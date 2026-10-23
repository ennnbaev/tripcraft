package com.tripcraft.ai;

import java.util.List;

/**
 * A validated AI answer plus the {@code ai_requests} rows written while getting it.
 *
 * @param logIds ids of every attempt (including the failed one before a retry)
 */
public record AiResult<T>(T value, List<Long> logIds) {
}
