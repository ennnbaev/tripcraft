package com.tripcraft.stats;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/** Plain SQL aggregates: they map directly to the stats page and need no entities. */
@Service
@RequiredArgsConstructor
public class StatsService {

    static final int DAYS = 14;
    static final int RECENT = 20;

    private final JdbcClient jdbc;

    @Transactional(readOnly = true)
    public Stats stats() {
        Totals totals = jdbc.sql("""
                SELECT count(*)                                          AS total,
                       count(*) FILTER (WHERE status = 'SUCCESS')        AS success,
                       coalesce(round(avg(latency_ms), 1), 0)            AS avg_latency,
                       coalesce(sum(input_tokens), 0)                    AS input_tokens,
                       coalesce(sum(output_tokens), 0)                   AS output_tokens
                FROM ai_requests
                """)
                .query((rs, i) -> new Totals(rs.getLong("total"), rs.getLong("success"), rs.getDouble("avg_latency"),
                        rs.getLong("input_tokens"), rs.getLong("output_tokens")))
                .single();

        List<Stats.DayStat> byDay = jdbc.sql("""
                SELECT d::date AS day,
                       count(r.id)                                       AS requests,
                       count(r.id) FILTER (WHERE r.status <> 'SUCCESS')  AS errors
                FROM generate_series(current_date - (:days - 1), current_date, interval '1 day') AS d
                LEFT JOIN ai_requests r ON r.created_at::date = d::date
                GROUP BY d
                ORDER BY d
                """)
                .param("days", DAYS)
                .query((rs, i) -> new Stats.DayStat(rs.getDate("day").toLocalDate(), rs.getLong("requests"),
                        rs.getLong("errors")))
                .list();

        List<Stats.ProviderStat> byProvider = jdbc.sql("""
                SELECT provider, model, count(*) AS requests,
                       coalesce(sum(input_tokens), 0)  AS input_tokens,
                       coalesce(sum(output_tokens), 0) AS output_tokens,
                       coalesce(round(avg(latency_ms), 1), 0) AS avg_latency
                FROM ai_requests
                GROUP BY provider, model
                ORDER BY requests DESC
                """)
                .query((rs, i) -> new Stats.ProviderStat(rs.getString("provider"), rs.getString("model"),
                        rs.getLong("requests"), rs.getLong("input_tokens"), rs.getLong("output_tokens"),
                        rs.getDouble("avg_latency")))
                .list();

        List<Stats.TemplateStat> byTemplate = jdbc.sql("""
                SELECT template_name, count(*) AS requests, coalesce(round(avg(latency_ms), 1), 0) AS avg_latency
                FROM ai_requests
                GROUP BY template_name
                ORDER BY requests DESC
                """)
                .query((rs, i) -> new Stats.TemplateStat(rs.getString("template_name"), rs.getLong("requests"),
                        rs.getDouble("avg_latency")))
                .list();

        List<Stats.RecentRequest> recent = jdbc.sql("""
                SELECT id, trip_id, template_name, template_version, provider, model, input_tokens, output_tokens,
                       latency_ms, status, error_message, created_at
                FROM ai_requests
                ORDER BY created_at DESC, id DESC
                LIMIT :limit
                """)
                .param("limit", RECENT)
                .query((rs, i) -> new Stats.RecentRequest(rs.getLong("id"), rs.getObject("trip_id", Long.class),
                        rs.getString("template_name"), rs.getString("template_version"), rs.getString("provider"),
                        rs.getString("model"), rs.getObject("input_tokens", Integer.class),
                        rs.getObject("output_tokens", Integer.class), rs.getObject("latency_ms", Long.class),
                        rs.getString("status"), rs.getString("error_message"),
                        rs.getObject("created_at", OffsetDateTime.class)))
                .list();

        long errors = totals.total() - totals.success();
        double errorRate = totals.total() == 0 ? 0 : (double) errors / totals.total();
        return new Stats(totals.total(), totals.success(), errors, errorRate, totals.avgLatency(),
                totals.inputTokens(), totals.outputTokens(), byDay, byProvider, byTemplate, recent);
    }

    private record Totals(long total, long success, double avgLatency, long inputTokens, long outputTokens) {
    }
}
