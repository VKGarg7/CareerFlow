import { actionOptions } from '../utils/auditLog'

export default function ActionFilterSelect({ logs, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs font-medium border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white/60 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40"
    >
      <option value="" className="bg-app-surface text-white">All actions</option>
      {actionOptions(logs).map((a) => (
        <option key={a} value={a} className="bg-app-surface text-white">{a.replaceAll('_', ' ')}</option>
      ))}
    </select>
  )
}
