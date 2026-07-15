export default function AnalyticsCard({ className = '', children }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/[0.03] bg-[#0B0C14] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_16px_40px_-12px_rgba(0,0,0,0.45)] p-6 ${className}`}>
      {children}
    </div>
  )
}
