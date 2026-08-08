import { useState, useEffect } from 'react'
import { CircularProgress } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { CloseGlyphIcon } from './CloseGlyphIcon'
import { modalZoomFromCursor } from '../lib/motion'
import { getLastPointerPosition } from '../hooks/useLastPointerPosition'

const CloseIcon = () => <CloseGlyphIcon className="w-4 h-4" />

export function ModalShell({ open, onClose, title, subtitle, maxWidth = 'max-w-lg', children }) {
  const origin = open ? getLastPointerPosition() : { x: '50%', y: '50%' }
  const zoom = modalZoomFromCursor(origin.x, origin.y)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={zoom.initial}
            animate={zoom.animate}
            exit={zoom.exit}
            transition={zoom.transition}
            className={`glass-surface glass-edge relative overflow-hidden rounded-hud shadow-glass-2 w-full ${maxWidth} mx-4 max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition">
                <CloseIcon />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmDeleteModal({ open, onClose, onConfirm, title, message, warning, confirmLabel = 'Delete' }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setDeleting(false); setError('') } }, [open])

  const handleConfirm = async () => {
    setDeleting(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete. Please try again.')
      setDeleting(false)
    }
  }

  const origin = open ? getLastPointerPosition() : { x: '50%', y: '50%' }
  const zoom = modalZoomFromCursor(origin.x, origin.y)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md"
        >
          <motion.div
            initial={zoom.initial}
            animate={zoom.animate}
            exit={zoom.exit}
            transition={zoom.transition}
            className="glass-surface glass-edge relative overflow-hidden rounded-hud shadow-glass-2 w-full max-w-sm mx-4 p-6"
          >
            <div className="w-12 h-12 rounded-full bg-app-danger/10 flex items-center justify-center mx-auto mb-4 shadow-edge-glow shadow-app-danger/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-app-danger">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
              </svg>
            </div>
            <h2 className="text-base font-bold text-white text-center mb-1">{title}</h2>
            <div className="text-sm text-white/50 text-center mb-4">{message}</div>
            {warning && <div className="mb-4">{warning}</div>}
            {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 text-app-danger text-sm">{error}</div>}
            <div className="flex gap-3">
              <button onClick={handleConfirm} disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-app-danger rounded-xl hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting && <CircularProgress size={14} color="inherit" />}
                {confirmLabel}
              </button>
              <button onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-white/70 bg-white/[0.06] rounded-xl hover:bg-white/[0.10] transition">
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
