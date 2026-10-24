import { Languages, Sparkles } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useCreateTrip } from '../api/trips'
import DestinationInput from '../components/form/DestinationInput'
import Field from '../components/form/Field'
import InterestChips from '../components/form/InterestChips'
import SegmentedControl from '../components/form/SegmentedControl'
import Stepper from '../components/form/Stepper'
import DateRangeField from '../components/form/DateRangeField'
import Select, { type SelectOption } from '../components/form/Select'
import { TextArea } from '../components/form/TextInput'
import GenerationLoading, { type GenerationError } from '../components/generating/GenerationLoading'
import Button from '../components/ui/Button'
import Notice from '../components/ui/Notice'
import { addDaysIso, todayIso, tripLength } from '../lib/dates'
import { formatDateSpan, label, plural } from '../lib/format'
import { MAX_NOTES, MAX_TRIP_DAYS, validateTrip, type FieldErrors } from '../lib/validation'
import { BUDGET_LEVELS, PACES, type BudgetLevel, type Pace, type TripRequest } from '../types/api'

const BUDGET_HINTS: Record<BudgetLevel, string> = {
  ECONOMY: 'Street food, public transport and free sights.',
  MEDIUM: 'A mix of cafés, restaurants and paid sights.',
  PREMIUM: 'Top restaurants, taxis and guided tours.',
}

// value is what the backend gets (an English name the model understands); hint is the native name
const LANGUAGES: SelectOption[] = [
  ['English', ''],
  ['Russian', 'Русский'],
  ['Ukrainian', 'Українська'],
  ['Georgian', 'ქართული'],
  ['Armenian', 'Հայերեն'],
  ['German', 'Deutsch'],
  ['French', 'Français'],
  ['Spanish', 'Español'],
  ['Italian', 'Italiano'],
  ['Portuguese', 'Português'],
  ['Polish', 'Polski'],
  ['Turkish', 'Türkçe'],
  ['Arabic', 'العربية'],
  ['Chinese', '中文'],
  ['Japanese', '日本語'],
  ['Korean', '한국어'],
].map(([value, hint]) => ({ value, label: value, hint: hint || undefined }))

const PACE_HINTS: Record<Pace, string> = {
  RELAXED: '2–3 things a day, long breaks.',
  BALANCED: '3–5 things a day.',
  ACTIVE: '5–8 things a day, early starts.',
}

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

const isIsoDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)

/** Copy for the Generating error state; 400s never get here (they go back to the form fields). */
function generationError(err: unknown): GenerationError {
  if (err instanceof ApiError) {
    if (err.status === 429)
      return {
        title: 'The free AI limit is reached',
        body: 'Please try again in a minute.',
        code: `Error 429 · ${err.body.error}`,
      }
    if (err.status === 502)
      return {
        title: 'We couldn’t build a valid plan',
        body: 'The AI answer didn’t pass our checks, even after a retry. Please try again.',
        code: `Error 502 · ${err.body.error}`,
      }
    return {
      title: 'Something went wrong',
      body: 'The server couldn’t create the trip. Please try again.',
      code: `Error ${err.status} · ${err.body.error}`,
    }
  }
  return {
    title: 'We can’t reach TripCraft',
    body: 'Check your connection and that the backend is running, then try again.',
    code: 'Network error · the request did not reach the server',
  }
}

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

export default function NewTripPage() {
  const navigate = useNavigate()
  const createTrip = useCreateTrip()
  const abortRef = useRef<AbortController | null>(null)
  const [form, setForm] = useState<TripRequest>(initialForm)
  const [submitted, setSubmitted] = useState(false)
  // 400 details from the backend, shown under the matching fields until the user edits that field
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})

  const clientErrors = validateTrip(form)
  const errors: FieldErrors = submitted ? { ...serverErrors, ...clientErrors } : serverErrors
  const otherServerErrors = Object.entries(serverErrors).filter(([key]) => !(key in form))
  const hasServerErrors = Object.keys(serverErrors).length > 0
  const showSummary = Object.keys(errors).length > 0 || otherServerErrors.length > 0

  const update = <K extends keyof TripRequest>(key: K, value: TripRequest[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setServerErrors((e) => {
      if (!(key in e)) return e
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  const days = isIsoDate(form.startDate) && isIsoDate(form.endDate) ? tripLength(form.startDate, form.endDate) : 0
  const validRange = days >= 1 && days <= MAX_TRIP_DAYS
  const city = form.destination.split(',')[0].trim()
  const planSummary = validRange && city ? `${plural(days, 'day')} in ${city}` : 'your days'

  const send = () => {
    const body: TripRequest = {
      ...form,
      destination: form.destination.trim(),
      notes: form.notes?.trim() || null,
      language: form.language?.trim() || 'English',
    }
    abortRef.current = new AbortController()
    createTrip.mutate(
      { body, signal: abortRef.current.signal },
      {
        onSuccess: (trip) => navigate(`/trips/${trip.id}`),
        onError: (err) => {
          if (isAbort(err)) return
          if (err instanceof ApiError && err.status === 400) {
            setServerErrors(err.details as FieldErrors)
            createTrip.reset()
          }
        },
      },
    )
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setServerErrors({})
    if (Object.keys(clientErrors).length > 0) return
    send()
  }

  // Cancel and "Edit trip": drop the request and show the form again with the same answers
  const backToForm = () => {
    abortRef.current?.abort()
    createTrip.reset()
  }

  const failed = createTrip.isError && !isAbort(createTrip.error)
  if (createTrip.isPending || failed) {
    const summary = [
      form.destination.trim(),
      formatDateSpan(form.startDate, form.endDate),
      plural(form.travelers, 'traveler'),
      `${label(form.budgetLevel)} budget`,
      form.interests.map(label).join(', '),
    ].join(' · ')
    return (
      <GenerationLoading
        heading={`Planning ${plural(days, 'day')} in ${city}`}
        summary={summary}
        error={failed ? generationError(createTrip.error) : null}
        onCancel={backToForm}
        onRetry={send}
        onEdit={backToForm}
      />
    )
  }

  const dateHint = validRange ? `${plural(days, 'day')} · ${formatDateSpan(form.startDate, form.endDate)}` : 'Choose your dates'

  return (
    <div className="tc-hero tc-deep">
      <div className="tc-hero__inner">
        <div className="tc-hero__art" aria-hidden>
          <i style={{ width: 88, height: 120, background: 'var(--coral)' }} />
          <i style={{ width: 64, height: 64, background: 'var(--sun)', borderRadius: '50%' }} />
          <i style={{ width: 112, height: 160, background: 'var(--mint)' }} />
          <i style={{ width: 56, height: 96, background: 'var(--sky)' }} />
        </div>
        <h1>
          Where to <em>next?</em>
        </h1>
        <p className="tc-hero__lead">
          Tell us where, when and what you love. We'll plan the days for you, with times, places and estimated prices.
        </p>

        <form className="tc-planner" aria-labelledby="planner-title" noValidate onSubmit={onSubmit}>
          <h2 id="planner-title" className="sr-only">
            New trip
          </h2>

          {showSummary && (
            <Notice tone="error" title="Check the highlighted fields">
              {hasServerErrors
                ? 'The server didn’t accept some answers. Fix them and try again.'
                : 'Nothing was sent yet. Fix them and try again.'}
              {otherServerErrors.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {otherServerErrors.map(([key, msg]) => (
                    <li key={key}>{msg}</li>
                  ))}
                </ul>
              )}
            </Notice>
          )}

          <div className="tc-form">
            <Field className="tc-s6" label="Destination" htmlFor="f-dest" messageId="f-dest-msg" error={errors.destination}>
              <DestinationInput
                id="f-dest"
                value={form.destination}
                onChange={(v) => update('destination', v)}
                invalid={!!errors.destination}
                describedBy={errors.destination ? 'f-dest-msg' : undefined}
              />
            </Field>

            <Field
              className="tc-s6"
              label="Dates"
              htmlFor="f-dates"
              messageId="f-dates-msg"
              error={errors.startDate ?? errors.endDate}
              hint={dateHint}
              counter={errors.startDate || errors.endDate ? undefined : `Up to ${MAX_TRIP_DAYS} days`}
            >
              <DateRangeField
                id="f-dates"
                start={form.startDate}
                end={form.endDate}
                maxDays={MAX_TRIP_DAYS}
                onChange={(start, end) => {
                  update('startDate', start)
                  update('endDate', end)
                }}
                invalid={!!(errors.startDate || errors.endDate)}
                describedBy="f-dates-msg"
              />
            </Field>

            <Field className="tc-s3" label="Travelers" labelId="f-trav-l" error={errors.travelers} hint="1 to 10 people">
              <Stepper
                labelledBy="f-trav-l"
                value={form.travelers}
                min={1}
                max={10}
                onChange={(v) => update('travelers', v)}
                format={(n) => plural(n, 'traveler')}
                decrementLabel="Fewer travelers"
                incrementLabel="More travelers"
              />
            </Field>

            <Field className="tc-s5" label="Budget" labelId="f-budget-l" error={errors.budgetLevel}>
              <SegmentedControl
                labelledBy="f-budget-l"
                options={BUDGET_LEVELS}
                value={form.budgetLevel}
                onChange={(v) => update('budgetLevel', v)}
              />
              <span className="tc-seg__hint">{BUDGET_HINTS[form.budgetLevel]}</span>
            </Field>

            <Field className="tc-s4" label="Pace" labelId="f-pace-l" error={errors.pace}>
              <SegmentedControl labelledBy="f-pace-l" options={PACES} value={form.pace} onChange={(v) => update('pace', v)} />
              <span className="tc-seg__hint">{PACE_HINTS[form.pace]}</span>
            </Field>

            <div className="tc-s12" role="group" aria-labelledby="f-int-l">
              <Field label="Interests" labelId="f-int-l" labelNote="Pick at least one" error={errors.interests}>
                <InterestChips value={form.interests} onChange={(v) => update('interests', v)} />
              </Field>
            </div>

            <Field
              className="tc-s8"
              label="Notes"
              labelNote="Optional"
              htmlFor="f-notes"
              messageId="f-notes-count"
              error={errors.notes}
              hint="We pass this to the planner as is."
              counter={`${form.notes?.length ?? 0} / ${MAX_NOTES}`}
            >
              <TextArea
                id="f-notes"
                rows={3}
                maxLength={MAX_NOTES}
                placeholder="Anything we should know? Dietary needs, must-sees, mobility."
                value={form.notes ?? ''}
                onChange={(e) => update('notes', e.target.value.slice(0, MAX_NOTES))}
                aria-describedby="f-notes-count"
              />
            </Field>

            <Field
              className="tc-s4"
              label="Itinerary language"
              htmlFor="f-lang"
              messageId="f-lang-help"
              error={errors.language}
              hint="The app stays in English. Only the plan is translated."
            >
              <Select
                id="f-lang"
                value={form.language ?? 'English'}
                options={LANGUAGES}
                onChange={(v) => update('language', v)}
                icon={<Languages className="tc-icon" aria-hidden />}
                invalid={!!errors.language}
                describedBy="f-lang-help"
              />
            </Field>
          </div>

          <div className="tc-planner__foot">
            <p>
              <Sparkles className="tc-icon" aria-hidden />
              We'll plan {planSummary}. It usually takes 5–30 seconds.
            </p>
            <Button type="submit">
              <Sparkles className="tc-icon" aria-hidden />
              Plan my trip
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
