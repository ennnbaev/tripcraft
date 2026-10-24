import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client'
import { useCreateTrip } from '../api/trips'
import Alert from '../components/Alert'
import DestinationInput from '../components/form/DestinationInput'
import Field from '../components/form/Field'
import InterestChips from '../components/form/InterestChips'
import SegmentedControl from '../components/form/SegmentedControl'
import Spinner from '../components/Spinner'
import { addDaysIso, todayIso, tripLength } from '../lib/dates'
import { MAX_NOTES, MAX_TRIP_DAYS, validateTrip, type FieldErrors } from '../lib/validation'
import { BUDGET_LEVELS, PACES, type TripRequest } from '../types/api'

const LANGUAGES = ['English', 'Russian', 'Ukrainian', 'Spanish', 'German', 'French', 'Italian', 'Polish']

function initialForm(): TripRequest {
  const start = addDaysIso(todayIso(), 14)
  return {
    destination: '',
    startDate: start,
    endDate: addDaysIso(start, 2),
    travelers: 2,
    budgetLevel: 'MEDIUM',
    interests: [],
    pace: 'BALANCED',
    notes: '',
    language: 'English',
  }
}

export default function NewTripPage() {
  const navigate = useNavigate()
  const createTrip = useCreateTrip()
  const [form, setForm] = useState<TripRequest>(initialForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const busy = createTrip.isPending

  const update = <K extends keyof TripRequest>(key: K, value: TripRequest[K]) => {
    const next = { ...form, [key]: value }
    setForm(next)
    // after the first submit, re-validate live so errors disappear as the user fixes them
    if (submitted) setErrors(validateTrip(next))
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const found = validateTrip(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const body: TripRequest = {
      ...form,
      destination: form.destination.trim(),
      notes: form.notes?.trim() || null,
    }
    createTrip.mutate(body, {
      onSuccess: (trip) => navigate(`/trips/${trip.id}`),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 400) {
          setErrors(err.details as FieldErrors)
        }
      },
    })
  }

  const days = form.startDate && form.endDate ? tripLength(form.startDate, form.endDate) : 0
  const serverError = createTrip.error
  // 400 details for known fields are shown under the fields; anything else goes to the banner
  const fieldDetails = serverError instanceof ApiError && serverError.status === 400 ? serverError.details : {}
  const otherDetails = Object.entries(fieldDetails).filter(([key]) => !(key in form))
  const showBanner =
    serverError && (Object.keys(fieldDetails).length === 0 || otherDetails.length > 0)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Plan a new trip</h1>
      <p className="mt-2 text-slate-600">
        Tell us where and when you are going. TripCraft builds a day-by-day plan with places, times and prices.
      </p>

      <form onSubmit={onSubmit} noValidate className="card mt-8 space-y-6 p-6 sm:p-8">
        <Field label="Destination" htmlFor="destination" error={errors.destination}>
          <DestinationInput
            id="destination"
            value={form.destination}
            onChange={(v) => update('destination', v)}
            invalid={!!errors.destination}
            disabled={busy}
            autoFocus
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Start date" htmlFor="startDate" error={errors.startDate}>
            <input
              id="startDate"
              type="date"
              className={`input ${errors.startDate ? 'input-error' : ''}`}
              min={todayIso()}
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field
            label="End date"
            htmlFor="endDate"
            error={errors.endDate}
            hint={days > 0 ? `${days} day${days === 1 ? '' : 's'} (max ${MAX_TRIP_DAYS})` : undefined}
          >
            <input
              id="endDate"
              type="date"
              className={`input ${errors.endDate ? 'input-error' : ''}`}
              min={form.startDate || todayIso()}
              value={form.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              disabled={busy}
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Travelers" htmlFor="travelers" error={errors.travelers}>
            <input
              id="travelers"
              type="number"
              min={1}
              max={10}
              className={`input ${errors.travelers ? 'input-error' : ''}`}
              value={Number.isNaN(form.travelers) ? '' : form.travelers}
              onChange={(e) => update('travelers', e.target.valueAsNumber)}
              disabled={busy}
            />
          </Field>
          <Field label="Itinerary language" htmlFor="language" error={errors.language}>
            <select
              id="language"
              className="input"
              value={form.language ?? 'English'}
              onChange={(e) => update('language', e.target.value)}
              disabled={busy}
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Budget" error={errors.budgetLevel}>
          <SegmentedControl
            name="Budget"
            options={BUDGET_LEVELS}
            value={form.budgetLevel}
            onChange={(v) => update('budgetLevel', v)}
            disabled={busy}
          />
        </Field>

        <Field label="Pace" error={errors.pace}>
          <SegmentedControl
            name="Pace"
            options={PACES}
            value={form.pace}
            onChange={(v) => update('pace', v)}
            disabled={busy}
          />
        </Field>

        <Field label="Interests" error={errors.interests}>
          <InterestChips value={form.interests} onChange={(v) => update('interests', v)} disabled={busy} />
        </Field>

        <Field
          label="Notes (optional)"
          htmlFor="notes"
          error={errors.notes}
          hint={`${form.notes?.length ?? 0}/${MAX_NOTES}`}
        >
          <textarea
            id="notes"
            rows={3}
            className={`input resize-y ${errors.notes ? 'input-error' : ''}`}
            placeholder="Vegetarian, traveling with kids, no early mornings…"
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            disabled={busy}
          />
        </Field>

        {showBanner && (
          <Alert title={serverError instanceof ApiError && serverError.status === 429 ? 'Rate limit' : "Couldn't generate the trip"}>
            {errorMessage(serverError)}
            {otherDetails.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {otherDetails.map(([key, msg]) => (
                  <li key={key}>{msg}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        {busy && (
          <Alert tone="info" title="Building your itinerary…">
            The AI is planning your days. This usually takes 10–30 seconds, please keep this page open.
          </Alert>
        )}

        <button type="submit" className="tc-btn tc-btn--primary w-full py-3 text-base" disabled={busy}>
          {busy ? (
            <>
              <Spinner className="h-4 w-4" /> Generating…
            </>
          ) : (
            'Generate itinerary'
          )}
        </button>
      </form>
    </div>
  )
}
