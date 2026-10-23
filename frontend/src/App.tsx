import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'

// Routes from the PRD (to be implemented):
//   /            -> new trip form
//   /trips       -> my trips
//   /trips/:id   -> itinerary view
//   /stats       -> AI usage stats
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
