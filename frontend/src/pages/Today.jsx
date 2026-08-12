import { useEffect, useState, useCallback } from 'react'
import {
  WarningAmberRounded, TodayRounded, EventAvailableOutlined, WorkOutlined,
  HandshakeOutlined, EventBusyRounded, CheckCircleOutlineRounded, SnoozeRounded,
  CloseRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import EmptyState from '../components/EmptyState'
import { useWorkspace } from '../context/WorkspaceContext'
import { getTodayView } from '../api/today'
import { completeActionItem, snoozeActionItem } from '../api/actionItem'
import { dismissStaleApplication, markStaleNoResponse } from '../api/application'
import { fmt, fmtDate } from '../utils/followup'
import useTransientMessage from '../hooks/useTransientMessage'

function SectionHeader({ icon, title, count, tint }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ background: `${tint}1A`, color: tint }}>
        {icon}
      </span>
      <h2 className="text-[15px] font-bold text-white">{title}</h2>
      <span className="text-xs font-semibold text-white/35">{count}</span>
    </div>
  )
}

function ActionRow({ item, onComplete, onSnooze }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-app-surface hover:border-white/[0.1] transition">
      <button onClick={() => onComplete(item)} title="Mark complete"
        className="shrink-0 text-white/25 hover:text-app-success transition">
        <CheckCircleOutlineRounded sx={{ fontSize: 20 }} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/85 truncate">{item.title}</p>
        <p className="text-xs text-white/35 mt-0.5">{item.dueDate ? fmtDate(item.dueDate) : 'No due date'}</p>
      </div>
      <button onClick={() => onSnooze(item)} title="Snooze"
        className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition">
        <SnoozeRounded sx={{ fontSize: 17 }} />
      </button>
    </div>
  )
}

function InterviewRow({ item }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-app-surface">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-warning/10 text-app-warning shrink-0">
        <EventAvailableOutlined sx={{ fontSize: 18 }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/85 truncate">{item.round || 'Interview'} — {item.role}</p>
        <p className="text-xs text-white/35 mt-0.5">{item.companyName} · {fmt(item.scheduledAt)}</p>
      </div>
    </div>
  )
}

function StaleAppRow({ app, onDismiss, onNoResponse }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-app-surface">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-danger/10 text-app-danger shrink-0">
        <WorkOutlined sx={{ fontSize: 18 }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/85 truncate">{app.role} at {app.companyName}</p>
        <p className="text-xs text-white/35 mt-0.5">No update in {app.daysSinceUpdate} days</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => onNoResponse(app)} title="Mark no response"
          className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition">
          No Response
        </button>
        <button onClick={() => onDismiss(app)} title="Dismiss"
          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition">
          <CloseRounded sx={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  )
}

function ReferralRow({ item }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-app-surface">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-accent2/10 text-app-accent-soft shrink-0">
        <HandshakeOutlined sx={{ fontSize: 18 }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/85 truncate">{item.targetRole} via {item.contactName}</p>
        <p className={`text-xs mt-0.5 ${item.overdue ? 'text-app-danger font-semibold' : 'text-white/35'}`}>
          {item.followUpDate ? `Follow up ${fmtDate(item.followUpDate)}${item.overdue ? ' — overdue' : ''}` : item.status}
        </p>
      </div>
    </div>
  )
}

function DeadlineRow({ item }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-app-surface">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-accent/10 text-app-accent-soft shrink-0">
        <EventBusyRounded sx={{ fontSize: 18 }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/85 truncate">{item.title}</p>
        <p className="text-xs text-white/35 mt-0.5">{fmt(item.dueAt)}</p>
      </div>
    </div>
  )
}

export default function Today() {
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useTransientMessage()

  const load = useCallback(() => {
    if (workspaceLoading || !activeWorkspaceId) return
    setLoading(true)
    getTodayView()
      .then((res) => { setData(res.data); setError('') })
      .catch(() => setError('Failed to load your Today view.'))
      .finally(() => setLoading(false))
  }, [activeWorkspaceId, workspaceLoading])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dep change is the intended effect
    load()
  }, [load])

  const handleComplete = async (item) => {
    await completeActionItem(item.id)
    setSuccess('Action completed.')
    load()
  }

  const handleSnooze = async (item) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    await snoozeActionItem(item.id, tomorrow)
    setSuccess('Snoozed until tomorrow.')
    load()
  }

  const handleDismissStale = async (app) => {
    await dismissStaleApplication(app.id)
    setSuccess('Dismissed.')
    load()
  }

  const handleNoResponse = async (app) => {
    await markStaleNoResponse(app.id)
    setSuccess('Marked as no response.')
    load()
  }

  if (loading) return <Layout><PageSpinner /></Layout>

  const isEmpty = data && data.totalCount === 0
    && data.staleApplications.length === 0 && data.pendingReferrals.length === 0 && data.approachingDeadlines.length === 0

  return (
    <Layout>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      {isEmpty ? (
        <EmptyState
          icon="🎉"
          title="You're all caught up"
          description="No overdue actions, no interviews this week, nothing stale. Enjoy the calm — or go find your next opportunity."
        />
      ) : data && (
        <div className="max-w-2xl space-y-8">
          <div>
            <SectionHeader icon={<WarningAmberRounded sx={{ fontSize: 16 }} />} title="Overdue" count={data.overdueActions.length} tint="#F43F5E" />
            <div className="space-y-2">
              {data.overdueActions.map((item) => (
                <ActionRow key={item.id} item={item} onComplete={handleComplete} onSnooze={handleSnooze} />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader icon={<TodayRounded sx={{ fontSize: 16 }} />} title="Due Today" count={data.actionsDueToday.length} tint="#5B5FEF" />
            <div className="space-y-2">
              {data.actionsDueToday.map((item) => (
                <ActionRow key={item.id} item={item} onComplete={handleComplete} onSnooze={handleSnooze} />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader icon={<EventAvailableOutlined sx={{ fontSize: 16 }} />} title="Interviews This Week" count={data.interviewsThisWeek.length} tint="#F59E0B" />
            <div className="space-y-2">
              {data.interviewsThisWeek.map((item) => <InterviewRow key={item.id} item={item} />)}
            </div>
          </div>

          <div>
            <SectionHeader icon={<WorkOutlined sx={{ fontSize: 16 }} />} title="Stale Applications" count={data.staleApplications.length} tint="#F43F5E" />
            <div className="space-y-2">
              {data.staleApplications.map((app) => (
                <StaleAppRow key={app.id} app={app} onDismiss={handleDismissStale} onNoResponse={handleNoResponse} />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader icon={<HandshakeOutlined sx={{ fontSize: 16 }} />} title="Pending Referrals" count={data.pendingReferrals.length} tint="#8B5CF6" />
            <div className="space-y-2">
              {data.pendingReferrals.map((item) => <ReferralRow key={item.id} item={item} />)}
            </div>
          </div>

          <div>
            <SectionHeader icon={<EventBusyRounded sx={{ fontSize: 16 }} />} title="Approaching Deadlines" count={data.approachingDeadlines.length} tint="#5B5FEF" />
            <div className="space-y-2">
              {data.approachingDeadlines.map((item) => <DeadlineRow key={item.id} item={item} />)}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
