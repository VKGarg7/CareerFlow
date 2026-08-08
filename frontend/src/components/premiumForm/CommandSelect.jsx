import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { KeyboardArrowDown, Check, SearchRounded } from '@mui/icons-material'
import useFloatingMenu from '../../hooks/useFloatingMenu'
import useCloseOnOutsideEvent from '../../hooks/useCloseOnOutsideEvent'
import { springSnappy } from '../../lib/motion'

export default function CommandSelect({
  label,
  icon,
  value,
  onChange,
  options,
  required = false,
  error,
  searchable = true,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const pos = useFloatingMenu(open, triggerRef, { width: (r) => Math.max(r.width, 220), flipThreshold: 220, maxHeightCap: 320 })
  useCloseOnOutsideEvent(open, () => { setOpen(false); setQuery('') }, [triggerRef, menuRef])

  const selected = options.find((o) => o.value === value)
  const filtered = useMemo(
    () => (query.trim() ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())) : options),
    [options, query]
  )

  const floated = open || !!selected

  return (
    <div className={className}>
      <div className={`field-glass ${open ? 'is-focused' : ''} ${error ? 'has-error' : ''}`}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox" aria-expanded={open}
          className="relative flex h-12 w-full items-center px-4 text-left"
        >
          {icon && <span className="mr-2.5 shrink-0 text-white/30">{icon}</span>}
          <span className={`min-w-0 flex-1 truncate text-sm ${selected ? 'text-white/90' : 'text-transparent'}`}>
            {selected?.label || '.'}
          </span>
          <label className={`field-label-float ${icon ? '' : 'no-icon'} ${floated ? 'floated' : ''}`}>
            {label}{required && <span className="text-app-danger"> *</span>}
          </label>
          <KeyboardArrowDown sx={{ fontSize: 18 }} className={`shrink-0 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-app-danger">{error}</p>}

      <AnimatePresence>
        {open && pos && createPortal(
          <motion.div
            ref={menuRef}
            role="listbox"
            initial={{ opacity: 0, scale: 0.97, y: pos.bottom !== undefined ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={springSnappy}
            style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
            className="glass-surface glass-edge z-[100] overflow-hidden rounded-xl shadow-glass-2"
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
                <SearchRounded sx={{ fontSize: 16 }} className="shrink-0 text-white/30" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full bg-transparent text-sm text-white/85 outline-none placeholder:text-white/25"
                />
              </div>
            )}
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-3.5 py-3 text-sm text-white/30">No matches</p>
              )}
              {filtered.map((o) => (
                <button
                  key={o.value}
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    o.value === value ? 'bg-white/[0.07] text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check sx={{ fontSize: 16 }} className="shrink-0 text-app-accent-soft" />}
                </button>
              ))}
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  )
}
