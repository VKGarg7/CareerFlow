import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined, BusinessOutlined, WorkOutlined,
  PeopleOutlined, PersonOutlined, LogoutOutlined,
  Menu, Close, NotificationsNoneOutlined, Handshake,
} from '@mui/icons-material'

const NAV = [
  { to: '/dashboard',    Icon: DashboardOutlined,        label: 'Dashboard'    },
  { to: '/companies',    Icon: BusinessOutlined,          label: 'Companies'    },
  { to: '/applications', Icon: WorkOutlined,              label: 'Applications' },
  { to: '/follow-ups',   Icon: NotificationsNoneOutlined, label: 'Follow-Ups'   },
  { to: '/recruiters',   Icon: PeopleOutlined,            label: 'Recruiters'   },
  { to: '/referrals',    Icon: Handshake,                 label: 'Referrals'    },
  { to: '/profile',      Icon: PersonOutlined,            label: 'Profile'      },
]

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
        <span className="text-white text-[11px] font-black tracking-tight">CF</span>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-gray-900">CareerFlow</p>
        <p className="text-[10px] text-gray-400">Job Search Tracker</p>
      </div>
    </div>
  )
}

function SidebarContent({ onClose, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 shrink-0">
        <Brand />
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <Close fontSize="small" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <Icon sx={{ fontSize: 18 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100 shrink-0">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogoutOutlined sx={{ fontSize: 18 }} />
          Log out
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-56 bg-white border-r border-gray-100 z-50 shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:pl-56 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <Menu fontSize="small" />
          </button>
          <Brand />
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
