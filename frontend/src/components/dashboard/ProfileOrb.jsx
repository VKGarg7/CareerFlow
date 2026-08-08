import { CheckRounded, ArrowOutward } from '@mui/icons-material'
import { Surface } from './primitives'

export default function ProfileOrb({ checklist, percentage, onNavigate }) {
  const remaining = checklist.filter((c) => !c.done)
  const complete = percentage === 100
  const r = 46, circ = 2 * Math.PI * r

  return (
    <Surface interactive className="p-5">
      <div className="flex items-center gap-4">
        <div className="perspective-hud relative shrink-0" style={{ width: 108, height: 108 }}>
          <div className="absolute inset-2 animate-pulse-glow rounded-full bg-app-accent/[0.14] blur-xl" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/[0.06] to-transparent" style={{ boxShadow: 'inset 0 8px 16px -4px rgba(255,255,255,0.08), inset 0 -8px 20px -6px rgba(0,0,0,0.5)' }} />
          <svg width={108} height={108} className="relative -rotate-90">
            <circle cx={54} cy={54} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
            <circle cx={54} cy={54} r={r} fill="none" stroke="url(#profileGrad)" strokeWidth={9}
              strokeDasharray={`${(percentage / 100) * circ} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)', filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.5))' }} />
            <defs>
              <linearGradient id="profileGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8184F5" /><stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold leading-none text-white tabular-nums">{percentage}%</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white/85">Profile strength</p>
            {complete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-app-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-app-success">
                <CheckRounded sx={{ fontSize: 11 }} /> Complete
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/40">
            {complete ? 'Everything looks great.' : `${remaining.length} step${remaining.length !== 1 ? 's' : ''} left`}
          </p>
        </div>
      </div>

      {remaining.length > 0 && (
        <div className="mt-4 space-y-1 border-t border-white/[0.05] pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/25">Next up</p>
          {remaining.slice(0, 3).map((c) => (
            <button key={c.text} onClick={onNavigate} className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-white/[0.03]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-app-accent-soft" />
              <span className="truncate text-xs text-white/50 transition-colors group-hover:text-white/80">{c.text}</span>
              <ArrowOutward sx={{ fontSize: 12 }} className="ml-auto shrink-0 text-white/15 transition-colors group-hover:text-white/45" />
            </button>
          ))}
        </div>
      )}
    </Surface>
  )
}
