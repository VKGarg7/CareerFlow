import { Link } from 'react-router-dom'

function GlowOrb({ className }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />
}

function WaveLines({ className = '' }) {
  return (
    <svg viewBox="0 0 400 300" fill="none" className={`pointer-events-none absolute ${className}`}>
      <path d="M-20 180 C 60 140, 100 220, 180 170 S 320 100, 420 150" stroke="#5B5FEF" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M-20 210 C 70 170, 110 250, 190 200 S 330 130, 420 180" stroke="#8B5CF6" strokeOpacity="0.2" strokeWidth="1.5" />
      <path d="M-20 240 C 80 200, 120 280, 200 230 S 340 160, 420 210" stroke="#22D3EE" strokeOpacity="0.15" strokeWidth="1.5" />
    </svg>
  )
}


function DashboardIllustration() {
  const pct = 0.72
  const r = 26
  return (
    <div className="mt-8 hidden lg:block" style={{ perspective: '1000px' }}>
      <div
        className="relative rounded-2xl border border-white/10 bg-[#0B0C14]/80 p-4 shadow-[0_40px_80px_-24px_rgba(91,95,239,0.4)] backdrop-blur-xl"
        style={{ transform: 'rotateX(8deg) rotateY(-14deg) rotateZ(2deg)', transformStyle: 'preserve-3d' }}
      >
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="ml-2 h-2 flex-1 max-w-[120px] rounded-full bg-white/[0.06]" />
        </div>

        <div className="flex items-center gap-4">
          <svg viewBox="0 0 160 60" className="h-14 flex-1" preserveAspectRatio="none">
            <path d="M0 45 C 20 20, 35 50, 55 30 S 90 10, 110 35 S 140 15, 160 25" fill="none" stroke="url(#authWaveGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="authWaveGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5B5FEF" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative h-16 w-16 shrink-0">
            <svg width="64" height="64" className="-rotate-90 absolute inset-0">
              <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <circle cx="32" cy="32" r={r} fill="none" stroke="url(#authDonutGrad)" strokeWidth="7"
                strokeDasharray={`${pct * 2 * Math.PI * r} ${2 * Math.PI * r}`} strokeLinecap="round" />
              <defs>
                <linearGradient id="authDonutGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#5B5FEF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-1.5 w-3/4 rounded-full bg-white/[0.06]" />
          <div className="h-1.5 w-1/2 rounded-full bg-white/[0.06]" />
        </div>
      </div>
    </div>
  )
}

export function AuthBrand({ mobile = false }) {
  if (mobile) {
    return (
      <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 px-16 lg:hidden">
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

export default function AuthPanel({ eyebrow = 'Field notes', title, subtitle, items = [], width = 'w-[420px]', illustration = false }) {
  const detailed = items.length > 0 && items[0].title != null

  return (
    <div className={`relative hidden ${width} shrink-0 flex-col overflow-hidden bg-[#05060B] p-10 text-white lg:flex`}>
      <GlowOrb className="-top-32 -right-24 h-96 w-96 bg-[#5B5FEF]/25 animate-drift" />
      <GlowOrb className="bottom-0 -left-24 h-80 w-80 bg-[#8B5CF6]/20 animate-drift-slow" />
      {illustration ? (
        <WaveLines className="bottom-0 left-0 h-72 w-full opacity-80" />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col overflow-y-auto no-scrollbar">
        <AuthBrand />

        <div className="my-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8184F5]">
            ·{eyebrow}
          </p>
          <h2 className="font-display text-3xl font-bold leading-[1.12] tracking-tight text-balance">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/50">{subtitle}</p>
        </div>

        {items.length > 0 && (
          detailed ? (
            <ul className="mb-auto space-y-4">
              {items.map(({ icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-base ring-1 ring-white/10">
                    {icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/45">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
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
          )
        )}

        {illustration && <DashboardIllustration />}
      </div>
    </div>
  )
}
