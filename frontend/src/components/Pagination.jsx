import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyboardArrowLeft, KeyboardArrowRight, KeyboardArrowDown, Check } from '@mui/icons-material'
import useFloatingMenu from '../hooks/useFloatingMenu'
import useCloseOnOutsideEvent from '../hooks/useCloseOnOutsideEvent'

const SIZE_OPTIONS = [10, 25, 50, 100]

function pageNumbers(current, total) {
  // current/total are 1-indexed here
  const pages = new Set([1, total, current, current - 1, current + 1])
  return [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
    .reduce((acc, p) => {
      if (acc.length > 0 && p - acc[acc.length - 1] > 1) acc.push('…')
      acc.push(p)
      return acc
    }, [])
}

function PageSizeSelect({ size, onSizeChange }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const pos = useFloatingMenu(open, triggerRef, { width: 96, align: 'right', flipThreshold: 160 })
  useCloseOnOutsideEvent(open, () => setOpen(false), [triggerRef, menuRef])

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 h-9 pl-3 pr-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-white/60 hover:bg-white/[0.06] hover:text-white transition whitespace-nowrap"
      >
        {size} / page
        <KeyboardArrowDown sx={{ fontSize: 15 }} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && createPortal(
        <div ref={menuRef} role="listbox"
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width }}
          className={`rounded-xl border border-white/[0.08] bg-app-raised shadow-card-hover py-1.5 z-[100] animate-scale-in ${pos.bottom !== undefined ? 'origin-bottom-right' : 'origin-top-right'}`}>
          {SIZE_OPTIONS.map((opt) => (
            <button key={opt} role="option" aria-selected={opt === size}
              onClick={() => { onSizeChange(opt); setOpen(false) }}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left transition-colors ${
                opt === size ? 'text-white bg-white/[0.06]' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
              }`}>
              {opt} / page
              {opt === size && <Check sx={{ fontSize: 16 }} className="shrink-0 text-app-accent-soft" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

export default function Pagination({ page, totalPages, totalElements, size, onPageChange, onSizeChange }) {
  if (totalPages <= 1) return null

  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, totalElements)
  const current = page + 1

  const btnCls = (active) =>
    `flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded-lg border text-xs font-semibold transition ${
      active
        ? 'border-app-accent bg-app-accent text-white'
        : 'border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white'
    }`

  return (
    <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
      <p className="text-xs text-white/35">
        Showing {from}–{to} of {totalElements}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Previous page"
        >
          <KeyboardArrowLeft fontSize="small" />
        </button>

        {pageNumbers(current, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-white/30 select-none">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p - 1)} className={btnCls(p === current)}>
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next page"
        >
          <KeyboardArrowRight fontSize="small" />
        </button>

        {onSizeChange && <PageSizeSelect size={size} onSizeChange={onSizeChange} />}
      </div>
    </div>
  )
}
