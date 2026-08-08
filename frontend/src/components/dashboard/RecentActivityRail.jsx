import { motion } from 'framer-motion'
import { HistoryRounded } from '@mui/icons-material'
import { Surface } from './primitives'
import CompanyLogo from '../CompanyLogo'
import { staggerContainer, staggerItem } from '../../lib/motion'
import { daysLabel } from '../../utils/followup'

export default function RecentActivityRail({ items, companyById, onSelect }) {
  if (items.length === 0) return null

  return (
    <Surface className="mb-5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <HistoryRounded sx={{ fontSize: 15 }} className="text-white/35" />
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Recent Activity</h2>
      </div>
      <motion.div
        className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1"
        initial="hidden" animate="show" variants={staggerContainer(0.05)}
      >
        {items.map((item) => (
          <motion.button
            key={item.id}
            variants={staggerItem}
            onClick={() => onSelect?.(item)}
            whileHover={{ y: -3 }}
            className="glass-surface glass-edge elevate-float flex w-56 shrink-0 items-center gap-3 rounded-2xl p-3.5 text-left shadow-glass-1 transition-shadow hover:shadow-glass-hover"
          >
            <CompanyLogo name={item.companyName} website={companyById[item.companyId]?.website} dotColor="#8184F5" className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white/80">{item.role}</p>
              <p className="truncate text-xs text-white/35">{item.companyName}</p>
              <p className="mt-1 truncate text-[11px] text-white/25">{daysLabel((item.appliedDate || item.createdAt || '').slice(0, 10))}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </Surface>
  )
}
