import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageSpinner from '../components/PageSpinner'
import {
  BusinessOutlined, WorkOutlined, PeopleOutlined, EmojiEventsOutlined,
  ScheduleOutlined, MicNoneOutlined, NotificationsNoneOutlined,
  ArrowForward, CloseRounded, CheckRounded, InboxOutlined, CelebrationOutlined,
  TrendingUpRounded, TrendingDownRounded, ArrowOutward,
} from '@mui/icons-material'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, YAxis,
  BarChart, Bar, Cell,
} from 'recharts'
import Layout from '../components/Layout'
import DashboardTopBar from '../components/DashboardTopBar'
import CompanyLogo from '../components/CompanyLogo'
import StatusBadge from '../components/StatusBadge'
import { todayStr, daysDiff } from '../utils/followup'
import { useProfile } from '../context/ProfileContext'
import { getCompanies, getCompanyStats } from '../api/company'
import { getApplications, getApplicationStats, getWeeklyTrend, getUpcomingDeadlines } from '../api/application'
import { getRecruiters, getRecruiterStats } from '../api/recruiter'
import { getUpcomingFollowUps } from '../api/followup'

const STATUS_CFG = {
  SAVED:               { label: 'Saved',               tone: 'muted',   hex: '#8B8FA3' },
  APPLIED:             { label: 'Applied',              tone: 'neutral', hex: '#8B8FA3' },
  OA_SCHEDULED:        { label: 'OA Scheduled',         tone: 'warning', hex: '#F59E0B' },
  OA_CLEARED:          { label: 'OA Cleared',           tone: 'accent',  hex: '#22D3EE' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled',  tone: 'accent',  hex: '#8184F5' },
  INTERVIEW_CLEARED:   { label: 'Interview Cleared',    tone: 'accent',  hex: '#A78BFA' },
  OFFER_RECEIVED:      { label: 'Offer Received',       tone: 'success', hex: '#22C55E' },
  REJECTED:            { label: 'Rejected',             tone: 'danger',  hex: '#F43F5E' },
  JOINED:              { label: 'Joined',               tone: 'success', hex: '#22C55E' },
}

const TONE_CLS = {
  accent:  'bg-app-accent/10 text-app-accent-soft',
  success: 'bg-app-success/10 text-app-success',
  warning: 'bg-app-warning/10 text-app-warning',
  danger:  'bg-app-danger/10 text-app-danger',
  neutral: 'bg-white/[0.06] text-white/60',
  muted:   'bg-white/[0.04] text-white/35',
}
const TONE_DOT = {
  accent: 'bg-app-accent', success: 'bg-app-success', warning: 'bg-app-warning',
  danger: 'bg-app-danger', neutral: 'bg-white/50', muted: 'bg-white/25',
}

function StatusPill({ tone = 'neutral', children }) {
  return <StatusBadge badge={TONE_CLS[tone]} dot={TONE_DOT[tone]} label={children} />
}

function Surface({ className = '', children, interactive = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card transition-all duration-300 ${
        interactive ? 'hover:-translate-y-[1px] hover:border-white/[0.07] hover:shadow-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

function WeeklyTrendChart({ dailyTrend }) {
  const data = useMemo(() => {
    // dailyTrend covers the last 14 days; show only the most recent 7 for the chart.
    const last7 = dailyTrend.slice(-7)
    return last7.map((d) => {
      const date = new Date(`${d.date}T00:00:00`)
      return { key: d.date, label: date.toLocaleDateString('en-US', { weekday: 'short' }), count: d.count }
    })
  }, [dailyTrend])

  const thisWeek = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="h-[168px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8184F5" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8184F5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, (max) => Math.max(max, 3)]} />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.10)' }}
            contentStyle={{ background: '#0E0F18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}
            itemStyle={{ color: '#fff' }}
            formatter={(v) => [v, 'Applications']}
          />
          <Area type="monotone" dataKey="count" stroke="#8184F5" strokeWidth={2.5} fill="url(#trendFill)" dot={false}
            isAnimationActive animationDuration={700} animationEasing="ease-out"
            activeDot={{ r: 4, fill: '#8184F5', stroke: '#0B0C14', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[11px] text-white/30">{thisWeek} application{thisWeek !== 1 ? 's' : ''} logged this week</p>
    </div>
  )
}

function StatusDonut({ statusCounts, total, size = 128, strokeWidth = 16 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2
  const segments = Object.entries(STATUS_CFG)
    .map(([key, cfg]) => ({ key, count: statusCounts[key] || 0, ...cfg }))
    .filter((s) => s.count > 0)

  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        {segments.map((s) => {
          const len = (s.count / total) * circ
          const el = (
            <circle key={s.key} cx={cx} cy={cy} r={r} fill="none" stroke={s.hex} strokeWidth={strokeWidth}
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} strokeLinecap="butt" />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-semibold leading-none text-white tabular-nums">{total}</span>
        <span className="mt-1 text-[10px] text-white/35">total</span>
      </div>
    </div>
  )
}

function KpiWidget({ icon, label, value, trend, trendLabel, tint, sparkline, onClick }) {
  const positive = trend >= 0
  return (
    <button onClick={onClick} className="h-full w-full text-left">
      <Surface interactive className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner-highlight"
            style={{ background: `linear-gradient(160deg, ${tint}26, ${tint}0D)`, color: tint }}
          >
            {icon}
          </div>
          {trend !== null && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold ${
                positive ? 'bg-app-success/10 text-app-success' : 'bg-app-danger/10 text-app-danger'
              }`}
            >
              {positive ? <TrendingUpRounded sx={{ fontSize: 13 }} /> : <TrendingDownRounded sx={{ fontSize: 13 }} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>

        <div className="flex-1">
          <p className="font-display mt-5 text-[1.85rem] font-bold leading-none tracking-tight text-white tabular-nums">{value}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-white/45">{label}</p>
            {trendLabel && <p className="text-[11px] text-white/25">{trendLabel}</p>}
          </div>
        </div>

        {sparkline && (
          <div className="-mx-1 mt-3.5 h-7">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparkline} barCategoryGap="35%">
                <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={600}>
                  {sparkline.map((_, i) => (
                    <Cell key={i} fill={tint} fillOpacity={0.18 + (i / sparkline.length) * 0.42} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Surface>
    </button>
  )
}

function ProfileWidget({ checklist, percentage, onNavigate }) {
  const remaining = checklist.filter((c) => !c.done)
  const complete = percentage === 100
  const r = 42, circ = 2 * Math.PI * r
  return (
    <Surface className="p-5">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          <div className="absolute inset-2 rounded-full bg-app-accent/[0.10] blur-xl" />
          <svg width={96} height={96} className="relative -rotate-90">
            <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle cx={48} cy={48} r={r} fill="none" stroke="url(#profileGrad)" strokeWidth={8}
              strokeDasharray={`${(percentage / 100) * circ} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
            <defs>
              <linearGradient id="profileGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8184F5" /><stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-bold leading-none text-white tabular-nums">{percentage}%</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white/85">Profile strength</p>
            {complete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-app-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-app-success">
                <CheckRounded sx={{ fontSize: 11 }} /> Complete
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/40">
            {complete ? 'Everything looks great.' : `${remaining.length} step${remaining.length !== 1 ? 's' : ''} left`}
          </p>
        </div>
      </div>

      {remaining.length > 0 && (
        <div className="mt-4 space-y-1 border-t border-white/[0.05] pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/25">Next up</p>
          {remaining.slice(0, 3).map((c) => (
            <button key={c.text} onClick={onNavigate} className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-white/[0.03]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-app-accent-soft" />
              <span className="truncate text-xs text-white/50 transition-colors group-hover:text-white/80">{c.text}</span>
              <ArrowOutward sx={{ fontSize: 12 }} className="ml-auto shrink-0 text-white/15 transition-colors group-hover:text-white/45" />
            </button>
          ))}
        </div>
      )}
    </Surface>
  )
}

// ─── List-style widget shell ───────────────────────────────────────────────────
function ListWidget({ title, onViewAll, empty, emptyIcon, children }) {
  return (
    <Surface className="p-5">
      <div className="relative mb-4 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{title}</h2>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-medium text-white/40 transition-colors hover:text-white/75">
            View all
          </button>
        )}
      </div>
      {empty ? (
        <div className="relative py-6 text-center">
          <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/30">
            {emptyIcon}
          </div>
          <p className="text-xs text-white/35">{empty}</p>
        </div>
      ) : (
        <div className="relative space-y-3.5">{children}</div>
      )}
    </Surface>
  )
}

function ChecklistItem({ done, text, index }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-success/15 text-app-success">
          <CheckRounded sx={{ fontSize: 13 }} />
        </div>
      ) : (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15">
          <span className="text-[9px] font-medium text-white/30">{index + 1}</span>
        </div>
      )}
      <span className={`text-sm ${done ? 'text-white/30 line-through' : 'text-white/70'}`}>{text}</span>
    </div>
  )
}

export default function Dashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const [companies,    setCompanies]    = useState([])
  const [applications, setApplications] = useState([])
  const [recruiters,   setRecruiters]   = useState([])
  const [upcomingFollowUps, setUpcomingFollowUpsState] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [dailyTrend,   setDailyTrend]   = useState([])
  const [companyStats,     setCompanyStats]     = useState(null)
  const [applicationStats, setApplicationStats] = useState(null)
  const [recruiterStats,   setRecruiterStats]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [summaryDismissed, setSummaryDismissed] = useState(
    () => localStorage.getItem('cf_summary_dismissed') === todayStr()
  )
  const navigate = useNavigate()

  useEffect(() => {
    Promise.allSettled([
      getCompanies({ size: 1000 }), getApplications({ size: 1000 }), getRecruiters({ size: 1000 }),
      getUpcomingFollowUps(7), getUpcomingDeadlines(7), getWeeklyTrend(14),
      getCompanyStats(), getApplicationStats(), getRecruiterStats(),
    ]).then(([c, a, r, f, d, wt, cs, as, rs]) => {
      if (c.status === 'fulfilled') setCompanies(c.value.data  || [])
      if (a.status === 'fulfilled') setApplications(a.value.data || [])
      if (r.status === 'fulfilled') setRecruiters(r.value.data  || [])
      if (f.status === 'fulfilled') setUpcomingFollowUpsState(f.value.data || [])
      if (d.status === 'fulfilled') setUpcomingDeadlines(d.value.data || [])
      if (wt.status === 'fulfilled') setDailyTrend(wt.value.data || [])
      if (cs.status === 'fulfilled') setCompanyStats(cs.value.data)
      if (as.status === 'fulfilled') setApplicationStats(as.value.data)
      if (rs.status === 'fulfilled') setRecruiterStats(rs.value.data)
      setLoading(false)
    })
  }, [])

  const name = profile?.firstName ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}` : 'there'

  const checklist = [
    { done: !!profile,                              text: 'Create your profile' },
    { done: !!profile?.bio,                         text: 'Add a bio' },
    { done: (profile?.education?.length  || 0) > 0, text: 'Add education details' },
    { done: (profile?.experience?.length || 0) > 0, text: 'Add work experience' },
    { done: (profile?.projects?.length   || 0) > 0, text: 'Showcase a project' },
    { done: !!profile?.resume,                      text: 'Upload your resume' },
    { done: !!profile?.linkedinUrl,                 text: 'Add LinkedIn URL' },
  ]
  const doneCount  = checklist.filter((c) => c.done).length
  const percentage = Math.round((doneCount / checklist.length) * 100)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const today = todayStr()
  const overdueFollowUps  = upcomingFollowUps.filter((f) => f.followUpDate < today)
  const todayFollowUps    = upcomingFollowUps.filter((f) => f.followUpDate === today)
  const laterFollowUps    = upcomingFollowUps.filter((f) => f.followUpDate > today)
  const followUpList = [...overdueFollowUps, ...todayFollowUps, ...laterFollowUps].slice(0, 5)

  const deadlineList = upcomingDeadlines
    .map((a) => ({ ...a, daysLeft: daysDiff(today, a.deadline) }))
    .slice(0, 5)

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const interviewFollowUpIds = new Set(
    upcomingFollowUps.filter((f) => f.followUpDate === today || f.followUpDate === tomorrow).map((f) => f.applicationId)
  )
  const interviewReminders = applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED' && interviewFollowUpIds.has(a.id))

  const fmtFollowUpDate = (d) => {
    if (d === today) return 'Today'
    if (d < today) return `${daysDiff(d, today)}d overdue`
    return `in ${daysDiff(today, d)}d`
  }

  const dismissSummary = () => {
    localStorage.setItem('cf_summary_dismissed', today)
    setSummaryDismissed(true)
  }

  const offerCount = applicationStats?.byStatus?.OFFER_RECEIVED ?? applications.filter((a) => a.status === 'OFFER_RECEIVED').length
  const summaryItems = [
    overdueFollowUps.length  > 0 && { Icon: ScheduleOutlined, text: `${overdueFollowUps.length} overdue follow-up${overdueFollowUps.length !== 1 ? 's' : ''}` },
    todayFollowUps.length    > 0 && { Icon: NotificationsNoneOutlined, text: `${todayFollowUps.length} follow-up${todayFollowUps.length !== 1 ? 's' : ''} due today` },
    interviewReminders.length > 0 && { Icon: MicNoneOutlined, text: `${interviewReminders.length} interview${interviewReminders.length !== 1 ? 's' : ''} today or tomorrow` },
    offerCount > 0 && { Icon: CelebrationOutlined, text: `${offerCount} offer${offerCount !== 1 ? 's' : ''} received` },
  ].filter(Boolean)

  const recent = [...applications]
    .sort((a, b) => new Date(b.appliedDate || b.createdAt || 0) - new Date(a.appliedDate || a.createdAt || 0))
    .slice(0, 6)

  const companyById = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c])),
    [companies]
  )

  const statusCounts = applicationStats?.byStatus
    ?? applications.reduce((acc, app) => { acc[app.status] = (acc[app.status] || 0) + 1; return acc }, {})

  const totalCompanies    = companyStats?.total    ?? companies.length
  const totalApplications = applicationStats?.total ?? applications.length
  const totalRecruiters   = recruiterStats?.total   ?? recruiters.length

  const weekTrend = useMemo(() => {
    const last7 = dailyTrend.slice(-7)
    const prev7 = dailyTrend.slice(-14, -7)
    const thisWeek = last7.reduce((s, d) => s + d.count, 0)
    const lastWeek = prev7.reduce((s, d) => s + d.count, 0)
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
  }, [dailyTrend])

  const sparkline14 = useMemo(
    () => dailyTrend.map((d) => ({ v: d.count })),
    [dailyTrend]
  )

  if (loading || profileLoading) return (
    <Layout>
      <PageSpinner py="py-24" size={28} />
    </Layout>
  )

  return (
    <Layout headerAction={<DashboardTopBar profile={profile} pendingFollowUpCount={overdueFollowUps.length + todayFollowUps.length} />}>
      {!summaryDismissed && summaryItems.length > 0 && (
        <Surface className="mb-4 px-5 py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">
                Today · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {summaryItems.map(({ Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-sm text-white/70">
                    <Icon sx={{ fontSize: 15 }} className="text-white/35" />{text}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={dismissSummary} className="shrink-0 text-white/25 transition-colors hover:text-white/60" title="Dismiss for today">
              <CloseRounded sx={{ fontSize: 17 }} />
            </button>
          </div>
        </Surface>
      )}

      <Surface className="mb-4 p-7 sm:p-9">
        <p className="mb-2 text-sm text-white/40">{greeting}</p>
        <h1 className="font-display mb-3 break-words text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-[2.25rem]">
          Welcome back, {name}
        </h1>
        <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-white/45">
          {totalApplications === 0
            ? 'Start tracking your job search — add a company and log your first application.'
            : <>You're tracking <span className="font-medium text-white/85">{totalApplications} application{totalApplications !== 1 ? 's' : ''}</span> across <span className="font-medium text-white/85">{totalCompanies} {totalCompanies !== 1 ? 'companies' : 'company'}</span>{offerCount > 0 && <> with <span className="font-medium text-app-success">{offerCount} offer{offerCount !== 1 ? 's' : ''}</span></>}.</>}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/applications')}
            className="group inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-app-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow shadow-app-accent/50 transition-all hover:brightness-110">
            View Applications
            <ArrowForward sx={{ fontSize: 15 }} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => navigate('/companies')}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white">
            Add Company
          </button>
        </div>
      </Surface>

      {/* ── KPI row ── */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiWidget
          icon={<BusinessOutlined sx={{ fontSize: 18 }} />} label="Companies" value={totalCompanies}
          trend={null} tint="#8184F5"
          onClick={() => navigate('/companies')} />
        <KpiWidget
          icon={<WorkOutlined sx={{ fontSize: 18 }} />} label="Applications" value={totalApplications}
          trend={weekTrend} trendLabel="vs last week" tint="#8184F5"
          sparkline={sparkline14}
          onClick={() => navigate('/applications')} />
        <KpiWidget
          icon={<PeopleOutlined sx={{ fontSize: 18 }} />} label="Recruiters" value={totalRecruiters}
          trend={null} tint="#8184F5"
          onClick={() => navigate('/recruiters')} />
        <KpiWidget
          icon={<EmojiEventsOutlined sx={{ fontSize: 18 }} />} label="Offers" value={statusCounts['OFFER_RECEIVED'] || 0}
          trend={null} tint="#22C55E"
          onClick={() => navigate('/applications')} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Surface className="flex items-center justify-center p-5 lg:col-span-1">
          <h2 className="sr-only">Application Overview</h2>
          {totalApplications === 0 ? (
            <p className="relative py-6 text-center text-xs text-white/35">No applications tracked yet.</p>
          ) : (
            <div className="relative flex w-full flex-wrap items-center gap-6">
              <StatusDonut statusCounts={statusCounts} total={totalApplications} />
              <div className="grid min-w-[8rem] flex-1 grid-cols-1 gap-1.5">
                {Object.entries(STATUS_CFG).filter(([k]) => statusCounts[k]).map(([k, cfg]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cfg.hex }} />
                    <span className="truncate text-xs text-white/55">{cfg.label}</span>
                    <span className="ml-auto text-xs font-medium text-white/80 tabular-nums">{statusCounts[k]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Surface>

        <Surface className="p-5 lg:col-span-1">
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">Activity Trend</h2>
          <WeeklyTrendChart dailyTrend={dailyTrend} />
        </Surface>

        <div className="lg:col-span-1">
          <ProfileWidget checklist={checklist} percentage={percentage} onNavigate={() => navigate('/profile')} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ListWidget title="Upcoming Deadlines" onViewAll={() => navigate('/applications')}
          empty={deadlineList.length === 0 ? 'No upcoming deadlines.' : null}
          emptyIcon={<ScheduleOutlined sx={{ fontSize: 17 }} />}>
          {deadlineList.map((a) => {
            const urgent = a.daysLeft <= 1
            const soon = a.daysLeft <= 3
            const chipCls = urgent ? 'bg-app-danger/10 text-app-danger' : soon ? 'bg-app-warning/10 text-app-warning' : 'bg-white/[0.05] text-white/40'
            return (
              <div key={a.id} className="group flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-white/[0.025]">
                <CompanyLogo name={a.companyName} website={companyById[a.companyId]?.website} dotColor={urgent ? '#F43F5E' : '#8184F5'} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/75">{a.role}</p>
                  <p className="truncate text-xs text-white/35">{a.companyName}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums ${chipCls}`}>
                  {a.daysLeft === 0 ? 'Today' : `${a.daysLeft}d`}
                </span>
              </div>
            )
          })}
        </ListWidget>

        <ListWidget title="Recent Follow-Ups" onViewAll={() => navigate('/follow-ups')}
          empty={followUpList.length === 0 ? 'No pending follow-ups.' : null}
          emptyIcon={<NotificationsNoneOutlined sx={{ fontSize: 17 }} />}>
          {followUpList.map((f) => {
            const isOverdue = f.followUpDate < today
            const isToday   = f.followUpDate === today
            const chipCls = isOverdue ? 'bg-app-danger/10 text-app-danger' : isToday ? 'bg-app-warning/10 text-app-warning' : 'bg-white/[0.05] text-white/40'
            return (
              <div key={f.id} className="group flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-white/[0.025]">
                <CompanyLogo name={f.companyName} website={companyById[f.companyId]?.website} dotColor={isOverdue ? '#F43F5E' : '#8184F5'} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/75">{f.role}</p>
                  <p className="truncate text-xs text-white/35">{f.companyName}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${chipCls}`}>
                  {fmtFollowUpDate(f.followUpDate)}
                </span>
              </div>
            )
          })}
        </ListWidget>

        <ListWidget title="Recent Applications" onViewAll={() => navigate('/applications')}
          empty={recent.length === 0 ? 'No applications yet.' : null}
          emptyIcon={<InboxOutlined sx={{ fontSize: 17 }} />}>
          {recent.slice(0, 5).map((app) => {
            const cfg = STATUS_CFG[app.status] || { label: app.status, tone: 'neutral' }
            return (
              <div key={app.id} onClick={() => navigate('/applications')}
                className="group flex cursor-pointer items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-white/[0.025]">
                <CompanyLogo name={app.companyName} website={companyById[app.companyId]?.website} dotColor="#8184F5" className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/75">{app.role}</p>
                  <p className="truncate text-xs text-white/35">{app.companyName}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
                </div>
              </div>
            )
          })}
        </ListWidget>
      </div>

      <Surface className="relative mt-4 overflow-hidden bg-gradient-to-br from-[#2A1F5C] via-[#241850] to-[#1A1240] px-7 py-6 sm:px-9">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{
          backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, white, transparent), radial-gradient(1.5px 1.5px at 60% 65%, white, transparent), radial-gradient(1px 1px at 80% 20%, white, transparent), radial-gradient(1px 1px at 40% 80%, white, transparent), radial-gradient(1.5px 1.5px at 90% 55%, white, transparent)',
          backgroundSize: '200px 200px',
        }} />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <p className="font-display text-lg font-semibold text-white">Stay organized. Get hired.</p>
            <p className="mt-1 text-sm text-white/50">Track, follow up, and land your dream job.</p>
          </div>
          <svg viewBox="0 0 64 64" className="hidden h-14 w-14 shrink-0 sm:block" style={{ filter: 'drop-shadow(0 0 14px rgba(139,92,246,0.55))' }}>
            <defs>
              <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
            </defs>
            <path d="M32 4c7 6 11 16 11 27 0 5-1 9-2 12l-9 5-9-5c-1-3-2-7-2-12 0-11 4-21 11-27Z" fill="url(#rocketBody)" />
            <circle cx="32" cy="26" r="5" fill="#1A1240" opacity="0.6" />
            <path d="M21 33c-4 1-7 5-8 12 5-1 9-3 11-7Z" fill="#6D28D9" />
            <path d="M43 33c4 1 7 5 8 12-5-1-9-3-11-7Z" fill="#6D28D9" />
            <path d="M27 48h10l-3 8a2 2 0 0 1-4 0Z" fill="#F59E0B" />
          </svg>
        </div>
      </Surface>
    </Layout>
  )
}
