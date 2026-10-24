import { Check } from 'lucide-react'
import { categoryStyle } from '../../lib/category'
import { INTERESTS, type Interest } from '../../types/api'

type Props = { value: Interest[]; onChange: (value: Interest[]) => void; disabled?: boolean }

/** Toggle chips: a category colour dot that turns into a check when selected. */
export default function InterestChips({ value, onChange, disabled }: Props) {
  const toggle = (interest: Interest) =>
    onChange(value.includes(interest) ? value.filter((i) => i !== interest) : [...value, interest])

  return (
    <div className="tc-chips">
      {INTERESTS.map((interest) => {
        const selected = value.includes(interest)
        const { label, slug } = categoryStyle(interest)
        return (
          <button
            key={interest}
            type="button"
            className="tc-chip"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => toggle(interest)}
          >
            {selected ? <Check className="tc-icon tc-check-ic" aria-hidden /> : <span className={`tc-dot tc-bg--${slug}`} />}
            {label}
          </button>
        )
      })}
    </div>
  )
}
