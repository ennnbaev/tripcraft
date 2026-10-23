import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

type Health = { status: string; app: string }

// Placeholder page: only checks that the backend is reachable.
export default function HomePage() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => api<Health>('/health'),
  })

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">TripCraft</h1>
        <p className="mt-2 text-slate-600">AI trip planner. Scaffold is up.</p>
        <p className="mt-6 text-sm">
          Backend:{' '}
          {isLoading && <span className="text-slate-500">checking…</span>}
          {isError && <span className="text-red-600">not reachable</span>}
          {data && <span className="text-emerald-600">{data.status}</span>}
        </p>
      </div>
    </main>
  )
}
