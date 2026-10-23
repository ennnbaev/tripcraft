package com.tripcraft.ai;

import java.time.OffsetDateTime;

import org.hibernate.annotations.CreationTimestamp;

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

/** One LLM call (a retry is a separate row). */
@Entity
@Table(name = "ai_requests")
@Getter
@Setter
@NoArgsConstructor
public class AiRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tripId;

    @Column(nullable = false)
    private String templateName;

    @Column(nullable = false)
    private String templateVersion;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String model;

    private Integer inputTokens;

    private Integer outputTokens;

    private Long latencyMs;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AiStatus status;

    private String errorMessage;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
