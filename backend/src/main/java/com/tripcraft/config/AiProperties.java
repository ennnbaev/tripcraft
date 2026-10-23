package com.tripcraft.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * {@code app.ai.*}: what gets written to {@code ai_requests} and how long we wait for the provider.
 *
 * @param promptVersion version of the prompt templates in {@code resources/prompts}
 * @param provider      provider name for logs (gemini, groq, openai, mock), set per Spring profile
 * @param model         model name for logs
 * @param timeout       read timeout of a single LLM HTTP call
 */
@ConfigurationProperties(prefix = "app.ai")
public record AiProperties(String promptVersion, String provider, String model, Duration timeout) {
}
