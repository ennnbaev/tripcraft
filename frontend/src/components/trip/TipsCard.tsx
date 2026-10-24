import { Lightbulb } from 'lucide-react'

export default function TipsCard({ tips }: { tips: string[] }) {
  return (
    <section className="tc-tips tc-o-tips" style={{ gridColumn: 'span 6' }} aria-labelledby="tips-title">
      <h3 id="tips-title">
        <Lightbulb className="tc-icon" aria-hidden />
        Good to know
      </h3>
      <ol>
        {tips.map((tip, i) => (
          <li key={tip}>
            <b aria-hidden>{i + 1}</b>
            <span>{tip}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
