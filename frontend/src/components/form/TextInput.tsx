import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** leading icon, e.g. <MapPin size={18} /> */
  icon?: ReactNode
  trailing?: ReactNode
}

/** Bordered control box (tc-input) around a plain input, so icons sit inside the border. */
export default function TextInput({ icon, trailing, className = '', ...rest }: InputProps) {
  return (
    <div className={`tc-input ${className}`}>
      {icon}
      <input {...rest} />
      {trailing}
    </div>
  )
}

export function TextArea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={`tc-input tc-input--area ${className}`}>
      <textarea {...rest} />
    </div>
  )
}
