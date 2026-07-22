import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { countByStatus } from '../utils/followup'

function Sparkline({ data, colorVar }) {
  if (!data || data.length < 2) return null
  const points = data.map((v, i) => ({ i, v }))
  return (
    <div className="relative h-6 w-full min-w-0 overflow-hidden">
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line type="monotone" dataKey="v" stroke={colorVar} strokeWidth={1.75} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function StatTilesBar({
  items = [],
  statusKey = 'status',
  statusConfig = {},
  activeFilter = '',
  onFilter,
  totalLabel = 'Total',
  totalIcon = null,
  trendByStatus = {},
  counts: countsOverride,
  total: totalOverride,
  compact = false,
}) {
  const counts = countsOverride ?? countByStatus(items, statusKey, statusConfig)

  const total = totalOverride ?? items.length
  const allActive = activeFilter === ''
  const tiles = Object.entries(statusConfig)
    .map(([key, cfg]) => ({ key, cfg, count: counts[key] || 0 }))
    .filter((t) => t.count > 0)

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6'}`}>
      <button
        onClick={() => onFilter('')}
        className={`text-left rounded-xl border px-4 py-3 transition-all flex items-center gap-3 min-w-0 ${
          allActive
            ? 'bg-app-accent/10 border-app-accent/40'
            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]'
        }`}
      >
        {totalIcon && (
          <span className={`w-9 h-9 rounded-lg bg-app-accent/15 text-app-accent-soft items-center justify-center shrink-0 ${compact ? 'hidden' : 'flex'}`}>
            {totalIcon}
          </span>
        )}
        <div className="min-w-0">
          <span className="font-display text-xl font-bold text-white leading-none">{total}</span>
          <p className="text-xs text-white/40 mt-1.5 truncate">{totalLabel}</p>
        </div>
      </button>

      {tiles.map(({ key, cfg, count }) => {
        const isActive = activeFilter === key
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const trend = trendByStatus[key]
        return (
          <button
            key={key}
            onClick={() => onFilter(isActive ? '' : key)}
            className={`text-left rounded-xl border px-4 py-3 transition-all min-w-0 ${
              isActive
                ? `${cfg.badge} border-current/40`
                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className={`relative flex w-5 h-5 rounded-full shrink-0 items-center justify-center ${cfg.dot}`}>
                <span className="w-2 h-2 rounded-full bg-white/90" />
              </span>
              <span className="font-display text-xl font-bold text-white leading-none shrink-0">{count}</span>
              <span className="text-[11px] font-semibold text-white/35 shrink-0">{pct}%</span>
            </div>
            <p className="text-xs text-white/40 mt-1.5 truncate">{cfg.label}</p>
            {trend && <div className="mt-2"><Sparkline data={trend} colorVar={cfg.hex} /></div>}
          </button>
        )
      })}
    </div>
  )
}
