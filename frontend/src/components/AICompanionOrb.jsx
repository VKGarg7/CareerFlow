import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AutoAwesomeRounded, CloseRounded } from '@mui/icons-material'
import ChatPanel from './ChatPanel'
import { useWorkspace } from '../context/WorkspaceContext'
import { getUpcomingFollowUps } from '../api/followup'
import { todayStr } from '../utils/followup'
import { companionCopyFor } from '../utils/aiCompanionCopy'
import { springSnappy } from '../lib/motion'

export default function AICompanionOrb() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [overdueCount, setOverdueCount] = useState(0)
  const location = useLocation()
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace()

  useEffect(() => {
    if (workspaceLoading || !activeWorkspaceId) return
    getUpcomingFollowUps(7)
      .then((res) => {
        const today = todayStr()
        setOverdueCount((res.data || []).filter((f) => f.followUpDate < today).length)
      })
      .catch(() => {})
  }, [activeWorkspaceId, workspaceLoading, location.pathname])

  const copy = companionCopyFor(location.pathname)
  const hasAnomaly = overdueCount > 0
  const state = open ? 'listening' : thinking ? 'thinking' : 'breathing'

  const handleOpen = () => {
    setThinking(true)
    window.setTimeout(() => { setThinking(false); setOpen(true) }, 420)
  }

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={springSnappy}
            className="fixed bottom-6 right-6 z-50"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="glass-surface glass-edge absolute bottom-full right-0 mb-3 w-64 rounded-xl p-3.5 shadow-glass-2"
                >
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-app-accent-soft">
                    <AutoAwesomeRounded sx={{ fontSize: 12 }} />
                    Companion
                  </p>
                  <p className="text-[13px] leading-relaxed text-white/70">{copy.insight}</p>
                  {hasAnomaly && (
                    <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-app-warning">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-app-warning shadow-glow-warning" />
                      {overdueCount} overdue follow-up{overdueCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleOpen}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label="AI companion"
              className="relative flex h-14 w-14 items-center justify-center rounded-full"
            >
              <span className={`orb-ring absolute inset-[-6px] rounded-full ${state === 'thinking' ? 'orb-thinking' : ''}`} />
              <span
                className={`orb-core relative flex h-14 w-14 items-center justify-center rounded-full text-white ${
                  state === 'listening' ? 'orb-listening' : state === 'thinking' ? '' : 'orb-breathing'
                }`}
              >
                <AutoAwesomeRounded sx={{ fontSize: 22 }} className={state === 'thinking' ? 'animate-spin-slow' : ''} />
              </span>
              {hasAnomaly && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-app-warning text-[9px] font-bold text-white shadow-glow-warning">
                  {overdueCount > 9 ? '9+' : overdueCount}
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  )
}
