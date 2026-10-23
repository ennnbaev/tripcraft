package com.tripcraft.ai;

import java.util.Map;

import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/** Renders the StringTemplate files from {@code resources/prompts}. */
@Component
@RequiredArgsConstructor
public class PromptTemplates {

    public static final String SYSTEM = "itinerary-system";
    public static final String GENERATE = "itinerary-generate";
    public static final String REGENERATE_DAY = "day-regenerate";
    public static final String PACKING_LIST = "packing-list";

    private final ResourceLoader resourceLoader;

    public String render(String name, Map<String, Object> variables) {
        PromptTemplate template = PromptTemplate.builder()
                .resource(resourceLoader.getResource("classpath:prompts/" + name + ".st"))
                .variables(variables)
                .build();
        return template.render();
    }
}
