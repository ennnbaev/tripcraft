import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export type SelectOption = { value: string; label: string; hint?: string }

type Props = {
  id: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  icon?: ReactNode
  invalid?: boolean
  describedBy?: string
}

/** Styled single-select (button + listbox) that matches tc-input; keyboard: arrows, Home/End, Enter, Escape, type-ahead. */
export default function Select({ id, value, options, onChange, icon, invalid, describedBy }: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  const [active, setActive] = useState(selectedIndex)
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // keep the highlighted option visible while moving with the keyboard
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const openList = () => {
    setActive(selectedIndex)
    setOpen(true)
  }

  const pick = (index: number) => {
    onChange(options[index].value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    if (e.key === 'ArrowDown') setActive((i) => Math.min(i + 1, last))
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' || e.key === ' ') pick(active)
    else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
      return
    } else if (e.key.length === 1) {
      // type-ahead: jump to the first option starting with the typed letter
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()))
      if (i >= 0) setActive(i)
      return
    } else return
    e.preventDefault()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`tc-input w-full cursor-pointer text-left ${invalid ? 'border-danger!' : ''}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">
          {selected.label}
          {selected.hint && <span className="ml-2 text-sm text-ink-muted">{selected.hint}</span>}
        </span>
        <ChevronDown className={`tc-icon transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute top-full right-0 left-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-input border border-border bg-surface-raised py-1.5 shadow-lift"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              data-index={i}
              role="option"
              aria-selected={o.value === value}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-[15px] ${i === active ? 'bg-mint-tint' : ''}`}
              onMouseEnter={() => setActive(i)}
              // mousedown keeps focus on the button
              onMouseDown={(e) => {
                e.preventDefault()
                pick(i)
              }}
            >
              <span className="min-w-0 flex-1">
                <span className="text-ink">{o.label}</span>
                {o.hint && <span className="ml-2 text-sm text-ink-muted">{o.hint}</span>}
              </span>
              {o.value === value && <Check className="tc-icon text-mint-ink" size={16} aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
