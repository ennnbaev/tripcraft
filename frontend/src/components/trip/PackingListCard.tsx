import { errorMessage } from '../../api/client'
import { useGeneratePackingList } from '../../api/trips'
import type { PackingList } from '../../types/api'
import Alert from '../Alert'
import Spinner from '../Spinner'

type Props = { tripId: number; packingList: PackingList | null }

export default function PackingListCard({ tripId, packingList }: Props) {
  const generate = useGeneratePackingList(tripId)
  const busy = generate.isPending
  const hasList = !!packingList && packingList.categories.length > 0

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Packing list</h2>
        <button
          type="button"
          className={hasList ? 'btn-ghost' : 'btn-secondary px-3 py-2'}
          onClick={() => generate.mutate()}
          disabled={busy}
        >
          {busy ? <Spinner className="h-4 w-4" /> : hasList ? '↻ Regenerate' : 'Generate packing list'}
        </button>
      </div>

      {generate.isError && (
        <div className="mt-3">
          <Alert>{errorMessage(generate.error)}</Alert>
        </div>
      )}

      {busy && !hasList && <p className="mt-3 text-sm text-slate-500">Asking the AI what to pack…</p>}

      {hasList ? (
        <div className={`mt-4 space-y-4 ${busy ? 'opacity-40' : ''}`}>
          {packingList.categories.map((cat) => (
            <div key={cat.name}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{cat.name}</h3>
              <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
                {cat.items.map((item, i) => (
                  <li key={`${item.name}-${i}`} className="flex gap-2">
                    <span aria-hidden className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-slate-300" />
                    <span>
                      {item.name}
                      {item.note && <span className="text-slate-500"> — {item.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        !busy && <p className="mt-2 text-sm text-slate-500">Get a checklist based on the destination, dates and activities.</p>
      )}
    </section>
  )
}
