export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-5">
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-white/80 mb-1">{title}</h3>
      <p className="text-sm text-white/35 mb-6 max-w-xs mx-auto leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
