import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { TrendingUpRounded, TrendingDownRounded } from '@mui/icons-material'
import { Surface } from './primitives'
import CountUp from '../CountUp'
import { staggerContainer, staggerItem } from '../../lib/motion'

function KpiTile({ icon, label, value, trend, trendLabel, tint, sparkline, onClick, tall = false, offset = false }) {
  const positive = trend >= 0
  return (
    <motion.div variants={staggerItem} className={offset ? 'lg:mt-7' : ''}>
      <button onClick={onClick} className="block w-full text-left">
        <Surface interactive className={`flex ${tall ? 'min-h-[180px]' : 'min-h-[140px]'} flex-col p-5`}>
          <div className="flex items-start justify-between">
            <div
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner-highlight"
              style={{ background: `linear-gradient(160deg, ${tint}26, ${tint}0D)`, color: tint }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-xl opacity-40 blur-md" style={{ background: tint }} />
              <span className="icon-embossed relative">{icon}</span>
            </div>
            {trend !== null && (
              <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold ${
                positive ? 'bg-app-success/10 text-app-success' : 'bg-app-danger/10 text-app-danger'
              }`}>
                {positive ? <TrendingUpRounded sx={{ fontSize: 13 }} /> : <TrendingDownRounded sx={{ fontSize: 13 }} />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>

          <div className="flex-1">
            <p className="font-display mt-5 text-[1.85rem] font-bold leading-none tracking-tight text-white tabular-nums">
              <CountUp value={value} />
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[13px] font-medium text-white/45">{label}</p>
              {trendLabel && <p className="text-[11px] text-white/25">{trendLabel}</p>}
            </div>
          </div>

          {sparkline && (
            <div className="engraved-well -mx-1 mt-3.5 h-7 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sparkline} barCategoryGap="35%">
                  <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={600}>
                    {sparkline.map((_, i) => (
                      <Cell key={i} fill={tint} fillOpacity={0.18 + (i / sparkline.length) * 0.42} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Surface>
      </button>
    </motion.div>
  )
}

export default function AsymmetricKpiGrid({ kpis }) {
  return (
    <motion.div
      className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"
      initial="hidden" animate="show"
      variants={staggerContainer()}
    >
      {kpis.map((kpi, i) => (
        <KpiTile key={kpi.label} {...kpi} tall={i % 3 === 0} offset={i % 2 === 1} />
      ))}
    </motion.div>
  )
}
