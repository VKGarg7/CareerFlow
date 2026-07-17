import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useFloatingMenu from '../hooks/useFloatingMenu'
import useCloseOnOutsideEvent from '../hooks/useCloseOnOutsideEvent'

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
  </svg>
)

const KebabIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10 5.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM10 11.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM10 17.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" />
  </svg>
)

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
  </svg>
)

const PRESET_ICONS = { edit: <EditIcon />, delete: <DeleteIcon /> }

const TONE_CLASSES = {
  default: 'border-white/[0.08] text-white/60 bg-white/[0.02] hover:bg-white/[0.10] hover:text-white hover:border-white/[0.14]',
  danger:  'border-app-danger/20 text-app-danger bg-app-danger/[0.04] hover:bg-app-danger hover:text-white hover:border-app-danger',
  accent:  'border-app-warning/20 text-app-warning bg-app-warning/[0.04] hover:bg-app-warning hover:text-white hover:border-app-warning',
  info:    'border-app-accent/20 text-app-accent-soft bg-app-accent/10 hover:bg-app-accent hover:text-white hover:border-app-accent',
}

export function CardMenu({ items = [] }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const pos = useFloatingMenu(open, triggerRef, { width: 176, align: 'right', flipThreshold: 160 })
  useCloseOnOutsideEvent(open, () => setOpen(false), [triggerRef, menuRef])

  if (items.length === 0) return null

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
        aria-label="More actions" aria-haspopup="menu" aria-expanded={open}>
        <KebabIcon />
      </button>
      {open && pos && createPortal(
        <div ref={menuRef} role="menu"
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left }}
          className={`w-44 rounded-xl border border-white/[0.08] bg-app-raised shadow-card-hover py-1.5 z-[100] animate-scale-in ${pos.bottom !== undefined ? 'origin-bottom-right' : 'origin-top-right'}`}>
          {items.map(({ key, label, icon, onClick: onAction, tone = 'default' }) => (
            <button key={key || label} role="menuitem"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAction?.(e) }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors ${
                tone === 'danger'
                  ? 'text-app-danger hover:bg-app-danger/10'
                  : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
              }`}>
              {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>}
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

export function EntityCard({ onClick, accentColor, avatarColor, avatarText, avatarSlot, titleSlot, chips, note, actions = [], actionsSlot, footer, footNote }) {
  const trimmedNote = note?.trim()
  return (
    <div onClick={onClick}
      className={`relative overflow-hidden rounded-card border border-white/[0.06] border-l-4 ${accentColor} bg-app-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover cursor-pointer`}>
      <div className="flex flex-wrap sm:flex-nowrap items-start gap-4 p-6">
        {avatarSlot || (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner-highlight ${avatarColor}`}>
            {avatarText}
          </div>
        )}

        <div className="flex-1 min-w-[12rem] sm:min-w-0">
          <div className="min-w-0 mb-2">{titleSlot}</div>
          {chips && <div className="flex flex-wrap gap-2 mb-1.5">{chips}</div>}
          {trimmedNote && <p className="text-xs text-white/35 line-clamp-1 italic">"{trimmedNote}"</p>}
        </div>

        {actionsSlot ? (
          <div className="w-full sm:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>{actionsSlot}</div>
        ) : actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions.map(({ key, label, icon, onClick: onAction, tone = 'default', className = '' }) => (
              <button key={key || label} onClick={onAction} title={typeof label === 'string' ? label : key}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${TONE_CLASSES[tone]} ${className}`}>
                {typeof icon === 'string' ? PRESET_ICONS[icon] : icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {footer && (
        <div className="grid grid-cols-3 border-t border-white/[0.06]">
          {footer.map((cell, i) => (
            <div key={i} className={`px-4 py-3 ${i > 0 ? 'border-l border-white/[0.06]' : ''}`}>{cell}</div>
          ))}
        </div>
      )}

      {footNote && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/[0.06] text-sm">{footNote}</div>
      )}
    </div>
  )
}

export function EntityDirectoryCard({
  onClick, borderTopColor, statusBarColor, avatarColor, avatarText, avatarSlot, titleSlot, chips, note, actions = [],
  actionsSlot, revealActionsOnHover = false, footer, footNote,
}) {
  const trimmedNote = note?.trim()
  return (
    <div onClick={onClick} style={borderTopColor ? { borderTopColor } : undefined}
      className={`group relative overflow-hidden rounded-card border border-white/[0.06] ${statusBarColor ? '' : 'border-t-4'} bg-app-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover flex flex-col cursor-pointer`}>
      {statusBarColor && <div className={`h-1 w-full ${statusBarColor}`} />}
      <div className="p-6 flex flex-col gap-3.5 flex-1">
        <div className="flex items-start gap-3">
          {avatarSlot || (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner-highlight ${avatarColor}`}>
              {avatarText}
            </div>
          )}
          <div className="flex-1 min-w-0">{titleSlot}</div>
          {actionsSlot && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>{actionsSlot}</div>
          )}
        </div>

        {chips && <div className="flex items-center gap-3 min-w-0" onClick={(e) => e.stopPropagation()}>{chips}</div>}
        <p className="text-xs text-white/35 line-clamp-2 italic min-h-[2.25rem]">{trimmedNote ? `"${trimmedNote}"` : ''}</p>
      </div>

      {footer && (
        <div className="border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>{footer}</div>
      )}

      {footNote && (
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-white/[0.06] text-xs">{footNote}</div>
      )}

      {actions.length > 0 && (
        <div
          className={`flex border-t border-white/[0.06] bg-app-surface ${revealActionsOnHover
            ? 'absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150'
            : ''}`}
          onClick={(e) => e.stopPropagation()}>
          {actions.map(({ key, label, icon, onClick: onAction, tone = 'default' }, i) => (
            <div key={key || label} className="flex-1 flex items-center">
              {i > 0 && <div className="w-px self-stretch bg-white/[0.06]" />}
              <button onClick={onAction}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
                  tone === 'danger' ? 'text-app-danger hover:bg-app-danger/10' :
                  tone === 'accent' ? 'text-app-warning hover:bg-app-warning/10' :
                  tone === 'info' ? 'text-app-accent-soft hover:bg-app-accent/10' :
                  'text-white/60 hover:bg-white/[0.06]'
                }`}>
                {icon}
                {label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
