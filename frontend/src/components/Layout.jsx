import { useRef, useState, useCallback } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { pageTransition, drawerSlideBlur } from '../lib/motion'
import {
  DashboardOutlined, BusinessOutlined, WorkOutlined,
  PeopleOutlined, PersonOutlined, LogoutOutlined,
  Menu, Close, NotificationsNoneOutlined, Handshake,
  AdminPanelSettingsOutlined, FolderOutlined, KeyboardArrowDownRounded,
  BusinessCenterOutlined, HandshakeOutlined, PersonAddAltOutlined,
  FlagOutlined,
} from '@mui/icons-material'
import { useProfile } from '../context/ProfileContext'
import { useWorkspace } from '../context/WorkspaceContext'
import useCloseOnOutsideEvent from '../hooks/useCloseOnOutsideEvent'
import { profileInitial } from '../utils/followup'
import { NAV, ADMIN_NAV, QUICK_ACTIONS } from '../constants/navigation'
import AICompanionOrb from './AICompanionOrb'
import AmbientBackground from './AmbientBackground'
import AvatarRing from './AvatarRing'
import GlowTrail from './GlowTrail'
import CommandPalette from './CommandPalette'

const PAGE_META = {
  '/dashboard':    { title: 'Dashboard',    sub: 'Your job search, at a glance' },
  '/companies':    { title: 'Companies',    sub: 'Every employer you’re pursuing' },
  '/opportunities': { title: 'Opportunities', sub: 'Roles you’re evaluating before you apply' },
  '/applications': { title: 'Applications', sub: 'Track every role through the pipeline' },
  '/follow-ups':   { title: 'Follow-Ups',   sub: 'Stay ahead of every thread' },
  '/recruiters':   { title: 'Recruiters',   sub: 'Your network of contacts' },
  '/referrals':    { title: 'Referrals',    sub: 'Who’s vouching for you' },
  '/goals':        { title: 'Goals',        sub: 'Track progress toward your targets' },
  '/profile':      { title: 'Profile',      sub: 'Your public-facing story' },
  '/admin':        { title: 'Admin',        sub: 'Workspace administration' },
  '/activity':     { title: 'Activity',     sub: 'Everything that’s happened' },
  '/change-password': { title: 'Change Password', sub: 'Keep your account secure' },
}

const NAV = [
  { to: '/dashboard',    Icon: DashboardOutlined,        label: 'Dashboard'    },
  { to: '/workspaces',   Icon: FolderOutlined,            label: 'Workspaces'   },
  { to: '/companies',    Icon: BusinessOutlined,          label: 'Companies'    },
  { to: '/applications', Icon: WorkOutlined,              label: 'Applications' },
  { to: '/follow-ups',   Icon: NotificationsNoneOutlined, label: 'Follow-Ups'   },
  { to: '/recruiters',   Icon: PeopleOutlined,            label: 'Recruiters'   },
  { to: '/referrals',    Icon: Handshake,                 label: 'Referrals'    },
  { to: '/goals',        Icon: FlagOutlined,              label: 'Goals'        },
]

const ADMIN_NAV = { to: '/admin', Icon: AdminPanelSettingsOutlined, label: 'Admin' }

const QUICK_ACTIONS = [
  { to: '/applications?add=1', Icon: BusinessCenterOutlined, label: 'Log Application', key: 'A' },
  { to: '/companies?add=1',    Icon: BusinessOutlined,       label: 'Add Company',     key: 'C' },
  { to: '/recruiters?add=1',   Icon: PersonAddAltOutlined,   label: 'Add Recruiter',   key: 'R' },
  { to: '/referrals?add=1',    Icon: HandshakeOutlined,      label: 'New Referral',    key: 'N' },
]

function Brand({ onNavigate, iconOnly = false }) {
  return (
    <Link to="/dashboard" onClick={onNavigate}
      className="group flex items-center gap-2.5 rounded-xl transition-transform active:scale-[0.98]">
      <div className="cf-rail-orb icon-3d relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-shadow duration-200 group-hover:shadow-[0_6px_22px_-2px_rgba(124,107,255,0.85)]">
        <div className="pointer-events-none absolute inset-0 rounded-[10px] bg-white/25 opacity-0 blur-[6px] transition-opacity duration-300 group-hover:opacity-100" />
        <span className="icon-embossed relative font-display text-[11px] font-bold tracking-tight text-white">CF</span>
      </div>
      {!iconOnly && (
        <div className="sidebar-label leading-tight">
          <p className="font-display text-[13px] font-semibold text-white">CareerFlow</p>
          <p className="text-[9.5px] font-medium uppercase tracking-wider text-white/30">Career OS</p>
        </div>
      )}
    </Link>
  )
}

function WorkspaceSwitcher({ onNavigate }) {
  const { workspaces, activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, loading } = useWorkspace()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useCloseOnOutsideEvent(open, () => setOpen(false), [triggerRef, menuRef])

  if (loading || workspaces.length === 0) {
    return <p className="sidebar-label px-2 pb-1 text-[10px] text-white/30">Workspace</p>
  }

  return (
    <div className="relative px-0 pb-1.5">
      <motion.button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="glass-surface glass-edge flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left shadow-inner-highlight transition-shadow hover:shadow-glass-1"
      >
        <span className="icon-embossed flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-app-accent/25 to-app-purple/25 text-app-accent-soft">
          <FolderRounded sx={{ fontSize: 14 }} />
        </span>
        <div className="sidebar-label min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/30">Workspace</p>
          <p className="truncate text-[12.5px] font-medium text-white/80">{activeWorkspace?.name || 'Select workspace'}</p>
        </div>
        <KeyboardArrowDownRounded sx={{ fontSize: 15 }} className={`shrink-0 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="glass-surface glass-edge absolute left-0 top-full z-10 mt-1.5 w-64 overflow-hidden rounded-xl shadow-glass-2"
          >
            <p className="px-3.5 pt-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-white/25">Workspaces</p>
            <div className="max-h-64 overflow-y-auto no-scrollbar py-1">
              {workspaces.map((w) => {
                const active = String(w.id) === String(activeWorkspaceId)
                return (
                  <button
                    key={w.id}
                    onClick={() => { setActiveWorkspaceId(String(w.id)); setOpen(false) }}
                    className={`flex h-10 w-full items-center gap-2.5 px-3.5 text-left text-[13px] font-medium transition-colors ${
                      active ? 'bg-white/[0.07] text-white' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${active ? 'bg-app-accent text-white shadow-glow-accent' : 'bg-white/[0.06] text-transparent'}`}>
                      <CheckRounded sx={{ fontSize: 12 }} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{w.name}</span>
                    {w.isDefault && <span className="shrink-0 text-[10px] text-white/25">Default</span>}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-white/[0.06] py-1">
              <Link
                to="/workspaces"
                onClick={() => { setOpen(false); onNavigate?.() }}
                className="flex h-9 items-center gap-2 px-3.5 text-left text-[12.5px] font-medium text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/80"
              >
                Manage workspaces
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarContent({ onClose, onLogout, onRailScroll }) {
  const isAdmin = localStorage.getItem('role') === 'ADMIN'
  const items = isAdmin ? [...NAV, ADMIN_NAV] : NAV

  const navigate = useNavigate()
  const { profile } = useProfile()
  const [accountOpen, setAccountOpen] = useState(false)
  const accountTriggerRef = useRef(null)
  const accountMenuRef = useRef(null)

  useCloseOnOutsideEvent(accountOpen, () => setAccountOpen(false), [accountTriggerRef, accountMenuRef])

  const name = profile?.firstName ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}` : 'Account'
  const initial = profileInitial(profile)

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex h-14 shrink-0 items-center justify-between px-2.5">
        <Brand onNavigate={onClose} />
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden">
            <Close fontSize="small" />
          </button>
        )}
      </div>

      <WorkspaceSwitcher onNavigate={onClose} />

      <div className="my-1.5 h-px shrink-0 bg-white/[0.06]" />

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
      <nav className="space-y-0.5 py-2.5">
        <p className="px-3.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/25">Menu</p>
        {items.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex h-9 items-center gap-3 rounded-xl px-3.5 text-[13.5px] font-medium transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-white/40 hover:bg-white/[0.035] hover:text-white/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="liquid-indicator absolute inset-0 bg-white/[0.07] shadow-inner-highlight"
                  >
                    <span className="cf-active-beam absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-full" />
                  </motion.span>
                )}
                <span className="icon-3d relative">
                  <Icon sx={{ fontSize: 17 }} className={`transition-colors duration-200 ${isActive ? 'text-app-accent-soft drop-shadow-[0_0_6px_rgba(129,140,248,0.6)]' : 'text-white/70 group-hover:text-white'}`} />
                </span>
                <span className="sidebar-label relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        </nav>
      </GlowTrail>

      <div className="my-1.5 h-px bg-white/[0.06]" />

      <div className="pb-1 pt-1.5">
        <p className="sidebar-label px-3.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/25">Commands</p>
        <div className="space-y-0.5">
          {QUICK_ACTIONS.map(({ to, Icon, label, key }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="group flex h-8 items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-white/45 transition-all duration-200 hover:bg-white/[0.035] hover:text-white/85"
            >
              <span className="icon-3d flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-white/70 transition-colors group-hover:bg-app-accent/20 group-hover:text-app-accent-soft">
                <Icon sx={{ fontSize: 12 }} />
              </span>
              <span className="sidebar-label flex-1 truncate">{label}</span>
              <kbd className="cf-keycap sidebar-label rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white/40 group-hover:text-white/60">
                {key}
              </kbd>
            </Link>
          ))}
        </div>
      </div>
      </div>

      <div className="my-1.5 h-px shrink-0 bg-white/[0.06]" />

      <div className="relative shrink-0 pt-1.5">
        <AnimatePresence>
          {accountOpen && (
            <motion.div
              ref={accountMenuRef}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="glass-surface glass-edge absolute inset-x-0 bottom-full mb-1.5 overflow-hidden rounded-xl shadow-glass-2"
            >
              <button
                onClick={() => { navigate('/profile'); setAccountOpen(false); onClose?.() }}
                className="group flex h-10 w-full items-center gap-3 px-3.5 text-left text-[13px] font-medium text-white/70 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <span className="icon-3d"><PersonOutlined sx={{ fontSize: 17 }} className="opacity-75" /></span>
                View Profile
              </button>
              <button
                onClick={() => { setAccountOpen(false); onLogout() }}
                className="group flex h-10 w-full items-center gap-3 px-3.5 text-left text-[13px] font-medium text-white/40 transition-colors duration-200 hover:bg-rose-500/[0.08] hover:text-rose-300"
              >
                <span className="icon-3d"><LogoutOutlined sx={{ fontSize: 17 }} className="opacity-75" /></span>
                Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          ref={accountTriggerRef}
          onClick={() => setAccountOpen((v) => !v)}
          whileHover={{ y: -1 }}
          className="glass-surface glass-edge flex w-full items-center gap-2.5 rounded-xl p-2 text-left shadow-inner-highlight transition-shadow hover:shadow-glass-1"
        >
          <AvatarRing initial={initial} size={30} />
          <div className="sidebar-label min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12.5px] font-medium text-white/85">{name}</p>
            <p className="truncate text-[11px] text-white/35">{profile?.email || ''}</p>
          </div>
          <KeyboardArrowDownRounded sx={{ fontSize: 16 }} className={`sidebar-label shrink-0 text-white/25 transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
    </div>
  )
}

function UserChip() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [open, setOpen] = useState(false)

  const name = profile?.firstName ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}` : 'Account'
  const initial = profileInitial(profile)

  return (
    <button
      onClick={() => navigate('/profile')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="group flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2.5 transition-colors duration-200 hover:bg-white/[0.05]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-app-accent to-app-accent2 text-[11px] font-bold text-white">
        {initial}
      </div>
      <div className="hidden text-left leading-tight sm:block">
        <p className="text-xs font-medium text-white/80">{name}</p>
      </div>
      <KeyboardArrowDownRounded sx={{ fontSize: 15 }} className={`hidden text-white/25 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}

export default function Layout({ children, headerAction, drawerOpen = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()
  const reducedMotion = useReducedMotion()
  const sidebarParallax = useTransform(scrollY, [0, 600], [0, reducedMotion ? 0 : -18])

  const scrollFadeTimeout = useRef(null)
  const handleRailScroll = useCallback((e) => {
    const el = e.currentTarget
    el.classList.add('is-scrolling')
    clearTimeout(scrollFadeTimeout.current)
    scrollFadeTimeout.current = setTimeout(() => el.classList.remove('is-scrolling'), 900)
  }, [])

  const handleRailPointerMove = useCallback((e) => {
    if (reducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--cf-x', `${x}%`)
    e.currentTarget.style.setProperty('--cf-y', `${y}%`)
  }, [reducedMotion])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const meta = PAGE_META[location.pathname] || { title: 'CareerFlow', sub: '' }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app-depth">
      <AmbientBackground />

      <motion.aside
        style={{ y: sidebarParallax }}
        initial={false}
        whileHover="expanded"
        animate="collapsed"
        variants={{ collapsed: { width: 76 }, expanded: { width: 280 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.9 }}
        onPointerMove={handleRailPointerMove}
        className="sidebar-rail perspective-hud group fixed inset-y-0 left-0 z-30 hidden p-3 lg:flex"
      >
        <div className="cf-rail cf-rail-tilt glass-surface glass-edge glass-reflection-sweep elevate-float relative flex w-full flex-col rounded-hud shadow-glass-1 transition-shadow duration-500 hover:shadow-glass-2">
          <div className="cf-rail-glow" />
          <div className="pointer-events-none absolute -inset-px rounded-hud bg-gradient-to-b from-white/[0.04] via-transparent to-app-accent/[0.03]" />
          <SidebarContent onLogout={handleLogout} onRailScroll={handleRailScroll} />
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: '-100%', filter: 'blur(8px)' }} animate={{ x: 0, filter: 'blur(0px)' }} exit={{ x: '-100%', filter: 'blur(8px)' }}
              transition={drawerSlideBlur.transition}
              className="absolute inset-y-0 left-0 w-72 p-3"
            >
              <div className="glass-surface glass-edge flex h-full flex-col rounded-hud shadow-glass-2">
                <SidebarContent onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col lg:pl-[76px]">
        <header className="glass-surface sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/[0.06] px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/[0.08] hover:text-white">
            <Menu fontSize="small" />
          </button>
          <Brand iconOnly />
        </header>

        {location.pathname !== '/workspaces' && (
          <header className={`sticky top-0 z-20 hidden h-20 items-center justify-between gap-4 px-8 lg:flex transition-[margin] duration-300 ease-out ${drawerOpen ? 'lg:mr-[26rem]' : ''}`}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0"
            >
              <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-app-text truncate">{meta.title}</h1>
              {meta.sub && <p className="mt-1 text-sm text-app-text-muted truncate">{meta.sub}</p>}
            </motion.div>
            <div className={location.pathname === '/dashboard' && headerAction ? 'min-w-0 flex-1 max-w-xl' : 'shrink-0'}>
              {headerAction || (location.pathname === '/dashboard' && <UserChip />)}
            </div>
          </header>
        )}

        <main className="mx-auto w-full max-w-[84rem] flex-1 px-8 pb-10 pt-2">
          {headerAction && <div className="mb-6 flex flex-wrap justify-end gap-2 lg:hidden">{headerAction}</div>}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial} animate={pageTransition.animate} exit={pageTransition.exit}
              transition={pageTransition.transition}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AICompanionOrb />
      <CommandPalette />
    </div>
  )
}
