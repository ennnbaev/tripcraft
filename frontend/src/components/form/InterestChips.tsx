import { INTERESTS, type Interest } from '../../types/api'
import { categoryStyle } from '../../lib/categories'
import { label } from '../../lib/format'

type Props = { value: Interest[]; onChange: (value: Interest[]) => void; disabled?: boolean }

export default function InterestChips({ value, onChange, disabled }: Props) {
  const toggle = (interest: Interest) =>
    onChange(value.includes(interest) ? value.filter((i) => i !== interest) : [...value, interest])

  return (
    <div className="flex flex-wrap gap-2">
      {INTERESTS.map((interest) => {
        const active = value.includes(interest)
        return (
          <button
            key={interest}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => toggle(interest)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
              active
                ? 'border-sky-600 bg-sky-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            <span className="mr-1">{categoryStyle(interest).icon}</span>
            {label(interest)}
          </button>
        )
      })}
    </div>
  )
}
