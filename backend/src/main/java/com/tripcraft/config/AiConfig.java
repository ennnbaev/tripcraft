package com.tripcraft.config;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
public class AiConfig {

    /** The only entry point to the LLM. The provider behind it is chosen by Spring profile. */
    @Bean
    ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }

    /** Spring AI's OpenAI client is built from the auto-configured RestClient.Builder, so this sets its timeouts. */
    @Bean
    RestClientCustomizer aiTimeoutCustomizer(AiProperties properties) {
        return builder -> {
            HttpClient httpClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
            factory.setReadTimeout(properties.timeout());
            builder.requestFactory(factory);
        };
    }
}
