import { useEffect, useState } from 'react'
import { getApplications } from '../api/application'

export default function ChatApplicationPicker({ onSelect }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getApplications({ size: 100 })
      .then((res) => { if (!cancelled) setApplications(res.data) })
      .catch(() => { if (!cancelled) setError('Could not load your applications.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Start a new chat</p>

      <button
        onClick={() => onSelect(null)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-left text-sm font-medium text-white/80 transition hover:bg-white/[0.06]"
      >
        General prep chat
      </button>

      {loading && <p className="px-1 text-xs text-white/30">Loading applications…</p>}
      {error && <p className="px-1 text-xs text-app-danger">{error}</p>}

      {!loading && !error && applications.length > 0 && (
        <>
          <p className="mt-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-white/25">Or attach to an application</p>
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto no-scrollbar">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => onSelect(app.id)}
                className="flex flex-col items-start gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-left transition hover:bg-white/[0.05]"
              >
                <span className="text-sm font-medium text-white/85">{app.role}</span>
                <span className="text-xs text-white/40">{app.companyName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
