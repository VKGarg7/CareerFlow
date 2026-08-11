import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyboardArrowDown, Check, Search } from '@mui/icons-material'
import { getContacts } from '../api/contact'
import useFloatingMenu from '../hooks/useFloatingMenu'
import useCloseOnOutsideEvent from '../hooks/useCloseOnOutsideEvent'

export default function ContactPicker({ value, onChange, placeholder = 'Select a contact…' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const searchRef = useRef(null)

  const widthFn = useCallback((rect) => Math.max(rect.width, 260), [])
  const pos = useFloatingMenu(open, triggerRef, { width: widthFn, flipThreshold: 240, maxHeightCap: 320 })
  useCloseOnOutsideEvent(open, () => setOpen(false), [triggerRef, menuRef])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getContacts({ search: query.trim() || undefined, size: 50 })
      .then((res) => setContacts(res.data))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false))
  }, [open, query])

  useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus())
  }, [open])

  const selected = contacts.find((c) => c.id === value) || (value && value.__label ? value : null)
  const label = value?.name || (typeof value === 'object' ? value?.name : null)

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className="w-full h-11 flex items-center pl-4 pr-9 border border-white/[0.06] rounded-xl text-sm text-app-text bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition cursor-pointer relative"
      >
        <span className={`truncate ${!label ? 'text-white/30' : ''}`}>{label || placeholder}</span>
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-app-text-muted">
          <KeyboardArrowDown fontSize="small" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && pos && createPortal(
        <div ref={menuRef} role="listbox"
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
          className={`flex flex-col rounded-xl border border-white/[0.08] bg-app-raised shadow-card-hover z-[100] overflow-hidden animate-scale-in ${pos.bottom !== undefined ? 'origin-bottom' : 'origin-top'}`}>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0">
            <Search sx={{ fontSize: 15 }} className="text-white/30" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts…"
              className="flex-1 bg-transparent text-sm text-white/85 focus:outline-none placeholder:text-white/25"
            />
          </div>
          <div className="overflow-y-auto py-1.5">
            {loading ? (
              <p className="px-3.5 py-2 text-xs text-white/35">Loading…</p>
            ) : contacts.length === 0 ? (
              <p className="px-3.5 py-2 text-xs text-white/35">No contacts found.</p>
            ) : contacts.map((c) => (
              <button key={c.id} role="option" aria-selected={c.id === value?.id}
                type="button"
                onClick={() => { onChange(c); setOpen(false); setQuery('') }}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left transition-colors ${
                  c.id === value?.id ? 'text-white bg-white/[0.06]' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                }`}>
                <span className="min-w-0 truncate">
                  <span className="truncate">{c.name}</span>
                  {c.companyName && <span className="text-white/35"> · {c.companyName}</span>}
                </span>
                {c.id === value?.id && <Check sx={{ fontSize: 16 }} className="shrink-0 text-app-accent-soft" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
