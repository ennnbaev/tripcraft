package com.tripcraft.web.dto;

import java.util.Map;

/** Unified error body: a readable message, plus field messages for validation errors. */
public record ErrorResponse(String error, Map<String, String> details) {

    public static ErrorResponse of(String error) {
        return new ErrorResponse(error, Map.of());
    }
}
