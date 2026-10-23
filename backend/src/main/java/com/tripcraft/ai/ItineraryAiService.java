package com.tripcraft.ai;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripcraft.ai.model.Activity;
import com.tripcraft.ai.model.Day;
import com.tripcraft.ai.model.Itinerary;
import com.tripcraft.ai.model.PackingList;

import lombok.RequiredArgsConstructor;

/** The three AI features: full itinerary, one regenerated day, packing list. */
@Service
@RequiredArgsConstructor
public class ItineraryAiService {

    static final int MAX_TIPS = 5;

    private final AiCallExecutor executor;
    private final ObjectMapper objectMapper;

    public AiResult<Itinerary> generate(TripBrief trip) {
        Map<String, Object> vars = baseVariables(trip);
        vars.put("days", trip.days());
        vars.put("hasNotes", hasText(trip.notes()));
        vars.put("notes", nullToEmpty(trip.notes()));
        return executor.call(PromptTemplates.GENERATE, vars, Itinerary.class, null,
                itinerary -> normalize(itinerary, trip));
    }

    /** Returns only the new day; the caller merges it into the stored itinerary. */
    public AiResult<Day> regenerateDay(TripBrief trip, Long tripId, Itinerary current, int dayNumber, String feedback) {
        Day target = current.days().get(dayNumber - 1);
        Map<String, Object> vars = baseVariables(trip);
        vars.put("itineraryJson", toJson(current));
        vars.put("dayNumber", dayNumber);
        vars.put("date", target.date());
        vars.put("hasFeedback", hasText(feedback));
        vars.put("feedback", nullToEmpty(feedback));
        vars.put("usedPlaces", placesOutside(current, dayNumber));
        return executor.call(PromptTemplates.REGENERATE_DAY, vars, Day.class, tripId,
                day -> day.withNumberAndDate(dayNumber, target.date()).withRecomputedCosts());
    }

    public AiResult<PackingList> packingList(TripBrief trip, Long tripId, Itinerary itinerary) {
        Map<String, Object> vars = baseVariables(trip);
        vars.put("activities", activitySummary(itinerary));
        return executor.call(PromptTemplates.PACKING_LIST, vars, PackingList.class, tripId, list -> list);
    }

    /**
     * Checks that the model returned exactly the requested days, then puts days in order,
     * sets their dates from the trip dates, caps tips and recomputes all costs.
     */
    static Itinerary normalize(Itinerary itinerary, TripBrief trip) {
        int expected = trip.days();
        List<Integer> numbers = itinerary.days().stream().map(Day::dayNumber).sorted().toList();
        List<Integer> wanted = IntStream.rangeClosed(1, expected).boxed().toList();
        if (!numbers.equals(wanted)) {
            throw new InvalidAiResponseException(
                    "Expected days 1.." + expected + " but got " + numbers);
        }
        List<Day> days = itinerary.days().stream()
                .sorted(Comparator.comparingInt(Day::dayNumber))
                .map(d -> d.withNumberAndDate(d.dayNumber(), trip.startDate().plusDays(d.dayNumber() - 1L)))
                .toList();
        List<String> tips = itinerary.tips().stream().limit(MAX_TIPS).toList();
        return itinerary.withDays(days).withTips(tips).withRecomputedCosts();
    }

    private static Map<String, Object> baseVariables(TripBrief trip) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("destination", trip.destination());
        vars.put("startDate", trip.startDate());
        vars.put("endDate", trip.endDate());
        vars.put("travelers", trip.travelers());
        vars.put("budgetLevel", trip.budgetLevel());
        vars.put("interests", String.join(", ", trip.interests()));
        vars.put("pace", trip.pace());
        vars.put("language", trip.language());
        return vars;
    }

    private static String placesOutside(Itinerary itinerary, int dayNumber) {
        String places = itinerary.days().stream()
                .filter(d -> d.dayNumber() != dayNumber)
                .flatMap(d -> d.activities().stream())
                .map(Activity::name)
                .distinct()
                .collect(Collectors.joining("; "));
        return places.isEmpty() ? "-" : places;
    }

    private static String activitySummary(Itinerary itinerary) {
        return itinerary.days().stream()
                .flatMap(d -> d.activities().stream())
                .map(a -> a.name() + " (" + a.category() + ")")
                .distinct()
                .collect(Collectors.joining("; "));
    }

    private String toJson(Itinerary itinerary) {
        try {
            return objectMapper.writeValueAsString(itinerary);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot serialize itinerary", e);
        }
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s.strip();
    }
}
