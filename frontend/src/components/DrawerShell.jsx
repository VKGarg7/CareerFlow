import { Close } from '@mui/icons-material'

export function DrawerShell({ children }) {
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-app-surface border-l border-white/[0.08] shadow-card-hover flex flex-col"
      style={{ animation: 'drawer-in 0.24s cubic-bezier(0.16,1,0.3,1)' }}>
      {children}
    </aside>
  )
}

export function CloseIconButton({ onClose, className = '' }) {
  return (
    <button onClick={onClose}
      className={`p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition ${className}`}>
      <Close sx={{ fontSize: 18 }} />
    </button>
  )
}

export function DrawerHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      <CloseIconButton onClose={onClose} />
    </div>
  )
}
