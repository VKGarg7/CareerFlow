import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowBackOutlined } from '@mui/icons-material'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import PageSpinner from '../components/PageSpinner'
import ActionFilterSelect from '../components/ActionFilterSelect'
import { getMyActivity } from '../api/auditLog'
import { fmtDateTime } from '../utils/auditLog'

export default function Activity() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState('')

  const load = (filterAction) => {
    setLoading(true)
    getMyActivity(filterAction ? { action: filterAction } : undefined)
      .then((res) => setLogs(res.data || []))
      .catch(() => setError('Failed to load your activity.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const filterLogs = (value) => {
    setAction(value)
    load(value)
  }

  if (loading) return (
    <Layout>
      <PageSpinner py="py-20" />
    </Layout>
  )

  return (
    <Layout>
      <div className="overflow-x-hidden">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-1.5 text-sm font-medium text-white/45 hover:text-white/85 transition mb-4"
      >
        <ArrowBackOutlined sx={{ fontSize: 16 }} />
        Back to Profile
      </button>

      {error && (
        <div className="rounded-xl border border-app-danger/20 bg-app-danger/10 text-app-danger text-sm px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <ActionFilterSelect logs={logs} value={action} onChange={filterLogs} />
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No activity yet"
          description="Actions you take on your account will show up here."
        />
      ) : (
        <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card divide-y divide-white/[0.05]">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-app-accent/10 text-app-accent-soft shrink-0">
                {l.action.replaceAll('_', ' ')}
              </span>
              <p className="text-sm text-white/70 flex-1 min-w-0 truncate">{l.description}</p>
              <span className="text-xs text-white/35 shrink-0">{fmtDateTime(l.occurredAt)}</span>
            </div>
          ))}
        </div>
      )}
      </div>
    </Layout>
  )
}
