import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

/** App shell: dark header, then the page. Pages own their width because some start with a full-bleed band. */
export default function Layout() {
  return (
    <div className="tc-page flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

/** Standard centered content column (max 1200px). */
export function PageWrap({ children }: { children: ReactNode }) {
  return <div className="tc-wrap">{children}</div>
}
