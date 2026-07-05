export default function PageHeader({ title, subtitle, action, icon, gradient = 'from-blue-500 to-indigo-600' }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <div className={`hidden sm:flex w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} items-center justify-center text-xl shrink-0 shadow-sm`}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto">{action}</div>}
    </div>
  )
}
