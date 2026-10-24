import { label as toLabel } from '../../lib/format'

type Props<T extends string> = {
  /** id of the visible label element */
  labelledBy: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

/** Pill radio group (tc-seg); arrow keys move the selection like native radios. */
export default function SegmentedControl<T extends string>({ labelledBy, options, value, onChange, disabled }: Props<T>) {
  const move = (group: HTMLElement, step: number) => {
    const index = (options.indexOf(value) + step + options.length) % options.length
    onChange(options[index])
    group.querySelectorAll('button')[index]?.focus()
  }
  return (
    <div
      className="tc-seg"
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={(e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
        if (!step) return
        e.preventDefault()
        move(e.currentTarget, step)
      }}
    >
      {options.map((opt) => {
        const checked = opt === value
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(opt)}
          >
            {toLabel(opt)}
          </button>
        )
      })}
    </div>
  )
}
