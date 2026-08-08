import TiltCard from './TiltCard'

const SIZE_PADDING = { sm: 'p-4', md: 'p-6', lg: 'p-7' }

export default function PremiumCard({
  children,
  className = '',
  size = 'md',
  interactive = true,
  statusChip,
  icon,
  miniChart,
  accentColor,
  onClick,
}) {
  const shellClass = [
    'glass-surface glass-edge corner-light gradient-border-anim glass-reflection-sweep elevate-float',
    'relative overflow-visible rounded-hud shadow-glass-1',
    interactive ? 'hover:shadow-glass-hover' : '',
    className,
  ].filter(Boolean).join(' ')

  const body = (
    <div className={`relative overflow-hidden rounded-[inherit] ${SIZE_PADDING[size] || SIZE_PADDING.md}`}>
      <div className="card-noise bg-noise" />
      {accentColor && <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-[inherit]" style={{ background: accentColor }} />}

      {(icon || miniChart) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          {icon && (
            <div className="icon-embossed icon-3d group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-app-accent-soft shadow-inner-highlight">
              {icon}
            </div>
          )}
          {miniChart && <div className="engraved-well h-8 min-w-[64px] flex-1 px-1">{miniChart}</div>}
        </div>
      )}

      {children}
    </div>
  )

  return (
    <div className="relative">
      {statusChip && <div className="chip-float">{statusChip}</div>}
      {interactive ? (
        <TiltCard className={shellClass} onClick={onClick}>{body}</TiltCard>
      ) : (
        <div className={shellClass} onClick={onClick}>{body}</div>
      )}
    </div>
  )
}
