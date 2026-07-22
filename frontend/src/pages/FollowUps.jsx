import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, CircularProgress } from '@mui/material'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  NotificationsActiveRounded, EventBusyRounded, TodayRounded, EventAvailableRounded,
  CheckCircleRounded, CheckRounded, EventRepeatRounded, DeleteOutlineRounded,
  UndoRounded, WorkOutlineRounded, ChevronRightRounded, CalendarMonthRounded,
  KeyboardArrowDownRounded, EventNoteRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import { ConfirmDeleteModal } from '../components/ModalShell'
import { getAllFollowUps, updateFollowUp, deleteFollowUp, getFollowUpCounts } from '../api/followup'
import { todayStr, fmtDate, fmtDateTime, daysLabel, initials } from '../utils/followup'
import useTransientMessage from '../hooks/useTransientMessage'
import RescheduleInline from '../components/RescheduleInline'
import CompanyDetailModal from '../components/CompanyDetailModal'
import { CardMenu } from '../components/EntityCard'

function monthKey(dtStr) {
  const d = new Date(dtStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function partitionPending(followUps) {
  const today = todayStr()
  const overdue = [], dueToday = [], upcoming = []
  for (const f of followUps) {
    if (f.followUpDate < today) overdue.push(f)
    else if (f.followUpDate === today) dueToday.push(f)
    else upcoming.push(f)
  }
  return { overdue, dueToday, upcoming }
}

function groupByMonth(followUps) {
  const map = {}
  for (const f of followUps) {
    const key = monthKey(f.updatedAt || f.followUpDate)
    if (!map[key]) map[key] = []
    map[key].push(f)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}

function avatarHex(fu) {
  if (fu.overdue) return '#F43F5E'
  if (fu.followUpDate === todayStr()) return '#F59E0B'
  return '#5B5FEF'
}

function TabToggle({ active, onChange }) {
  const tabs = [
    { key: 'active',  label: 'Active',  Icon: NotificationsActiveRounded },
    { key: 'history', label: 'History', Icon: CheckCircleRounded },
  ]
  return (
    <div className="inline-flex bg-white/[0.04] rounded-xl p-1 gap-1 mb-6">
      {tabs.map(({ key, label, Icon }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            active === key
              ? 'bg-app-accent text-white shadow-card'
              : 'text-white/50 hover:text-white/80'
          }`}>
          <Icon sx={{ fontSize: 16 }} />{label}
        </button>
      ))}
    </div>
  )
}

function StatTile({ Icon, tint, value, label, onClick, active: isActive }) {
  return (
    <button onClick={onClick}
      className={`text-left relative overflow-hidden rounded-card border px-4 py-3.5 flex items-center gap-3 transition-all ${
        isActive ? 'border-current' : 'border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.02]'
      }`}
      style={isActive ? { color: tint, background: `${tint}14` } : undefined}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-inner-highlight"
        style={{ background: `linear-gradient(160deg, ${tint}26, ${tint}0D)`, color: tint }}>
        <Icon sx={{ fontSize: 18 }} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-display font-black leading-none text-white">{value}</p>
        <p className="text-[11px] text-white/40 font-medium mt-1 truncate">{label}</p>
      </div>
    </button>
  )
}

function SectionHeader({ Icon, label, count, accent, collapsed, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="flex items-center gap-2 mb-3 w-full text-left group">
      <Icon sx={{ fontSize: 15 }} className={accent} />
      <span className={`text-xs font-bold uppercase tracking-widest ${accent}`}>{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-xs text-white/35 font-medium">{count}</span>
      <KeyboardArrowDownRounded sx={{ fontSize: 18 }}
        className={`text-white/30 transition-transform group-hover:text-white/60 ${collapsed ? '-rotate-90' : ''}`} />
    </button>
  )
}

function SectionEmptyRow({ title, description }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-card border border-white/[0.04] bg-app-surface/60 py-8 px-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/35">
        <EventNoteRounded sx={{ fontSize: 19 }} />
      </span>
      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold text-white/70">{title}</p>
        <p className="text-xs text-white/35 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function FollowUpCard({ fu, onDone, onDelete, onReschedule, onCompany }) {
  const isOverdue = fu.overdue
  const isToday = fu.followUpDate === todayStr()
  const [editing, setEditing] = useState(false)

  const borderColor = isOverdue ? 'border-l-app-danger'
    : isToday ? 'border-l-app-warning'
    : 'border-l-app-accent/60'

  return (
    <div className={`relative overflow-hidden rounded-card border border-white/[0.04] border-l-4 ${borderColor} bg-app-surface shadow-card p-4 transition-all duration-300 hover:-translate-y-[1px] hover:border-white/[0.07] hover:shadow-card-hover`}>
      <div className="flex flex-wrap sm:flex-nowrap items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner-highlight"
          style={{ background: avatarHex(fu) }}>
          {initials(fu.companyName)}
        </div>

        <div className="flex-1 min-w-[12rem] sm:min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`flex items-center gap-1 text-sm font-bold whitespace-nowrap ${isOverdue ? 'text-app-danger' : 'text-white/85'}`}>
              <CalendarMonthRounded sx={{ fontSize: 14 }} /> {fmtDate(fu.followUpDate)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
              isOverdue ? 'bg-app-danger/10 text-app-danger'
              : isToday ? 'bg-app-warning/10 text-app-warning'
              : 'bg-app-accent/10 text-app-accent-soft'
            }`}>
              {daysLabel(fu.followUpDate)}
            </span>
          </div>
          <p className="text-sm text-white/70 flex items-center gap-1 flex-wrap">
            <button type="button" onClick={() => onCompany(fu.companyId)}
              className="font-semibold text-white/85 hover:text-app-accent-soft transition">{fu.companyName}</button>
            <span className="text-white/35 font-normal">· {fu.role}</span>
          </p>
          {fu.note && (
            <p className="text-xs mt-1 text-white/40 line-clamp-2">"{fu.note}"</p>
          )}
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto shrink-0 items-start sm:justify-end">
          <button onClick={onDone}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-app-success/20 text-app-success bg-app-success/[0.04] hover:bg-app-success hover:text-white hover:border-app-success transition-all">
            <CheckRounded sx={{ fontSize: 14 }} /> Done
          </button>
          <button onClick={() => setEditing((e) => !e)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${editing ? 'bg-app-warning text-white border-app-warning' : 'border-app-warning/20 text-app-warning bg-app-warning/[0.04] hover:bg-app-warning hover:text-white hover:border-app-warning'}`}>
            <EventRepeatRounded sx={{ fontSize: 14 }} /> Reschedule
          </button>
          <CardMenu items={[
            { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 15 }} />, onClick: onDelete, tone: 'danger' },
          ]} />
        </div>
      </div>

      {editing && (
        <RescheduleInline
          currentDate={fu.followUpDate}
          onSave={async (d) => { await onReschedule(d); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

function HistoryCard({ fu, onUndo, onDelete, onCompany }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-white/[0.04] border-l-4 border-l-app-success/60 bg-app-surface shadow-card p-4 transition-all duration-300 hover:-translate-y-[1px] hover:border-white/[0.07] hover:shadow-card-hover">
      <div className="flex flex-wrap sm:flex-nowrap items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-app-success/10 flex items-center justify-center shrink-0">
          <CheckCircleRounded sx={{ fontSize: 20 }} className="text-app-success" />
        </div>

        <div className="flex-1 min-w-[10rem] sm:min-w-0">
          <p className="text-sm text-white/80 flex items-center gap-1 flex-wrap mb-1">
            <button type="button" onClick={() => onCompany(fu.companyId)}
              className="font-bold text-white/85 hover:text-app-accent-soft transition">{fu.companyName}</button>
            <span className="text-white/35 font-normal">· {fu.role}</span>
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
            <span>
              <span className="font-medium text-white/60">Scheduled</span>
              {' '}{fmtDate(fu.followUpDate)}
            </span>
            <span>
              <span className="font-medium text-white/60">Completed</span>
              {' '}{fmtDateTime(fu.updatedAt)}
            </span>
          </div>

          {fu.note && (
            <p className="text-xs mt-1.5 text-white/35 line-clamp-2 italic">"{fu.note}"</p>
          )}
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto shrink-0 items-start">
          <button onClick={onUndo}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] text-white/50 bg-white/[0.02] hover:bg-white/[0.08] transition-all">
            <UndoRounded sx={{ fontSize: 14 }} /> Undo
          </button>
          <CardMenu items={[
            { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 15 }} />, onClick: onDelete, tone: 'danger' },
          ]} />
        </div>
      </div>
    </div>
  )
}

export default function FollowUps() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('active')
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [companyDetailId, setCompanyDetailId] = useState(null)
  const [success, setSuccess] = useTransientMessage()
  const [activeChip, setActiveChip] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [completedCount, setCompletedCount] = useState(0)
  const [counts, setCounts] = useState({ overdue: 0, dueToday: 0, upcoming: 0, completed: 0 })

  const toggleSection = (key) => setCollapsedSections((s) => ({ ...s, [key]: !s[key] }))

  const fetchCounts = useCallback(async () => {
    try {
      const { data } = await getFollowUpCounts()
      setCounts(data)
      setCompletedCount(data.completed)
    } catch { /* stat tiles fall back to previous values */ }
  }, [])

  const SECTION_SIZE = 500

  const fetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'history') {
        const res = await getAllFollowUps({ status: 'DONE', size: 1000 })
        setFollowUps(res.data)
      } else {
        const [overdueRes, todayRes, upcomingRes] = await Promise.all([
          getAllFollowUps({ status: 'PENDING', bucket: 'OVERDUE', size: SECTION_SIZE }),
          getAllFollowUps({ status: 'PENDING', bucket: 'TODAY', size: SECTION_SIZE }),
          getAllFollowUps({ status: 'PENDING', bucket: 'UPCOMING', size: SECTION_SIZE }),
        ])
        setFollowUps([...overdueRes.data, ...todayRes.data, ...upcomingRes.data])
      }
    } catch {
      setError('Failed to load follow-ups.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  const refreshAll = useCallback(() => { fetch(); fetchCounts() }, [fetch, fetchCounts])

  useEffect(() => {
    setActiveChip(null)
    refreshAll()
  }, [refreshAll])

  const flash = setSuccess

  const handleDone = async (fu) => {
    try {
      await updateFollowUp(fu.id, { status: 'DONE' })
      flash('Marked as completed.')
      refreshAll()
    } catch { setError('Failed to update follow-up.') }
  }

  const handleUndo = async (fu) => {
    try {
      await updateFollowUp(fu.id, { status: 'PENDING' })
      flash('Moved back to pending.')
      refreshAll()
    } catch { setError('Failed to update follow-up.') }
  }

  const handleDeleteConfirmed = async () => {
    await deleteFollowUp(deleteTarget.id)
    setDeleteTarget(null)
    flash('Follow-up deleted.')
    refreshAll()
  }

  const handleReschedule = async (fu, newDate) => {
    try {
      await updateFollowUp(fu.id, { followUpDate: newDate })
      flash('Follow-up rescheduled.')
      refreshAll()
    } catch {
      setError('Failed to reschedule follow-up.')
      throw new Error('reschedule failed')
    }
  }

  const { overdue, dueToday, upcoming } = partitionPending(followUps)

  const chipMatch = (fu) => {
    if (!activeChip) return true
    if (activeChip === 'overdue') return fu.overdue
    if (activeChip === 'today')   return fu.followUpDate === todayStr()
    if (activeChip === 'upcoming') return !fu.overdue && fu.followUpDate !== todayStr()
    return true
  }

  const activeGroups = [
    { key: 'overdue',  Icon: EventBusyRounded,      label: 'Overdue',   accent: 'text-app-danger',      items: overdue,  totalCount: counts.overdue,
      emptyTitle: 'No overdue follow-ups',   emptyDescription: "Nothing slipped through the cracks." },
    { key: 'today',    Icon: TodayRounded,          label: 'Due Today', accent: 'text-app-warning',     items: dueToday, totalCount: counts.dueToday,
      emptyTitle: 'No follow-ups due today', emptyDescription: "You're all caught up for today!" },
    { key: 'upcoming', Icon: EventAvailableRounded, label: 'Upcoming',  accent: 'text-app-accent-soft', items: upcoming, totalCount: counts.upcoming,
      emptyTitle: 'Nothing upcoming',        emptyDescription: 'Scheduled follow-ups will show up here.' },
  ]

  const filteredGroups = activeChip
    ? activeGroups.filter((g) => g.key === activeChip).map((g) => ({ ...g, items: g.items.filter(chipMatch) }))
    : activeGroups

  const monthGroups = groupByMonth(followUps)

  return (
    <Layout
      headerAction={
        <button onClick={() => navigate('/applications')}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white/70 bg-white/[0.04] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] hover:text-white transition">
          <WorkOutlineRounded sx={{ fontSize: 16 }} />
          View Applications
          <ChevronRightRounded sx={{ fontSize: 16 }} />
        </button>
      }
    >
      <div className="overflow-x-hidden">
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      <TabToggle active={tab} onChange={setTab} />

      {tab === 'active' && (
        <>
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatTile Icon={EventBusyRounded}      tint="#F43F5E" value={counts.overdue}  label="Overdue"
                onClick={() => setActiveChip(activeChip === 'overdue'  ? null : 'overdue')}  active={activeChip === 'overdue'}  />
              <StatTile Icon={TodayRounded}          tint="#F59E0B" value={counts.dueToday} label="Due Today"
                onClick={() => setActiveChip(activeChip === 'today'    ? null : 'today')}    active={activeChip === 'today'}    />
              <StatTile Icon={EventAvailableRounded} tint="#5B5FEF" value={counts.upcoming} label="Upcoming"
                onClick={() => setActiveChip(activeChip === 'upcoming' ? null : 'upcoming')} active={activeChip === 'upcoming'} />
              <StatTile Icon={CheckCircleRounded}     tint="#22C55E" value={completedCount}  label="Completed"
                onClick={() => setTab('history')} active={false} />
            </div>
          )}

          {loading ? (
            <PageSpinner />
          ) : followUps.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="No pending follow-ups"
              description="All caught up! You have no pending reminders. Completed ones are in the History tab."
            />
          ) : (
            <div className="space-y-8">
              {filteredGroups.map(({ key, Icon, label, accent, items, totalCount, emptyTitle, emptyDescription }) => {
                const collapsed = !!collapsedSections[key]
                return (
                  <section key={key}>
                    <SectionHeader Icon={Icon} label={label} count={totalCount} accent={accent}
                      collapsed={collapsed} onToggle={() => toggleSection(key)} />
                    {!collapsed && (
                      items.length === 0 ? (
                        <SectionEmptyRow title={emptyTitle} description={emptyDescription} />
                      ) : (
                        <div className="space-y-2">
                          {items.map((fu) => (
                            <FollowUpCard key={fu.id} fu={fu}
                              onDone={() => handleDone(fu)}
                              onDelete={() => setDeleteTarget(fu)}
                              onReschedule={(d) => handleReschedule(fu, d)}
                              onCompany={setCompanyDetailId}
                            />
                          ))}
                        </div>
                      )
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {!loading && followUps.length > 0 && (
            <p className="text-xs text-white/35 font-medium mb-6">
              {followUps.length} completed {followUps.length === 1 ? 'follow-up' : 'follow-ups'}
            </p>
          )}

          {loading ? (
            <PageSpinner />
          ) : followUps.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No completed follow-ups yet"
              description="Follow-ups you mark as done will appear here with their completion details."
              action={
                <button onClick={() => setTab('active')}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
                  View Active Follow-Ups
                </button>
              }
            />
          ) : (
            <div className="space-y-8">
              {monthGroups.map(([key, items]) => {
                const collapsed = !!collapsedSections[key]
                return (
                  <section key={key}>
                    <SectionHeader Icon={CalendarMonthRounded} label={monthLabel(key)} count={items.length} accent="text-white/45"
                      collapsed={collapsed} onToggle={() => toggleSection(key)} />
                    {!collapsed && (
                      <div className="space-y-2">
                        {items.map((fu) => (
                          <HistoryCard key={fu.id} fu={fu}
                            onUndo={() => handleUndo(fu)}
                            onDelete={() => setDeleteTarget(fu)}
                            onCompany={setCompanyDetailId}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
      </div>
      <CompanyDetailModal open={companyDetailId !== null} companyId={companyDetailId}
        onClose={() => setCompanyDetailId(null)} />
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Follow-Up"
        message={deleteTarget && <>Remove the follow-up for <strong>{deleteTarget.companyName}</strong>? This can't be undone.</>}
      />
    </Layout>
  )
}
