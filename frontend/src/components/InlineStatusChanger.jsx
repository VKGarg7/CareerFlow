import { useState } from 'react'
import { CircularProgress } from '@mui/material'

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23555555' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`

/**
 * @param {object} item       - entity with .status and .id
 * @param {object} statusConfig - STATUS_CONFIG map for this entity
 * @param {string} defaultStatus - key to fall back to when item.status is unknown
 * @param {function} updateFn  - (id, payload) => Promise — called to persist the new status
 * @param {function} onStatusChanged - called with the server response on success
 * @param {string} [wrapperClass] - extra classes on the outer div
 */
export default function InlineStatusChanger({
  item,
  statusConfig,
  defaultStatus,
  updateFn,
  onStatusChanged,
  wrapperClass = '',
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const cfg = statusConfig[item.status] || statusConfig[defaultStatus]

  const handleChange = async (e) => {
    const newStatus = e.target.value
    if (newStatus === item.status) return
    setSaving(true)
    setError('')
    try {
      const { data } = await updateFn(item.id, { status: newStatus })
      onStatusChanged(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={e => e.stopPropagation()} className={`relative flex items-center gap-1.5 ${wrapperClass}`}>
      {saving && <CircularProgress size={12} />}
      <select
        value={item.status}
        onChange={handleChange}
        disabled={saving}
        title={error || 'Change status'}
        style={{
          backgroundImage: CHEVRON_SVG,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
        }}
        className={`appearance-none w-fit text-xs font-semibold pl-2 pr-6 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition disabled:opacity-50 ${cfg.badge} border-current`}
      >
        {Object.entries(statusConfig).map(([val, { label }]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      {error && (
        <span className="absolute top-full left-0 mt-1 text-[10px] text-red-500 bg-white border border-red-100 rounded-lg px-2 py-1 shadow z-10 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  )
}
