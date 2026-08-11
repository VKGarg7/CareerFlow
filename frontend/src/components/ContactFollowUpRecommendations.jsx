import { useCallback, useState } from 'react'
import { CircularProgress } from '@mui/material'
import { NotificationsActiveRounded, CheckRounded, CloseRounded, ChevronRightRounded } from '@mui/icons-material'
import useFetchOnce from '../hooks/useFetchOnce'
import { getRecommendations, dismissRecommendation, convertRecommendation } from '../api/contactFollowUpRecommendation'

export default function ContactFollowUpRecommendations({ onViewContact }) {
  const { data: recommendations, setData } = useFetchOnce(
    useCallback(() => getRecommendations({ status: 'PENDING', size: 20 }), []), []
  )
  const [busyId, setBusyId] = useState(null)
  const [collapsed, setCollapsed] = useState(false)

  if (!recommendations || recommendations.length === 0) return null

  const handleDismiss = async (id) => {
    setBusyId(id)
    try {
      await dismissRecommendation(id)
      setData((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // best-effort
    } finally {
      setBusyId(null)
    }
  }

  const handleConvert = async (id) => {
    setBusyId(id)
    try {
      await convertRecommendation(id)
      setData((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // best-effort
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-card border border-app-warning/20 bg-app-warning/[0.04] shadow-card px-5 py-4 mb-6">
      <button type="button" onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 w-full text-left">
        <NotificationsActiveRounded sx={{ fontSize: 16 }} className="text-app-warning" />
        <span className="text-xs font-bold uppercase tracking-widest text-app-warning">Follow-Up Recommendations</span>
        <span className="text-xs text-white/35 font-medium">{recommendations.length}</span>
        <ChevronRightRounded sx={{ fontSize: 18 }} className={`ml-auto text-white/30 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
      </button>

      {!collapsed && (
        <div className="mt-3 space-y-2">
          {recommendations.map((rec) => (
            <div key={rec.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => onViewContact?.(rec.contactId)}
                  className="text-sm font-semibold text-white/85 hover:text-app-accent-soft transition truncate block text-left">
                  {rec.contactName}
                </button>
                <p className="text-xs text-white/45 truncate">{rec.recommendedAction}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleConvert(rec.id)} disabled={busyId === rec.id}
                  title="Convert to outreach"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-app-success/20 text-app-success bg-app-success/[0.04] hover:bg-app-success hover:text-white hover:border-app-success transition-all disabled:opacity-50">
                  {busyId === rec.id ? <CircularProgress size={12} /> : <CheckRounded sx={{ fontSize: 14 }} />}
                </button>
                <button onClick={() => handleDismiss(rec.id)} disabled={busyId === rec.id}
                  title="Dismiss"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] text-white/50 bg-white/[0.02] hover:bg-white/[0.08] transition-all disabled:opacity-50">
                  <CloseRounded sx={{ fontSize: 14 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
