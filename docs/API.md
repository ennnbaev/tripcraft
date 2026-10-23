# TripCraft: API contract

Shared contract between backend and frontend. JSON everywhere, dates are `YYYY-MM-DD`, timestamps are ISO-8601 with offset.
If this file and the PRD disagree, this file wins for field names and shapes.

## Enums

| Enum | Values |
|---|---|
| `BudgetLevel` | `ECONOMY`, `MEDIUM`, `PREMIUM` |
| `Pace` | `RELAXED`, `BALANCED`, `ACTIVE` |
| `Interest` | `FOOD`, `MUSEUMS`, `NATURE`, `NIGHTLIFE`, `SHOPPING`, `HISTORY`, `ART`, `SPORT` |
| `Category` | all `Interest` values + `SIGHTSEEING`, `TRANSPORT`, `OTHER` |
| `Slot` | `MORNING`, `AFTERNOON`, `EVENING` |
| `AiStatus` | `SUCCESS`, `INVALID_JSON`, `RATE_LIMITED`, `ERROR` |

## Models

```ts
type TripRequest = {
  destination: string        // 1..255 chars, required
  startDate: string          // not in the past
  endDate: string            // >= startDate, trip length 1..14 days
  travelers: number          // 1..10
  budgetLevel: BudgetLevel
  interests: Interest[]      // at least 1, no duplicates
  pace: Pace
  notes?: string | null      // up to 500 chars
  language?: string | null   // language of the itinerary text, default "English", up to 30 chars
}

type Activity = {
  slot: Slot
  time: string               // "HH:mm"
  name: string
  description: string
  category: Category
  estimatedCost: number      // local currency, for the whole group, >= 0
  estimatedCostUsd: number   // >= 0
  durationMinutes: number    // > 0
  lat?: number | null        // approximate coordinates, may be missing
  lng?: number | null
}

type Day = {
  dayNumber: number          // 1..N
  date: string
  title: string
  activities: Activity[]     // 1..8
  dayEstimatedCost: number   // recomputed by backend = sum of activities
  dayEstimatedCostUsd: number
}

type Itinerary = {
  destination: string
  currency: string           // ISO code, e.g. "GEL"
  days: Day[]
  totalEstimatedCost: number // recomputed by backend = sum of days
  totalEstimatedCostUsd: number
  tips: string[]             // 3..5
}

type PackingList = {
  categories: { name: string; items: { name: string; note?: string | null }[] }[]
}

type TripResponse = {
  id: number
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budgetLevel: BudgetLevel
  pace: Pace
  interests: Interest[]
  notes: string | null
  language: string
  itinerary: Itinerary | null
  packingList: PackingList | null
  createdAt: string
  updatedAt: string
}

type TripSummary = {
  id: number
  destination: string
  startDate: string
  endDate: string
  createdAt: string
}

type ErrorResponse = {
  error: string                       // human-readable message
  details: Record<string, string>     // field -> message for 400, otherwise {}
}

type Stats = {
  totalRequests: number
  successCount: number
  errorCount: number                  // every status except SUCCESS
  errorRate: number                   // 0..1
  avgLatencyMs: number
  totalInputTokens: number
  totalOutputTokens: number
  byDay: { date: string; requests: number; errors: number }[]          // last 14 days, ascending
  byProvider: { provider: string; model: string; requests: number; inputTokens: number; outputTokens: number; avgLatencyMs: number }[]
  byTemplate: { templateName: string; requests: number; avgLatencyMs: number }[]
  recent: {
    id: number; tripId: number | null; templateName: string; templateVersion: string
    provider: string; model: string; inputTokens: number | null; outputTokens: number | null
    latencyMs: number | null; status: AiStatus; errorMessage: string | null; createdAt: string
  }[]                                 // last 20, newest first
}
```

## Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/health` | — | `{ status, app }` |
| POST | `/api/trips` | `TripRequest` | `201 TripResponse` (itinerary generated) |
| GET | `/api/trips` | — | `TripSummary[]`, newest first |
| GET | `/api/trips/{id}` | — | `TripResponse` |
| DELETE | `/api/trips/{id}` | — | `204` |
| POST | `/api/trips/{id}/days/{dayNumber}/regenerate` | `{ feedback: string }` (0..500 chars) | `TripResponse` |
| POST | `/api/trips/{id}/packing-list` | — | `TripResponse` (with `packingList`) |
| GET | `/api/stats` | — | `Stats` |

## Errors

All errors use `ErrorResponse`.

| Status | When |
|---|---|
| 400 | Validation failed (`details` has field messages), malformed JSON, `dayNumber` out of range |
| 404 | Trip not found |
| 429 | AI provider rate limit: `"AI free tier limit reached, please try again in a minute"` |
| 502 | AI provider error or invalid AI response after retry |

A failed generation in `POST /api/trips` does not leave a trip behind. A failed regenerate or packing-list call leaves the stored trip unchanged.
