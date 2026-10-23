// Mirrors docs/API.md. Keep in sync with the backend records.

export const BUDGET_LEVELS = ['ECONOMY', 'MEDIUM', 'PREMIUM'] as const
export const PACES = ['RELAXED', 'BALANCED', 'ACTIVE'] as const
export const INTERESTS = [
  'FOOD',
  'MUSEUMS',
  'NATURE',
  'NIGHTLIFE',
  'SHOPPING',
  'HISTORY',
  'ART',
  'SPORT',
] as const
export const SLOTS = ['MORNING', 'AFTERNOON', 'EVENING'] as const

export type BudgetLevel = (typeof BUDGET_LEVELS)[number]
export type Pace = (typeof PACES)[number]
export type Interest = (typeof INTERESTS)[number]
export type Category = Interest | 'SIGHTSEEING' | 'TRANSPORT' | 'OTHER'
export type Slot = (typeof SLOTS)[number]
export type AiStatus = 'SUCCESS' | 'INVALID_JSON' | 'RATE_LIMITED' | 'ERROR'

export type TripRequest = {
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budgetLevel: BudgetLevel
  interests: Interest[]
  pace: Pace
  notes?: string | null
  language?: string | null
}

export type Activity = {
  slot: Slot
  time: string
  name: string
  description: string
  category: Category
  estimatedCost: number
  estimatedCostUsd: number
  durationMinutes: number
  lat?: number | null
  lng?: number | null
}

export type Day = {
  dayNumber: number
  date: string
  title: string
  activities: Activity[]
  dayEstimatedCost: number
  dayEstimatedCostUsd: number
}

export type Itinerary = {
  destination: string
  currency: string
  days: Day[]
  totalEstimatedCost: number
  totalEstimatedCostUsd: number
  tips: string[]
}

export type PackingList = {
  categories: { name: string; items: { name: string; note?: string | null }[] }[]
}

export type TripResponse = {
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

export type TripSummary = {
  id: number
  destination: string
  startDate: string
  endDate: string
  createdAt: string
}

export type ErrorResponse = {
  error: string
  details: Record<string, string>
}

export type RecentRequest = {
  id: number
  tripId: number | null
  templateName: string
  templateVersion: string
  provider: string
  model: string
  inputTokens: number | null
  outputTokens: number | null
  latencyMs: number | null
  status: AiStatus
  errorMessage: string | null
  createdAt: string
}

export type Stats = {
  totalRequests: number
  successCount: number
  errorCount: number
  errorRate: number
  avgLatencyMs: number
  totalInputTokens: number
  totalOutputTokens: number
  byDay: { date: string; requests: number; errors: number }[]
  byProvider: {
    provider: string
    model: string
    requests: number
    inputTokens: number
    outputTokens: number
    avgLatencyMs: number
  }[]
  byTemplate: { templateName: string; requests: number; avgLatencyMs: number }[]
  recent: RecentRequest[]
}
