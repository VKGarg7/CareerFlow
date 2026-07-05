import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import { ArrowBackOutlined } from '@mui/icons-material'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
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
      <div className="flex justify-center py-20"><CircularProgress /></div>
    </Layout>
  )

  return (
    <Layout>
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition mb-4"
      >
        <ArrowBackOutlined sx={{ fontSize: 16 }} />
        Back to Profile
      </button>

      <PageHeader title="My Activity" subtitle="A history of actions taken on your account" />

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 text-sm px-4 py-3 mb-6">
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
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm overflow-hidden">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 shrink-0">
                {l.action.replaceAll('_', ' ')}
              </span>
              <p className="text-sm text-gray-700 flex-1 min-w-0 truncate">{l.description}</p>
              <span className="text-xs text-gray-400 shrink-0">{fmtDateTime(l.occurredAt)}</span>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
