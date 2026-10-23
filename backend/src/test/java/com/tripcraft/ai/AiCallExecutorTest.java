package com.tripcraft.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.retry.NonTransientAiException;
import org.springframework.core.io.DefaultResourceLoader;

import com.fasterxml.jackson.databind.json.JsonMapper;
import com.tripcraft.ai.model.Category;
import com.tripcraft.ai.model.Itinerary;
import com.tripcraft.ai.model.Slot;

import jakarta.validation.Validation;

class AiCallExecutorTest {

    private static final TripBrief TRIP = new TripBrief("Tbilisi", LocalDate.of(2030, 5, 1), LocalDate.of(2030, 5, 3),
            2, "MEDIUM", List.of("FOOD", "HISTORY"), "BALANCED", null, "English");

    private final StubChatModel model = new StubChatModel();
    private final AiRequestLogger requestLogger = mock(AiRequestLogger.class);
    private ItineraryAiService service;

    @BeforeEach
    void setUp() {
        when(requestLogger.log(any(), any(), any(), any(), anyLong(), any(), any())).thenReturn(1L, 2L);
        AiCallExecutor executor = new AiCallExecutor(ChatClient.create(model),
                new PromptTemplates(new DefaultResourceLoader()), requestLogger,
                Validation.buildDefaultValidatorFactory().getValidator());
        service = new ItineraryAiService(executor, JsonMapper.builder().findAndAddModules().build());
    }

    @Test
    void parsesSloppyButValidAnswer() {
        String sloppy = "```json\n" + AiTestData.itinerary(1, 2, 3)
                .replace("\"MORNING\"", "\"morning\"")
                .replaceFirst("\"HISTORY\"", "\"ADVENTURE\"") + "\n```";
        model.answer(sloppy);

        AiResult<Itinerary> result = service.generate(TRIP);

        Itinerary itinerary = result.value();
        assertThat(itinerary.days()).hasSize(3);
        assertThat(itinerary.days().getFirst().activities().getFirst().slot()).isEqualTo(Slot.MORNING);
        assertThat(itinerary.days().getFirst().activities().getFirst().category()).isEqualTo(Category.OTHER);
        assertThat(result.logIds()).containsExactly(1L);
        verify(requestLogger).log(eq(PromptTemplates.GENERATE), isNull(), eq(100), eq(50), anyLong(),
                eq(AiStatus.SUCCESS), isNull());
    }

    @Test
    void sendsSystemAndUserPromptWithSchema() {
        model.answer(AiTestData.itinerary(1, 2, 3));

        service.generate(TRIP);

        var messages = model.prompts().getFirst().getInstructions();
        assertThat(messages).extracting(m -> m.getMessageType()).containsExactly(MessageType.SYSTEM, MessageType.USER);
        assertThat(messages.get(1).getText())
                .contains("Number of days: 3", "Interests: FOOD, HISTORY", "\"$schema\"")
                .doesNotContain("Traveler notes");
    }

    @Test
    void retriesOnceAfterInvalidAnswer() {
        model.answer("not json at all").answer(AiTestData.itinerary(1, 2, 3));

        AiResult<Itinerary> result = service.generate(TRIP);

        assertThat(result.logIds()).containsExactly(1L, 2L);
        InOrder order = inOrder(requestLogger);
        order.verify(requestLogger).log(any(), any(), any(), any(), anyLong(), eq(AiStatus.INVALID_JSON), any());
        order.verify(requestLogger).log(any(), any(), any(), any(), anyLong(), eq(AiStatus.SUCCESS), any());
    }

    @Test
    void wrongDayCountCountsAsInvalid() {
        model.answer(AiTestData.itinerary(1, 2)).answer(AiTestData.itinerary(1, 2, 2));

        assertThatThrownBy(() -> service.generate(TRIP)).isInstanceOf(AiUnavailableException.class);
        verify(requestLogger, times(2)).log(any(), any(), any(), any(), anyLong(), eq(AiStatus.INVALID_JSON), any());
    }

    @Test
    void rateLimitIsNotRetried() {
        model.fail(new NonTransientAiException("HTTP 429 - quota exceeded"));

        assertThatThrownBy(() -> service.generate(TRIP)).isInstanceOf(AiRateLimitException.class);
        verify(requestLogger).log(any(), any(), isNull(), isNull(), anyLong(), eq(AiStatus.RATE_LIMITED), any());
        assertThat(model.prompts()).hasSize(1);
    }

    @Test
    void providerErrorBecomesUnavailable() {
        model.fail(new NonTransientAiException("HTTP 401 - bad key"));

        assertThatThrownBy(() -> service.generate(TRIP)).isInstanceOf(AiUnavailableException.class);
        verify(requestLogger).log(any(), any(), any(), any(), anyLong(), eq(AiStatus.ERROR), eq("HTTP 401 - bad key"));
        verify(requestLogger, never()).log(any(), any(), any(), any(), anyLong(), eq(AiStatus.SUCCESS), any());
    }
}
