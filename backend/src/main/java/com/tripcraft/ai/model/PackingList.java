package com.tripcraft.ai.model;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record PackingList(@NotEmpty List<@Valid Category> categories) {

    public record Category(@NotBlank String name, @NotEmpty List<@Valid Item> items) {
    }

    public record Item(@NotBlank String name, String note) {
    }
}
