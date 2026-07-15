import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import {
  CloseRounded, BusinessCenterOutlined, Place, LanguageOutlined, WorkOutlineOutlined,
  StarRounded, StarBorderRounded, KeyboardArrowDown,
  HandshakeOutlined, NotificationsNoneOutlined, PeopleOutlined,
  PersonOutlineRounded, VisibilityOutlined, CallOutlined, DesktopWindowsOutlined,
  ScheduleOutlined, EditOutlined,
} from '@mui/icons-material'
import { getCompany, updateCompany } from '../api/company'
import { getApplications } from '../api/application'
import { getInterviewsForApplication } from '../api/interview'
import { getAllFollowUps } from '../api/followup'
import InlineStatusChanger from './InlineStatusChanger'
import CompanyLogo from './CompanyLogo'
import { DrawerShell } from './DrawerShell'
import { fmtDate, todayStr } from '../utils/followup'
import { APP_STATUS_CONFIG, appStatusLabel } from '../constants/applicationStatus'

const STATUS_CONFIG = {
  TARGETING:    { label: 'Targeting',    badge: 'bg-white/[0.06] text-white/60'   },
  APPLIED:      { label: 'Applied',      badge: 'bg-app-accent/10 text-app-accent-soft'  },
  INTERVIEWING: { label: 'Interviewing', badge: 'bg-app-warning/10 text-app-warning' },
  OFFER:        { label: 'Offer',        badge: 'bg-app-success/10 text-app-success'  },
  REJECTED:     { label: 'Rejected',     badge: 'bg-app-danger/10 text-app-danger'     },
}

function useLocalRating(companyId) {
  const key = `cf_company_rating_${companyId}`
  const [rating, setRating] = useState(() => Number(localStorage.getItem(key)) || 0)

  useEffect(() => {
    setRating(Number(localStorage.getItem(key)) || 0)
  }, [key])

  const rate = (value) => {
    const next = value === rating ? 0 : value
    localStorage.setItem(key, String(next))
    setRating(next)
  }

  return [rating, rate]
}

function StarRating({ companyId }) {
  const [rating, rate] = useLocalRating(companyId)
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || rating)
        return (
          <button key={n} onClick={() => rate(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            className="text-app-warning transition-transform hover:scale-110" title={`Rate ${n} star${n > 1 ? 's' : ''}`}>
            {filled ? <StarRounded sx={{ fontSize: 18 }} /> : <StarBorderRounded sx={{ fontSize: 18 }} className="text-white/20" />}
          </button>
        )
      })}
      {rating > 0 && <span className="ml-1 text-xs font-semibold text-white/50">{rating.toFixed(1)}</span>}
    </div>
  )
}

const TIMELINE_STAGES = {
  applied:    { icon: PersonOutlineRounded,   tone: 'bg-app-accent' },
  screening:  { icon: VisibilityOutlined,     tone: 'bg-app-success' },
  phone:      { icon: CallOutlined,           tone: 'bg-app-warning' },
  technical:  { icon: DesktopWindowsOutlined, tone: 'bg-app-accent2' },
  onsite:     { icon: WorkOutlineOutlined,    tone: 'bg-white/30' },
  followup:   { icon: NotificationsNoneOutlined, tone: 'bg-app-warning' },
}

function interviewStageKind(iv) {
  const type = (iv.interviewType || '').toUpperCase()
  if (type === 'PHONE_SCREEN' || type === 'VIDEO_CALL') return 'phone'
  if (type === 'TECHNICAL' || type === 'CASE_STUDY') return 'technical'
  if (type === 'ONSITE' || type === 'HR' || type === 'BEHAVIORAL' || type === 'GROUP') return 'onsite'
  return 'phone'
}

function buildTimeline(applications, interviewsByApp, followUps) {
  const now = Date.now()
  const events = []

  for (const app of applications) {
    const dateStamp = app.applicationDate || app.createdAt
    if (dateStamp) {
      events.push({ key: `app-${app.id}`, date: dateStamp, kind: 'applied', label: `Applied — ${app.role}` })
    }
    if (['OA_CLEARED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_CLEARED', 'OFFER_RECEIVED', 'JOINED'].includes(app.status) && dateStamp) {
      events.push({ key: `screen-${app.id}`, date: dateStamp, kind: 'screening', label: `Recruiter viewed — ${app.role}` })
    }
    for (const iv of interviewsByApp[app.id] || []) {
      if (iv.scheduledAt) {
        events.push({
          key: `iv-${iv.id}`, date: iv.scheduledAt, kind: interviewStageKind(iv),
          label: `${iv.round || 'Interview'} — ${app.role}`,
          upcoming: new Date(iv.scheduledAt).getTime() > now,
        })
      }
    }
  }
  for (const fu of followUps) {
    events.push({
      key: `fu-${fu.id}`, date: fu.followUpDate, kind: 'followup',
      label: fu.status === 'DONE' ? `Follow-up completed — ${fu.role}` : `Follow-up due — ${fu.role}`,
      upcoming: fu.status !== 'DONE' && fu.followUpDate >= todayStr(),
    })
  }

  return events
    .filter((e) => e.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)
}

function ActivityTimeline({ events }) {
  if (events.length === 0) return <p className="text-sm text-white/35 text-center py-3">No activity yet.</p>
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-white/[0.06]" />
      <div className="space-y-6">
        {events.map((e) => {
          const cfg = TIMELINE_STAGES[e.kind] || TIMELINE_STAGES.applied
          const Icon = cfg.icon
          return (
            <div key={e.key} className="relative flex items-start gap-3.5">
              <span className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-app-surface ${e.upcoming ? 'bg-white/10' : cfg.tone}`}>
                <Icon sx={{ fontSize: 16 }} className={e.upcoming ? 'text-white/40' : 'text-white'} />
              </span>
              <div className="min-w-0 flex-1 pt-1.5">
                <p className={`text-sm truncate ${e.upcoming ? 'text-white/40' : 'text-white/80 font-medium'}`}>{e.label}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{e.upcoming ? 'Upcoming' : fmtDate(e.date)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MoreActionsMenu({ company }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const items = [
    { key: 'application', label: 'Add Application', icon: WorkOutlineOutlined, to: '/applications' },
    { key: 'referral', label: 'Add Referral', icon: HandshakeOutlined, to: '/referrals' },
    { key: 'followup', label: 'Add Follow-up', icon: NotificationsNoneOutlined, to: '/follow-ups' },
    { key: 'recruiter', label: 'Add Recruiter', icon: PeopleOutlined, to: '/recruiters' },
  ]

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 208
    setPos({ bottom: window.innerHeight - rect.top + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)) })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative flex-1">
      <button ref={triggerRef} onClick={() => setOpen((o) => !o)}
        className="flex w-full h-11 items-center justify-center gap-1.5 text-sm font-semibold text-white/70 bg-white/[0.06] rounded-xl hover:bg-white/[0.10] transition">
        More Actions
        <KeyboardArrowDown sx={{ fontSize: 16 }} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && createPortal(
        <div ref={menuRef} role="menu"
          style={{ position: 'fixed', bottom: pos.bottom, left: pos.left }}
          className="w-52 rounded-xl border border-white/[0.08] bg-app-raised shadow-card-hover py-1.5 z-[100] animate-scale-in origin-bottom-left">
          {items.map(({ key, label, icon: Icon, to }) => (
            <button key={key} role="menuitem"
              onClick={() => { setOpen(false); navigate(to) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors">
              <Icon sx={{ fontSize: 17 }} className="text-white/35" />
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

export default function CompanyDetailModal({ open, companyId, onClose, onStatusChanged, onEdit, onDelete }) {
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [applications, setApplications] = useState([])
  const [interviewsByApp, setInterviewsByApp] = useState({})
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (companyId == null) {
      setError('Company ID not available. Please restart the backend server.')
      return
    }
    setLoading(true)
    setError('')
    setCompany(null)
    setApplications([])
    setInterviewsByApp({})
    setFollowUps([])

    Promise.all([getCompany(companyId), getApplications({ companyId, size: 1000 })])
      .then(async ([co, appsRes]) => {
        setCompany(co)
        const apps = appsRes.data || []
        setApplications(apps)

        const [interviewResults, followUpRes] = await Promise.all([
          Promise.allSettled(apps.map((a) => getInterviewsForApplication(a.id))),
          getAllFollowUps({ size: 1000 }).catch(() => ({ data: [] })),
        ])
        const byApp = {}
        apps.forEach((a, i) => {
          const r = interviewResults[i]
          byApp[a.id] = r.status === 'fulfilled' ? (r.value.data || []) : []
        })
        setInterviewsByApp(byApp)

        const appIds = new Set(apps.map((a) => a.id))
        setFollowUps((followUpRes.data || []).filter((f) => appIds.has(f.applicationId)))
      })
      .catch(() => setError('Failed to load company details.'))
      .finally(() => setLoading(false))
  }, [open, companyId])

  const handleStatusChanged = (updated) => {
    setCompany(updated)
    onStatusChanged?.(updated)
  }

  if (!open) return null

  const nextFollowUp = followUps
    .filter((f) => f.status !== 'DONE')
    .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))[0]

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.applicationDate || b.createdAt || 0) - new Date(a.applicationDate || a.createdAt || 0))
    .slice(0, 3)

  const timelineEvents = company ? buildTimeline(applications, interviewsByApp, followUps) : []

  return (
    <DrawerShell>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
        <h2 className="text-base font-bold text-white">Company Details</h2>
        <button onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition">
          <CloseRounded sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 no-scrollbar">
        {loading && <div className="flex justify-center py-16"><CircularProgress size={24} sx={{ color: '#5B5FEF' }} /></div>}
        {error && <p className="text-sm text-app-danger text-center py-6 px-5">{error}</p>}

        {company && !loading && (
          <div className="px-6 py-6 space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <CompanyLogo name={company.name} website={company.website} className="w-12 h-12" textClassName="text-base"
                  dotClassName="bg-gradient-to-br from-app-accent to-app-accent2" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{company.name}</h3>
                  {company.industry && <p className="text-xs text-white/40 truncate">{company.industry}</p>}
                </div>
              </div>
              <div className="mt-2.5">
                <InlineStatusChanger
                  item={company}
                  statusConfig={STATUS_CONFIG}
                  defaultStatus="TARGETING"
                  updateFn={(id, payload) => updateCompany(id, payload)}
                  onStatusChanged={handleStatusChanged}
                />
              </div>
              <div className="mt-2.5">
                <StarRating companyId={company.id} />
              </div>
            </div>

            {(company.location || company.website) && (
              <div className="space-y-1.5 text-sm">
                {company.location && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Place sx={{ fontSize: 16 }} className="text-app-danger shrink-0" />
                    <span className="truncate">{company.location}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <LanguageOutlined sx={{ fontSize: 15 }} className="text-white/30 shrink-0" />
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank" rel="noreferrer"
                      className="text-app-accent-soft hover:underline truncate text-sm">
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            )}

            {company.description && (
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-1.5">About</p>
                <p className="text-sm text-white/60 leading-relaxed">{company.description}</p>
              </div>
            )}

            {company.notes && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide">Notes</p>
                  {onEdit && (
                    <button onClick={() => onEdit(company)} className="flex items-center gap-1 text-xs font-semibold text-app-accent-soft hover:text-white transition">
                      <EditOutlined sx={{ fontSize: 12 }} />
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-sm text-white/50 italic">"{company.notes}"</p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-3">Activity Timeline</p>
              <ActivityTimeline events={timelineEvents} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide">
                  Applications ({applications.length})
                </p>
                {applications.length > 3 && (
                  <button onClick={() => onEdit?.(company)} className="text-xs font-semibold text-app-accent-soft hover:text-white transition">
                    View all
                  </button>
                )}
              </div>
              {applications.length === 0 ? (
                <p className="text-sm text-white/35 text-center py-3">No applications yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                          <WorkOutlineOutlined sx={{ fontSize: 15 }} className="text-white/40" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white/80 truncate">{app.role}</p>
                          {app.applicationDate && (
                            <p className="text-[11px] text-white/35 mt-0.5">Applied on {fmtDate(app.applicationDate)}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${APP_STATUS_CONFIG[app.status]?.badge || 'bg-white/[0.06] text-white/60'}`}>
                        {appStatusLabel(app.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-2.5">Next Follow-up</p>
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <ScheduleOutlined sx={{ fontSize: 15 }} className="text-white/30 shrink-0" />
                  {nextFollowUp ? (
                    <p className="text-sm text-white/75 truncate">{fmtDate(nextFollowUp.followUpDate)}</p>
                  ) : (
                    <p className="text-sm text-white/35">No pending follow-ups</p>
                  )}
                </div>
                <button onClick={() => navigate('/follow-ups')}
                  className="shrink-0 text-xs font-semibold text-app-accent-soft hover:text-white transition">
                  Add Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {company && !loading && (
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-white/[0.06] shrink-0">
          <MoreActionsMenu company={company} />
          {onDelete && (
            <button onClick={() => onDelete(company)}
              className="flex-1 h-11 text-sm font-semibold text-app-danger bg-app-danger/10 rounded-xl hover:bg-app-danger/20 transition">
              Delete Company
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(company)}
              className="flex-1 h-11 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Edit Company
            </button>
          )}
        </div>
      )}
    </DrawerShell>
  )
}
