import { Route, Routes } from 'react-router-dom'
import Layout, { PageWrap } from './components/Layout'
import NewTripPage from './pages/NewTripPage'
import NotFoundPage from './pages/NotFoundPage'
import StatsPage from './pages/StatsPage'
import TripPage from './pages/TripPage'
import TripsPage from './pages/TripsPage'

// PageWrap is temporary: redesigned screens (handoff steps 2-4) render their own full-bleed layout
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PageWrap><NewTripPage /></PageWrap>} />
        <Route path="/trips" element={<PageWrap><TripsPage /></PageWrap>} />
        <Route path="/trips/:id" element={<PageWrap><TripPage /></PageWrap>} />
        <Route path="/stats" element={<PageWrap><StatsPage /></PageWrap>} />
        <Route path="*" element={<PageWrap><NotFoundPage /></PageWrap>} />
      </Route>
    </Routes>
  )
}
