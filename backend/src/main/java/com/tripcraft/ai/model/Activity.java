package com.tripcraft.ai.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record Activity(
        @NotNull Slot slot,
        @NotBlank @Pattern(regexp = "^([01]?\\d|2[0-3]):[0-5]\\d$", message = "must be HH:mm")
        @JsonPropertyDescription("Start time, 24h format HH:mm")
        String time,
        @NotBlank String name,
        @NotBlank String description,
        @NotNull Category category,
        @NotNull @PositiveOrZero
        @JsonPropertyDescription("Approximate cost in local currency for the whole group")
        BigDecimal estimatedCost,
        @NotNull @PositiveOrZero
        @JsonPropertyDescription("Same cost converted to USD")
        BigDecimal estimatedCostUsd,
        @NotNull @Positive Integer durationMinutes,
        @JsonPropertyDescription("Approximate latitude of the place, null if unknown")
        Double lat,
        @JsonPropertyDescription("Approximate longitude of the place, null if unknown")
        Double lng) {
}
