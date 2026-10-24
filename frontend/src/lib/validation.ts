import type { TripRequest } from '../types/api'
import { todayIso, tripLength } from './dates'

export const MAX_TRIP_DAYS = 14
export const MAX_NOTES = 500
export const MAX_LANGUAGE = 30

export type FieldErrors = Partial<Record<keyof TripRequest, string>>

const isIsoDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)

/** Mirrors the backend rules so most errors are caught before the (slow) AI call. Copy follows the design. */
export function validateTrip(req: TripRequest): FieldErrors {
  const errors: FieldErrors = {}
  const destination = req.destination.trim()
  if (!destination) errors.destination = 'Enter where you are going.'
  else if (destination.length > 255) errors.destination = 'Keep the destination under 255 characters.'

  if (!isIsoDate(req.startDate)) errors.startDate = 'Pick a start date.'
  else if (req.startDate < todayIso()) errors.startDate = 'Pick a start date from today on.'

  if (!isIsoDate(req.endDate)) errors.endDate = 'Pick an end date.'
  else if (isIsoDate(req.startDate) && req.endDate < req.startDate)
    errors.endDate = 'The end date can’t be before the start date.'
  else if (isIsoDate(req.startDate)) {
    const days = tripLength(req.startDate, req.endDate)
    if (days > MAX_TRIP_DAYS) errors.endDate = `Trips can be up to ${MAX_TRIP_DAYS} days. This one is ${days} days.`
  }

  if (!Number.isInteger(req.travelers) || req.travelers < 1 || req.travelers > 10)
    errors.travelers = 'Choose 1 to 10 travelers.'

  if (req.interests.length === 0) errors.interests = 'Pick at least one interest.'

  if ((req.notes?.length ?? 0) > MAX_NOTES) errors.notes = `Keep notes under ${MAX_NOTES} characters.`
  if ((req.language?.length ?? 0) > MAX_LANGUAGE) errors.language = `Keep the language under ${MAX_LANGUAGE} characters.`

  return errors
}
