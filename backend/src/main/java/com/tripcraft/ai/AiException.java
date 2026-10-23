package com.tripcraft.ai;

/** Base class for AI failures that reach the client. */
public abstract class AiException extends RuntimeException {

    protected AiException(String message) {
        super(message);
    }
}
