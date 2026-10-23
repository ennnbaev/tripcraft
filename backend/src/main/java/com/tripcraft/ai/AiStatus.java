package com.tripcraft.ai;

/** Outcome of one LLM call, stored in {@code ai_requests.status}. */
public enum AiStatus {
    SUCCESS, INVALID_JSON, RATE_LIMITED, ERROR
}
