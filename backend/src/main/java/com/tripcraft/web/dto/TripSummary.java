package com.tripcraft.web.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.tripcraft.trip.TripSummaryView;

public record TripSummary(Long id, String destination, LocalDate startDate, LocalDate endDate, OffsetDateTime createdAt) {

    public static TripSummary from(TripSummaryView view) {
        return new TripSummary(view.getId(), view.getDestination(), view.getStartDate(), view.getEndDate(),
                view.getCreatedAt());
    }
}
