import { useState } from 'react'
import { CircularProgress } from '@mui/material'

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' fill-opacity='0.4' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`

/**
 * @param {object} item       
 * @param {object} statusConfig 
 * @param {string} defaultStatus 
 * @param {function} updateFn  
 * @param {function} onStatusChanged 
 * @param {string} [wrapperClass] 
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
      {saving && <CircularProgress size={12} sx={{ color: 'rgba(255,255,255,0.4)' }} />}
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
        className={`appearance-none w-fit text-[11px] font-medium pl-2.5 pr-6 py-1 rounded-md border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-app-accent/40 transition disabled:opacity-50 ${cfg.badge}`}
      >
        {Object.entries(statusConfig).map(([val, { label }]) => (
          <option key={val} value={val} className="bg-app-surface text-white">{label}</option>
        ))}
      </select>
      {error && (
        <span className="absolute top-full left-0 mt-1 text-[10px] text-app-danger bg-app-surface border border-white/[0.08] rounded-lg px-2 py-1 shadow-card z-10 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  )
}
