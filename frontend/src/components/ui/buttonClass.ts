export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ai' | 'ai-solid' | 'danger' | 'on-deep'

export type ButtonStyle = {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  /** square icon-only button; pass aria-label */
  icon?: boolean
  block?: boolean
}

export function buttonClass({ variant = 'primary', size = 'md', icon, block }: ButtonStyle, extra = '') {
  return [
    'tc-btn',
    `tc-btn--${variant}`,
    size === 'sm' && 'tc-btn--sm',
    icon && 'tc-btn--icon',
    block && 'tc-btn--block',
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}
