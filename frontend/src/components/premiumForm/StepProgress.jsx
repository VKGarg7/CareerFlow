import { motion } from 'framer-motion'
import { CheckRounded } from '@mui/icons-material'

export default function StepProgress({ steps, current }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{ scale: active ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                  done ? 'bg-app-emerald text-white shadow-glow-success'
                  : active ? 'bg-app-accent text-white shadow-glow-accent'
                  : 'bg-white/[0.06] text-white/35'
                }`}
              >
                {done ? <CheckRounded sx={{ fontSize: 16 }} /> : i + 1}
              </motion.div>
              <span className={`whitespace-nowrap text-[10.5px] font-medium ${active ? 'text-white/80' : 'text-white/30'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative -mt-4 h-px flex-1 overflow-hidden bg-white/[0.08]">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-app-accent to-app-emerald"
                  initial={false}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
