import type { AiStatus } from '../../types/api'

const styles: Record<AiStatus, [cls: string, label: string]> = {
  SUCCESS: ['success', 'Success'],
  INVALID_JSON: ['invalid', 'Invalid JSON'],
  RATE_LIMITED: ['limited', 'Rate limited'],
  ERROR: ['error', 'Error'],
}

export default function StatusBadge({ status }: { status: AiStatus }) {
  const [cls, label] = styles[status] ?? styles.ERROR
  return (
    <span className={`tc-status tc-status--${cls}`}>
      <i aria-hidden />
      {label}
    </span>
  )
}
