import { motion } from 'framer-motion'
import { MicNoneOutlined } from '@mui/icons-material'
import { Surface, StaggerRow } from './primitives'
import CompanyLogo from '../CompanyLogo'
import { staggerContainer } from '../../lib/motion'
import { daysLabel } from '../../utils/followup'

export default function InterviewTimeline({ interviews, companyById, onViewAll }) {
  return (
    <Surface className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Upcoming Interviews</h2>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-medium text-white/40 transition-colors hover:text-white/75">
            View all
          </button>
        )}
      </div>

      {interviews.length === 0 ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/30">
            <MicNoneOutlined sx={{ fontSize: 17 }} />
          </div>
          <p className="text-xs text-white/35">No interviews scheduled.</p>
        </div>
      ) : (
        <motion.div className="relative space-y-1" initial="hidden" animate="show" variants={staggerContainer(0.06)}>
          <div className="absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-app-purple/40 via-white/[0.08] to-transparent" />
          {interviews.map((app) => (
            <StaggerRow key={app.id} className="relative flex items-center gap-4 rounded-xl py-2 pl-1 pr-2">
              <div className="relative z-[1] shrink-0">
                <span className="absolute -inset-1 rounded-full bg-app-purple/20 blur-md" />
                <CompanyLogo name={app.companyName} website={companyById[app.companyId]?.website} dotColor="#A855F7" className="relative h-10 w-10 ring-4 ring-app-surface" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white/80">{app.role}</p>
                <p className="truncate text-xs text-white/35">{app.companyName}</p>
              </div>
              <span className="shrink-0 rounded-full bg-app-purple/10 px-2.5 py-1 text-[11px] font-semibold text-app-purple-soft">
                {app.followUpDate ? daysLabel(app.followUpDate) : 'Scheduled'}
              </span>
            </StaggerRow>
          ))}
        </motion.div>
      )}
    </Surface>
  )
}
