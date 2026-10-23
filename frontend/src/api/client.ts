import type { ErrorResponse } from '../types/api'

/** Error thrown for any non-2xx response; carries the backend's ErrorResponse when present. */
export class ApiError extends Error {
  readonly status: number
  readonly body: ErrorResponse

  constructor(status: number, body: ErrorResponse) {
    super(body.error)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  get details(): Record<string, string> {
    return this.body.details ?? {}
  }
}

async function parseError(res: Response): Promise<ErrorResponse> {
  const text = await res.text()
  try {
    const json = JSON.parse(text) as Partial<ErrorResponse>
    if (typeof json.error === 'string') {
      return { error: json.error, details: json.details ?? {} }
    }
  } catch {
    // not JSON, fall through
  }
  return { error: text || `Request failed with status ${res.status}`, details: {} }
}

// Thin fetch wrapper. In dev, Vite proxies /api to http://localhost:8080.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res))
  }
  if (res.status === 204 || res.headers.get('Content-Length') === '0') {
    return undefined as T
  }
  return res.json() as Promise<T>
}

/** User-facing message for any error thrown by a query or mutation. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return error.body.error || 'AI free tier limit reached, please try again in a minute.'
    }
    if (error.status === 502) {
      return error.body.error || 'The AI provider failed to answer. Please try again.'
    }
    if (error.status >= 500) {
      return 'Something went wrong on the server. Please try again.'
    }
    return error.body.error
  }
  if (error instanceof TypeError) {
    return 'Cannot reach the server. Is the backend running?'
  }
  return error instanceof Error ? error.message : 'Unexpected error'
}
