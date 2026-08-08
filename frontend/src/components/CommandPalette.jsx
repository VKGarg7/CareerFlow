import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  SearchRounded, LogoutOutlined, PersonOutlined,
} from '@mui/icons-material'
import { NAV, ADMIN_NAV, QUICK_ACTIONS } from '../constants/navigation'
import { springSnappy } from '../lib/motion'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('role') === 'ADMIN'

  const commands = useMemo(() => {
    const navCommands = [...NAV, ...(isAdmin ? [ADMIN_NAV] : [])].map((n) => ({
      id: `nav-${n.to}`, group: 'Go to', label: n.label, Icon: n.Icon, action: () => navigate(n.to),
    }))
    const actionCommands = QUICK_ACTIONS.map((a) => ({
      id: `action-${a.to}`, group: 'Quick actions', label: a.label, Icon: a.Icon, action: () => navigate(a.to),
    }))
    const accountCommands = [
      { id: 'profile', group: 'Account', label: 'View Profile', Icon: PersonOutlined, action: () => navigate('/profile') },
      {
        id: 'logout', group: 'Account', label: 'Log out', Icon: LogoutOutlined,
        action: () => { localStorage.removeItem('token'); localStorage.removeItem('role'); navigate('/login') },
      },
    ]
    return [...navCommands, ...actionCommands, ...accountCommands]
  }, [isAdmin, navigate])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => { setActiveIndex(0) }, [query])

  const runCommand = (cmd) => {
    cmd.action()
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIndex]) runCommand(filtered[activeIndex]) }
  }

  let lastGroup = null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[300] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[14vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={springSnappy}
            onClick={(e) => e.stopPropagation()}
            className="glass-surface glass-edge corner-light w-full max-w-lg overflow-hidden rounded-hud shadow-glass-2"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
              <SearchRounded sx={{ fontSize: 19 }} className="shrink-0 text-white/35" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, quick actions..."
                className="w-full bg-transparent text-[15px] text-white/90 outline-none placeholder:text-white/30"
              />
              <kbd className="shrink-0 rounded-md border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-white/35">esc</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-white/30">No matching commands</p>
              )}
              {filtered.map((cmd, i) => {
                const showGroup = cmd.group !== lastGroup
                lastGroup = cmd.group
                return (
                  <div key={cmd.id}>
                    {showGroup && (
                      <p className="px-4 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-white/25 first:pt-1.5">
                        {cmd.group}
                      </p>
                    )}
                    <button
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => runCommand(cmd)}
                      className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        i === activeIndex ? 'bg-app-accent/15 text-white' : 'text-white/65 hover:bg-white/[0.05]'
                      }`}
                    >
                      <cmd.Icon sx={{ fontSize: 16 }} className={i === activeIndex ? 'text-app-accent-soft' : 'text-white/35'} />
                      {cmd.label}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
