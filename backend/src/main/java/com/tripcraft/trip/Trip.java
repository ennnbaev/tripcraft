package com.tripcraft.trip;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.tripcraft.ai.model.Itinerary;
import com.tripcraft.ai.model.PackingList;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A saved trip. The AI-generated parts are JSONB documents, read and written as a whole. */
@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private int travelers;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BudgetLevel budgetLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Pace pace;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private List<Interest> interests;

    private String notes;

    @Column(nullable = false)
    private String language;

    @JdbcTypeCode(SqlTypes.JSON)
    private Itinerary itinerary;

    @JdbcTypeCode(SqlTypes.JSON)
    private PackingList packingList;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    public int days() {
        return (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }
}
