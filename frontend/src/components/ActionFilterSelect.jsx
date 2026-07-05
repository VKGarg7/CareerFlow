import { actionOptions } from '../utils/auditLog'

export default function ActionFilterSelect({ logs, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white"
    >
      <option value="">All actions</option>
      {actionOptions(logs).map((a) => (
        <option key={a} value={a}>{a.replaceAll('_', ' ')}</option>
      ))}
    </select>
  )
}
