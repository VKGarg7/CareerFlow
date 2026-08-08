import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScheduleOutlined } from '@mui/icons-material'
import { Surface, StaggerRow } from './primitives'
import CompanyLogo from '../CompanyLogo'
import { staggerContainer } from '../../lib/motion'

function HeatCell({ cell }) {
  const [hover, setHover] = useState(false)
  const bg = cell.count === 0
    ? 'rgba(255,255,255,0.04)'
    : `rgba(91,95,239,${0.18 + cell.intensity * 0.65})`
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <motion.div
        whileHover={{ scale: 1.15 }}
        className="h-7 w-7 rounded-md shadow-inner-highlight"
        style={{ background: bg, boxShadow: cell.count > 0 ? `0 0 10px -2px rgba(91,95,239,${cell.intensity * 0.6})` : undefined }}
      />
      {hover && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/[0.08] bg-app-raised px-2 py-1 text-[10.5px] font-medium text-white/80 shadow-glass-2">
          {cell.label} · {cell.count} app{cell.count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

export default function DeadlineHeatmap({ heatmapCells, deadlines, companyById, onViewAll }) {
  return (
    <Surface className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Activity &amp; Deadlines</h2>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-medium text-white/40 transition-colors hover:text-white/75">
            View all
          </button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {heatmapCells.map((cell) => <HeatCell key={cell.date} cell={cell} />)}
      </div>

      {deadlines.length === 0 ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/30">
            <ScheduleOutlined sx={{ fontSize: 17 }} />
          </div>
          <p className="text-xs text-white/35">No upcoming deadlines.</p>
        </div>
      ) : (
        <motion.div className="space-y-1 border-t border-white/[0.05] pt-4" initial="hidden" animate="show" variants={staggerContainer(0.05)}>
          {deadlines.map((a) => {
            const urgent = a.daysLeft <= 1
            const soon = a.daysLeft <= 3
            const chipCls = urgent ? 'bg-app-danger/10 text-app-danger' : soon ? 'bg-app-warning/10 text-app-warning' : 'bg-white/[0.05] text-white/40'
            return (
              <StaggerRow key={a.id} className="group flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-white/[0.025]">
                <CompanyLogo name={a.companyName} website={companyById[a.companyId]?.website} dotColor={urgent ? '#F43F5E' : '#8184F5'} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/75">{a.role}</p>
                  <p className="truncate text-xs text-white/35">{a.companyName}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums ${chipCls}`}>
                  {a.daysLeft === 0 ? 'Today' : `${a.daysLeft}d`}
                </span>
              </StaggerRow>
            )
          })}
        </motion.div>
      )}
    </Surface>
  )
}
