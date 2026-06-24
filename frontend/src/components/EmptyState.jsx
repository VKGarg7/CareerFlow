export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-5">
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
