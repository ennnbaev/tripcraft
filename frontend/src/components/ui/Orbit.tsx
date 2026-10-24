import { Sparkles } from 'lucide-react'

/** "AI is working" animation: three dots orbiting a violet sparkles disc (stops with reduced motion). */
export default function Orbit() {
  return (
    <div className="tc-orbit" aria-hidden>
      <i />
      <i />
      <i />
      <b>
        <Sparkles className="tc-icon" />
      </b>
    </div>
  )
}
