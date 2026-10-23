import { label as toLabel } from '../../lib/format'

type Props<T extends string> = {
  name: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

export default function SegmentedControl<T extends string>({ name, options, value, onChange, disabled }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-flow-col auto-cols-fr rounded-xl bg-slate-100 p-1">
      {options.map((opt) => {
        const active = opt === value
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {toLabel(opt)}
          </button>
        )
      })}
    </div>
  )
}
