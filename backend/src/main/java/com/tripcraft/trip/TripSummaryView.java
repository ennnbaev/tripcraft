package com.tripcraft.trip;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/** Projection for the trip list, so the JSONB documents are not loaded. */
public interface TripSummaryView {

    Long getId();

    String getDestination();

    LocalDate getStartDate();

    LocalDate getEndDate();

    OffsetDateTime getCreatedAt();
}
