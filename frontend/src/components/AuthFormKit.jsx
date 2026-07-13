import { Link } from 'react-router-dom'

const ArrowLeft = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 10H4M9 5l-5 5 5 5" />
  </svg>
)

/**
 * Right-hand column shared by every auth screen — gives the form its own
 * atmosphere (glow, grid texture, floating glass accent) instead of flat
 * empty black, and always offers a way back to the marketing site.
 */
export function AuthFormSide({ children }) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />
      <div className="pointer-events-none absolute right-[-8rem] top-[-6rem] h-96 w-96 rounded-full bg-[#8B5CF6]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] h-80 w-80 rounded-full bg-[#22D3EE]/[0.06] blur-3xl" />

      <Link
        to="/"
        className="absolute right-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white/50 backdrop-blur-sm transition-colors hover:border-white/20 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to site
      </Link>

      <div className="relative z-[1] w-full max-w-sm">{children}</div>
    </div>
  )
}

/** Small decorative glass card tucked into the auth card's corner, overlapping slightly like the hero's floating stat chip. */
export function AuthDecoTile({ label, value, sub, className = '', style }) {
  return (
    <div
      className={`animate-float pointer-events-none absolute z-0 hidden w-44 rounded-xl border border-white/10 bg-[#0B0C14]/95 p-3.5 shadow-2xl backdrop-blur-xl lg:block ${className}`}
      style={style}
    >
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">{label}</p>
      <p className="text-[13px] font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-white/40">{sub}</p>}
    </div>
  )
}

export function AuthCard({ children }) {
  return (
    <div className="relative z-[2] rounded-3xl border border-white/10 bg-[#0B0C14] p-8 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]">
      {children}
    </div>
  )
}

export function AuthField({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function authInputCls(hasError) {
  return `w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/50 focus:border-[#5B5FEF]/50 hover:border-white/20 ${
    hasError ? 'border-red-400/50 bg-red-500/[0.06]' : 'border-white/10'
  }`
}

export function AuthErrorBanner({ children }) {
  if (!children) return null
  return (
    <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {children}
    </div>
  )
}

export function AuthSubmitButton({ loading, loadingText, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5B5FEF] to-[#8B5CF6] py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(91,95,239,0.35)] transition-all hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(91,95,239,0.55)] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  )
}

export function EyeIcon({ open }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
