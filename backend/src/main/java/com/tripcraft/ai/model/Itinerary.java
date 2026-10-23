package com.tripcraft.ai.model;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record Itinerary(
        @NotBlank String destination,
        @NotBlank String currency,
        @NotEmpty List<@Valid Day> days,
        BigDecimal totalEstimatedCost,
        BigDecimal totalEstimatedCostUsd,
        @NotEmpty List<@NotBlank String> tips) {

    public Itinerary withDays(List<Day> days) {
        return new Itinerary(destination, currency, days, totalEstimatedCost, totalEstimatedCostUsd, tips);
    }

    public Itinerary withTips(List<String> tips) {
        return new Itinerary(destination, currency, days, totalEstimatedCost, totalEstimatedCostUsd, tips);
    }

    /** Recomputes every day's cost from its activities and the totals from the days. */
    public Itinerary withRecomputedCosts() {
        List<Day> recomputed = days.stream().map(Day::withRecomputedCosts).toList();
        BigDecimal total = recomputed.stream().map(Day::dayEstimatedCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUsd = recomputed.stream().map(Day::dayEstimatedCostUsd).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new Itinerary(destination, currency, recomputed, total, totalUsd, tips);
    }
}
