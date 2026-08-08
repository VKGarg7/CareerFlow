import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, YAxis } from 'recharts'
import { Surface } from './primitives'
import CountUp from '../CountUp'
import { appStatusHex } from '../../constants/applicationStatus'

function StatusDonut({ segments, total, size = 128, strokeWidth = 16, activeKey, onHover }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        {segments.map((s) => {
          const len = (s.count / total) * circ
          const dashOffset = -offset
          const dimmed = activeKey && activeKey !== s.key
          const el = (
            <motion.circle key={s.key} cx={cx} cy={cy} r={r} fill="none" stroke={s.hex}
              strokeWidth={dimmed ? strokeWidth - 4 : strokeWidth}
              strokeLinecap="butt"
              style={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity 0.2s ease, stroke-width 0.2s ease' }}
              onMouseEnter={() => onHover?.(s.key)}
              onMouseLeave={() => onHover?.(null)}
              initial={{ strokeDasharray: `0 ${circ}`, strokeDashoffset: dashOffset }}
              animate={{ strokeDasharray: `${len} ${circ - len}`, strokeDashoffset: dashOffset }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-semibold leading-none text-white tabular-nums"><CountUp value={total} /></span>
        <span className="mt-1 text-[10px] text-white/35">total</span>
      </div>
    </div>
  )
}

function TrendChart({ dailyTrend }) {
  const data = useMemo(() => {
    const last7 = dailyTrend.slice(-7)
    return last7.map((d) => {
      const date = new Date(`${d.date}T00:00:00`)
      return { key: d.date, label: date.toLocaleDateString('en-US', { weekday: 'short' }), count: d.count }
    })
  }, [dailyTrend])

  const thisWeek = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="engraved-well h-[168px] w-full pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8184F5" stopOpacity={0.45}>
                <animate attributeName="stop-opacity" values="0.35;0.55;0.35" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#8184F5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, (max) => Math.max(max, 3)]} />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.10)' }}
            contentStyle={{ background: '#101428', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}
            itemStyle={{ color: '#fff' }}
            formatter={(v) => [v, 'Applications']}
          />
          <Area type="monotone" dataKey="count" stroke="#8184F5" strokeWidth={2.5} fill="url(#trendFill)" dot={false}
            isAnimationActive animationDuration={700} animationEasing="ease-out"
            activeDot={{ r: 4, fill: '#8184F5', stroke: '#0B0C14', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[11px] text-white/30">{thisWeek} application{thisWeek !== 1 ? 's' : ''} logged this week</p>
    </div>
  )
}

export default function GlassChartPanel({ statusCfg, statusCounts, totalApplications, dailyTrend }) {
  const [activeKey, setActiveKey] = useState(null)

  const segments = useMemo(
    () => Object.entries(statusCfg)
      .map(([key, cfg]) => ({ key, count: statusCounts[key] || 0, hex: appStatusHex(key), ...cfg }))
      .filter((s) => s.count > 0),
    [statusCfg, statusCounts]
  )

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Surface className="flex items-center justify-center p-5">
        <h2 className="sr-only">Application Overview</h2>
        {totalApplications === 0 ? (
          <p className="relative py-6 text-center text-xs text-white/35">No applications tracked yet.</p>
        ) : (
          <div className="relative flex w-full flex-wrap items-center gap-6">
            <StatusDonut segments={segments} total={totalApplications} activeKey={activeKey} onHover={setActiveKey} />
            <div className="grid min-w-[8rem] flex-1 grid-cols-1 gap-1.5">
              {segments.map((s) => (
                <button
                  key={s.key}
                  onMouseEnter={() => setActiveKey(s.key)}
                  onMouseLeave={() => setActiveKey(null)}
                  className={`flex items-center gap-2 rounded-md px-1 py-0.5 text-left transition-opacity ${activeKey && activeKey !== s.key ? 'opacity-40' : 'opacity-100'}`}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.hex }} />
                  <span className="truncate text-xs text-white/55">{s.label}</span>
                  <span className="ml-auto text-xs font-medium text-white/80 tabular-nums">{s.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Surface>

      <Surface className="p-5">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">Activity Trend</h2>
        <TrendChart dailyTrend={dailyTrend} />
      </Surface>
    </div>
  )
}
