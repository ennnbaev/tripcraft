import { label } from '../../lib/format'
import type { AiStatus } from '../../types/api'

const styles: Record<AiStatus, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  INVALID_JSON: 'bg-amber-50 text-amber-800 ring-amber-200',
  RATE_LIMITED: 'bg-orange-50 text-orange-700 ring-orange-200',
  ERROR: 'bg-red-50 text-red-700 ring-red-200',
}

export default function StatusBadge({ status }: { status: AiStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status] ?? styles.ERROR}`}>
      {label(status)}
    </span>
  )
}
