/**
 * Clickable status summary cards — one per status showing item count.
 *
 * Props:
 *   items:        array of data objects
 *   statusKey:    field name on each item to group by (default 'status')
 *   statusConfig: { STATUS_KEY: { label, badge } }  — badge must be Tailwind bg+text classes
 *   activeFilter: currently selected status string ('' = all)
 *   onFilter:     (statusKey | '') => void
 */
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

  return (
    <div
      className={`grid gap-2 mb-6 ${
        statuses.length <= 6
          ? 'grid-cols-3 sm:grid-cols-6'
          : 'grid-cols-3 sm:grid-cols-5'
      }`}
    >
      {statuses.map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onFilter(activeFilter === key ? '' : key)}
          className={`rounded-xl p-3 text-center transition-all border ${
            activeFilter === key
              ? `${cfg.badge} border-current shadow-sm`
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
          }`}
        >
          <p className="text-lg font-bold text-gray-800">{counts[key] || 0}</p>
          <p
            className={`text-[11px] font-semibold leading-tight mt-0.5 ${
              activeFilter === key ? '' : 'text-gray-500'
            }`}
          >
            {cfg.label}
          </p>
        </button>
      ))}
    </div>
  )
}
