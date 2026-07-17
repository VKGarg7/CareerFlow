import {
  LanguageRounded, LinkedIn, PeopleAltRounded, SchoolRounded,
  WorkOutlineRounded, MoreHorizRounded, StarRounded,
} from '@mui/icons-material'
import AnalyticsCard from './AnalyticsCard'

const SOURCE_META = {
  CAREERS_PAGE: { icon: LanguageRounded,    tint: '#38BDF8' },
  LINKEDIN:     { icon: LinkedIn,           tint: '#38BDF8' },
  REFERRAL:     { icon: PeopleAltRounded,   tint: '#7C6BFF' },
  NAUKRI:       { icon: WorkOutlineRounded, tint: '#7C6BFF' },
  INTERNSHALA:  { icon: SchoolRounded,      tint: '#F59E0B' },
  JOB_PORTAL:   { icon: WorkOutlineRounded, tint: '#7C6BFF' },
  OTHER:        { icon: MoreHorizRounded,   tint: '#94A3B8' },
}

function SourceRow({ label, sourceKey, total, offers, interviews, offerRate, maxTotal, isBest }) {
  const { icon: Icon, tint } = SOURCE_META[sourceKey] || SOURCE_META.OTHER
  const barPct = Math.max((total / maxTotal) * 100, 3)
  const rateBarPct = Math.min(offerRate, 100)

  return (
    <div className="group grid grid-cols-[1.5rem_8rem_1fr_3.5rem_3.5rem_5rem] items-center gap-4 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-white/[0.03]">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-md"
        style={{ background: isBest ? '#22C55E1F' : `${tint}1F`, color: isBest ? '#22C55E' : tint }}
      >
        <Icon sx={{ fontSize: 14 }} />
      </span>

      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-sm font-semibold text-white/85">{label}</span>
        {isBest && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-app-viz-success/15 px-1.5 py-0.5 text-[10px] font-bold text-app-viz-success">
            <StarRounded sx={{ fontSize: 11 }} /> Best
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
              isBest ? 'bg-gradient-to-r from-app-viz-success/70 to-app-viz-success' : 'bg-gradient-to-r from-app-viz/60 to-app-viz'
            }`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <span className="w-9 shrink-0 text-right text-sm font-bold tabular-nums text-white/70">{total}</span>
      </div>

      <span className="justify-self-center rounded-lg bg-app-viz/15 px-2 py-1 text-center text-xs font-semibold tabular-nums text-app-viz-soft">
        {interviews}
      </span>

      <span className="justify-self-center rounded-lg bg-app-viz-success/15 px-2 py-1 text-center text-xs font-semibold tabular-nums text-app-viz-success">
        {offers}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tabular-nums text-white/60">{offerRate.toFixed(0)}%</span>
        <div className="h-1 w-10 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-app-viz-success transition-[width] duration-500 ease-out" style={{ width: `${rateBarPct}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function ApplicationSourcesCard({ sources, bestSource, onViewAll }) {
  const maxTotal = sources[0]?.total || 1

  return (
    <AnalyticsCard>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Application Sources</p>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-app-viz-soft transition-colors duration-200 hover:text-app-viz"
          >
            View all sources
          </button>
        )}
      </div>

      {sources.length === 0 ? (
        <p className="py-10 text-center text-xs text-white/30">No applications yet</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[28rem]">
            <div className="grid grid-cols-[1.5rem_8rem_1fr_3.5rem_3.5rem_5rem] gap-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/25">
              <span />
              <span>Source</span>
              <span>Applications</span>
              <span className="text-center">Interviews</span>
              <span className="text-center">Offers</span>
              <span>Offer Rate</span>
            </div>
            <div className="space-y-0.5">
              {sources.map((s) => (
                <SourceRow key={s.key} sourceKey={s.key} label={s.label} total={s.total}
                  offers={s.offers} interviews={s.interviews} offerRate={s.offerRate}
                  maxTotal={maxTotal} isBest={bestSource?.key === s.key} />
              ))}
            </div>
          </div>
        </div>
      )}
    </AnalyticsCard>
  )
}
