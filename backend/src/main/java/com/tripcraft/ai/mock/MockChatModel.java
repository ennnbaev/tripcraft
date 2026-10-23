package com.tripcraft.ai.mock;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.DefaultUsage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripcraft.ai.model.Activity;
import com.tripcraft.ai.model.Category;
import com.tripcraft.ai.model.Day;
import com.tripcraft.ai.model.Itinerary;
import com.tripcraft.ai.model.PackingList;
import com.tripcraft.ai.model.Slot;

/**
 * DEV / DEMO ONLY ({@code SPRING_PROFILES_ACTIVE=mock}): a fake LLM so the app runs without an API key.
 * <p>
 * It sits behind {@code ChatClient} exactly like a real provider, so prompts are rendered, the answer is
 * parsed and validated, and every call lands in {@code ai_requests}. It recognizes the task by the
 * {@code TASK: ...} line of the user prompt and reads the few values it needs (dates, day number)
 * from the rendered prompt. The places are generic placeholders, not real recommendations.
 */
@Component
@Profile("mock")
public class MockChatModel implements ChatModel {

    private static final Map<String, double[]> CITY_CENTERS = Map.of(
            "tbilisi", new double[] {41.6938, 44.8015},
            "paris", new double[] {48.8566, 2.3522},
            "rome", new double[] {41.9028, 12.4964},
            "barcelona", new double[] {41.3874, 2.1686},
            "london", new double[] {51.5072, -0.1276},
            "tokyo", new double[] {35.6762, 139.6503},
            "new york", new double[] {40.7128, -74.0060},
            "kyiv", new double[] {50.4501, 30.5234},
            "lisbon", new double[] {38.7223, -9.1393},
            "istanbul", new double[] {41.0082, 28.9784});

    private static final List<String[]> MORNING = List.of(
            new String[] {"Old Town walking tour", "HISTORY"}, new String[] {"City history museum", "MUSEUMS"},
            new String[] {"Botanical garden", "NATURE"}, new String[] {"Local market breakfast", "FOOD"},
            new String[] {"Cathedral and main square", "SIGHTSEEING"}, new String[] {"Fine arts gallery", "ART"});
    private static final List<String[]> AFTERNOON = List.of(
            new String[] {"Traditional lunch tavern", "FOOD"}, new String[] {"Hilltop viewpoint", "SIGHTSEEING"},
            new String[] {"Riverside park walk", "NATURE"}, new String[] {"Design district shops", "SHOPPING"},
            new String[] {"Modern art center", "ART"}, new String[] {"Fortress ruins", "HISTORY"},
            new String[] {"Bike ride along the waterfront", "SPORT"});
    private static final List<String[]> EVENING = List.of(
            new String[] {"Dinner with local wine", "FOOD"}, new String[] {"Rooftop bar", "NIGHTLIFE"},
            new String[] {"Live folk music show", "NIGHTLIFE"}, new String[] {"Night market", "SHOPPING"},
            new String[] {"Sunset promenade", "SIGHTSEEING"});

    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public MockChatModel(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        String user = prompt.getInstructions().stream()
                .filter(m -> m.getMessageType() == MessageType.USER)
                .map(m -> m.getText())
                .reduce("", (a, b) -> a + "\n" + b);

        Object answer;
        if (user.contains("TASK: GENERATE_ITINERARY")) {
            answer = itinerary(user);
        } else if (user.contains("TASK: REGENERATE_DAY")) {
            int dayNumber = Integer.parseInt(value(user, "Day number"));
            answer = day(dayNumber, LocalDate.parse(value(user, "Date")), center(value(user, "Destination")));
        } else if (user.contains("TASK: PACKING_LIST")) {
            answer = packingList();
        } else {
            throw new IllegalArgumentException("MockChatModel does not know this prompt");
        }

        sleep(400 + random.nextInt(800));
        String json = toJson(answer);
        ChatResponseMetadata metadata = ChatResponseMetadata.builder()
                .model("mock-planner")
                .usage(new DefaultUsage(user.length() / 4, json.length() / 4))
                .build();
        return new ChatResponse(List.of(new Generation(new AssistantMessage(json))), metadata);
    }

    private Itinerary itinerary(String prompt) {
        String destination = value(prompt, "Destination");
        LocalDate start = LocalDate.parse(value(prompt, "Start date"));
        int days = Integer.parseInt(value(prompt, "Number of days"));
        double[] center = center(destination);
        List<Day> list = new ArrayList<>();
        for (int i = 1; i <= days; i++) {
            list.add(day(i, start.plusDays(i - 1L), center));
        }
        List<String> tips = List.of(
                "Carry some cash: small cafes and markets may not take cards.",
                "Use a ride-hailing app or public transport instead of street taxis.",
                "Book popular museums a day ahead to skip the queue.",
                "This is a demo itinerary from the mock AI profile: places are placeholders.");
        return new Itinerary(destination, "USD", list, null, null, tips);
    }

    private Day day(int dayNumber, LocalDate date, double[] center) {
        List<Activity> activities = new ArrayList<>();
        activities.add(activity(Slot.MORNING, "09:30", pick(MORNING), center));
        activities.add(activity(Slot.AFTERNOON, "13:00", pick(AFTERNOON), center));
        if (random.nextBoolean()) {
            activities.add(activity(Slot.AFTERNOON, "15:30", pick(AFTERNOON), center));
        }
        activities.add(activity(Slot.EVENING, "19:30", pick(EVENING), center));
        String title = "Day " + dayNumber + ": " + activities.get(0).name() + " and " + activities.get(1).name();
        return new Day(dayNumber, date, title, activities, null, null);
    }

    private Activity activity(Slot slot, String time, String[] place, double[] center) {
        int cost = random.nextInt(5) * 10;
        Double lat = center == null ? null : center[0] + (random.nextDouble() - 0.5) * 0.04;
        Double lng = center == null ? null : center[1] + (random.nextDouble() - 0.5) * 0.04;
        return new Activity(slot, time, place[0], "A placeholder " + place[0].toLowerCase(Locale.ROOT)
                + " generated by the mock AI.", Category.valueOf(place[1]), BigDecimal.valueOf(cost),
                BigDecimal.valueOf(cost), 60 + random.nextInt(4) * 30, round(lat), round(lng));
    }

    private static PackingList packingList() {
        return new PackingList(List.of(
                new PackingList.Category("Documents", List.of(
                        new PackingList.Item("Passport", null), new PackingList.Item("Travel insurance", "printed copy"))),
                new PackingList.Category("Clothes", List.of(
                        new PackingList.Item("Comfortable walking shoes", null),
                        new PackingList.Item("Light jacket", "evenings can be cool"))),
                new PackingList.Category("Electronics", List.of(
                        new PackingList.Item("Phone charger", null), new PackingList.Item("Power bank", null))),
                new PackingList.Category("Health", List.of(
                        new PackingList.Item("Sunscreen", null), new PackingList.Item("Basic medicines", null)))));
    }

    private String[] pick(List<String[]> options) {
        return options.get(random.nextInt(options.size()));
    }

    private static double[] center(String destination) {
        String key = destination.toLowerCase(Locale.ROOT);
        return CITY_CENTERS.entrySet().stream()
                .filter(e -> key.contains(e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }

    /** Reads "Label: value" from a line of the rendered prompt. */
    private static String value(String prompt, String label) {
        Matcher m = Pattern.compile("^" + Pattern.quote(label) + ": (.+)$", Pattern.MULTILINE).matcher(prompt);
        if (!m.find()) {
            throw new IllegalArgumentException("Prompt has no '" + label + "' line");
        }
        return m.group(1).strip();
    }

    private static Double round(Double value) {
        return value == null ? null : BigDecimal.valueOf(value).setScale(5, RoundingMode.HALF_UP).doubleValue();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
