import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../api/stats'
import DataTable from '../components/stats/DataTable'
import KpiTile from '../components/stats/KpiTile'
import RequestsChart from '../components/stats/RequestsChart'
import StatusBadge from '../components/stats/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { formatDateTime, formatNumber } from '../lib/format'
import type { Stats } from '../types/api'

const ms = (n: number | null) => (n == null ? '—' : `${formatNumber(Math.round(n))} ms`)
const num = (n: number | null) => (n == null ? '—' : formatNumber(n))

export default function StatsPage() {
  const { data: stats, isLoading, error, refetch, isFetching } = useStats()

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI usage</h1>
          <p className="mt-1 text-slate-600">Every LLM call is logged with tokens, latency and status.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <LoadingState message="Loading stats…" />
        ) : error || !stats ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : stats.totalRequests === 0 ? (
          <EmptyState
            title="No AI requests yet"
            text="Generate a trip and its AI calls will show up here."
            action={
              <Link to="/" className="btn-primary">
                Plan a trip
              </Link>
            }
          />
        ) : (
          <StatsContent stats={stats} />
        )}
      </div>
    </div>
  )
}

function StatsContent({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Requests" value={formatNumber(stats.totalRequests)} sub={`${formatNumber(stats.successCount)} successful`} />
        <KpiTile
          label="Error rate"
          value={`${(stats.errorRate * 100).toFixed(1)}%`}
          sub={`${formatNumber(stats.errorCount)} failed`}
        />
        <KpiTile label="Avg latency" value={ms(stats.avgLatencyMs)} />
        <KpiTile
          label="Tokens"
          value={formatNumber(stats.totalInputTokens + stats.totalOutputTokens)}
          sub={`${formatNumber(stats.totalInputTokens)} in · ${formatNumber(stats.totalOutputTokens)} out`}
        />
      </div>

      <Panel title="Requests per day" subtitle="Last 14 days">
        <div className="px-5 pt-8 pb-5">
          <RequestsChart data={stats.byDay} />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="By provider">
          <DataTable
            rows={stats.byProvider}
            rowKey={(r) => `${r.provider}-${r.model}`}
            empty="No data"
            columns={[
              { header: 'Provider', cell: (r) => <span className="font-medium text-slate-900">{r.provider}</span> },
              { header: 'Model', cell: (r) => r.model },
              { header: 'Requests', cell: (r) => num(r.requests), align: 'right' },
              { header: 'Tokens in/out', cell: (r) => `${num(r.inputTokens)} / ${num(r.outputTokens)}`, align: 'right' },
              { header: 'Avg latency', cell: (r) => ms(r.avgLatencyMs), align: 'right' },
            ]}
          />
        </Panel>
        <Panel title="By template">
          <DataTable
            rows={stats.byTemplate}
            rowKey={(r) => r.templateName}
            empty="No data"
            columns={[
              { header: 'Template', cell: (r) => <code className="text-xs text-slate-900">{r.templateName}</code> },
              { header: 'Requests', cell: (r) => num(r.requests), align: 'right' },
              { header: 'Avg latency', cell: (r) => ms(r.avgLatencyMs), align: 'right' },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Recent requests" subtitle="Last 20">
        <DataTable
          rows={stats.recent}
          rowKey={(r) => r.id}
          empty="No requests"
          columns={[
            { header: 'Time', cell: (r) => formatDateTime(r.createdAt) },
            { header: 'Template', cell: (r) => <code className="text-xs">{r.templateName}@{r.templateVersion}</code> },
            {
              header: 'Trip',
              cell: (r) =>
                r.tripId == null ? '—' : (
                  <Link to={`/trips/${r.tripId}`} className="text-sky-700 hover:underline">
                    #{r.tripId}
                  </Link>
                ),
            },
            { header: 'Provider', cell: (r) => `${r.provider} · ${r.model}` },
            { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
            { header: 'Tokens', cell: (r) => `${num(r.inputTokens)} / ${num(r.outputTokens)}`, align: 'right' },
            { header: 'Latency', cell: (r) => ms(r.latencyMs), align: 'right' },
            {
              header: 'Error',
              cell: (r) =>
                r.errorMessage ? (
                  <span className="block max-w-xs truncate text-red-600" title={r.errorMessage}>
                    {r.errorMessage}
                  </span>
                ) : (
                  ''
                ),
            },
          ]}
        />
      </Panel>
    </div>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-baseline gap-2 border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>
      {children}
    </section>
  )
}
