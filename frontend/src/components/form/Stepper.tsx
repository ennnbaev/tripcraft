import { Minus, Plus } from 'lucide-react'

type Props = {
  labelledBy: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  /** e.g. n => "2 travelers" */
  format: (value: number) => string
  decrementLabel: string
  incrementLabel: string
  disabled?: boolean
}

export default function Stepper({ labelledBy, value, min, max, onChange, format, decrementLabel, incrementLabel, disabled }: Props) {
  return (
    <div className="tc-stepper" role="group" aria-labelledby={labelledBy}>
      <button type="button" aria-label={decrementLabel} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        <Minus className="tc-icon" aria-hidden />
      </button>
      <output aria-live="polite">{format(value)}</output>
      <button type="button" aria-label={incrementLabel} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <Plus className="tc-icon" aria-hidden />
      </button>
    </div>
  )
}
