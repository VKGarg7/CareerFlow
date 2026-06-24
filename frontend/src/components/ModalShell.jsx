import { useState, useEffect } from 'react'
import { CircularProgress } from '@mui/material'

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
  </svg>
)

/**
 * Generic modal overlay + card shell.
 *
 * Props:
 *   open      — boolean
 *   onClose   — () => void
 *   title     — string
 *   subtitle  — string (optional)
 *   maxWidth  — Tailwind max-w-* class (default 'max-w-lg')
 *   children  — modal body content
 */
export function ModalShell({ open, onClose, title, subtitle, maxWidth = 'max-w-lg', children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} mx-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <CloseIcon />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Generic delete confirmation modal.
 *
 * Props:
 *   open      — boolean
 *   onClose   — () => void
 *   onConfirm — async () => void  (should throw on error)
 *   title     — string  e.g. "Delete Company"
 *   message   — ReactNode  e.g. <>Remove <strong>Google</strong>?</>
 *   warning   — ReactNode (optional) extra warning content below message
 *   confirmLabel — string (default 'Delete')
 */
export function ConfirmDeleteModal({ open, onClose, onConfirm, title, message, warning, confirmLabel = 'Delete' }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open) { setDeleting(false); setError('') } }, [open])

  if (!open) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-500">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
          </svg>
        </div>
        <h2 className="text-base font-bold text-gray-800 text-center mb-1">{title}</h2>
        <div className="text-sm text-gray-500 text-center mb-4">{message}</div>
        {warning && <div className="mb-4">{warning}</div>}
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3">
          <button onClick={handleConfirm} disabled={deleting}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting && <CircularProgress size={14} color="inherit" />}
            {confirmLabel}
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
