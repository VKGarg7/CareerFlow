import { Link } from 'react-router-dom'

const Sparkle = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
  </svg>
)

function GlowOrb({ className }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />
}

export function AuthBrand({ mobile = false }) {
  if (mobile) {
    return (
      <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6] shadow-[0_0_20px_rgba(91,95,239,0.5)]">
          <span className="font-display text-xs font-bold text-white">CF</span>
        </div>
        <span className="font-display text-lg font-semibold text-white">CareerFlow</span>
      </Link>
    )
  }
  return (
    <Link to="/" className="mb-auto flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
        <span className="font-display text-xs font-bold text-white">CF</span>
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-semibold text-white">CareerFlow</p>
        <p className="text-[11px] text-white/40">Job Search Tracker</p>
      </div>
    </Link>
  )
}

/**
 * Dark-glass left panel shared by every auth screen, matching the Landing page's
 * indigo/violet/cyan gradient identity.
 */
export default function AuthPanel({ eyebrow = 'Field notes', title, subtitle, items = [], width = 'w-[420px]' }) {
  return (
    <div className={`relative hidden ${width} shrink-0 flex-col overflow-hidden bg-[#05060B] p-10 text-white lg:flex`}>
      <GlowOrb className="-top-32 -right-24 h-96 w-96 bg-[#5B5FEF]/25 animate-drift" />
      <GlowOrb className="bottom-0 -left-24 h-80 w-80 bg-[#8B5CF6]/20 animate-drift-slow" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <AuthBrand />

        <div className="my-8">
          <p className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#8184F5]">
            <Sparkle className="h-3 w-3" />
            {eyebrow}
          </p>
          <h2 className="font-display text-3xl font-bold leading-[1.12] tracking-tight text-balance">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/50">{subtitle}</p>
        </div>

        {items.length > 0 && (
          <ul className="mb-auto space-y-3.5">
            {items.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/70">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-base ring-1 ring-white/10">
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
