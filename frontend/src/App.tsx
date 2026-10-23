import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import NewTripPage from './pages/NewTripPage'
import NotFoundPage from './pages/NotFoundPage'
import StatsPage from './pages/StatsPage'
import TripPage from './pages/TripPage'
import TripsPage from './pages/TripsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<NewTripPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
