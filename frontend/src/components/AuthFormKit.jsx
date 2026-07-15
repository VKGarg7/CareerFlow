import { Link } from 'react-router-dom'

const ArrowLeft = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 10H4M9 5l-5 5 5 5" />
  </svg>
)


export function AuthFormSide({ children }) {
  return (
    <div className="relative flex-1 overflow-hidden">
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

      <div className="relative z-[1] flex h-full items-center justify-center overflow-y-auto px-6 py-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

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

export function AuthCard({ children, compact = false }) {
  return (
    <div
      className={`relative z-[2] rounded-3xl border border-white/10 bg-[#0B0C14] backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] ${
        compact ? 'p-6' : 'p-8'
      }`}
    >
      {children}
    </div>
  )
}

export function AuthField({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/40">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function authInputCls(hasError) {
  return `w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/50 focus:border-[#5B5FEF]/50 hover:border-white/20 ${
    hasError ? 'border-red-400/50 bg-red-500/[0.06]' : 'border-white/10'
  }`
}

export function authInputIconCls(hasError) {
  return `w-full rounded-xl border bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/50 focus:border-[#5B5FEF]/50 hover:border-white/20 ${
    hasError ? 'border-red-400/50 bg-red-500/[0.06]' : 'border-white/10'
  }`
}

export function AuthInputIcon({ children }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
      {children}
    </span>
  )
}

export function UserIcon(props) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
    </svg>
  )
}

export function MailIcon(props) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

export function LockIcon(props) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
    </svg>
  )
}

export function AuthCheckbox({ checked, onChange, error, children }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-2.5 select-none">
        <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
          <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
          <span
            className={`h-4 w-4 rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#5B5FEF]/50 ${
              checked
                ? 'border-[#5B5FEF] bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6]'
                : error
                ? 'border-red-400/50 bg-red-500/[0.06]'
                : 'border-white/20 bg-white/[0.04]'
            }`}
          />
          {checked && (
            <svg className="pointer-events-none absolute h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span className="text-xs leading-relaxed text-white/50">{children}</span>
      </label>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function AuthDivider({ children }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/30">{children}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  )
}

const GoogleGlyph = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.27v3.11A11.998 11.998 0 0012 24z" />
    <path fill="#FBBC05" d="M5.28 14.29a7.2 7.2 0 010-4.58V6.6H1.27a12 12 0 000 10.8l4.01-3.11z" />
    <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.6l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77z" />
  </svg>
)

const LinkedInGlyph = (props) => (
  <svg viewBox="0 0 24 24" fill="#0A66C2" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM7.12 20.45H3.56V9h3.56v11.45z" />
  </svg>
)

const GitHubGlyph = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.05 11.05 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.21.66.79.55A10.51 10.51 0 0023.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
  </svg>
)

const SOCIAL_PROVIDERS = {
  google: { Glyph: GoogleGlyph, label: 'Google' },
  linkedin: { Glyph: LinkedInGlyph, label: 'LinkedIn' },
  github: { Glyph: GitHubGlyph, label: 'GitHub' },
}

export function AuthSocialRow({ providers = ['google', 'linkedin', 'github'], fullLabel = false, onSelect }) {
  const btnCls =
    'flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
  return (
    <div className="flex gap-3">
      {providers.map((key) => {
        const { Glyph, label } = SOCIAL_PROVIDERS[key]
        return (
          <button key={key} type="button" onClick={() => onSelect?.(key)} className={btnCls}>
            <Glyph className="h-4 w-4 shrink-0" /> {fullLabel ? `Continue with ${label}` : label}
          </button>
        )
      })}
    </div>
  )
}

export function AuthErrorBanner({ children }) {
  if (!children) return null
  return (
    <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {children}
    </div>
  )
}

export function AuthSubmitButton({ loading, loadingText, children, arrow = false, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5B5FEF] to-[#8B5CF6] py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(91,95,239,0.35)] transition-all hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(91,95,239,0.55)] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
      {...props}
    >
      {loading ? loadingText : (
        <>
          {children}
          {arrow && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          )}
        </>
      )}
    </button>
  )
}

export function AuthTrustFooter() {
  return (
    <div className="mt-6 space-y-1.5 text-center">
      <p className="flex items-center justify-center gap-1.5 text-xs text-white/35">
        <svg className="h-3.5 w-3.5 text-emerald-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Your data is protected with enterprise-grade security
      </p>
      <p className="text-xs text-white/30">
        By signing in, you agree to our{' '}
        <Link to="/terms" className="text-[#8184F5] hover:text-[#A78BFA]">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy" className="text-[#8184F5] hover:text-[#A78BFA]">Privacy Policy</Link>
      </p>
    </div>
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
