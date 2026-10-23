package com.tripcraft.web.dto;

import java.time.LocalDate;
import java.util.List;

import com.tripcraft.trip.BudgetLevel;
import com.tripcraft.trip.Interest;
import com.tripcraft.trip.Pace;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The new-trip form (PRD F1). Date range and duplicate interests are checked by {@link ValidTripRequest}. */
@ValidTripRequest
public record TripRequest(
        @NotBlank @Size(max = 255) String destination,
        @NotNull @FutureOrPresent(message = "must not be in the past") LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull @Min(1) @Max(10) Integer travelers,
        @NotNull BudgetLevel budgetLevel,
        @NotEmpty(message = "choose at least one interest") List<@NotNull Interest> interests,
        @NotNull Pace pace,
        @Size(max = 500) String notes,
        @Size(max = 30) String language) {

    public static final int MAX_DAYS = 14;
    public static final String DEFAULT_LANGUAGE = "English";

    public String languageOrDefault() {
        return language == null || language.isBlank() ? DEFAULT_LANGUAGE : language.strip();
    }
}
