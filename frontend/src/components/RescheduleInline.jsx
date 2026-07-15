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
    <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-2">
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="flex-1 px-2 py-1.5 border border-app-warning/30 rounded-xl text-xs text-white/80 bg-app-raised focus:outline-none focus:ring-2 focus:ring-app-warning/40 [color-scheme:dark]" />
      <button onClick={handleSave} disabled={saving}
        className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl bg-app-warning text-white hover:brightness-110 transition disabled:opacity-50 flex items-center gap-1">
        {saving && <CircularProgress size={10} color="inherit" />}
        Save
      </button>
      <button onClick={onCancel}
        className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-white/[0.08] text-white/50 bg-white/[0.02] hover:bg-white/[0.06] transition">
        Cancel
      </button>
    </div>
  )
}
