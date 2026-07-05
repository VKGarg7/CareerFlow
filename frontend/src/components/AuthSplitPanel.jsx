export function AuthBrand({ mobile = false }) {
  if (mobile) {
    return (
      <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-black">CF</span>
        </div>
        <span className="font-bold text-gray-900">CareerFlow</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 mb-auto">
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <span className="text-white text-sm font-black">CF</span>
      </div>
      <div>
        <p className="font-bold text-lg leading-tight">CareerFlow</p>
        <p className="text-blue-200 text-xs">Job Search Tracker</p>
      </div>
    </div>
  )
}

/**
 * Left gradient hero panel shared by all auth screens (Login, Signup, and the
 * password utility pages), so the whole auth flow reads as one cohesive product.
 */
export default function AuthPanel({ title, subtitle, items = [], width = 'w-[420px]' }) {
  return (
    <div className={`hidden lg:flex flex-col ${width} shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-10 text-white relative overflow-hidden`}>
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white opacity-5" />
      <div className="absolute bottom-10 -left-20 w-72 h-72 rounded-full bg-white opacity-5" />
      <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-indigo-500 opacity-20" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 45%)' }} />

      <AuthBrand />

      <div className="my-8 relative z-10">
        <h2 className="text-3xl font-bold leading-snug mb-3">{title}</h2>
        <p className="text-blue-200 text-sm leading-relaxed">{subtitle}</p>
      </div>

      {items.length > 0 && (
        <ul className="space-y-3 mb-auto relative z-10">
          {items.map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-blue-100">
              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-base shrink-0">
                {icon}
              </span>
              {text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
