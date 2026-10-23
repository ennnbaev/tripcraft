package com.tripcraft.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

class PromptTemplatesTest {

    private final PromptTemplates templates = new PromptTemplates(new DefaultResourceLoader());

    @Test
    void systemPromptRendersWithoutVariables() {
        assertThat(templates.render(PromptTemplates.SYSTEM, Map.of())).contains("JSON only");
    }

    @Test
    void generateIncludesNotesOnlyWhenPresent() {
        Map<String, Object> vars = generateVars();
        vars.put("hasNotes", true);
        vars.put("notes", "vegetarian");
        assertThat(templates.render(PromptTemplates.GENERATE, vars))
                .contains("Destination: Tbilisi", "Number of days: 3", "Traveler notes: vegetarian", "SCHEMA");

        vars.put("hasNotes", false);
        vars.put("notes", "");
        assertThat(templates.render(PromptTemplates.GENERATE, vars)).doesNotContain("Traveler notes");
    }

    @Test
    void regenerateKeepsJsonAndSwitchesFeedbackText() {
        Map<String, Object> vars = new HashMap<>(Map.of("itineraryJson", "{\"days\":[]}", "destination", "Tbilisi",
                "dayNumber", 2, "date", "2030-05-02", "travelers", 2, "budgetLevel", "MEDIUM", "interests", "FOOD",
                "pace", "RELAXED", "language", "English", "usedPlaces", "Narikala"));
        vars.putAll(Map.of("format", "SCHEMA", "hasFeedback", true, "feedback", "more food"));

        assertThat(templates.render(PromptTemplates.REGENERATE_DAY, vars))
                .contains("{\"days\":[]}", "Day number: 2", "feedback for this day: more food", "Narikala");

        vars.put("hasFeedback", false);
        assertThat(templates.render(PromptTemplates.REGENERATE_DAY, vars)).contains("no specific feedback");
    }

    @Test
    void packingListRenders() {
        Map<String, Object> vars = Map.of("destination", "Tbilisi", "startDate", "2030-05-01", "endDate", "2030-05-03",
                "travelers", 2, "activities", "Narikala (HISTORY)", "language", "English", "format", "SCHEMA");
        assertThat(templates.render(PromptTemplates.PACKING_LIST, vars)).contains("TASK: PACKING_LIST", "Narikala");
    }

    private static Map<String, Object> generateVars() {
        return new HashMap<>(Map.of("destination", "Tbilisi", "startDate", "2030-05-01", "endDate", "2030-05-03",
                "days", 3, "travelers", 2, "budgetLevel", "MEDIUM", "interests", "FOOD, HISTORY", "pace", "BALANCED",
                "language", "English", "format", "SCHEMA"));
    }
}
