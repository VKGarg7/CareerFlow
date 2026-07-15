import { KeyboardArrowDown } from '@mui/icons-material'

export default function FilterSelect({ value, onChange, allLabel, options, className = 'shrink-0 w-40' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 appearance-none pl-4 pr-9 border border-white/[0.06] rounded-xl text-sm text-app-text bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition cursor-pointer"
      >
        <option value="" className="bg-app-surface text-white">{allLabel}</option>
        {options.map(({ value: v, label }) => (
          <option key={v} value={v} className="bg-app-surface text-white">{label}</option>
        ))}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-app-text-muted">
        <KeyboardArrowDown fontSize="small" />
      </span>
    </div>
  )
}
