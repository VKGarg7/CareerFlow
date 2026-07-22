import { useEffect, useRef, useState } from 'react'
import { ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material'
import { countByStatus } from '../utils/followup'

export default function StatusSummaryBar({
  items = [],
  statusKey = 'status',
  statusConfig = {},
  activeFilter = '',
  onFilter,
  counts: countsOverride,
  total: totalOverride,
}) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState)
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [items, statusConfig])

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  const counts = countsOverride ?? countByStatus(items, statusKey, statusConfig)

  const total = totalOverride ?? items.length
  const statuses = Object.entries(statusConfig)
  const allActive = activeFilter === ''

  const BAR_COLORS = {
    SAVED:               '#8B8FA3',
    APPLIED:             '#8184F5',
    OA_SCHEDULED:        '#F59E0B',
    OA_CLEARED:          '#22D3EE',
    INTERVIEW_SCHEDULED: '#A78BFA',
    INTERVIEW_CLEARED:   '#8B5CF6',
    OFFER_RECEIVED:      '#22C55E',
    REJECTED:            '#F43F5E',
    JOINED:              '#22C55E',
  }
  const colorOf = (key, cfg) => cfg?.hex ?? BAR_COLORS[key] ?? '#8B8FA3'

  const segments = statuses
    .map(([key, cfg]) => ({ key, cfg, count: counts[key] || 0 }))
    .filter((s) => s.count > 0)

  return (
    <div className="mb-6">
      {total > 0 && (
        <div className="mb-3">
          <div className="flex h-2 rounded-full overflow-hidden gap-px bg-white/[0.06]">
            {segments.map(({ key, count }) => {
              const pct = (count / total) * 100
              return (
                <div
                  key={key}
                  title={`${statusConfig[key]?.label ?? key}: ${count} (${Math.round(pct)}%)`}
                  style={{ width: `${pct}%`, backgroundColor: colorOf(key, statusConfig[key]) }}
                  className="transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="relative flex items-center gap-1 rounded-card border border-white/[0.06] bg-app-surface shadow-card px-2 py-2">
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-1)}
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-white/50 bg-white/[0.04] hover:bg-white/[0.10] hover:text-white transition"
            aria-label="Scroll left"
          >
            <ChevronLeftRounded fontSize="small" />
          </button>
        )}

        <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0 flex-1">
          <button
            onClick={() => onFilter('')}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
              allActive
                ? 'bg-app-accent text-white border-app-accent shadow-glow shadow-app-accent/30'
                : 'bg-white/[0.02] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/75'
            }`}
          >
            All
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${allActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/50'}`}>
              {total}
            </span>
          </button>

          {statuses.map(([key, cfg]) => {
            const count = counts[key] || 0
            if (count === 0) return null
            const isActive = activeFilter === key
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <button
                key={key}
                onClick={() => onFilter(isActive ? '' : key)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  isActive
                    ? `${cfg.badge} border-current shadow-card ring-1 ring-offset-0 ring-current/40`
                    : 'bg-white/[0.02] text-white/50 border-white/[0.08] hover:border-white/[0.14] hover:text-white/75'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorOf(key, cfg) }} />
                {cfg.label}
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/20' : 'bg-white/[0.06] text-white/50'}`}>
                  {count}
                </span>
                {!isActive && (
                  <span className="text-[10px] text-white/30">{pct}%</span>
                )}
              </button>
            )
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scrollBy(1)}
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-white/50 bg-white/[0.04] hover:bg-white/[0.10] hover:text-white transition"
            aria-label="Scroll right"
          >
            <ChevronRightRounded fontSize="small" />
          </button>
        )}
      </div>
    </div>
  )
}
