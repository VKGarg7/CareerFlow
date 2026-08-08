import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowBackOutlined } from '@mui/icons-material'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import PageSpinner from '../components/PageSpinner'
import ActionFilterSelect from '../components/ActionFilterSelect'
import HybridRow from '../components/HybridRow'
import { StaggerRow } from '../components/dashboard/primitives'
import { staggerContainer } from '../lib/motion'
import { getMyActivity } from '../api/auditLog'
import { fmtDateTime } from '../utils/auditLog'

function LogRow({ log: l, isLast }) {
  return (
    <HybridRow
      accentBorder="border-l-app-accent/40"
      avatarColor="bg-app-accent/20"
      name={l.action.replaceAll('_', ' ')}
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
        <motion.div initial="hidden" animate="show" variants={staggerContainer(0.03)}>
          {logs.map((l, i) => (
            <StaggerRow key={l.id}>
              <LogRow log={l} isLast={i === logs.length - 1} />
            </StaggerRow>
          ))}
        </motion.div>
      )}
      </div>
    </Layout>
  )
}
