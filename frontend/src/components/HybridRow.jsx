import { motion, AnimatePresence } from 'framer-motion'
import { Email, LinkedIn, ExpandMoreRounded } from '@mui/icons-material'
import { CardMenu } from './EntityCard'
import { initials } from '../utils/followup'
import { easeOut } from '../lib/motion'

const contactBtnCls = 'flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] text-app-accent-soft hover:text-white hover:bg-app-accent transition'

export default function HybridRow({
  onClick,
  accentBorder,
  avatarColor,
  name,
  subtitle,
  statusSlot,
  children,
  hidden,
  logoSlot,
  email,
  linkedIn,
  menuItems,
  extraActions,
  timelineTone = 'accent',
  expanded = false,
  onToggleExpand,
  expandedContent,
  isLast = false,
}) {
  const timelineDot = {
    accent: 'bg-app-accent shadow-glow-accent',
    success: 'bg-app-emerald shadow-glow-success',
    warning: 'bg-app-warning shadow-glow-warning',
    danger: 'bg-app-danger shadow-glow-danger',
    neutral: 'bg-white/30',
  }[timelineTone] || 'bg-app-accent shadow-glow-accent'

  return (
    <div className="relative flex gap-3">
      <div className="relative flex w-4 shrink-0 flex-col items-center pt-6">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${timelineDot}`} />
        {!isLast && <span className="mt-1 w-px flex-1 bg-gradient-to-b from-white/[0.12] to-transparent" />}
      </div>

      <motion.div
        layout
        whileHover={{ y: -3 }}
        transition={{ layout: { duration: 0.35, ease: easeOut }, y: { type: 'spring', stiffness: 340, damping: 28 } }}
        className={`group glass-surface glass-edge corner-light elevate-float relative mb-3 flex-1 overflow-hidden rounded-hud border-l-4 ${accentBorder} shadow-glass-1 transition-shadow duration-300 hover:shadow-glass-hover`}
      >
        <div className="card-noise bg-noise" />
        <div onClick={onClick} className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap sm:px-5">

          {logoSlot || (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-inner-highlight ${avatarColor}`}>
              {initials(name)}
            </div>
          )}

          <div className="order-1 w-[calc(100%-3.75rem)] min-w-0 shrink-0 sm:order-none sm:w-44">
            <p className="truncate text-sm font-bold text-white/90">{name}</p>
            {subtitle && <p className="mt-0.5 truncate text-xs text-white/40">{subtitle}</p>}
          </div>

          <div className="w-full max-w-full shrink-0 sm:w-36" onClick={(e) => e.stopPropagation()}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
              {statusSlot}
            </motion.div>
          </div>

          {children}

          {hidden && (
            <div className="hidden max-w-xs flex-1 items-center gap-4 overflow-hidden opacity-0 transition-all duration-300 group-hover:opacity-100 lg:flex">
              {hidden}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5 shrink-0 opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            {extraActions}
            {email && (
              <a href={`mailto:${email}`} title={email} className={contactBtnCls}>
                <Email sx={{ fontSize: 15 }} />
              </a>
            )}
            {linkedIn && (
              <a href={linkedIn} target="_blank" rel="noreferrer" title="LinkedIn" className={contactBtnCls}>
                <LinkedIn sx={{ fontSize: 15 }} />
              </a>
            )}
            {onToggleExpand && (
              <button onClick={onToggleExpand} className={contactBtnCls} title={expanded ? 'Collapse' : 'Expand'}>
                <ExpandMoreRounded sx={{ fontSize: 17 }} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
            <CardMenu items={menuItems} />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && expandedContent && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: easeOut }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="px-5 py-4">{expandedContent}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
