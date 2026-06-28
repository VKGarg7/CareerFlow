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

  const statuses = Object.entries(statusConfig)
  const allActive = activeFilter === ''

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {/* All chip */}
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
            {items.length}
          </span>
        </button>

        {/* Per-status chips — only shown if count > 0 */}
        {statuses.map(([key, cfg]) => {
          const count = counts[key] || 0
          if (count === 0) return null
          const isActive = activeFilter === key
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
