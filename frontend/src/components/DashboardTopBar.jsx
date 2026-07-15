import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileInitial } from '../utils/followup'
import {
  Search, NotificationsNoneOutlined, CalendarTodayOutlined,
  AddRounded, KeyboardArrowDownRounded, BusinessOutlined, WorkOutlineRounded,
} from '@mui/icons-material'

export default function DashboardTopBar({ profile, pendingFollowUpCount = 0 }) {
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const addMenuRef = useRef(null)

  useEffect(() => {
    if (!addOpen) return
    const onDocClick = (e) => { if (!addMenuRef.current?.contains(e.target)) setAddOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setAddOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [addOpen])

  const initial = profileInitial(profile)

  return (
    <div className="flex w-full items-center gap-3">
      <div className="relative min-w-[14rem] flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
          <Search sx={{ fontSize: 18 }} />
        </span>
        <input
          type="text"
          placeholder="Search anything..."
          className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-14 text-sm text-white placeholder:text-white/30 transition hover:border-white/[0.12] focus:border-app-accent/40 focus:outline-none focus:ring-2 focus:ring-app-accent/30"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-1 text-[11px] font-medium text-white/30">
          ⌘K
        </span>
      </div>

      <button
        onClick={() => navigate('/follow-ups')}
        title="Follow-ups"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/50 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
      >
        <NotificationsNoneOutlined sx={{ fontSize: 18 }} />
        {pendingFollowUpCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-app-danger px-1 text-[10px] font-bold leading-none text-white">
            {pendingFollowUpCount > 9 ? '9+' : pendingFollowUpCount}
          </span>
        )}
      </button>

      <button
        onClick={() => navigate('/applications')}
        title="Applications calendar"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/50 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
      >
        <CalendarTodayOutlined sx={{ fontSize: 17 }} />
      </button>

      <button
        onClick={() => navigate('/profile')}
        title="Profile"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-app-accent to-app-accent2 text-[13px] font-bold text-white shadow-inner-highlight"
      >
        {initial}
      </button>

      <div className="relative shrink-0" ref={addMenuRef}>
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl bg-app-accent px-4 text-sm font-semibold text-white shadow-glow shadow-app-accent/40 transition hover:brightness-110"
        >
          <AddRounded sx={{ fontSize: 18 }} />
          Add New
          <KeyboardArrowDownRounded sx={{ fontSize: 16 }} className={`transition-transform ${addOpen ? 'rotate-180' : ''}`} />
        </button>
        {addOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-52 rounded-xl border border-white/[0.08] bg-app-raised py-1.5 shadow-card-hover animate-scale-in origin-top-right">
            <button
              onClick={() => { setAddOpen(false); navigate('/companies?add=1') }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <BusinessOutlined sx={{ fontSize: 16 }} className="text-white/40" />
              Add Company
            </button>
            <button
              onClick={() => { setAddOpen(false); navigate('/applications?add=1') }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <WorkOutlineRounded sx={{ fontSize: 16 }} className="text-white/40" />
              Add Application
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
