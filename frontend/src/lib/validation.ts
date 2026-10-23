import type { TripRequest } from '../types/api'
import { todayIso, tripLength } from './dates'

export const MAX_TRIP_DAYS = 14
export const MAX_NOTES = 500

export type FieldErrors = Partial<Record<keyof TripRequest, string>>

/** Mirrors the backend rules so most errors are caught before the (slow) AI call. */
export function validateTrip(req: TripRequest): FieldErrors {
  const errors: FieldErrors = {}
  const destination = req.destination.trim()
  if (!destination) errors.destination = 'Destination is required'
  else if (destination.length > 255) errors.destination = 'Destination is too long'

  if (!req.startDate) errors.startDate = 'Start date is required'
  else if (req.startDate < todayIso()) errors.startDate = 'Start date cannot be in the past'

  if (!req.endDate) errors.endDate = 'End date is required'
  else if (req.startDate && req.endDate < req.startDate) errors.endDate = 'End date must be on or after the start date'
  else if (req.startDate && tripLength(req.startDate, req.endDate) > MAX_TRIP_DAYS)
    errors.endDate = `Trip can be at most ${MAX_TRIP_DAYS} days`

  if (!Number.isInteger(req.travelers) || req.travelers < 1 || req.travelers > 10)
    errors.travelers = 'Travelers must be between 1 and 10'

  if (req.interests.length === 0) errors.interests = 'Pick at least one interest'

  if ((req.notes?.length ?? 0) > MAX_NOTES) errors.notes = `Notes can be at most ${MAX_NOTES} characters`

  return errors
}
