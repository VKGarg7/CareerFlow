import { useState } from 'react'
import { CircularProgress } from '@mui/material'

export default function RescheduleInline({ currentDate, onSave, onCancel }) {
  const [date, setDate] = useState(currentDate)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!date || date === currentDate) { onCancel(); return }
    setSaving(true)
    try { await onSave(date) }
    finally { setSaving(false) }
  }

  return (
    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="flex-1 px-2 py-1.5 border border-amber-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
      <button onClick={handleSave} disabled={saving}
        className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-50 flex items-center gap-1">
        {saving && <CircularProgress size={10} color="inherit" />}
        Save
      </button>
      <button onClick={onCancel}
        className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-gray-200 text-gray-500 bg-white hover:bg-gray-100 transition">
        Cancel
      </button>
    </div>
  )
}
