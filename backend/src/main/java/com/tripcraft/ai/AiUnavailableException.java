package com.tripcraft.ai;

/** Provider error or an invalid answer after the retry. Mapped to HTTP 502. */
public class AiUnavailableException extends AiException {

    public AiUnavailableException(String message) {
        super(message);
    }
}
