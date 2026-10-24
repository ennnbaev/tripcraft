import { ChartColumn, List, MapPin, Moon, Plus, Sun } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../lib/theme'

const links = [
  { to: '/', label: 'New trip', icon: Plus, end: true },
  { to: '/trips', label: 'My trips', icon: List, end: false },
  { to: '/stats', label: 'AI stats', icon: ChartColumn, end: false },
]

export default function Header() {
  const { theme, toggle } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className="tc-header">
      <Link to="/" className="tc-logo" aria-label="TripCraft home">
        <span className="tc-logo__mark">
          <MapPin className="tc-icon" aria-hidden />
        </span>
        <span className="tc-logo__text">
          Trip<b>Craft</b>
        </span>
      </Link>
      <nav className="tc-nav" aria-label="Main">
        {/* NavLink sets aria-current="page" on the active link, which the tc-nav styles use */}
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon className="tc-icon tc-icon-sm" aria-hidden />
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          className="tc-btn tc-btn--on-deep tc-btn--icon tc-btn--sm ml-1 w-8 border-transparent"
          onClick={toggle}
          aria-label={`Switch to ${next} theme`}
          title={`Switch to ${next} theme`}
        >
          {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
        </button>
      </nav>
    </header>
  )
}
