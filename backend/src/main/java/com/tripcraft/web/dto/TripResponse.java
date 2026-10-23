package com.tripcraft.web.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import com.tripcraft.ai.model.Itinerary;
import com.tripcraft.ai.model.PackingList;
import com.tripcraft.trip.BudgetLevel;
import com.tripcraft.trip.Interest;
import com.tripcraft.trip.Pace;
import com.tripcraft.trip.Trip;

public record TripResponse(
        Long id,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        int travelers,
        BudgetLevel budgetLevel,
        Pace pace,
        List<Interest> interests,
        String notes,
        String language,
        Itinerary itinerary,
        PackingList packingList,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

    public static TripResponse from(Trip trip) {
        return new TripResponse(trip.getId(), trip.getDestination(), trip.getStartDate(), trip.getEndDate(),
                trip.getTravelers(), trip.getBudgetLevel(), trip.getPace(), trip.getInterests(), trip.getNotes(),
                trip.getLanguage(), trip.getItinerary(), trip.getPackingList(), trip.getCreatedAt(), trip.getUpdatedAt());
    }
}
