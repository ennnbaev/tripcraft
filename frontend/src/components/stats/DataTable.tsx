import type { ReactNode } from 'react'

type Column<T> = { header: string; cell: (row: T) => ReactNode; align?: 'right' }

type Props<T> = { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string | number; empty: string }

export default function DataTable<T>({ columns, rows, rowKey, empty }: Props<T>) {
  if (rows.length === 0) return <p className="px-5 py-6 text-sm text-slate-500">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {columns.map((c) => (
              <th key={c.header} className={`px-5 py-2.5 whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="text-slate-700">
              {columns.map((c) => (
                <td key={c.header} className={`px-5 py-2.5 whitespace-nowrap ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
