import CompanyLogo from './CompanyLogo'
import AnalyticsCard from './AnalyticsCard'

function RankedRow({ rank, name, website, count, max, statuses }) {
  const pct = Math.max((count / max) * 100, 4)
  const hasOffer = statuses.includes('OFFER_RECEIVED')
  const hasInterview = statuses.some((s) => s.startsWith('INTERVIEW'))
  const tag = hasOffer
    ? { label: 'Offer', cls: 'bg-app-viz-success/15 text-app-viz-success' }
    : hasInterview
    ? { label: 'Interview', cls: 'bg-app-viz-info/15 text-app-viz-info' }
    : null

  return (
    <div className="group flex items-center gap-2 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-white/[0.03]">
      <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-white/35">#{rank}</span>
      <CompanyLogo name={name} website={website} dotColor="#7C6BFF" className="h-8 w-8 shrink-0" />
      <span className="min-w-0 max-w-[6rem] shrink truncate text-sm font-semibold text-white/90">{name}</span>
      {tag && (
        <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-block ${tag.cls}`}>
          {tag.label}
        </span>
      )}
      <div className="h-1.5 min-w-[2rem] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-app-viz/70 to-app-viz transition-[width] duration-500 ease-out group-hover:to-app-viz-soft"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-right text-sm font-bold tabular-nums text-white/60">{count}</span>
    </div>
  )
}

export default function MostAppliedCard({ companies, onViewAll }) {
  const max = companies[0]?.count || 1

  return (
    <AnalyticsCard>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-widest text-white/35">Most Applied Companies</p>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-xs font-semibold text-app-viz-soft transition-colors duration-200 hover:text-app-viz"
          >
            View all
          </button>
        )}
      </div>

      {companies.length === 0 ? (
        <p className="py-10 text-center text-xs text-white/30">No applications yet</p>
      ) : (
        <div className="mt-4 space-y-0.5">
          {companies.map((c, i) => (
            <RankedRow key={c.name} rank={i + 1} name={c.name} website={c.website} count={c.count} max={max} statuses={c.statuses} />
          ))}
        </div>
      )}
    </AnalyticsCard>
  )
}
