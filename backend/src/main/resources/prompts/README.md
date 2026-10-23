# Prompt templates

Spring AI `PromptTemplate` files (StringTemplate syntax, variables in `{braces}`, conditionals as `{if(flag)}...{endif}`).
Rendered by `com.tripcraft.ai.PromptTemplates`; called through `ChatClient` by `com.tripcraft.ai.AiCallExecutor`.
The version of this set is `app.ai.prompt-version` (application.yml) and is written to `ai_requests.template_version`.
Change the version whenever you change a template, so the stats can compare versions.

| File | Type | Variables | Purpose |
|---|---|---|---|
| `itinerary-system.st` | system | — | Role and rules for every call (real places, logistics, pace, budget, prices, JSON only) |
| `itinerary-generate.st` | user | `destination, startDate, endDate, days, travelers, budgetLevel, interests, pace, language, hasNotes, notes, format` | Full trip from the form |
| `day-regenerate.st` | user | `itineraryJson, destination, dayNumber, date, travelers, budgetLevel, interests, pace, language, hasFeedback, feedback, usedPlaces, format` | Rebuild one day with the traveler's feedback |
| `packing-list.st` | user | `destination, startDate, endDate, travelers, activities, language, format` | Packing list by category |

`format` is filled by Spring AI `BeanOutputConverter`: the JSON schema of the target record
(`Itinerary`, `Day`, `PackingList`) plus the instruction to answer with JSON only.

The `TASK: ...` first line of each user template names the task. It also lets the dev-only
`mock` profile (`MockChatModel`) recognize which answer to fake.
