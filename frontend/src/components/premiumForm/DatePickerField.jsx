import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarTodayRounded, ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material'
import useFloatingMenu from '../../hooks/useFloatingMenu'
import useCloseOnOutsideEvent from '../../hooks/useCloseOnOutsideEvent'
import { springSnappy } from '../../lib/motion'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

const toISO = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export default function DatePickerField({ label, icon = <CalendarTodayRounded sx={{ fontSize: 16 }} />, value, onChange, required = false, error, max, min, className = '' }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const pos = useFloatingMenu(open, triggerRef, { width: 288, flipThreshold: 340 })
  useCloseOnOutsideEvent(open, () => setOpen(false), [triggerRef, menuRef])

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null
  const [cursor, setCursor] = useState(() => selectedDate || new Date())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = buildMonthGrid(year, month)
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const floated = open || !!value

  const isDisabled = (iso) => (max && iso > max) || (min && iso < min)

  return (
    <div className={className}>
      <div className={`field-glass ${open ? 'is-focused' : ''} ${error ? 'has-error' : ''}`}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="relative flex h-12 w-full items-center px-4 text-left"
        >
          {icon && <span className="mr-2.5 shrink-0 text-white/30">{icon}</span>}
          <span className={`min-w-0 flex-1 truncate text-sm ${value ? 'text-white/90' : 'text-transparent'}`}>
            {value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '.'}
          </span>
          <label className={`field-label-float ${icon ? '' : 'no-icon'} ${floated ? 'floated' : ''}`}>
            {label}{required && <span className="text-app-danger"> *</span>}
          </label>
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-app-danger">{error}</p>}

      <AnimatePresence>
        {open && pos && createPortal(
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.96, y: pos.bottom !== undefined ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={springSnappy}
            style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width }}
            className="glass-surface glass-edge z-[100] overflow-hidden rounded-xl p-3 shadow-glass-2"
          >
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.08] hover:text-white transition">
                <ChevronLeftRounded sx={{ fontSize: 18 }} />
              </button>
              <p className="text-sm font-semibold text-white/85">{monthLabel}</p>
              <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.08] hover:text-white transition">
                <ChevronRightRounded sx={{ fontSize: 18 }} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_LABELS.map((d, i) => (
                <span key={i} className="py-1 text-[10px] font-semibold text-white/25">{d}</span>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <span key={i} />
                const iso = toISO(year, month, d)
                const isSelected = iso === value
                const isToday = iso === toISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
                const disabled = isDisabled(iso)
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => { onChange(iso); setOpen(false) }}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                      isSelected ? 'bg-app-accent text-white shadow-glow-accent'
                      : disabled ? 'text-white/15 cursor-not-allowed'
                      : isToday ? 'text-app-accent-soft ring-1 ring-app-accent/40 hover:bg-white/[0.08]'
                      : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  )
}
