package com.tripcraft.web.dto;

import jakarta.validation.constraints.Size;

/** Optional free-text feedback, e.g. "more food, less walking". */
public record RegenerateDayRequest(@Size(max = 500) String feedback) {
}
