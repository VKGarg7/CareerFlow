export default function StatusBadge({ badge = '', dot = '', label = '' }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.05] px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm ${badge}`}>
      <span className={`relative h-1.5 w-1.5 rounded-full ${dot}`}>
        <span className={`absolute inset-0 animate-pulse-glow rounded-full ${dot} blur-[3px]`} />
      </span>
      {label}
    </span>
  )
}
