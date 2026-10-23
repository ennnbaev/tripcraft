package com.tripcraft.ai;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.retry.NonTransientAiException;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;

/**
 * Runs one structured LLM call: render prompts, call the model through {@link ChatClient},
 * parse the JSON into a record, validate it, log every attempt, and retry once on an invalid answer.
 */
@Slf4j
@Component
public class AiCallExecutor {

    static final int MAX_ATTEMPTS = 2;

    private final ChatClient chatClient;
    private final PromptTemplates templates;
    private final AiRequestLogger requestLogger;
    private final Validator validator;
    private final JsonMapper lenientMapper;

    public AiCallExecutor(ChatClient chatClient, PromptTemplates templates, AiRequestLogger requestLogger,
                          Validator validator) {
        this.chatClient = chatClient;
        this.templates = templates;
        this.requestLogger = requestLogger;
        this.validator = validator;
        // Models are sloppy with enum casing and sometimes add extra fields; that alone should not cost a retry.
        this.lenientMapper = JsonMapper.builder()
                .findAndAddModules()
                .enable(MapperFeature.ACCEPT_CASE_INSENSITIVE_ENUMS)
                .enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE)
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .build();
    }

    /**
     * @param templateName user prompt template; the JSON schema is passed to it as {@code format}
     * @param variables    template variables
     * @param type         record the answer is parsed into
     * @param tripId       trip to link the log rows to, or null if the trip does not exist yet
     * @param postProcess  extra checks and normalization; throws {@link InvalidAiResponseException} to trigger the retry
     */
    public <T> AiResult<T> call(String templateName, Map<String, Object> variables, Class<T> type,
                                Long tripId, UnaryOperator<T> postProcess) {
        BeanOutputConverter<T> converter = new BeanOutputConverter<>(type, lenientMapper);
        Map<String, Object> allVariables = new HashMap<>(variables);
        allVariables.put("format", converter.getFormat());
        Prompt prompt = new Prompt(List.of(
                new SystemMessage(templates.render(PromptTemplates.SYSTEM, Map.of())),
                new UserMessage(templates.render(templateName, allVariables))));

        List<Long> logIds = new ArrayList<>();
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            long start = System.nanoTime();
            ChatResponse response;
            try {
                response = chatClient.prompt(prompt).call().chatResponse();
            } catch (RuntimeException e) {
                long latency = elapsedMs(start);
                if (isRateLimit(e)) {
                    logIds.add(requestLogger.log(templateName, tripId, null, null, latency, AiStatus.RATE_LIMITED, e.getMessage()));
                    throw new AiRateLimitException();
                }
                log.warn("AI provider call failed: {}", e.toString());
                logIds.add(requestLogger.log(templateName, tripId, null, null, latency, AiStatus.ERROR, e.getMessage()));
                throw new AiUnavailableException("The AI provider is not available right now, please try again later");
            }
            long latency = elapsedMs(start);
            Integer inputTokens = tokens(response, Usage::getPromptTokens);
            Integer outputTokens = tokens(response, Usage::getCompletionTokens);

            try {
                T value = postProcess.apply(validate(converter.convert(text(response))));
                logIds.add(requestLogger.log(templateName, tripId, inputTokens, outputTokens, latency, AiStatus.SUCCESS, null));
                return new AiResult<>(value, logIds);
            } catch (RuntimeException e) {
                log.warn("Invalid AI response (attempt {}/{}): {}", attempt, MAX_ATTEMPTS, e.getMessage());
                logIds.add(requestLogger.log(templateName, tripId, inputTokens, outputTokens, latency,
                        AiStatus.INVALID_JSON, e.getMessage()));
            }
        }
        throw new AiUnavailableException("The AI returned an invalid answer twice, please try again");
    }

    private <T> T validate(T value) {
        if (value == null) {
            throw new InvalidAiResponseException("Empty response");
        }
        Set<ConstraintViolation<T>> violations = validator.validate(value);
        if (!violations.isEmpty()) {
            throw new InvalidAiResponseException(violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .sorted()
                    .collect(Collectors.joining("; ")));
        }
        return value;
    }

    private static String text(ChatResponse response) {
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            return null;
        }
        return response.getResult().getOutput().getText();
    }

    /** Null when the provider did not report usage (Spring AI then returns zeros). */
    private static Integer tokens(ChatResponse response, Function<Usage, Integer> getter) {
        if (response == null || response.getMetadata() == null || response.getMetadata().getUsage() == null) {
            return null;
        }
        Usage usage = response.getMetadata().getUsage();
        Integer total = usage.getTotalTokens();
        if (total == null || total == 0) {
            return null;
        }
        return getter.apply(usage);
    }

    /** Spring AI turns a 4xx into NonTransientAiException("HTTP 429 - ..."). */
    private static boolean isRateLimit(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof NonTransientAiException && t.getMessage() != null && t.getMessage().startsWith("HTTP 429")) {
                return true;
            }
        }
        return false;
    }

    private static long elapsedMs(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }
}
