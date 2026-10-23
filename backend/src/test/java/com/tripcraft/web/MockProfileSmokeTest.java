package com.tripcraft.web;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;

import com.jayway.jsonpath.JsonPath;

/** The dev-only {@code mock} profile must produce answers that pass our own validation. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "mock"})
class MockProfileSmokeTest extends ApiTestSupport {

    @Test
    void mockProviderSupportsTheWholeFlow() throws Exception {
        String body = mvc.perform(post("/api/trips").contentType(MediaType.APPLICATION_JSON).content(tripJson(4)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itinerary.days", hasSize(4)))
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(body, "$.id")).longValue();

        mvc.perform(post("/api/trips/{id}/days/3/regenerate", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"feedback\":\"less walking\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itinerary.days[2].dayNumber").value(3));

        mvc.perform(post("/api/trips/{id}/packing-list", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.packingList.categories").isNotEmpty());
    }
}
