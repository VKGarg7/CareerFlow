import { motion } from 'framer-motion'
import { AutoAwesomeRounded } from '@mui/icons-material'
import { Surface } from './primitives'
import { staggerContainer, staggerItem } from '../../lib/motion'

const TONE_DOT = {
  accent: 'bg-app-accent shadow-glow-accent',
  success: 'bg-app-emerald shadow-glow-success',
  warning: 'bg-app-warning shadow-glow-warning',
}

export default function AIInsightsPanel({ insights }) {
  return (
    <Surface className="glass-reflection-sweep relative mb-5 overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 animate-pulse-glow rounded-full bg-app-accent/[0.10] blur-[80px]" />
      <div className="relative mb-4 flex items-center gap-2">
        <AutoAwesomeRounded sx={{ fontSize: 15 }} className="icon-embossed text-app-accent-soft" />
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Insights</h2>
      </div>
      <motion.div className="relative grid grid-cols-1 gap-2.5 sm:grid-cols-2" initial="hidden" animate="show" variants={staggerContainer(0.06)}>
        {insights.map((insight) => (
          <motion.div
            key={insight.key}
            variants={staggerItem}
            className="glass-surface glass-edge rounded-xl p-3.5"
          >
            <div className="flex items-start gap-2.5">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[insight.tone] || TONE_DOT.accent}`} />
              <p className="text-[13px] leading-relaxed text-white/65">{insight.text}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Surface>
  )
}
