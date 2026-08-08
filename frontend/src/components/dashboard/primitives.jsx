import { motion } from 'framer-motion'
import TiltCard from '../TiltCard'
import StatusBadge from '../StatusBadge'
import { staggerItem } from '../../lib/motion'

const TONE_CLS = {
  accent:  'bg-app-accent/10 text-app-accent-soft',
  success: 'bg-app-success/10 text-app-success',
  warning: 'bg-app-warning/10 text-app-warning',
  danger:  'bg-app-danger/10 text-app-danger',
  neutral: 'bg-white/[0.06] text-white/60',
  muted:   'bg-white/[0.04] text-white/35',
}
const TONE_DOT = {
  accent: 'bg-app-accent', success: 'bg-app-success', warning: 'bg-app-warning',
  danger: 'bg-app-danger', neutral: 'bg-white/50', muted: 'bg-white/25',
}

export function StatusPill({ tone = 'neutral', children }) {
  return <StatusBadge badge={TONE_CLS[tone]} dot={TONE_DOT[tone]} label={children} />
}

const SURFACE_SHELL = 'glass-surface glass-edge sheen corner-light gradient-border-anim relative overflow-hidden rounded-hud shadow-glass-1'

export function Surface({ className = '', children, interactive = false, style }) {
  if (!interactive) {
    return (
      <div className={`${SURFACE_SHELL} ${className}`} style={style}>
        <div className="card-noise bg-noise" />
        {children}
      </div>
    )
  }
  return (
    <TiltCard className={`${SURFACE_SHELL} elevate-float hover:shadow-glass-hover ${className}`} style={style}>
      <div className="card-noise bg-noise" />
      {children}
    </TiltCard>
  )
}

export function StaggerRow({ className = '', children, ...rest }) {
  return (
    <motion.div variants={staggerItem} className={className} {...rest}>
      {children}
    </motion.div>
  )
}
