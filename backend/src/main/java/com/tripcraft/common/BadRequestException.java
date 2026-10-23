package com.tripcraft.common;

/** Mapped to HTTP 400 for checks that Bean Validation cannot express (e.g. a day number outside the trip). */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
