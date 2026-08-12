import { useEffect, useState, useCallback } from 'react'
import { CircularProgress } from '@mui/material'
import {
  BookmarkAddedOutlined, WorkOutlined, SwapHorizRounded, EventAvailableOutlined,
  HandshakeOutlined, NotificationsNoneOutlined, CheckCircleOutlineRounded, NotesOutlined,
} from '@mui/icons-material'
import { fmt } from '../utils/followup'

const EVENT_CONFIG = {
  OPPORTUNITY_SAVED:          { label: 'Opportunity Saved',    icon: BookmarkAddedOutlined, dot: 'bg-white/40' },
  OPPORTUNITY_UPDATED:        { label: 'Opportunity Updated',  icon: BookmarkAddedOutlined, dot: 'bg-white/40' },
  OPPORTUNITY_CONVERTED:      { label: 'Converted to Application', icon: SwapHorizRounded,  dot: 'bg-app-accent2' },
  APPLICATION_SUBMITTED:      { label: 'Application Submitted', icon: WorkOutlined,          dot: 'bg-app-accent' },
  APPLICATION_STATUS_CHANGED: { label: 'Status Changed',       icon: SwapHorizRounded,       dot: 'bg-app-accent' },
  OA_SCHEDULED:                { label: 'OA Scheduled',         icon: EventAvailableOutlined, dot: 'bg-app-warning' },
  INTERVIEW_SCHEDULED:        { label: 'Interview Scheduled',  icon: EventAvailableOutlined, dot: 'bg-app-warning' },
  INTERVIEW_COMPLETED:        { label: 'Interview Completed',  icon: CheckCircleOutlineRounded, dot: 'bg-app-success' },
  REFERRAL_REQUESTED:         { label: 'Referral Requested',   icon: HandshakeOutlined,      dot: 'bg-app-accent2' },
  REFERRAL_STATUS_CHANGED:    { label: 'Referral Updated',     icon: HandshakeOutlined,      dot: 'bg-app-accent2' },
  FOLLOW_UP_SENT:              { label: 'Follow-Up Sent',       icon: NotificationsNoneOutlined, dot: 'bg-app-accent' },
  OFFER_RECEIVED:              { label: 'Offer Received',       icon: CheckCircleOutlineRounded, dot: 'bg-app-success' },
  ACTION_COMPLETED:            { label: 'Action Completed',     icon: CheckCircleOutlineRounded, dot: 'bg-app-success' },
  NOTE:                        { label: 'Note',                 icon: NotesOutlined,          dot: 'bg-white/30' },
}

const ENTITY_LABELS = {
  OPPORTUNITY: 'Opportunity', APPLICATION: 'Application', CONTACT: 'Contact',
  INTERVIEW: 'Interview', REFERRAL: 'Referral', OFFER: 'Offer',
}

export default function TimelineFeed({ fetchFn, emptyMessage = 'No activity yet.', pageSize = 20 }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback((pageNum, append) => {
    const setter = append ? setLoadingMore : setLoading
    setter(true)
    fetchFn({ page: pageNum, size: pageSize })
      .then((res) => {
        setEvents((prev) => append ? [...prev, ...res.data] : res.data)
        setHasMore(!res.data.last)
        setError('')
      })
      .catch(() => setError('Failed to load timeline.'))
      .finally(() => setter(false))
  }, [fetchFn, pageSize])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to page 0 when fetchFn identity changes is the intended effect
    setPage(0)
    load(0, false)
  }, [load])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    load(next, true)
  }

  if (loading) return <div className="flex justify-center py-8"><CircularProgress size={22} /></div>
  if (error) return <p className="text-sm text-app-danger">{error}</p>
  if (events.length === 0) return <p className="text-sm text-white/35 italic">{emptyMessage}</p>

  return (
    <div>
      <div className="space-y-0">
        {events.map((event, i) => {
          const cfg = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.NOTE
          const Icon = cfg.icon
          const isLast = i === events.length - 1
          return (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${cfg.dot}`}>
                  <Icon sx={{ fontSize: 14 }} className="text-white" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-white/[0.08] my-1" />}
              </div>
              <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-4'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white/85">{cfg.label}</p>
                  {event.entityType && (
                    <span className="text-[10px] font-semibold text-white/35 bg-white/[0.05] px-1.5 py-0.5 rounded-full">
                      {ENTITY_LABELS[event.entityType] || event.entityType}
                    </span>
                  )}
                </div>
                {event.entityLabel && <p className="text-xs text-white/55 mt-0.5">{event.entityLabel}</p>}
                {event.description && <p className="text-xs text-white/40 mt-0.5">{event.description}</p>}
                <p className="text-[11px] text-white/30 mt-0.5">{fmt(event.occurredAt)}</p>
              </div>
            </div>
          )
        })}
      </div>
      {hasMore && (
        <button onClick={loadMore} disabled={loadingMore}
          className="mt-3 w-full py-2 text-xs font-semibold text-app-accent-soft hover:text-white transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loadingMore && <CircularProgress size={12} sx={{ color: 'currentColor' }} />}
          Load More
        </button>
      )}
    </div>
  )
}
