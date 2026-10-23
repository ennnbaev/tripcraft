package com.tripcraft.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.ai.retry.NonTransientAiException;
import org.springframework.test.context.ActiveProfiles;

import com.jayway.jsonpath.JsonPath;
import com.tripcraft.ai.AiTestData;
import com.tripcraft.ai.StubChatModel;

/** Full HTTP flow with a scripted ChatModel behind the real ChatClient. */
@SpringBootTest(properties = {"spring.ai.model.chat=none", "app.ai.provider=stub", "app.ai.model=stub-model"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TripApiTest extends ApiTestSupport {

    @TestConfiguration
    static class StubConfig {
        @Bean
        StubChatModel stubChatModel() {
            return new StubChatModel();
        }
    }

    @Autowired
    private StubChatModel model;

    @BeforeEach
    void resetModel() {
        model.reset();
    }

    @Test
    void createsTripAndLinksAiLogs() throws Exception {
        model.answer("broken").answer(AiTestData.itinerary(1, 2, 3));

        mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(tripJson(3)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.language").value("English"))
                .andExpect(jsonPath("$.notes").value("no museums on Monday"))
                .andExpect(jsonPath("$.itinerary.days", hasSize(3)))
                .andExpect(jsonPath("$.itinerary.totalEstimatedCost").value(120))
                .andExpect(jsonPath("$.packingList").isEmpty());

        assertThat(count("SELECT count(*) FROM ai_requests WHERE trip_id IS NOT NULL")).isEqualTo(2);
        assertThat(count("SELECT count(*) FROM ai_requests WHERE status = 'INVALID_JSON'")).isEqualTo(1);
        assertThat(count("SELECT count(*) FROM ai_requests WHERE provider = 'stub' AND template_version = 'v1'"))
                .isEqualTo(2);
    }

    @Test
    void failedGenerationLeavesNoTrip() throws Exception {
        model.answer("broken").answer("{\"also\":\"broken\"}");

        mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(tripJson(3)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").isNotEmpty())
                .andExpect(jsonPath("$.details").isMap());

        assertThat(count("SELECT count(*) FROM trips")).isZero();
        assertThat(count("SELECT count(*) FROM ai_requests WHERE status = 'INVALID_JSON' AND trip_id IS NULL"))
                .isEqualTo(2);
    }

    @Test
    void rateLimitReturns429() throws Exception {
        model.fail(new NonTransientAiException("HTTP 429 - Too Many Requests"));

        mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(tripJson(2)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value(containsString("free tier limit")));
    }

    @Test
    void regeneratesOnlyTheRequestedDay() throws Exception {
        long id = createTrip();
        model.answer(AiTestData.day(7, "New place", 100));

        String body = mvc.perform(post("/api/trips/{id}/days/2/regenerate", id)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"feedback\":\"more food\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itinerary.days[1].dayNumber").value(2))
                .andExpect(jsonPath("$.itinerary.days[1].activities[0].name").value("New place morning"))
                .andExpect(jsonPath("$.itinerary.days[1].dayEstimatedCost").value(200))
                .andExpect(jsonPath("$.itinerary.days[0].activities[0].name").value("Place 1 morning"))
                .andExpect(jsonPath("$.itinerary.days[2].activities[0].name").value("Place 3 morning"))
                // 20 + 200 + 60
                .andExpect(jsonPath("$.itinerary.totalEstimatedCost").value(280))
                .andReturn().getResponse().getContentAsString();

        LocalDate start = LocalDate.parse(JsonPath.read(body, "$.startDate"));
        assertThat((String) JsonPath.read(body, "$.itinerary.days[1].date")).isEqualTo(start.plusDays(1).toString());
        String userPrompt = model.prompts().getLast().getInstructions().get(1).getText();
        assertThat(userPrompt).contains("Day number: 2", "more food", "Place 1 morning", "Place 3 dinner")
                .doesNotContain("already planned on other days: Place 2");
    }

    @Test
    void failedRegenerationKeepsTheTrip() throws Exception {
        long id = createTrip();
        String before = mvc.perform(get("/api/trips/{id}", id)).andReturn().getResponse().getContentAsString();
        model.answer("broken").answer("broken");

        mvc.perform(post("/api/trips/{id}/days/1/regenerate", id).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadGateway());

        String after = mvc.perform(get("/api/trips/{id}", id)).andReturn().getResponse().getContentAsString();
        assertThat(after).isEqualTo(before);
    }

    @Test
    void dayOutOfRangeIs400() throws Exception {
        long id = createTrip();

        mvc.perform(post("/api/trips/{id}/days/4/regenerate", id).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("outside the trip")));
    }

    @Test
    void generatesPackingList() throws Exception {
        long id = createTrip();
        model.answer(AiTestData.packingList());

        mvc.perform(post("/api/trips/{id}/packing-list", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.packingList.categories[0].items[0].name").value("Passport"));
        assertThat(model.prompts().getLast().getInstructions().get(1).getText()).contains("Place 2 dinner (FOOD)");
    }

    @Test
    void listsGetsAndDeletesTrips() throws Exception {
        long first = createTrip();
        long second = createTrip();

        mvc.perform(get("/api/trips"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(second))
                .andExpect(jsonPath("$[0].itinerary").doesNotExist());

        mvc.perform(delete("/api/trips/{id}", first)).andExpect(status().isNoContent());
        mvc.perform(get("/api/trips/{id}", first))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Trip " + first + " not found"));
        // AI logs of the deleted trip stay for the stats
        assertThat(count("SELECT count(*) FROM ai_requests")).isEqualTo(2);
    }

    @Test
    void validationErrorsNameTheFields() throws Exception {
        String invalid = """
                {"destination":" ","startDate":"2020-01-01","endDate":"2019-12-31","travelers":11,
                 "budgetLevel":"MEDIUM","interests":[],"pace":"BALANCED"}
                """;
        mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details.destination").exists())
                .andExpect(jsonPath("$.details.startDate").value("must not be in the past"))
                .andExpect(jsonPath("$.details.endDate").exists())
                .andExpect(jsonPath("$.details.travelers").exists())
                .andExpect(jsonPath("$.details.interests").exists());

        mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content("{\"pace\":\"FAST\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.pace").value(containsString("RELAXED")));
        assertThat(model.prompts()).isEmpty();
    }

    @Test
    void statsAggregateTheLog() throws Exception {
        createTrip();
        model.fail(new NonTransientAiException("HTTP 429 - Too Many Requests"));
        mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(tripJson(1)));

        mvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRequests").value(2))
                .andExpect(jsonPath("$.successCount").value(1))
                .andExpect(jsonPath("$.errorCount").value(1))
                .andExpect(jsonPath("$.errorRate").value(0.5))
                .andExpect(jsonPath("$.totalInputTokens").value(100))
                .andExpect(jsonPath("$.byDay", hasSize(14)))
                .andExpect(jsonPath("$.byDay[13].requests").value(2))
                .andExpect(jsonPath("$.byProvider[0].provider").value("stub"))
                .andExpect(jsonPath("$.byTemplate[0].templateName").value("itinerary-generate"))
                .andExpect(jsonPath("$.recent[0].status").value("RATE_LIMITED"))
                .andExpect(jsonPath("$.recent[0].tripId").isEmpty());
    }

    private long createTrip() throws Exception {
        model.answer(AiTestData.itinerary(1, 2, 3));
        String body = mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(tripJson(3)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }
}
