package com.tripcraft.ai;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.function.Supplier;

import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.DefaultUsage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;

/** Test double: answers with queued texts or throws queued exceptions, and remembers the prompts. */
public class StubChatModel implements ChatModel {

    private final Deque<Supplier<String>> answers = new ArrayDeque<>();
    private final Deque<Prompt> prompts = new ArrayDeque<>();

    public StubChatModel answer(String text) {
        answers.add(() -> text);
        return this;
    }

    public StubChatModel fail(RuntimeException e) {
        answers.add(() -> {
            throw e;
        });
        return this;
    }

    public void reset() {
        answers.clear();
        prompts.clear();
    }

    public Deque<Prompt> prompts() {
        return prompts;
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        prompts.add(prompt);
        Supplier<String> next = answers.poll();
        if (next == null) {
            throw new IllegalStateException("StubChatModel has no queued answer");
        }
        String text = next.get();
        return new ChatResponse(List.of(new Generation(new AssistantMessage(text))),
                ChatResponseMetadata.builder().usage(new DefaultUsage(100, 50)).build());
    }
}
