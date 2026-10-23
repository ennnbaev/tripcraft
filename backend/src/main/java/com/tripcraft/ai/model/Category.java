package com.tripcraft.ai.model;

import com.fasterxml.jackson.annotation.JsonEnumDefaultValue;

/** Activity category: every trip interest plus a few generic ones. Unknown values from the model map to OTHER. */
public enum Category {
    FOOD, MUSEUMS, NATURE, NIGHTLIFE, SHOPPING, HISTORY, ART, SPORT,
    SIGHTSEEING, TRANSPORT,
    @JsonEnumDefaultValue OTHER
}
