package com.tripcraft.ai;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** What the AI needs to know about a trip, independent of how the trip is stored. */
public record TripBrief(
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        int travelers,
        String budgetLevel,
        List<String> interests,
        String pace,
        String notes,
        String language) {

    public int days() {
        return (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }
}
