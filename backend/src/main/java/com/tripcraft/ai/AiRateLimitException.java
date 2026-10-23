package com.tripcraft.ai;

/** The provider answered 429. Mapped to HTTP 429. */
public class AiRateLimitException extends AiException {

    public AiRateLimitException() {
        super("AI free tier limit reached, please try again in a minute");
    }
}
