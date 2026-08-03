import { FolderOutlined, BoltRounded, PauseRounded, EmojiEventsRounded } from '@mui/icons-material'
import { countByStatus } from '../utils/followup'

function RingProgress({ pct, color }) {
  const r = 16
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div className="relative shrink-0 w-9 h-9">
      <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90 drop-shadow-[0_0_4px_var(--ring-glow)]" style={{ '--ring-glow': `${color}80` }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{pct}%</span>
    </div>
  )
}

function IconOrb({ Icon, color }) {
  return (
    <span
      className="relative z-[1] w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}33`, boxShadow: `0 0 20px ${color}66, inset 0 1px 0 0 rgba(255,255,255,0.15)` }}
    >
      <Icon sx={{ fontSize: 18, color }} />
    </span>
  )
}

function GlowBloom({ color }) {
  return (
    <div
      className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle, ${color}45, transparent 70%)` }}
    />
  )
}

function Wave({ color }) {
  return (
    <svg className="absolute left-0 right-0 bottom-0 w-full h-10 opacity-40 pointer-events-none" viewBox="0 0 300 50" preserveAspectRatio="none">
      <path
        d="M0,32 C30,14 60,44 90,26 C120,8 150,38 180,22 C210,6 240,34 270,18 C280,14 290,20 300,16"
        fill="none" stroke={color} strokeWidth="1.5" opacity="0.5"
        className="animate-float"
      />
      <path
        d="M0,40 C30,26 60,48 90,36 C120,24 150,46 180,32 C210,18 240,42 270,28 C280,24 290,30 300,26"
        fill="none" stroke={color} strokeWidth="2"
        className="animate-float"
      />
    </svg>
  )
}

const CARD_META = {
  ACTIVE:    { label: 'Active',    Icon: BoltRounded,        color: '#2EE896', hint: 'Most active' },
  PAUSED:    { label: 'Paused',    Icon: PauseRounded,       color: '#FFAE42', hint: 'On hold' },
  COMPLETED: { label: 'Completed', Icon: EmojiEventsRounded, color: '#A78BFA', hint: 'Great work!' },
  ARCHIVED:  { label: 'Archived',  Icon: FolderOutlined,     color: '#B0B4C4', hint: '' },
}

const CARD_ORDER = ['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']

const CARD_BG = {
  total:     'linear-gradient(135deg, #3730A3, #1E1B6E)',
  ACTIVE:    'linear-gradient(135deg, #0F5C42, #0A3428)',
  PAUSED:    'linear-gradient(135deg, #7C4A12, #4A2A0E)',
  COMPLETED: 'linear-gradient(135deg, #4C3AAE, #2A2270)',
  ARCHIVED:  'linear-gradient(135deg, #23262F, #181A22)',
}

export default function WorkspaceStatCards({ items = [], statusKey = 'status', statusConfig = {}, activeFilter = '', onFilter }) {
  const counts = countByStatus(items, statusKey, statusConfig)
  const total = items.length

  const cards = CARD_ORDER
    .filter((key) => statusConfig[key])
    .map((key) => ({ key, count: counts[key] || 0, ...CARD_META[key] }))
    .filter((c) => c.count > 0)

  const allActive = activeFilter === ''

  return (
    <div
      className="grid grid-cols-2 xl:grid-cols-[var(--stat-cols)] gap-[22px]"
      style={{ '--stat-cols': `1.4fr ${'1fr '.repeat(cards.length).trim()}` }}
    >
      <button
        onClick={() => onFilter('')}
        className={`group text-left relative overflow-hidden rounded-[20px] border p-4 h-[128px] min-w-0 col-span-2 xl:col-span-1 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${
          allActive ? 'border-white/20' : 'border-white/[0.08]'
        }`}
        style={{ background: CARD_BG.total, boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
      >
        <GlowBloom color="#8B8CFF" />
        <div className="flex items-start justify-between relative z-[1]">
          <div>
            <p className="text-[30px] font-bold text-white leading-none">{total}</p>
            <p className="text-sm font-semibold text-white/90 mt-1.5">Total Workspaces</p>
          </div>
          <IconOrb Icon={FolderOutlined} color="#8B8CFF" />
        </div>
        <p className="text-xs font-medium text-[#9C9DFF] mt-2 relative z-[1]">&#8599; +2 this month</p>
        <Wave color="#8B8CFF" />
      </button>

      {cards.map(({ key, label, color, count, Icon, hint }) => {
        const isActive = activeFilter === key
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <button
            key={key}
            onClick={() => onFilter(isActive ? '' : key)}
            className={`group text-left relative overflow-hidden rounded-[20px] border p-4 h-[128px] min-w-0 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${
              isActive ? 'border-white/20' : 'border-white/[0.08]'
            }`}
            style={{ background: CARD_BG[key], boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
          >
            <GlowBloom color={color} />
            <div className="flex items-start justify-between relative z-[1]">
              <div>
                <p className="text-[30px] font-bold text-white leading-none">{count}</p>
                <p className="text-sm font-semibold text-white/90 mt-1.5">{label}</p>
              </div>
              {key === 'ACTIVE' ? <RingProgress pct={pct} color={color} /> : <IconOrb Icon={Icon} color={color} />}
            </div>
            <p className="text-[11px] font-medium text-white/25 mt-1 relative z-[1]">{pct}%</p>
            {hint && <p className="text-xs font-medium -mt-0.5 relative z-[1]" style={{ color }}>&#9889; {hint}</p>}
            <Wave color={color} />
          </button>
        )
      })}
    </div>
  )
}
