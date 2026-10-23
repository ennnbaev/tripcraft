package com.tripcraft.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.json.JsonMapper;
import com.tripcraft.ai.model.Day;
import com.tripcraft.ai.model.Itinerary;

class ItineraryNormalizeTest {

    private static final TripBrief TRIP = new TripBrief("Tbilisi", LocalDate.of(2030, 5, 1), LocalDate.of(2030, 5, 3),
            2, "MEDIUM", List.of("FOOD"), "BALANCED", null, "English");

    private final JsonMapper mapper = JsonMapper.builder().findAndAddModules().build();

    @Test
    void sortsDaysSetsDatesCapsTipsAndRecomputesCosts() throws Exception {
        Itinerary raw = mapper.readValue(AiTestData.itinerary(3, 1, 2), Itinerary.class);

        Itinerary itinerary = ItineraryAiService.normalize(raw, TRIP);

        assertThat(itinerary.days()).extracting(Day::dayNumber).containsExactly(1, 2, 3);
        assertThat(itinerary.days()).extracting(Day::date)
                .containsExactly(LocalDate.of(2030, 5, 1), LocalDate.of(2030, 5, 2), LocalDate.of(2030, 5, 3));
        // day n has two activities costing 10n each (USD: 5n each)
        assertThat(itinerary.days()).extracting(Day::dayEstimatedCost)
                .containsExactly(new BigDecimal("20"), new BigDecimal("40"), new BigDecimal("60"));
        assertThat(itinerary.totalEstimatedCost()).isEqualByComparingTo("120");
        assertThat(itinerary.totalEstimatedCostUsd()).isEqualByComparingTo("60");
        assertThat(itinerary.tips()).hasSize(ItineraryAiService.MAX_TIPS);
    }

    @Test
    void rejectsMissingOrDuplicatedDays() throws Exception {
        Itinerary twoDays = mapper.readValue(AiTestData.itinerary(1, 2), Itinerary.class);
        Itinerary duplicate = mapper.readValue(AiTestData.itinerary(1, 1, 2), Itinerary.class);

        assertThatThrownBy(() -> ItineraryAiService.normalize(twoDays, TRIP)).isInstanceOf(InvalidAiResponseException.class);
        assertThatThrownBy(() -> ItineraryAiService.normalize(duplicate, TRIP)).isInstanceOf(InvalidAiResponseException.class);
    }
}
