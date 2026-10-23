package com.tripcraft.stats;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** Aggregates over {@code ai_requests} (PRD F8). */
public record Stats(
        long totalRequests,
        long successCount,
        long errorCount,
        double errorRate,
        double avgLatencyMs,
        long totalInputTokens,
        long totalOutputTokens,
        List<DayStat> byDay,
        List<ProviderStat> byProvider,
        List<TemplateStat> byTemplate,
        List<RecentRequest> recent) {

    public record DayStat(LocalDate date, long requests, long errors) {
    }

    public record ProviderStat(String provider, String model, long requests, long inputTokens, long outputTokens,
                               double avgLatencyMs) {
    }

    public record TemplateStat(String templateName, long requests, double avgLatencyMs) {
    }

    public record RecentRequest(Long id, Long tripId, String templateName, String templateVersion, String provider,
                                String model, Integer inputTokens, Integer outputTokens, Long latencyMs,
                                String status, String errorMessage, OffsetDateTime createdAt) {
    }
}
