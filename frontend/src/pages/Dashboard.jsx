import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ScheduleOutlined, MicNoneOutlined, NotificationsNoneOutlined,
  CloseRounded, CelebrationOutlined,
  BusinessOutlined, WorkOutlined, PeopleOutlined, EmojiEventsOutlined,
} from '@mui/icons-material'
import Skeleton, { SkeletonCard } from '../components/Skeleton'
import Layout from '../components/Layout'
import DashboardTopBar from '../components/DashboardTopBar'
import { Surface } from '../components/dashboard/primitives'
import HeroPanel from '../components/dashboard/HeroPanel'
import AsymmetricKpiGrid from '../components/dashboard/AsymmetricKpiGrid'
import GlassChartPanel from '../components/dashboard/GlassChartPanel'
import ApplicationTimeline from '../components/dashboard/ApplicationTimeline'
import RecentActivityRail from '../components/dashboard/RecentActivityRail'
import AIInsightsPanel from '../components/dashboard/AIInsightsPanel'
import ProfileOrb from '../components/dashboard/ProfileOrb'
import InterviewTimeline from '../components/dashboard/InterviewTimeline'
import DeadlineHeatmap from '../components/dashboard/DeadlineHeatmap'
import { todayStr, daysDiff } from '../utils/followup'
import {
  computeStreak, computeCurrentFocus, computeInsights, buildHeatmapCells,
} from '../utils/dashboardInsights'
import { useProfile } from '../context/ProfileContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { getCompanies, getCompanyStats } from '../api/company'
import { getApplications, getApplicationStats, getWeeklyTrend, getUpcomingDeadlines } from '../api/application'
import { getRecruiters, getRecruiterStats } from '../api/recruiter'
import { getUpcomingFollowUps } from '../api/followup'

const STATUS_CFG = {
  SAVED:               { label: 'Saved' },
  APPLIED:             { label: 'Applied' },
  OA_SCHEDULED:        { label: 'OA Scheduled' },
  OA_CLEARED:          { label: 'OA Cleared' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled' },
  INTERVIEW_CLEARED:   { label: 'Interview Cleared' },
  OFFER_RECEIVED:      { label: 'Offer Received' },
  REJECTED:            { label: 'Rejected' },
  JOINED:              { label: 'Joined' },
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
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace()

  useEffect(() => {
    if (workspaceLoading || !activeWorkspaceId) return
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
  }, [activeWorkspaceId, workspaceLoading])

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

  const deadlineList = upcomingDeadlines
    .map((a) => ({ ...a, daysLeft: daysDiff(today, a.deadline) }))
    .slice(0, 5)

  const tomorrowDate = new Date(today)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = tomorrowDate.toISOString().slice(0, 10)
  const followUpByAppId = useMemo(
    () => Object.fromEntries(upcomingFollowUps.map((f) => [f.applicationId, f.followUpDate])),
    [upcomingFollowUps]
  )
  const interviewFollowUpIds = new Set(
    upcomingFollowUps.filter((f) => f.followUpDate === today || f.followUpDate === tomorrow).map((f) => f.applicationId)
  )
  const upcomingInterviews = applications
    .filter((a) => a.status === 'INTERVIEW_SCHEDULED' && interviewFollowUpIds.has(a.id))
    .map((a) => ({ ...a, followUpDate: followUpByAppId[a.id] }))
    .slice(0, 5)

  const dismissSummary = () => {
    localStorage.setItem('cf_summary_dismissed', today)
    setSummaryDismissed(true)
  }

  const offerCount = applicationStats?.byStatus?.OFFER_RECEIVED ?? applications.filter((a) => a.status === 'OFFER_RECEIVED').length
  const summaryItems = [
    overdueFollowUps.length  > 0 && { Icon: ScheduleOutlined, text: `${overdueFollowUps.length} overdue follow-up${overdueFollowUps.length !== 1 ? 's' : ''}` },
    todayFollowUps.length    > 0 && { Icon: NotificationsNoneOutlined, text: `${todayFollowUps.length} follow-up${todayFollowUps.length !== 1 ? 's' : ''} due today` },
    upcomingInterviews.length > 0 && { Icon: MicNoneOutlined, text: `${upcomingInterviews.length} interview${upcomingInterviews.length !== 1 ? 's' : ''} today or tomorrow` },
    offerCount > 0 && { Icon: CelebrationOutlined, text: `${offerCount} offer${offerCount !== 1 ? 's' : ''} received` },
  ].filter(Boolean)

  const recentTimeline = [...applications]
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

  const streak = useMemo(() => computeStreak(dailyTrend), [dailyTrend])
  const currentFocus = useMemo(() => computeCurrentFocus(statusCounts), [statusCounts])
  const insights = useMemo(
    () => computeInsights({ statusCounts, totalApplications, weekTrend, offerCount, dailyTrend }),
    [statusCounts, totalApplications, weekTrend, offerCount, dailyTrend]
  )
  const heatmapCells = useMemo(() => buildHeatmapCells(dailyTrend, 14), [dailyTrend])

  if (loading || profileLoading) return (
    <Layout>
      <Skeleton className="mb-4 h-56 w-full" rounded="rounded-hud" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-32" />)}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} className="h-40" />)}
      </div>
    </Layout>
  )

  const kpis = [
    { icon: <BusinessOutlined sx={{ fontSize: 18 }} />, label: 'Companies', value: totalCompanies, trend: null, tint: '#8184F5', onClick: () => navigate('/companies') },
    { icon: <WorkOutlined sx={{ fontSize: 18 }} />, label: 'Applications', value: totalApplications, trend: weekTrend, trendLabel: 'vs last week', tint: '#22D3EE', sparkline: sparkline14, onClick: () => navigate('/applications') },
    { icon: <PeopleOutlined sx={{ fontSize: 18 }} />, label: 'Recruiters', value: totalRecruiters, trend: null, tint: '#A855F7', onClick: () => navigate('/recruiters') },
    { icon: <EmojiEventsOutlined sx={{ fontSize: 18 }} />, label: 'Offers', value: statusCounts['OFFER_RECEIVED'] || 0, trend: null, tint: '#10B981', onClick: () => navigate('/applications') },
  ]

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

      <HeroPanel
        name={name} greeting={greeting}
        totalApplications={totalApplications} totalCompanies={totalCompanies} offerCount={offerCount}
        streak={streak} currentFocus={currentFocus} percentage={percentage}
        onViewApplications={() => navigate('/applications')}
        onAddCompany={() => navigate('/companies')}
      />

      <AsymmetricKpiGrid kpis={kpis} />

      <div className="mb-5">
        <GlassChartPanel statusCfg={STATUS_CFG} statusCounts={statusCounts} totalApplications={totalApplications} dailyTrend={dailyTrend} />
      </div>

      <AIInsightsPanel insights={insights} />

      <RecentActivityRail items={recentTimeline} companyById={companyById} onSelect={() => navigate('/applications')} />

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ApplicationTimeline applications={recentTimeline} companyById={companyById} onViewAll={() => navigate('/applications')} onSelect={() => navigate('/applications')} />
        </div>
        <ProfileOrb checklist={checklist} percentage={percentage} onNavigate={() => navigate('/profile')} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <InterviewTimeline interviews={upcomingInterviews} companyById={companyById} onViewAll={() => navigate('/follow-ups')} />
        <DeadlineHeatmap heatmapCells={heatmapCells} deadlines={deadlineList} companyById={companyById} onViewAll={() => navigate('/applications')} />
      </div>

      <Surface className="relative overflow-hidden bg-gradient-to-br from-[#2A1F5C] via-[#241850] to-[#1A1240] px-7 py-6 shadow-edge-glow shadow-app-accent2/25 sm:px-9">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{
          backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, white, transparent), radial-gradient(1.5px 1.5px at 60% 65%, white, transparent), radial-gradient(1px 1px at 80% 20%, white, transparent), radial-gradient(1px 1px at 40% 80%, white, transparent), radial-gradient(1.5px 1.5px at 90% 55%, white, transparent)',
          backgroundSize: '200px 200px',
        }} />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <p className="font-display text-lg font-semibold text-app-text-bright">Stay organized. Get hired.</p>
            <p className="mt-1 text-sm text-app-text-muted">Track, follow up, and land your dream job.</p>
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
