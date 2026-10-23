import { NavLink, Outlet } from 'react-router-dom'
import { useHealth } from '../api/stats'

const links = [
  { to: '/', label: 'New trip', end: true },
  { to: '/trips', label: 'My trips', end: false },
  { to: '/stats', label: 'Stats', end: false },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-[1100] border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span>TripCraft</span>
          </NavLink>
          <nav className="flex gap-1 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function Footer() {
  const { data, isError, isLoading } = useHealth()
  const status = isLoading ? 'checking…' : isError ? 'not reachable' : data?.status
  const color = isLoading ? 'bg-slate-300' : isError ? 'bg-red-500' : 'bg-emerald-500'
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-xs text-slate-500">
        <span>TripCraft · AI trip planner</span>
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${color}`} />
          Backend: {status}
        </span>
      </div>
    </footer>
  )
}
