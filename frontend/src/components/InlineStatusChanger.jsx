import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircularProgress } from '@mui/material'
import { KeyboardArrowDown, Check } from '@mui/icons-material'
import useFloatingMenu from '../hooks/useFloatingMenu'
import useCloseOnOutsideEvent from '../hooks/useCloseOnOutsideEvent'

/**
 * @param {object} item
 * @param {object} statusConfig
 * @param {string} defaultStatus
 * @param {function} updateFn
 * @param {function} onStatusChanged
 * @param {string} [wrapperClass]
 */
export default function InlineStatusChanger({
  item,
  statusConfig,
  defaultStatus,
  updateFn,
  onStatusChanged,
  wrapperClass = '',
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [open, setOpen]     = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const cfg = statusConfig[item.status] || statusConfig[defaultStatus]

  const widthFn = useCallback((rect) => Math.max(rect.width, 160), [])
  const pos = useFloatingMenu(open, triggerRef, { width: widthFn, flipThreshold: 160, maxHeightCap: 280 })
  useCloseOnOutsideEvent(open, () => setOpen(false), [triggerRef, menuRef])

  const handleSelect = async (newStatus) => {
    setOpen(false)
    if (newStatus === item.status) return
    setSaving(true)
    setError('')
    try {
      const { data } = await updateFn(item.id, { status: newStatus })
      onStatusChanged(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className={`relative flex items-center gap-1.5 min-w-0 ${wrapperClass}`}>
      {saving && <CircularProgress size={12} sx={{ color: 'rgba(255,255,255,0.4)' }} />}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        title={error || 'Change status'}
        className={`appearance-none w-full max-w-full truncate text-[11px] font-medium pl-2.5 pr-6 py-1 rounded-md border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-app-accent/40 transition disabled:opacity-50 relative ${cfg.badge}`}
      >
        <span className="truncate">{cfg.label}</span>
        <KeyboardArrowDown sx={{ fontSize: 14 }} className={`absolute right-1 top-1/2 -translate-y-1/2 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div ref={menuRef} role="listbox"
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
          className={`rounded-xl border border-white/[0.08] bg-app-raised shadow-card-hover py-1.5 z-[100] overflow-y-auto animate-scale-in ${pos.bottom !== undefined ? 'origin-bottom' : 'origin-top'}`}>
          {Object.entries(statusConfig).map(([val, { label }]) => (
            <button key={val} role="option" aria-selected={val === item.status}
              onClick={(e) => { e.stopPropagation(); handleSelect(val) }}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left truncate transition-colors ${
                val === item.status ? 'text-white bg-white/[0.06]' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
              }`}>
              <span className="truncate">{label}</span>
              {val === item.status && <Check sx={{ fontSize: 16 }} className="shrink-0 text-app-accent-soft" />}
            </button>
          ))}
        </div>,
        document.body
      )}

      {error && (
        <span className="absolute top-full left-0 mt-1 text-[10px] text-app-danger bg-app-surface border border-white/[0.08] rounded-lg px-2 py-1 shadow-card z-10 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  )
}
