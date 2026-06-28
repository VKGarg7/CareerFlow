export default function StatusSummaryBar({
  items = [],
  statusKey = 'status',
  statusConfig = {},
  activeFilter = '',
  onFilter,
}) {
  const counts = Object.keys(statusConfig).reduce((acc, key) => {
    acc[key] = items.filter((item) => item[statusKey] === key).length
    return acc
  }, {})

  const total = items.length
  const statuses = Object.entries(statusConfig)
  const allActive = activeFilter === ''

  // Segment color map extracted from badge classes → use explicit hex for the bar
  const BAR_COLORS = {
    SAVED:               '#9ca3af',
    APPLIED:             '#3b82f6',
    OA_SCHEDULED:        '#f59e0b',
    OA_CLEARED:          '#06b6d4',
    INTERVIEW_SCHEDULED: '#a855f7',
    INTERVIEW_CLEARED:   '#7c3aed',
    OFFER_RECEIVED:      '#22c55e',
    REJECTED:            '#f87171',
    JOINED:              '#10b981',
  }

  const segments = statuses
    .map(([key, cfg]) => ({ key, cfg, count: counts[key] || 0 }))
    .filter((s) => s.count > 0)

  return (
    <div className="mb-6">
      {/* Stacked distribution bar */}
      {total > 0 && (
        <div className="mb-3">
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-gray-100">
            {segments.map(({ key, count }) => {
              const pct = (count / total) * 100
              return (
                <div
                  key={key}
                  title={`${statusConfig[key]?.label ?? key}: ${count} (${Math.round(pct)}%)`}
                  style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[key] ?? '#9ca3af' }}
                  className="transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilter('')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            allActive
              ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          All
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${allActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? `${cfg.badge} border-current shadow-sm ring-2 ring-offset-1 ring-current`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {cfg.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/10' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
              {!isActive && (
                <span className="text-[10px] text-gray-400">{pct}%</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
