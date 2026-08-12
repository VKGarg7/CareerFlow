import { useCallback } from 'react'
import { TimelineRounded } from '@mui/icons-material'
import Layout from '../components/Layout'
import TimelineFeed from '../components/TimelineFeed'
import { getWorkspaceTimeline } from '../api/timeline'

export default function Timeline() {
  const fetchFn = useCallback((params) => getWorkspaceTimeline(params), [])

  return (
    <Layout>
      <div className="max-w-2xl">
        <h2 className="text-[18px] font-semibold text-white mb-4 flex items-center gap-2">
          <TimelineRounded sx={{ fontSize: 18 }} className="text-app-accent-soft" />
          Job Search Timeline
        </h2>
        <div className="rounded-card border border-white/[0.06] bg-app-surface shadow-card p-5">
          <TimelineFeed fetchFn={fetchFn} emptyMessage="No activity recorded yet. Actions across opportunities, applications, interviews, and referrals will show up here." />
        </div>
      </div>
    </Layout>
  )
}
