import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyboardArrowDown, Check } from '@mui/icons-material'
import useFloatingMenu from '../hooks/useFloatingMenu'
import useCloseOnOutsideEvent from '../hooks/useCloseOnOutsideEvent'

export default function FilterSelect({ value, onChange, allLabel, options, className = 'shrink-0 w-40', hideAll = false }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const allOptions = hideAll ? options : [{ value: '', label: allLabel }, ...options]
  const selected = allOptions.find((o) => o.value === value) || allOptions[0]

  const widthFn = useCallback((rect) => Math.max(rect.width, 200), [])
  const pos = useFloatingMenu(open, triggerRef, { width: widthFn, flipThreshold: 200, maxHeightCap: 320 })
  useCloseOnOutsideEvent(open, () => setOpen(false), [triggerRef, menuRef])

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className="w-full h-11 flex items-center pl-4 pr-9 border border-white/[0.06] rounded-xl text-sm text-app-text bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition cursor-pointer relative"
      >
        <span className="truncate">{selected.label}</span>
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-app-text-muted">
          <KeyboardArrowDown fontSize="small" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && pos && createPortal(
        <div ref={menuRef} role="listbox"
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
          className={`rounded-xl border border-white/[0.08] bg-app-raised shadow-card-hover py-1.5 z-[100] overflow-y-auto animate-scale-in ${pos.bottom !== undefined ? 'origin-bottom' : 'origin-top'}`}>
          {allOptions.map((o) => (
            <button key={o.value} role="option" aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left truncate transition-colors ${
                o.value === value ? 'text-white bg-white/[0.06]' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
              }`}>
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check sx={{ fontSize: 16 }} className="shrink-0 text-app-accent-soft" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
