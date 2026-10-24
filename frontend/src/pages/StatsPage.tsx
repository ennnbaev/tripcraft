import { Activity, ArrowDownToLine, ArrowUpFromLine, ChartColumn, Check, CircleAlert, Clock, RefreshCw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStats } from '../api/stats'
import RequestsChart from '../components/stats/RequestsChart'
import StatTile from '../components/stats/StatTile'
import StatusBadge from '../components/stats/StatusBadge'
import { kilo, n0, percent, requestTime, seconds } from '../components/stats/statsFormat'
import { ButtonLink } from '../components/ui/Button'
import Notice from '../components/ui/Notice'
import Skeleton from '../components/ui/Skeleton'
import type { Stats } from '../types/api'

export default function StatsPage() {
  const { data: stats, isLoading, isError, isFetching, refetch } = useStats()
  const refreshing = isFetching && !isLoading

  return (
    <div className="tc-wrap">
      <div className="tc-pagehead">
        <div>
          <h1>AI usage</h1>
          <p>Every call to the model, including retries. Charts cover the last 14 days.</p>
        </div>
        <button
          type="button"
          className="tc-btn tc-btn--secondary tc-btn--sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-busy={isFetching}
        >
          <RefreshCw className={`tc-icon tc-icon-sm ${refreshing ? 'tc-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      {isError && (
        <Notice
          tone="error"
          title="We couldn't load the stats"
          className="mb-4"
          actions={
            <button type="button" className="tc-btn tc-btn--secondary tc-btn--sm" onClick={() => refetch()}>
              Try again
            </button>
          }
        >
          The server didn't answer. Try again in a moment.
        </Notice>
      )}

      {isLoading && <StatsSkeleton />}

      {stats && stats.totalRequests === 0 && (
        <section className="tc-empty" aria-labelledby="empty-title">
          <div className="tc-packempty__ic">
            <ChartColumn className="tc-icon" aria-hidden />
          </div>
          <h2 id="empty-title">No AI requests yet</h2>
          <p>Plan a trip and every call to the model will show up here, with tokens, timing and status.</p>
          <ButtonLink to="/" variant="primary">
            <Sparkles className="tc-icon" aria-hidden />
            Plan a trip
          </ButtonLink>
        </section>
      )}

      {stats && stats.totalRequests > 0 && <StatsContent stats={stats} />}
    </div>
  )
}

function StatsContent({ stats }: { stats: Stats }) {
  const successRate = stats.totalRequests ? stats.successCount / stats.totalRequests : 0
  const maxTemplate = Math.max(1, ...stats.byTemplate.map((b) => b.requests))

  return (
    <>
      <section className="tc-stats" aria-label="Totals">
        <StatTile label="Requests" icon={Activity} value={n0(stats.totalRequests)} note="All time" />
        <StatTile
          label="Successful"
          icon={Check}
          tone="mint"
          value={n0(stats.successCount)}
          note={`${percent(successRate)} of requests`}
        />
        <StatTile
          label="Errors"
          icon={CircleAlert}
          tone="danger"
          value={n0(stats.errorCount)}
          note={`${percent(stats.errorRate)} error rate`}
        />
        <StatTile
          label="Avg latency"
          icon={Clock}
          value={seconds(stats.avgLatencyMs)}
          note={`${n0(stats.avgLatencyMs)} ms per call`}
        />
        <StatTile
          label="Input tokens"
          icon={ArrowDownToLine}
          value={kilo(stats.totalInputTokens)}
          note={n0(stats.totalInputTokens)}
        />
        <StatTile
          label="Output tokens"
          icon={ArrowUpFromLine}
          value={kilo(stats.totalOutputTokens)}
          note={n0(stats.totalOutputTokens)}
        />
      </section>

      <div className="tc-statgrid">
        <RequestsChart days={stats.byDay} />

        <section className="tc-panel" style={{ gridColumn: 'span 4' }} aria-labelledby="bytpl-title">
          <div className="tc-panel__head">
            <div>
              <h2 id="bytpl-title">By prompt template</h2>
              <p>Requests and average latency</p>
            </div>
          </div>
          <div className="grid gap-[18px]">
            {stats.byTemplate.map((b) => (
              <div key={b.templateName}>
                <div className="flex items-baseline justify-between gap-2">
                  <code className="font-mono text-sm font-medium">{b.templateName}</code>
                  <span className="font-heading text-sm font-semibold tabular-nums">{n0(b.requests)}</span>
                </div>
                <div className="tc-minibar">
                  <i style={{ width: `${Math.round((100 * b.requests) / maxTemplate)}%` }} />
                </div>
                <span className="text-xs text-ink-muted">Avg {seconds(b.avgLatencyMs)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="tc-panel" style={{ gridColumn: 'span 12' }} aria-labelledby="byprov-title">
          <div className="tc-panel__head">
            <div>
              <h2 id="byprov-title">By provider</h2>
              <p>Switch providers with a Spring profile; the code doesn't change.</p>
            </div>
          </div>
          <div className="tc-tablebox">
            <table className="tc-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Model</th>
                  <th className="num">Requests</th>
                  <th className="num">Input tokens</th>
                  <th className="num">Output tokens</th>
                  <th className="num">Avg latency</th>
                </tr>
              </thead>
              <tbody>
                {stats.byProvider.map((r) => (
                  <tr key={`${r.provider}-${r.model}`}>
                    <td className="nowrap font-medium">{r.provider}</td>
                    <td className="nowrap">
                      <code>{r.model}</code>
                    </td>
                    <td className="num">{n0(r.requests)}</td>
                    <td className="num">{n0(r.inputTokens)}</td>
                    <td className="num">{n0(r.outputTokens)}</td>
                    <td className="num">{seconds(r.avgLatencyMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <RecentRequests recent={stats.recent} />
      </div>
    </>
  )
}

function RecentRequests({ recent }: { recent: Stats['recent'] }) {
  return (
    <section className="tc-panel" style={{ gridColumn: 'span 12' }} aria-labelledby="recent-title">
      <div className="tc-panel__head">
        <div>
          <h2 id="recent-title">Recent requests</h2>
          <p>Last 20, newest first</p>
        </div>
      </div>
      <div className="tc-tablebox">
        <table className="tc-table" style={{ minWidth: 960 }}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Trip</th>
              <th>Template</th>
              <th>Provider · model</th>
              <th className="num">In</th>
              <th className="num">Out</th>
              <th className="num">Latency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td className="nowrap">{requestTime(r.createdAt)}</td>
                <td className="nowrap">
                  {r.tripId == null ? (
                    <span className="muted">Deleted</span>
                  ) : (
                    <Link to={`/trips/${r.tripId}`} className="tc-link">
                      #{r.tripId}
                    </Link>
                  )}
                </td>
                <td className="nowrap">
                  <code>{r.templateName}</code> <span className="muted">{r.templateVersion}</span>
                </td>
                <td className="nowrap">
                  {r.provider} <span className="muted">· {r.model}</span>
                </td>
                <td className={`num ${r.inputTokens == null ? 'muted' : ''}`}>
                  {r.inputTokens == null ? '—' : n0(r.inputTokens)}
                </td>
                <td className={`num ${r.outputTokens == null ? 'muted' : ''}`}>
                  {r.outputTokens == null ? '—' : n0(r.outputTokens)}
                </td>
                <td className={`num ${r.latencyMs == null ? 'muted' : ''}`}>
                  {r.latencyMs == null ? '—' : seconds(r.latencyMs)}
                </td>
                <td>
                  <StatusBadge status={r.status} />
                  {r.errorMessage && <span className="err">{r.errorMessage}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StatsSkeleton() {
  return (
    <div role="status" aria-label="Loading stats" className="grid gap-4">
      <div className="tc-stats">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="tc-stat">
            <Skeleton style={{ height: 12, width: '60%' }} />
            <Skeleton style={{ height: 28, width: '50%', marginTop: 6 }} />
          </div>
        ))}
      </div>
      <div className="tc-panel">
        <Skeleton style={{ height: 260 }} />
      </div>
      <div className="tc-panel">
        <Skeleton style={{ height: 180 }} />
      </div>
    </div>
  )
}
