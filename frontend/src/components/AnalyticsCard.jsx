import TiltCard from './TiltCard'

const SHELL = 'glass-surface glass-edge corner-light gradient-border-anim relative overflow-hidden rounded-hud shadow-glass-1'

export default function AnalyticsCard({ className = '', children, interactive = false }) {
  if (!interactive) {
    return (
      <div className={`${SHELL} p-6 ${className}`}>
        <div className="card-noise bg-noise" />
        {children}
      </div>
    )
  }
  return (
    <TiltCard className={`${SHELL} elevate-float hover:shadow-glass-hover p-6 ${className}`}>
      <div className="card-noise bg-noise" />
      {children}
    </TiltCard>
  )
}
