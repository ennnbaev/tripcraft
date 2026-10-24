import { Sparkles } from 'lucide-react'

/** Violet marker for anything produced by the AI. */
export default function AiBadge({ children = 'AI', className = '' }: { children?: string; className?: string }) {
  return (
    <span className={`tc-ai ${className}`}>
      <Sparkles className="tc-icon" aria-hidden />
      {children}
    </span>
  )
}
