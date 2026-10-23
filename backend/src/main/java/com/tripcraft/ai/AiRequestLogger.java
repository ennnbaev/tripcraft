package com.tripcraft.ai;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.tripcraft.config.AiProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Writes every LLM call to {@code ai_requests}. Runs in its own transaction so the row survives
 * a rollback of the business operation that triggered the call.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiRequestLogger {

    private static final int MAX_ERROR_LENGTH = 1000;

    private final AiRequestRepository repository;
    private final AiProperties properties;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long log(String templateName, Long tripId, Integer inputTokens, Integer outputTokens,
                    long latencyMs, AiStatus status, String errorMessage) {
        AiRequest request = new AiRequest();
        request.setTripId(tripId);
        request.setTemplateName(templateName);
        request.setTemplateVersion(properties.promptVersion());
        request.setProvider(properties.provider());
        request.setModel(properties.model());
        request.setInputTokens(inputTokens);
        request.setOutputTokens(outputTokens);
        request.setLatencyMs(latencyMs);
        request.setStatus(status);
        request.setErrorMessage(truncate(errorMessage));
        Long id = repository.save(request).getId();
        log.info("AI call template={} version={} provider={} model={} status={} latencyMs={} tokens={}/{}",
                templateName, properties.promptVersion(), properties.provider(), properties.model(),
                status, latencyMs, inputTokens, outputTokens);
        return id;
    }

    private static String truncate(String message) {
        if (message == null || message.length() <= MAX_ERROR_LENGTH) {
            return message;
        }
        return message.substring(0, MAX_ERROR_LENGTH);
    }
}
