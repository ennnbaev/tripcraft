import { LoaderCircle, MapPin } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { flagEmoji, placeLabel, POPULAR_PLACES, usePlaceSearch, type Place } from '../../api/places'

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
  describedBy?: string
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

/**
 * Destination combobox: popular places when empty, city search while typing.
 * Free text is still accepted, so any destination the model knows can be entered.
 */
export default function DestinationInput({ id, value, onChange, disabled, invalid, autoFocus, describedBy }: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<Place | null>(null)

  const query = useDebounced(value, 250)
  const search = usePlaceSearch(query)
  const typing = value.trim().length >= 2
  const options = typing ? (search.data ?? []) : POPULAR_PLACES
  const loading = typing && (search.isFetching || query !== value)
  const activeIndex = Math.min(active, Math.max(options.length - 1, 0))

  // the flag stays only while the text still matches the picked place
  const flagPlace = selected && placeLabel(selected) === value ? selected : null

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const pick = (place: Place) => {
    setSelected(place)
    onChange(placeLabel(place))
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      if (options.length === 0) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((activeIndex + step + options.length) % options.length)
    } else if (e.key === 'Enter' && open && options[activeIndex]) {
      e.preventDefault()
      pick(options[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && !disabled

  return (
    <div ref={rootRef} className="relative">
      <div className="tc-input">
        {flagPlace ? (
          <span className="flex w-[18px] justify-center text-lg leading-none" aria-hidden>
            {flagEmoji(flagPlace.countryCode)}
          </span>
        ) : (
          <MapPin className="tc-icon" aria-hidden />
        )}
        <input
          id={id}
          type="text"
          role="combobox"
          maxLength={255}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          autoComplete="off"
          placeholder="City or region, e.g. Tbilisi"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        {loading && showList && <LoaderCircle className="tc-icon tc-spin" aria-hidden />}
      </div>

      {showList && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-input border border-border bg-surface-raised shadow-lift">
          <div className="px-3.5 pt-2.5 pb-1 font-heading text-xs font-semibold tracking-wide text-ink-muted uppercase">
            {typing ? 'Cities' : 'Popular destinations'}
          </div>
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto pb-1.5">
            {options.map((p, i) => (
              <li
                key={placeLabel(p)}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`flex cursor-pointer items-center gap-3 px-3.5 py-2 text-sm ${
                  i === activeIndex ? 'bg-mint-tint' : ''
                }`}
                onMouseEnter={() => setActive(i)}
                // mousedown instead of click so the input doesn't lose focus first
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(p)
                }}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {flagEmoji(p.countryCode)}
                </span>
                <span className="min-w-0 truncate">
                  <span className="font-medium text-ink">{p.name}</span>
                  <span className="text-ink-muted">
                    {' '}
                    · {p.region && p.region !== p.name ? `${p.region}, ` : ''}
                    {p.country}
                  </span>
                </span>
              </li>
            ))}
            {typing && !loading && options.length === 0 && (
              <li className="px-3.5 py-2 text-sm text-ink-muted">
                {search.isError ? 'City search is unavailable.' : 'No cities found.'} You can still use “{value.trim()}”.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
