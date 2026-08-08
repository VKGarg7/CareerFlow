import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SearchRounded } from '@mui/icons-material'
import Layout from '../components/Layout'
import ActionFilterSelect from '../components/ActionFilterSelect'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import { Surface, StaggerRow } from '../components/dashboard/primitives'
import HybridRow from '../components/HybridRow'
import CountUp from '../components/CountUp'
import { staggerContainer } from '../lib/motion'
import { getPlatformStats, getAllUsers, setUserActive, setUserRole, getAuditLogs, getSystemHealth } from '../api/admin'
import { fmtDateTime } from '../utils/auditLog'

function fmtUptime(ms) {
  if (!ms) return '—'
  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function HealthCard({ health }) {
  const dbUp = health?.databaseUp
  const memPct = health && health.maxMemoryMb > 0
    ? Math.round((health.usedMemoryMb / health.maxMemoryMb) * 100)
    : 0

  return (
    <Surface className="glass-reflection-sweep relative mb-8 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">System Health</h3>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
          dbUp ? 'bg-app-success/10 text-app-success' : 'bg-app-danger/10 text-app-danger'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dbUp ? 'bg-app-success shadow-glow-success' : 'bg-app-danger shadow-glow-danger'}`} />
          {dbUp ? 'All systems operational' : 'Database unreachable'}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-white/35 mb-1">Database</p>
          <p className="text-sm font-bold text-white/85">
            {dbUp ? `Up · ${health.databaseResponseTimeMs}ms` : 'Down'}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/35 mb-1">Uptime</p>
          <p className="text-sm font-bold text-white/85">{fmtUptime(health?.uptimeMillis)}</p>
        </div>
        <div>
          <p className="text-xs text-white/35 mb-1">Memory</p>
          <p className="text-sm font-bold text-white/85">
            {health ? `${health.usedMemoryMb} / ${health.maxMemoryMb} MB (${memPct}%)` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/35 mb-1">CPU Cores</p>
          <p className="text-sm font-bold text-white/85">{health?.availableProcessors ?? '—'}</p>
        </div>
      </div>
    </Surface>
  )
}

function StatCard({ icon, label, value, tint }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
      <Surface interactive className="p-5">
        <div
          className="icon-embossed relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner-highlight mb-4"
          style={{ background: `linear-gradient(160deg, ${tint}26, ${tint}0D)`, color: tint }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-xl opacity-40 blur-md" style={{ background: tint }} />
          <span className="relative text-lg">{icon}</span>
        </div>
        <p className="font-display text-3xl font-bold text-white mb-1 tabular-nums">
          <CountUp value={value} />
        </p>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">{label}</p>
      </Surface>
    </motion.div>
  )
}

function BreakdownCard({ title, data }) {
  const entries = Object.entries(data || {})
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  return (
    <Surface className="p-5">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-white/35">No data</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white/60">{key.replaceAll('_', ' ')}</span>
                <span className="text-xs font-bold text-white/85">{value}</span>
              </div>
              <div className="engraved-well h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-app-accent shadow-glow-accent transition-all duration-700 ease-out"
                  style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Surface>
  )
}

function UserRow({ user: u, isLast, busy, onToggleActive, onChangeRole }) {
  return (
    <HybridRow
      accentBorder={u.active ? 'border-l-app-success' : 'border-l-white/10'}
      avatarColor={u.role === 'ADMIN' ? 'bg-app-purple' : 'bg-white/[0.12]'}
      name={`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
      subtitle={u.email}
      isLast={isLast}
      timelineTone={u.active ? 'success' : 'neutral'}
      statusSlot={
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
          u.active ? 'bg-app-success/10 text-app-success' : 'bg-app-danger/10 text-app-danger'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-app-success' : 'bg-app-danger'}`} />
          {u.active ? 'Active' : 'Inactive'}
        </span>
      }
      hidden={
        <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
          <p className="text-[11px] text-white/35">Role</p>
          <select
            value={u.role}
            disabled={busy}
            onChange={(e) => onChangeRole(u, e.target.value)}
            className={`mt-0.5 rounded-full border-0 px-2 py-0.5 text-[11px] font-bold disabled:opacity-50 ${
              u.role === 'ADMIN' ? 'bg-app-purple/15 text-app-purple-soft' : 'bg-white/[0.06] text-white/50'
            }`}
          >
            <option value="USER" className="bg-app-raised text-white">USER</option>
            <option value="ADMIN" className="bg-app-raised text-white">ADMIN</option>
          </select>
        </div>
      }
      extraActions={
        <button
          disabled={busy}
          onClick={() => onToggleActive(u)}
          className={`btn-liquid rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
            u.active ? 'bg-app-danger/10 text-app-danger hover:bg-app-danger/20' : 'bg-app-success/10 text-app-success hover:bg-app-success/20'
          }`}
        >
          {u.active ? 'Deactivate' : 'Activate'}
        </button>
      }
      menuItems={[]}
    />
  )
}

function LogRow({ log: l, isLast }) {
  return (
    <HybridRow
      accentBorder="border-l-app-accent/40"
      avatarColor="bg-app-accent/20"
      name={l.actorEmail || 'System'}
      subtitle={l.description}
      isLast={isLast}
      timelineTone="accent"
      statusSlot={
        <span className="inline-flex items-center rounded-full bg-app-accent/10 px-2.5 py-1 text-[11px] font-bold text-app-accent-soft">
          {l.action.replaceAll('_', ' ')}
        </span>
      }
      hidden={
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[11px] text-white/35">When</p>
          <p className="mt-0.5 text-xs text-white/60">{fmtDateTime(l.occurredAt)}</p>
        </div>
      }
      menuItems={[]}
    />
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [logs, setLogs] = useState([])
  const [logAction, setLogAction] = useState('')
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const refreshHealth = () => {
    getSystemHealth().then((res) => setHealth(res.data)).catch(() => {})
  }

  const load = () => {
    setLoading(true)
    Promise.allSettled([getPlatformStats(), getAllUsers({ size: 1000 }), getAuditLogs({ size: 1000 }), getSystemHealth()]).then(([s, u, l, h]) => {
      if (s.status === 'fulfilled') setStats(s.value.data)
      if (u.status === 'fulfilled') setUsers(u.value.data || [])
      if (l.status === 'fulfilled') setLogs(l.value.data || [])
      if (h.status === 'fulfilled') setHealth(h.value.data)
      if (s.status === 'rejected' || u.status === 'rejected' || l.status === 'rejected' || h.status === 'rejected') {
        setError('Failed to load some admin data.')
      }
      setLoading(false)
    })
  }

  useEffect(load, [])

  useEffect(() => {
    const interval = setInterval(refreshHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const filterLogs = (action) => {
    setLogAction(action)
    getAuditLogs(action ? { action, size: 1000 } : { size: 1000 })
      .then((res) => setLogs(res.data || []))
      .catch(() => setError('Failed to load audit logs.'))
  }

  const toggleActive = async (user) => {
    setBusyId(user.id)
    setError('')
    try {
      const res = await setUserActive(user.id, !user.active)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.')
    } finally {
      setBusyId(null)
    }
  }

  const changeRole = async (user, role) => {
    if (role === user.role) return
    setBusyId(user.id)
    setError('')
    try {
      const res = await setUserRole(user.id, role)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.')
    } finally {
      setBusyId(null)
    }
  }

  const searchUsers = (value) => {
    setUserSearch(value)
    getAllUsers(value ? { search: value, size: 1000 } : { size: 1000 })
      .then((res) => setUsers(res.data || []))
      .catch(() => setError('Failed to search users.'))
  }

  if (loading) return (
    <Layout>
      <PageSpinner py="py-20" />
    </Layout>
  )

  return (
    <Layout>
      <div className="overflow-x-hidden">
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      <HealthCard health={health} />

      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        initial="hidden" animate="show" variants={staggerContainer()}
      >
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers ?? 0} tint="#8184F5" />
        <StatCard icon="✅" label="Active Users" value={stats?.activeUsers ?? 0} tint="#10B981" />
        <StatCard icon="🏢" label="Companies" value={stats?.totalCompanies ?? 0} tint="#A855F7" />
        <StatCard icon="📨" label="Applications" value={stats?.totalApplications ?? 0} tint="#F59E0B" />
        <StatCard icon="🎤" label="Interviews" value={stats?.totalInterviews ?? 0} tint="#22D3EE" />
        <StatCard icon="🤝" label="Referrals" value={stats?.totalReferrals ?? 0} tint="#F43F5E" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <BreakdownCard title="Applications by Status" data={stats?.applicationsByStatus} />
        <BreakdownCard title="Interviews by Outcome" data={stats?.interviewsByOutcome} />
        <BreakdownCard title="Referrals by Status" data={stats?.referralsByStatus} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Manage Users</h2>
        <div className="field-glass relative w-full sm:w-64">
          <SearchRounded sx={{ fontSize: 16 }} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => searchUsers(e.target.value)}
            placeholder="Search by name or email…"
            className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-white/80 outline-none placeholder:text-white/25"
          />
        </div>
      </div>
      {users.length === 0 ? (
        <Surface className="p-10 text-center">
          <p className="text-sm text-white/35">No users found.</p>
        </Surface>
      ) : (
        <motion.div initial="hidden" animate="show" variants={staggerContainer(0.04)}>
          {users.map((u, i) => (
            <StaggerRow key={u.id}>
              <UserRow user={u} isLast={i === users.length - 1} busy={busyId === u.id} onToggleActive={toggleActive} onChangeRole={changeRole} />
            </StaggerRow>
          ))}
        </motion.div>
      )}

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Audit Logs</h2>
        <ActionFilterSelect logs={logs} value={logAction} onChange={filterLogs} />
      </div>
      {logs.length === 0 ? (
        <Surface className="p-10 text-center">
          <p className="text-sm text-white/35">No activity recorded yet.</p>
        </Surface>
      ) : (
        <motion.div initial="hidden" animate="show" variants={staggerContainer(0.03)}>
          {logs.slice(0, 100).map((l, i) => (
            <StaggerRow key={l.id}>
              <LogRow log={l} isLast={i === Math.min(logs.length, 100) - 1} />
            </StaggerRow>
          ))}
        </motion.div>
      )}
      </div>
    </Layout>
  )
}
