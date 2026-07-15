import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined, BusinessOutlined, WorkOutlined,
  PeopleOutlined, PersonOutlined, LogoutOutlined,
  Menu, Close, NotificationsNoneOutlined, Handshake,
  AdminPanelSettingsOutlined, KeyboardArrowDownRounded,
  BusinessCenterOutlined, HandshakeOutlined, PersonAddAltOutlined,
} from '@mui/icons-material'
import { getProfile } from '../api/user'
import { profileInitial } from '../utils/followup'

const PAGE_META = {
  '/dashboard':    { title: 'Dashboard',    sub: 'Your job search, at a glance' },
  '/companies':    { title: 'Companies',    sub: 'Every employer you’re pursuing' },
  '/applications': { title: 'Applications', sub: 'Track every role through the pipeline' },
  '/follow-ups':   { title: 'Follow-Ups',   sub: 'Stay ahead of every thread' },
  '/recruiters':   { title: 'Recruiters',   sub: 'Your network of contacts' },
  '/referrals':    { title: 'Referrals',    sub: 'Who’s vouching for you' },
  '/profile':      { title: 'Profile',      sub: 'Your public-facing story' },
  '/admin':        { title: 'Admin',        sub: 'Workspace administration' },
  '/activity':     { title: 'Activity',     sub: 'Everything that’s happened' },
  '/change-password': { title: 'Change Password', sub: 'Keep your account secure' },
}

const NAV = [
  { to: '/dashboard',    Icon: DashboardOutlined,        label: 'Dashboard'    },
  { to: '/companies',    Icon: BusinessOutlined,          label: 'Companies'    },
  { to: '/applications', Icon: WorkOutlined,              label: 'Applications' },
  { to: '/follow-ups',   Icon: NotificationsNoneOutlined, label: 'Follow-Ups'   },
  { to: '/recruiters',   Icon: PeopleOutlined,            label: 'Recruiters'   },
  { to: '/referrals',    Icon: Handshake,                 label: 'Referrals'    },
]

const ADMIN_NAV = { to: '/admin', Icon: AdminPanelSettingsOutlined, label: 'Admin' }

const QUICK_ACTIONS = [
  { to: '/applications?add=1', Icon: BusinessCenterOutlined, label: 'Log Application', key: 'A' },
  { to: '/companies?add=1',    Icon: BusinessOutlined,       label: 'Add Company',     key: 'C' },
  { to: '/recruiters?add=1',   Icon: PersonAddAltOutlined,   label: 'Add Recruiter',   key: 'R' },
  { to: '/referrals?add=1',    Icon: HandshakeOutlined,      label: 'New Referral',    key: 'N' },
]

function Brand({ onNavigate }) {
  return (
    <Link to="/dashboard" onClick={onNavigate}
      className="group flex items-center gap-2.5 rounded-xl transition-transform active:scale-[0.98]">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-app-accent to-app-accent2 shadow-[0_2px_12px_-2px_rgba(99,102,241,0.55)] transition-shadow duration-200 group-hover:shadow-[0_4px_18px_-2px_rgba(99,102,241,0.75)]">
        <span className="font-display text-[11px] font-bold tracking-tight text-white">CF</span>
      </div>
      <div className="leading-tight">
        <p className="font-display text-[13px] font-semibold text-white">CareerFlow</p>
        <p className="text-[10px] text-white/30">Workspace</p>
      </div>
    </Link>
  )
}

function SidebarContent({ onClose, onLogout }) {
  const isAdmin = localStorage.getItem('role') === 'ADMIN'
  const items = isAdmin ? [...NAV, ADMIN_NAV] : NAV

  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    getProfile().then((res) => setProfile(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    const close = () => setAccountOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [accountOpen])

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
              `group relative flex h-9 items-center gap-3 rounded-xl px-3.5 text-[13.5px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/[0.07] text-white shadow-inner-highlight'
                  : 'text-white/40 hover:bg-white/[0.035] hover:text-white/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-app-accent-soft shadow-[0_0_8px_rgba(129,140,248,0.7)]" />
                )}
                <Icon sx={{ fontSize: 17 }} className={isActive ? 'text-app-accent-soft' : 'opacity-75 transition-opacity group-hover:opacity-100'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="my-1.5 h-px bg-white/[0.06]" />

      <div className="pb-1 pt-1.5">
        <p className="px-3.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/25">Quick Actions</p>
        <div className="space-y-0.5">
          {QUICK_ACTIONS.map(({ to, Icon, label, key }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="group flex h-8 items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-white/45 transition-all duration-200 hover:bg-white/[0.035] hover:text-white/85"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-white/45 transition-colors group-hover:bg-app-accent/20 group-hover:text-app-accent-soft">
                <Icon sx={{ fontSize: 12 }} />
              </span>
              <span className="flex-1 truncate">{label}</span>
              <kbd className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-white/30 group-hover:text-white/50">
                {key}
              </kbd>
            </Link>
          ))}
        </div>
      </div>
      </div>

      <div className="my-1.5 h-px shrink-0 bg-white/[0.06]" />

      <div className="relative shrink-0 pt-1.5">
        {accountOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-full mb-1.5 overflow-hidden rounded-xl border border-white/[0.08] bg-app-raised shadow-[0_16px_36px_-12px_rgba(0,0,0,0.6)]"
          >
            <button
              onClick={() => { navigate('/profile'); setAccountOpen(false); onClose?.() }}
              className="flex h-10 w-full items-center gap-3 px-3.5 text-left text-[13px] font-medium text-white/70 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
            >
              <PersonOutlined sx={{ fontSize: 17 }} className="opacity-75" />
              View Profile
            </button>
            <button
              onClick={() => { setAccountOpen(false); onLogout() }}
              className="flex h-10 w-full items-center gap-3 px-3.5 text-left text-[13px] font-medium text-white/40 transition-colors duration-200 hover:bg-rose-500/[0.08] hover:text-rose-300"
            >
              <LogoutOutlined sx={{ fontSize: 17 }} className="opacity-75" />
              Log out
            </button>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setAccountOpen((v) => !v) }}
          className="group flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors duration-200 hover:bg-white/[0.05]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-app-accent to-app-accent2 text-[11px] font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12.5px] font-medium text-white/85">{name}</p>
            <p className="truncate text-[11px] text-white/35">{profile?.email || ''}</p>
          </div>
          <KeyboardArrowDownRounded sx={{ fontSize: 16 }} className={`shrink-0 text-white/25 transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  )
}

function UserChip() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getProfile().then((res) => setProfile(res.data)).catch(() => {})
  }, [])

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

export default function Layout({ children, headerAction }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const meta = PAGE_META[location.pathname] || { title: 'CareerFlow', sub: '' }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app-bg">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-app-accent/[0.09] blur-[150px]" />
        <div className="absolute -left-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-app-success/[0.05] blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] p-3 lg:flex">
        <div className="flex w-full flex-col rounded-card bg-app-surface/60 shadow-[0_16px_36px_-20px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <SidebarContent onLogout={handleLogout} />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 p-3">
            <div className="flex h-full flex-col rounded-card bg-app-surface shadow-2xl">
              <SidebarContent onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
            </div>
          </aside>
        </div>
      )}

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-app-surface/90 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/[0.08] hover:text-white">
            <Menu fontSize="small" />
          </button>
          <Brand />
        </header>

        <header className="sticky top-0 z-20 hidden h-20 items-center justify-between gap-4 px-8 lg:flex">
          <div className="min-w-0">
            <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-app-text truncate">{meta.title}</h1>
            {meta.sub && <p className="mt-1 text-sm text-app-text-muted truncate">{meta.sub}</p>}
          </div>
          <div className={location.pathname === '/dashboard' && headerAction ? 'min-w-0 flex-1 max-w-xl' : 'shrink-0'}>
            {headerAction || (location.pathname === '/dashboard' && <UserChip />)}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[84rem] flex-1 px-8 pb-10 pt-2">
          {headerAction && <div className="mb-6 flex justify-end lg:hidden">{headerAction}</div>}
          {children}
        </main>
      </div>
    </div>
  )
}
