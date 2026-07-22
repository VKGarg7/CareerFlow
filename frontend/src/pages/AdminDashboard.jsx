import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import ActionFilterSelect from '../components/ActionFilterSelect'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
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
    <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card p-5 mb-8 transition-all duration-300 hover:-translate-y-[1px] hover:border-white/[0.07] hover:shadow-card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">System Health</h3>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
          dbUp ? 'bg-app-success/10 text-app-success' : 'bg-app-danger/10 text-app-danger'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dbUp ? 'bg-app-success' : 'bg-app-danger'}`} />
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
    </div>
  )
}

function StatCard({ icon, label, value, tint }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card p-5 transition-all duration-300 hover:-translate-y-[1px] hover:border-white/[0.07] hover:shadow-card-hover">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner-highlight mb-4"
        style={{ background: `linear-gradient(160deg, ${tint}26, ${tint}0D)`, color: tint }}
      >
        <span className="text-lg">{icon}</span>
      </div>
      <p className="font-display text-3xl font-bold text-white mb-1 tabular-nums">{value}</p>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function BreakdownCard({ title, data }) {
  const entries = Object.entries(data || {})
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  return (
    <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card p-5 transition-all duration-300 hover:-translate-y-[1px] hover:border-white/[0.07] hover:shadow-card-hover">
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
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-app-accent"
                  style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers ?? 0} tint="#8184F5" />
        <StatCard icon="✅" label="Active Users" value={stats?.activeUsers ?? 0} tint="#22C55E" />
        <StatCard icon="🏢" label="Companies" value={stats?.totalCompanies ?? 0} tint="#8B5CF6" />
        <StatCard icon="📨" label="Applications" value={stats?.totalApplications ?? 0} tint="#F59E0B" />
        <StatCard icon="🎤" label="Interviews" value={stats?.totalInterviews ?? 0} tint="#22D3EE" />
        <StatCard icon="🤝" label="Referrals" value={stats?.totalReferrals ?? 0} tint="#F43F5E" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <BreakdownCard title="Applications by Status" data={stats?.applicationsByStatus} />
        <BreakdownCard title="Interviews by Outcome" data={stats?.interviewsByOutcome} />
        <BreakdownCard title="Referrals by Status" data={stats?.referralsByStatus} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Manage Users</h2>
        <input
          type="text"
          value={userSearch}
          onChange={(e) => searchUsers(e.target.value)}
          placeholder="Search by name or email…"
          className="text-xs font-medium border border-white/[0.08] rounded-xl px-3 py-2 text-white/70 bg-white/[0.03] w-full sm:w-56 hover:border-white/[0.14] focus:outline-none focus:ring-2 focus:ring-app-accent/40 transition placeholder:text-white/25"
        />
      </div>
      <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-bold text-white/35 uppercase tracking-wide">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3 font-semibold text-white/85 whitespace-nowrap">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-5 py-3 text-white/50 whitespace-nowrap">{u.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border-0 disabled:opacity-50 ${
                        u.role === 'ADMIN' ? 'bg-app-accent2/10 text-app-accent-soft' : 'bg-white/[0.06] text-white/50'
                      }`}
                    >
                      <option value="USER" className="bg-app-surface text-white">USER</option>
                      <option value="ADMIN" className="bg-app-surface text-white">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      u.active ? 'bg-app-success/10 text-app-success' : 'bg-app-danger/10 text-app-danger'
                    }`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      disabled={busyId === u.id}
                      onClick={() => toggleActive(u)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition disabled:opacity-50 ${
                        u.active
                          ? 'bg-app-danger/10 text-app-danger hover:bg-app-danger/20'
                          : 'bg-app-success/10 text-app-success hover:bg-app-success/20'
                      }`}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="text-center text-sm text-white/35 py-10">No users found.</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Audit Logs</h2>
        <ActionFilterSelect logs={logs} value={logAction} onChange={filterLogs} />
      </div>
      <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-bold text-white/35 uppercase tracking-wide">
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3 text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3 text-white/50 whitespace-nowrap">{l.actorEmail || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-app-accent/10 text-app-accent-soft whitespace-nowrap">
                      {l.action.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/70">{l.description}</td>
                  <td className="px-5 py-3 text-right text-white/35 text-xs whitespace-nowrap">{fmtDateTime(l.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <p className="text-center text-sm text-white/35 py-10">No activity recorded yet.</p>
        )}
      </div>
      </div>
    </Layout>
  )
}
