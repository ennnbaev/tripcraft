package com.tripcraft.ai;

/** JSON answers as a model would send them. */
public final class AiTestData {

    private AiTestData() {
    }

    public static String activity(String slot, String time, String name, String category, int cost) {
        return """
                {"slot":"%s","time":"%s","name":"%s","description":"desc","category":"%s",
                 "estimatedCost":%d,"estimatedCostUsd":%d,"durationMinutes":60,"lat":41.7,"lng":44.8}
                """.formatted(slot, time, name, category, cost, cost / 2);
    }

    public static String day(int number, String name, int cost) {
        return """
                {"dayNumber":%d,"date":"2000-01-01","title":"Day %d","dayEstimatedCost":999,
                 "activities":[%s,%s]}
                """.formatted(number, number,
                activity("MORNING", "09:00", name + " morning", "HISTORY", cost),
                activity("EVENING", "19:00", name + " dinner", "FOOD", cost));
    }

    /** Days in the given order; each costs 2 * cost. */
    public static String itinerary(int... dayNumbers) {
        StringBuilder days = new StringBuilder();
        for (int n : dayNumbers) {
            if (!days.isEmpty()) {
                days.append(',');
            }
            days.append(day(n, "Place " + n, 10 * n));
        }
        return """
                {"destination":"Tbilisi, Georgia","currency":"GEL","days":[%s],
                 "totalEstimatedCost":1,"totalEstimatedCostUsd":1,"tips":["a","b","c","d","e","f"]}
                """.formatted(days);
    }

    public static String packingList() {
        return """
                {"categories":[{"name":"Documents","items":[{"name":"Passport","note":null}]}]}
                """;
    }
}
