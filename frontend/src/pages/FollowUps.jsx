import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, CircularProgress } from '@mui/material'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { getAllFollowUps, updateFollowUp, deleteFollowUp } from '../api/followup'
import { todayStr, fmtDate, fmtDateTime, daysLabel } from '../utils/followup'
import RescheduleInline from '../components/RescheduleInline'

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Tab toggle ───────────────────────────────────────────────────────────────
function TabToggle({ active, onChange }) {
  const tabs = [
    { key: 'active',  label: 'Active',  icon: '🔔' },
    { key: 'history', label: 'History', icon: '✅' },
  ]
  return (
    <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1 mb-6">
      {tabs.map(({ key, label, icon }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            active === key
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          <span>{icon}</span>{label}
        </button>
      ))}
    </div>
  )
}

// ─── Summary chips (active tab) ───────────────────────────────────────────────
function SummaryChip({ label, count, color, onClick, active: isActive }) {
  const colorMap = {
    red:   { base: 'bg-red-50 text-red-600 border-red-200',    active: 'bg-red-600 text-white border-red-600'    },
    amber: { base: 'bg-amber-50 text-amber-600 border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
    blue:  { base: 'bg-blue-50 text-blue-600 border-blue-200', active: 'bg-blue-600 text-white border-blue-600'  },
  }
  const cls = colorMap[color] || colorMap.blue
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] ${isActive ? cls.active : cls.base}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${isActive ? 'bg-white/30' : ''}`}>
        {count}
      </span>
      {label}
    </button>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label, count, accent }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-base">{icon}</span>
      <span className={`text-xs font-bold uppercase tracking-widest ${accent}`}>{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-400 font-medium">{count}</span>
    </div>
  )
}

// ─── Active follow-up card ────────────────────────────────────────────────────
function FollowUpCard({ fu, onDone, onDelete, onReschedule }) {
  const isOverdue = fu.overdue
  const [editing, setEditing] = useState(false)

  const borderColor = isOverdue ? 'border-l-red-400'
    : fu.followUpDate === todayStr() ? 'border-l-amber-400'
    : 'border-l-blue-300'

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} p-4 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
              📅 {fmtDate(fu.followUpDate)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              isOverdue ? 'bg-red-100 text-red-600'
              : fu.followUpDate === todayStr() ? 'bg-amber-100 text-amber-600'
              : 'bg-blue-50 text-blue-600'
            }`}>
              {daysLabel(fu.followUpDate)}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-700 truncate">
            {fu.companyName}<span className="text-gray-400 font-normal"> · {fu.role}</span>
          </p>
          {fu.note && (
            <p className="text-xs mt-1 text-gray-500 line-clamp-2">"{fu.note}"</p>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0 items-start flex-wrap justify-end">
          <button onClick={onDone}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-green-200 text-green-600 bg-white hover:bg-green-500 hover:text-white hover:border-green-500 transition-all">
            Done
          </button>
          <button onClick={() => setEditing((e) => !e)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${editing ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-200 text-amber-600 bg-white hover:bg-amber-500 hover:text-white hover:border-amber-500'}`}>
            Reschedule
          </button>
          <button onClick={onDelete}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
            Delete
          </button>
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

// ─── History card (completed follow-ups) ──────────────────────────────────────
function HistoryCard({ fu, onUndo, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-300 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-600">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate mb-1">
            {fu.companyName}<span className="text-gray-400 font-normal"> · {fu.role}</span>
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>
              <span className="font-medium text-gray-600">Scheduled</span>
              {' '}{fmtDate(fu.followUpDate)}
            </span>
            <span>
              <span className="font-medium text-gray-600">Completed</span>
              {' '}{fmtDateTime(fu.updatedAt)}
            </span>
          </div>

          {fu.note && (
            <p className="text-xs mt-1.5 text-gray-400 line-clamp-2 italic">"{fu.note}"</p>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0 items-start">
          <button onClick={onUndo}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-500 bg-white hover:bg-gray-100 transition-all">
            Undo
          </button>
          <button onClick={onDelete}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FollowUps() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('active')
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeChip, setActiveChip] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { status: tab === 'history' ? 'DONE' : 'PENDING' }
      const res = await getAllFollowUps(params)
      setFollowUps(res.data)
    } catch {
      setError('Failed to load follow-ups.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    setActiveChip(null)
    fetch()
  }, [fetch])

  const flash = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDone = async (fu) => {
    try {
      await updateFollowUp(fu.id, { status: 'DONE' })
      flash('Marked as completed.')
      fetch()
    } catch { setError('Failed to update follow-up.') }
  }

  const handleUndo = async (fu) => {
    try {
      await updateFollowUp(fu.id, { status: 'PENDING' })
      flash('Moved back to pending.')
      fetch()
    } catch { setError('Failed to update follow-up.') }
  }

  const handleDelete = async (id) => {
    try {
      await deleteFollowUp(id)
      flash('Follow-up deleted.')
      fetch()
    } catch { setError('Failed to delete follow-up.') }
  }

  const handleReschedule = async (fu, newDate) => {
    try {
      await updateFollowUp(fu.id, { followUpDate: newDate })
      flash('Follow-up rescheduled.')
      fetch()
    } catch {
      setError('Failed to reschedule follow-up.')
      throw new Error('reschedule failed')
    }
  }

  // ── Active tab data ───────────────────────────────────────────────────────
  const { overdue, dueToday, upcoming } = partitionPending(followUps)

  const chipMatch = (fu) => {
    if (!activeChip) return true
    if (activeChip === 'overdue') return fu.overdue
    if (activeChip === 'today')   return fu.followUpDate === todayStr()
    if (activeChip === 'upcoming') return !fu.overdue && fu.followUpDate !== todayStr()
    return true
  }

  const activeGroups = [
    overdue.length > 0  && { key: 'overdue',  icon: '🔴', label: 'Overdue',   accent: 'text-red-500',   items: overdue  },
    dueToday.length > 0 && { key: 'today',    icon: '🔔', label: 'Due Today', accent: 'text-amber-500', items: dueToday },
    upcoming.length > 0 && { key: 'upcoming', icon: '📋', label: 'Upcoming',  accent: 'text-blue-500',  items: upcoming },
  ].filter(Boolean)

  const filteredGroups = activeChip
    ? activeGroups
        .map((g) => ({ ...g, items: g.items.filter(chipMatch) }))
        .filter((g) => g.items.length > 0)
    : activeGroups

  // ── History tab data ──────────────────────────────────────────────────────
  const monthGroups = groupByMonth(followUps)

  return (
    <Layout>
      <PageHeader
        title="Follow-Ups"
        subtitle="Stay on top of every job search action item"
        action={
          <button onClick={() => navigate('/applications')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm">
            View Applications
          </button>
        }
      />

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <TabToggle active={tab} onChange={setTab} />

      {/* ── ACTIVE TAB ───────────────────────────────────────────────────── */}
      {tab === 'active' && (
        <>
          {!loading && (
            <div className="flex flex-wrap gap-2 mb-6">
              <SummaryChip label="Overdue"   count={overdue.length}  color="red"   onClick={() => setActiveChip(activeChip === 'overdue'  ? null : 'overdue')}  active={activeChip === 'overdue'}  />
              <SummaryChip label="Due Today" count={dueToday.length} color="amber" onClick={() => setActiveChip(activeChip === 'today'    ? null : 'today')}    active={activeChip === 'today'}    />
              <SummaryChip label="Upcoming"  count={upcoming.length} color="blue"  onClick={() => setActiveChip(activeChip === 'upcoming' ? null : 'upcoming')} active={activeChip === 'upcoming'} />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><CircularProgress /></div>
          ) : followUps.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="No pending follow-ups"
              description="All caught up! You have no pending reminders. Completed ones are in the History tab."
            />
          ) : filteredGroups.length === 0 ? (
            <EmptyState icon="✅" title="Nothing in this group" description="Try a different filter." />
          ) : (
            <div className="space-y-8">
              {filteredGroups.map(({ key, icon, label, accent, items }) => (
                <section key={key}>
                  <SectionHeader icon={icon} label={label} count={items.length} accent={accent} />
                  <div className="space-y-2">
                    {items.map((fu) => (
                      <FollowUpCard key={fu.id} fu={fu}
                        onDone={() => handleDone(fu)}
                        onDelete={() => handleDelete(fu.id)}
                        onReschedule={(d) => handleReschedule(fu, d)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ──────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <>
          {!loading && followUps.length > 0 && (
            <p className="text-xs text-gray-400 font-medium mb-6">
              {followUps.length} completed {followUps.length === 1 ? 'follow-up' : 'follow-ups'}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><CircularProgress /></div>
          ) : followUps.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No completed follow-ups yet"
              description="Follow-ups you mark as done will appear here with their completion details."
              action={
                <button onClick={() => setTab('active')}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
                  View Active Follow-Ups
                </button>
              }
            />
          ) : (
            <div className="space-y-8">
              {monthGroups.map(([key, items]) => (
                <section key={key}>
                  <SectionHeader icon="📅" label={monthLabel(key)} count={items.length} accent="text-gray-500" />
                  <div className="space-y-2">
                    {items.map((fu) => (
                      <HistoryCard key={fu.id} fu={fu}
                        onUndo={() => handleUndo(fu)}
                        onDelete={() => handleDelete(fu.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
