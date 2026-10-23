package com.tripcraft.ai;

/** The model answered, but the answer breaks our rules. Triggers the retry. */
public class InvalidAiResponseException extends RuntimeException {

    public InvalidAiResponseException(String message) {
        super(message);
    }
}
