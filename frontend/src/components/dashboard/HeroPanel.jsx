import {
  ArrowForward, LocalFireDepartmentRounded, AutoAwesomeRounded,
  CalendarTodayRounded, TrackChangesRounded,
} from '@mui/icons-material'
import { Surface } from './primitives'
import CountUp from '../CountUp'
import MagneticButton from '../MagneticButton'
import { pickMotivation } from '../../utils/dashboardInsights'

function HeroStat({ icon, label, value, tint }) {
  return (
    <div className="glass-surface glass-edge relative flex items-center gap-3 rounded-2xl px-4 py-3">
      <div className="icon-embossed flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${tint}1F`, color: tint }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-none text-white tabular-nums">{value}</p>
        <p className="mt-1 truncate text-[11px] text-white/40">{label}</p>
      </div>
    </div>
  )
}

export default function HeroPanel({
  name, greeting, totalApplications, totalCompanies, offerCount,
  streak, currentFocus, percentage, onViewApplications, onAddCompany,
}) {
  return (
    <Surface className="glass-reflection-sweep relative mb-5 overflow-hidden p-7 sm:p-9">
      <div className="light-rays" />
      <div className="particle-field" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 animate-float rounded-full bg-app-accent/[0.14] blur-[100px]" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 animate-float-tilt rounded-full bg-app-purple/[0.10] blur-[90px]" style={{ animationDelay: '1.2s' }} />
      <div className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 animate-pulse-glow rounded-full bg-app-cyan/[0.10] blur-[80px]" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/50">
            <AutoAwesomeRounded sx={{ fontSize: 13 }} className="text-app-accent-soft" />
            Assistant
          </div>
          <p className="mb-1.5 text-sm text-white/40">{greeting}</p>
          <h1 className="font-display mb-3 break-words text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-[2.25rem]">
            Welcome back, {name}
          </h1>
          <p className="mb-5 max-w-2xl text-[15px] leading-relaxed text-white/45">
            {totalApplications === 0
              ? 'Start tracking your job search — add a company and log your first application.'
              : <>You&apos;re tracking <span className="font-medium text-white/85">{totalApplications} application{totalApplications !== 1 ? 's' : ''}</span> across <span className="font-medium text-white/85">{totalCompanies} {totalCompanies !== 1 ? 'companies' : 'company'}</span>{offerCount > 0 && <> with <span className="font-medium text-app-success">{offerCount} offer{offerCount !== 1 ? 's' : ''}</span></>}. {pickMotivation()}</>}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton
              onClick={onViewApplications}
              className="btn-liquid group inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-app-accent px-5 py-2.5 text-sm font-semibold text-white shadow-ring-accent transition-colors hover:brightness-110">
              View Applications
              <ArrowForward sx={{ fontSize: 15 }} className="transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>
            <MagneticButton
              onClick={onAddCompany}
              className="btn-liquid inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white">
              Add Company
            </MagneticButton>
          </div>
        </div>

        <div className="grid w-full shrink-0 grid-cols-2 gap-2.5 sm:w-auto sm:grid-cols-2 lg:w-64">
          <HeroStat icon={<LocalFireDepartmentRounded sx={{ fontSize: 18 }} />} label={streak === 1 ? 'day streak' : 'day streak'} value={<CountUp value={streak} />} tint="#F97316" />
          <HeroStat icon={<TrackChangesRounded sx={{ fontSize: 18 }} />} label={currentFocus ? currentFocus.label : 'No active focus'} value={currentFocus ? currentFocus.count : '—'} tint="#22D3EE" />
          <HeroStat icon={<CalendarTodayRounded sx={{ fontSize: 18 }} />} label="profile strength" value={`${percentage}%`} tint="#A855F7" />
        </div>
      </div>
    </Surface>
  )
}
