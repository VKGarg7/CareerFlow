import { AnimatePresence, motion } from 'framer-motion'
import { EmojiEventsRounded } from '@mui/icons-material'
import Confetti from './Confetti'
import { springSnappy } from '../lib/motion'

export default function AchievementToast({ message, title = 'Achievement unlocked' }) {
  const active = !!message
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[200] flex justify-center">
      <div className="relative">
        <Confetti active={active} />
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={springSnappy}
              className="glass-surface glass-edge corner-light pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-glass-2"
            >
              <span className="orb-core orb-breathing flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
                <EmojiEventsRounded sx={{ fontSize: 20 }} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-app-emerald">{title}</p>
                <p className="text-sm font-medium text-white/85">{message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
