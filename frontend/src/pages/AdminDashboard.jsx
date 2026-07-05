import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import ActionFilterSelect from '../components/ActionFilterSelect'
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Health</h3>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
          dbUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dbUp ? 'bg-green-500' : 'bg-red-500'}`} />
          {dbUp ? 'All systems operational' : 'Database unreachable'}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Database</p>
          <p className="text-sm font-bold text-gray-800">
            {dbUp ? `Up · ${health.databaseResponseTimeMs}ms` : 'Down'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Uptime</p>
          <p className="text-sm font-bold text-gray-800">{fmtUptime(health?.uptimeMillis)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Memory</p>
          <p className="text-sm font-bold text-gray-800">
            {health ? `${health.usedMemoryMb} / ${health.maxMemoryMb} MB (${memPct}%)` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">CPU Cores</p>
          <p className="text-sm font-bold text-gray-800">{health?.availableProcessors ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, gradient, glow }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white shadow-lg ${glow}`}>
      <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute -right-1 -top-6 w-24 h-24 rounded-full bg-white/5" />
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-xs font-semibold opacity-75 uppercase tracking-wide">{label}</p>
      <span className="absolute top-4 right-4 text-xl opacity-60">{icon}</span>
    </div>
  )
}

function BreakdownCard({ title, data }) {
  const entries = Object.entries(data || {})
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">No data</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">{key.replaceAll('_', ' ')}</span>
                <span className="text-xs font-bold text-gray-800">{value}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
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
    Promise.allSettled([getPlatformStats(), getAllUsers(), getAuditLogs(), getSystemHealth()]).then(([s, u, l, h]) => {
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
    getAuditLogs(action ? { action } : undefined)
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
    getAllUsers(value ? { search: value } : undefined)
      .then((res) => setUsers(res.data || []))
      .catch(() => setError('Failed to search users.'))
  }

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20"><CircularProgress /></div>
    </Layout>
  )

  return (
    <Layout>
      <PageHeader title="Admin Dashboard" subtitle="Platform-wide statistics and user management" />

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 text-sm px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <HealthCard health={health} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers ?? 0}
          gradient="from-blue-500 to-blue-600" glow="shadow-blue-200/60 shadow-lg" />
        <StatCard icon="✅" label="Active Users" value={stats?.activeUsers ?? 0}
          gradient="from-emerald-500 to-green-600" glow="shadow-green-200/60 shadow-lg" />
        <StatCard icon="🏢" label="Companies" value={stats?.totalCompanies ?? 0}
          gradient="from-violet-500 to-purple-600" glow="shadow-purple-200/60 shadow-lg" />
        <StatCard icon="📨" label="Applications" value={stats?.totalApplications ?? 0}
          gradient="from-amber-400 to-orange-500" glow="shadow-orange-200/60 shadow-lg" />
        <StatCard icon="🎤" label="Interviews" value={stats?.totalInterviews ?? 0}
          gradient="from-cyan-500 to-blue-500" glow="shadow-cyan-200/60 shadow-lg" />
        <StatCard icon="🤝" label="Referrals" value={stats?.totalReferrals ?? 0}
          gradient="from-pink-500 to-rose-500" glow="shadow-pink-200/60 shadow-lg" />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <BreakdownCard title="Applications by Status" data={stats?.applicationsByStatus} />
        <BreakdownCard title="Interviews by Outcome" data={stats?.interviewsByOutcome} />
        <BreakdownCard title="Referrals by Status" data={stats?.referralsByStatus} />
      </div>

      {/* User management */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage Users</h2>
        <input
          type="text"
          value={userSearch}
          onChange={(e) => searchUsers(e.target.value)}
          placeholder="Search by name or email…"
          className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-gray-800">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border-0 disabled:opacity-50 ${
                        u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      disabled={busyId === u.id}
                      onClick={() => toggleActive(u)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                        u.active
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
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
          <p className="text-center text-sm text-gray-400 py-10">No users found.</p>
        )}
      </div>

      {/* Audit logs */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Audit Logs</h2>
        <ActionFilterSelect logs={logs} value={logAction} onChange={filterLogs} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3 text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-500">{l.actorEmail || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      {l.action.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{l.description}</td>
                  <td className="px-5 py-3 text-right text-gray-400 text-xs">{fmtDateTime(l.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">No activity recorded yet.</p>
        )}
      </div>
    </Layout>
  )
}
