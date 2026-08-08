import { InboxOutlined } from '@mui/icons-material'
import { Surface, StaggerRow, StatusPill } from './primitives'
import CompanyLogo from '../CompanyLogo'
import { staggerContainer } from '../../lib/motion'
import { motion } from 'framer-motion'
import { appStatusLabel } from '../../constants/applicationStatus'

const TONE_BY_STATUS = {
  SAVED: 'muted', APPLIED: 'neutral', OA_SCHEDULED: 'warning', OA_CLEARED: 'accent',
  INTERVIEW_SCHEDULED: 'accent', INTERVIEW_CLEARED: 'accent',
  OFFER_RECEIVED: 'success', REJECTED: 'danger', JOINED: 'success',
}

export default function ApplicationTimeline({ applications, companyById, onViewAll, onSelect }) {
  if (applications.length === 0) {
    return (
      <Surface className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Recent Applications</h2>
        </div>
        <div className="py-6 text-center">
          <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/30">
            <InboxOutlined sx={{ fontSize: 17 }} />
          </div>
          <p className="text-xs text-white/35">No applications yet.</p>
        </div>
      </Surface>
    )
  }

  return (
    <Surface className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Application Timeline</h2>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-medium text-white/40 transition-colors hover:text-white/75">
            View all
          </button>
        )}
      </div>

      <motion.div className="relative" initial="hidden" animate="show" variants={staggerContainer(0.06)}>
        <div className="absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-app-accent/40 via-white/[0.08] to-transparent" />
        <div className="space-y-1">
          {applications.map((app) => (
            <StaggerRow
              key={app.id}
              onClick={() => onSelect?.(app)}
              className="group relative flex cursor-pointer items-center gap-4 rounded-xl py-2.5 pl-1 pr-2 transition-colors hover:bg-white/[0.025]"
            >
              <div className="relative z-[1] shrink-0">
                <CompanyLogo name={app.companyName} website={companyById[app.companyId]?.website} dotColor="#8184F5" className="h-10 w-10 ring-4 ring-app-surface" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white/80">{app.role}</p>
                <p className="truncate text-xs text-white/35">{app.companyName} · {new Date(app.appliedDate || app.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <StatusPill tone={TONE_BY_STATUS[app.status] || 'neutral'}>{appStatusLabel(app.status)}</StatusPill>
            </StaggerRow>
          ))}
        </div>
      </motion.div>
    </Surface>
  )
}
