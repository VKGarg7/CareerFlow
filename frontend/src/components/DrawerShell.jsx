import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Close } from '@mui/icons-material'
import { drawerSlideBlur } from '../lib/motion'

export const DrawerShell = forwardRef(function DrawerShell({ children }, ref) {
  return (
    <motion.aside
      ref={ref}
      initial={drawerSlideBlur.initial}
      animate={drawerSlideBlur.animate}
      exit={drawerSlideBlur.exit}
      transition={drawerSlideBlur.transition}
      className="glass-surface glass-edge fixed inset-y-0 right-0 z-40 w-full max-w-sm shadow-glass-2 flex flex-col"
    >
      {children}
    </motion.aside>
  )
})

export function CloseIconButton({ onClose, className = '' }) {
  return (
    <button onClick={onClose} aria-label="Close"
      className={`p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition ${className}`}>
      <Close sx={{ fontSize: 18 }} />
    </button>
  )
}

export function DrawerHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      <CloseIconButton onClose={onClose} />
    </div>
  )
}
