package com.tripcraft.ai.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** One day of the itinerary. Costs are recomputed by the backend, so the model's values are not trusted. */
public record Day(
        @Positive int dayNumber,
        LocalDate date,
        @NotBlank String title,
        @NotEmpty @Size(max = 8) List<@Valid Activity> activities,
        BigDecimal dayEstimatedCost,
        BigDecimal dayEstimatedCostUsd) {

    public Day withNumberAndDate(int dayNumber, LocalDate date) {
        return new Day(dayNumber, date, title, activities, dayEstimatedCost, dayEstimatedCostUsd);
    }

    public Day withRecomputedCosts() {
        BigDecimal cost = activities.stream().map(Activity::estimatedCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal usd = activities.stream().map(Activity::estimatedCostUsd).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new Day(dayNumber, date, title, activities, cost, usd);
    }
}
