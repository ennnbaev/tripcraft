import type { ReactNode } from 'react'
import { errorMessage } from '../api/client'
import Spinner from './Spinner'

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
      <Spinner className="h-8 w-8 text-sky-600" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center">
      <p className="text-lg font-semibold text-slate-900">Something went wrong</p>
      <p className="mt-2 text-sm text-slate-600">{errorMessage(error)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="tc-btn tc-btn--secondary mt-5">
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {text && <p className="mt-1 text-sm text-slate-600">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
