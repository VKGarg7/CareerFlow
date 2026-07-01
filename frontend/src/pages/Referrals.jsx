import { useState, useEffect, useCallback } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import {
  Add, Search, KeyboardArrowDown, LinkedIn, Email,
  Close, OpenInNew, Work,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { getReferrals, getReferral, addReferral, updateReferral, deleteReferral, manageNote } from '../api/referral'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'
import InlineStatusChanger from '../components/InlineStatusChanger'
import { initials, fmt, fmtDate } from '../utils/followup'

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DRAFT:          { label: 'Draft',          badge: 'bg-gray-100 text-gray-600',    border: 'border-l-gray-300',    dot: 'bg-gray-400'    },
  REQUESTED:      { label: 'Requested',      badge: 'bg-blue-100 text-blue-700',    border: 'border-l-blue-400',    dot: 'bg-blue-500'    },
  ACKNOWLEDGED:   { label: 'Acknowledged',   badge: 'bg-amber-100 text-amber-700',  border: 'border-l-amber-400',   dot: 'bg-amber-500'   },
  REFERRED:       { label: 'Referred',       badge: 'bg-purple-100 text-purple-700', border: 'border-l-purple-400', dot: 'bg-purple-500'  },
  INTERVIEWING:   { label: 'Interviewing',   badge: 'bg-indigo-100 text-indigo-700', border: 'border-l-indigo-400', dot: 'bg-indigo-500'  },
  OFFER_RECEIVED: { label: 'Offer Received', badge: 'bg-green-100 text-green-700',  border: 'border-l-green-400',   dot: 'bg-green-500'   },
  REJECTED:       { label: 'Rejected',       badge: 'bg-red-100 text-red-700',      border: 'border-l-red-400',     dot: 'bg-red-400'     },
  WITHDRAWN:      { label: 'Withdrawn',      badge: 'bg-orange-100 text-orange-700', border: 'border-l-orange-400', dot: 'bg-orange-400'  },
  DECLINED:       { label: 'Declined',       badge: 'bg-rose-100 text-rose-700',    border: 'border-l-rose-400',    dot: 'bg-rose-400'    },
}

const SORT_OPTIONS = [
  { value: 'createdAt',       label: 'Date Added'    },
  { value: 'referrerName',    label: 'Referrer Name' },
  { value: 'referrerCompany', label: 'Company'       },
  { value: 'targetRole',      label: 'Role'          },
  { value: 'status',          label: 'Status'        },
  { value: 'requestedDate',   label: 'Requested Date' },
  { value: 'followUpDate',    label: 'Follow-Up Date' },
  { value: 'updatedAt',       label: 'Last Updated'  },
]

const EMPTY_FORM = {
  referrerName: '', referrerEmail: '', referrerLinkedIn: '',
  referrerCompany: '', referrerJobTitle: '',
  targetRole: '', jobPostingUrl: '',
  relationshipContext: '', messageToReferrer: '',
  status: 'DRAFT', requestedDate: '', followUpDate: '', notes: '',
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

// ─── Inline Status Changer ────────────────────────────────────────────────────
function ReferralStatusChanger({ referral, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={referral}
      statusConfig={STATUS_CONFIG}
      defaultStatus="DRAFT"
      updateFn={updateReferral}
      onStatusChanged={onStatusChanged}
    />
  )
}

// ─── Referral Card (list row) ─────────────────────────────────────────────────
function ReferralCard({ referral, onView, onEdit, onDelete, onStatusChanged }) {
  const cfg = STATUS_CONFIG[referral.status] || STATUS_CONFIG.DRAFT
  const isOverdue = referral.followUpDate
    && new Date(referral.followUpDate) < new Date()
    && !['REFERRED', 'INTERVIEWING', 'OFFER_RECEIVED', 'REJECTED', 'WITHDRAWN', 'DECLINED'].includes(referral.status)

  return (
    <div
      onClick={() => onView(referral)}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${cfg.border} p-5 hover:shadow-md transition-all duration-200 cursor-pointer`}
    >
      <div className="flex items-start gap-4">

        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
          {initials(referral.referrerName)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-0.5">
            <h3 className="text-base font-bold text-gray-800">{referral.referrerName}</h3>
            <ReferralStatusChanger referral={referral} onStatusChanged={onStatusChanged} />
            {isOverdue && (
              <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                Follow-up overdue
              </span>
            )}
          </div>

          {(referral.referrerJobTitle || referral.referrerCompany) && (
            <p className="text-sm text-gray-500 mb-2">
              {referral.referrerJobTitle && <span className="font-medium text-gray-600">{referral.referrerJobTitle}</span>}
              {referral.referrerJobTitle && referral.referrerCompany && <span className="text-gray-400"> @ </span>}
              {referral.referrerCompany && <span>{referral.referrerCompany}</span>}
            </p>
          )}

          {/* Role + contact chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
              <Work sx={{ fontSize: 12 }} />{referral.targetRole}
            </span>
            {referral.referrerEmail && (
              <a href={`mailto:${referral.referrerEmail}`} onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition">
                <Email sx={{ fontSize: 12 }} />{referral.referrerEmail}
              </a>
            )}
            {referral.referrerLinkedIn && (
              <a href={referral.referrerLinkedIn} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition">
                <LinkedIn sx={{ fontSize: 12 }} />LinkedIn
              </a>
            )}
            {referral.jobPostingUrl && (
              <a href={referral.jobPostingUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition">
                <OpenInNew sx={{ fontSize: 12 }} />Job Posting
              </a>
            )}
            {referral.requestedDate && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
                Requested: {fmtDate(referral.requestedDate)}
              </span>
            )}
            {referral.followUpDate && (
              <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${
                isOverdue ? 'bg-red-50 text-red-500 font-semibold' : 'bg-purple-50 text-purple-600'
              }`}>
                Follow-up: {fmtDate(referral.followUpDate)}
              </span>
            )}
          </div>

          {referral.notes && (
            <p className="text-xs text-gray-400 line-clamp-1 italic">"{referral.notes}"</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(referral)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
            </svg>
            Edit
          </button>
          <button onClick={() => onDelete(referral)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Directory Card (compact grid view) ──────────────────────────────────────
function DirectoryCard({ referral, onView, onEdit, onDelete, onStatusChanged }) {
  const cfg = STATUS_CONFIG[referral.status] || STATUS_CONFIG.DRAFT
  const isOverdue = referral.followUpDate
    && new Date(referral.followUpDate) < new Date()
    && !['REFERRED', 'INTERVIEWING', 'OFFER_RECEIVED', 'REJECTED', 'WITHDRAWN', 'DECLINED'].includes(referral.status)

  return (
    <div
      onClick={() => onView(referral)}
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col overflow-hidden relative`}
    >
      {/* Status color bar at top */}
      <div className={`h-1 w-full ${cfg.dot}`} />

      {/* Card body */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">

        {/* Avatar + name + company */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${cfg.dot}`}>
            {initials(referral.referrerName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate leading-tight">{referral.referrerName}</p>
            {(referral.referrerJobTitle || referral.referrerCompany) && (
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {[referral.referrerJobTitle, referral.referrerCompany].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Role */}
        <div className="flex w-fit max-w-full items-center gap-1.5 bg-indigo-50 rounded-lg px-2.5 py-1.5">
          <Work sx={{ fontSize: 11 }} className="text-indigo-400 shrink-0" />
          <p className="text-xs font-semibold text-indigo-700 truncate max-w-[160px]">{referral.targetRole}</p>
        </div>

        {/* Status changer + overdue */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <ReferralStatusChanger referral={referral} onStatusChanged={onStatusChanged} />
          {isOverdue && (
            <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full shrink-0">Overdue</span>
          )}
        </div>

        {/* Contact + date row */}
        <div className="flex items-center gap-1.5 mt-auto pt-1" onClick={e => e.stopPropagation()}>
          {referral.referrerEmail && (
            <a href={`mailto:${referral.referrerEmail}`} title={referral.referrerEmail}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition">
              <Email sx={{ fontSize: 13 }} />
            </a>
          )}
          {referral.referrerLinkedIn && (
            <a href={referral.referrerLinkedIn} target="_blank" rel="noreferrer" title="LinkedIn"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition">
              <LinkedIn sx={{ fontSize: 13 }} />
            </a>
          )}
          {referral.jobPostingUrl && (
            <a href={referral.jobPostingUrl} target="_blank" rel="noreferrer" title="Job Posting"
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
              <OpenInNew sx={{ fontSize: 13 }} />
            </a>
          )}
          {referral.followUpDate && (
            <span className={`text-[11px] ml-auto font-medium ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
              {new Date(referral.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {referral.notes && (
          <p className="text-[11px] text-gray-400 line-clamp-1 italic leading-relaxed">"{referral.notes}"</p>
        )}
      </div>

      {/* Hover action overlay */}
      <div
        className="absolute inset-x-0 bottom-0 flex border-t border-gray-100 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => onEdit(referral)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z"/>
            <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V8.5a.75.75 0 0 1 1.5 0v2.75A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7.5a.75.75 0 0 1 0 1.5H4.75Z"/>
          </svg>
          Edit
        </button>
        <div className="w-px bg-gray-100" />
        <button onClick={() => onDelete(referral)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ open, referral, onClose, onEdit, onDelete, onStatusChanged }) {
  const [history, setHistory]       = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [noteText, setNoteText]     = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteError, setNoteError]   = useState('')
  const [editingNote, setEditingNote] = useState(null)   // { id, text }
  const [editSaving, setEditSaving] = useState(false)

  const loadHistory = useCallback((id) => {
    setHistLoading(true)
    getReferral(id)
      .then(r => setHistory(r.data.statusHistory ?? []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false))
  }, [])

  useEffect(() => {
    if (!open || !referral) return
    loadHistory(referral.id)
  }, [open, referral?.id, loadHistory])

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setNoteSubmitting(true)
    setNoteError('')
    try {
      const res = await manageNote(referral.id, { action: 'ADD', note: noteText.trim() })
      setHistory(res.data)
      setNoteText('')
    } catch (e) {
      setNoteError(e.response?.data?.message || 'Failed to add note')
    } finally {
      setNoteSubmitting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingNote?.text.trim()) return
    setEditSaving(true)
    try {
      const res = await manageNote(referral.id, { action: 'EDIT', noteId: editingNote.id, note: editingNote.text.trim() })
      setHistory(res.data)
      setEditingNote(null)
    } catch (e) {
      // keep editing open, show nothing — transient
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteNote = async (historyId) => {
    try {
      const res = await manageNote(referral.id, { action: 'DELETE', noteId: historyId })
      setHistory(res.data)
    } catch (e) {
      // silent — entry stays visible
    }
  }

  if (!open || !referral) return null

  const cfg = STATUS_CONFIG[referral.status] || STATUS_CONFIG.DRAFT
  const isOverdue = referral.followUpDate
    && new Date(referral.followUpDate) < new Date()
    && !['REFERRED', 'INTERVIEWING', 'OFFER_RECEIVED', 'REJECTED', 'WITHDRAWN', 'DECLINED'].includes(referral.status)

  const Row = ({ label, value }) =>
    value ? (
      <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-gray-700 flex-1 break-words">{value}</span>
      </div>
    ) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="rounded-t-2xl px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${cfg.dot}`}>
              {initials(referral.referrerName)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-800 leading-tight">{referral.referrerName}</h2>
              {(referral.referrerJobTitle || referral.referrerCompany) && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {[referral.referrerJobTitle, referral.referrerCompany].filter(Boolean).join(' @ ')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <ReferralStatusChanger referral={referral} onStatusChanged={updated => {
                  onStatusChanged(updated)
                  setHistory(updated.statusHistory ?? [])
                }} />
                {isOverdue && (
                  <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    Follow-up overdue
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0">
              <Close sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Role */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Role</p>
            <Row label="Target Role" value={
              <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700">
                <Work sx={{ fontSize: 14 }} />{referral.targetRole}
              </span>
            } />
            <Row label="Job Posting" value={referral.jobPostingUrl && (
              <a href={referral.jobPostingUrl} target="_blank" rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1">
                <OpenInNew sx={{ fontSize: 14 }} />View Posting
              </a>
            )} />
          </div>

          {/* Contact */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact</p>
            <Row label="Email" value={referral.referrerEmail && (
              <a href={`mailto:${referral.referrerEmail}`}
                className="text-blue-600 hover:underline flex items-center gap-1">
                <Email sx={{ fontSize: 14 }} />{referral.referrerEmail}
              </a>
            )} />
            <Row label="LinkedIn" value={referral.referrerLinkedIn && (
              <a href={referral.referrerLinkedIn} target="_blank" rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1">
                <LinkedIn sx={{ fontSize: 14 }} />View Profile
              </a>
            )} />
          </div>

          {/* Tracking */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tracking</p>
            <Row label="Requested" value={referral.requestedDate ? fmtDate(referral.requestedDate) : null} />
            <Row label="Follow-Up" value={referral.followUpDate
              ? <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                  {fmtDate(referral.followUpDate)}{isOverdue ? ' — overdue' : ''}
                </span>
              : null} />
            <Row label="Added On" value={referral.createdAt
              ? new Date(referral.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
              : null} />
            <Row label="Last Updated" value={referral.updatedAt ? fmt(referral.updatedAt) : null} />
          </div>

          {/* Timeline */}
          <div className="mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Timeline</p>
            {histLoading ? (
              <div className="flex justify-center py-4"><CircularProgress size={20} /></div>
            ) : history.length === 0 ? (
              <p className="text-xs text-gray-400 italic mb-3">No activity recorded yet.</p>
            ) : (
              <div className="space-y-0 mb-3">
                {history.map((entry, i) => {
                  const isLast = i === history.length - 1
                  const isEditingThis = editingNote?.id === entry.id

                  if (entry.noteOnly) {
                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center shrink-0 pt-1">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
                          {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
                        </div>
                        <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-3'}`}>
                          {isEditingThis ? (
                            <div className="flex gap-2 items-start">
                              <textarea
                                className="flex-1 text-xs border border-indigo-300 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                rows={2}
                                value={editingNote.text}
                                onChange={e => setEditingNote(n => ({ ...n, text: e.target.value }))}
                              />
                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={editSaving || !editingNote.text.trim()}
                                  className="text-[10px] font-semibold px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition">
                                  {editSaving ? '…' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingNote(null)}
                                  className="text-[10px] font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-1 group">
                              <p className="text-xs text-gray-600 flex-1 italic">"{entry.note}"</p>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                <button
                                  onClick={() => setEditingNote({ id: entry.id, text: entry.note })}
                                  className="p-0.5 text-gray-400 hover:text-indigo-600 transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                    <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z"/>
                                    <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V8.5a.75.75 0 0 1 1.5 0v2.75A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7.5a.75.75 0 0 1 0 1.5H4.75Z"/>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(entry.id)}
                                  className="p-0.5 text-gray-400 hover:text-red-500 transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] text-gray-400 mt-0.5">{fmt(entry.changedAt)}</p>
                        </div>
                      </div>
                    )
                  }

                  // Status change entry
                  const toCfg = STATUS_CONFIG[entry.toStatus] || STATUS_CONFIG.DRAFT
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${toCfg.dot}`} />
                        {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
                      </div>
                      <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-3'}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.fromStatus && (
                            <span className="text-xs text-gray-400 line-through">
                              {STATUS_CONFIG[entry.fromStatus]?.label || entry.fromStatus}
                            </span>
                          )}
                          {entry.fromStatus && <span className="text-gray-300 text-xs">→</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${toCfg.badge}`}>
                            {toCfg.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{fmt(entry.changedAt)}</p>
                        {entry.note && (
                          <p className="text-xs text-gray-500 italic mt-0.5">"{entry.note}"</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add note input */}
            <div className="flex gap-2 items-start">
              <textarea
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
                rows={2}
                placeholder="Add a note to the timeline…"
                value={noteText}
                onChange={e => { setNoteText(e.target.value); setNoteError('') }}
              />
              <button
                onClick={handleAddNote}
                disabled={noteSubmitting || !noteText.trim()}
                className="shrink-0 px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition">
                {noteSubmitting ? <CircularProgress size={12} sx={{ color: 'white' }} /> : 'Add'}
              </button>
            </div>
            {noteError && <p className="text-[11px] text-red-500 mt-1">{noteError}</p>}
          </div>

          {/* Relationship context */}
          {referral.relationshipContext && (
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">How You Know Them</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{referral.relationshipContext}</p>
              </div>
            </div>
          )}

          {/* Message to referrer */}
          {referral.messageToReferrer && (
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Message to Referrer</p>
              <div className="bg-blue-50 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{referral.messageToReferrer}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {referral.notes && (
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{referral.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={() => { onClose(); onEdit(referral) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-700 hover:text-white hover:border-gray-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
            </svg>
            Edit
          </button>
          <button
            onClick={() => { onClose(); onDelete(referral) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-500 bg-white border border-red-200 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition ml-auto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AddEditModal({ open, referral, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(referral ? {
        referrerName:        referral.referrerName        || '',
        referrerEmail:       referral.referrerEmail       || '',
        referrerLinkedIn:    referral.referrerLinkedIn    || '',
        referrerCompany:     referral.referrerCompany     || '',
        referrerJobTitle:    referral.referrerJobTitle    || '',
        targetRole:          referral.targetRole          || '',
        jobPostingUrl:       referral.jobPostingUrl       || '',
        relationshipContext: referral.relationshipContext || '',
        messageToReferrer:   referral.messageToReferrer   || '',
        status:              referral.status              || 'DRAFT',
        requestedDate:       referral.requestedDate       || '',
        followUpDate:        referral.followUpDate        || '',
        notes:               referral.notes               || '',
      } : EMPTY_FORM)
      setError('')
      setFieldErrors({})
    }
  }, [open, referral])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const payload = {
      referrerName:        form.referrerName.trim()        || undefined,
      referrerEmail:       form.referrerEmail.trim()       || undefined,
      referrerLinkedIn:    form.referrerLinkedIn.trim()    || undefined,
      referrerCompany:     form.referrerCompany.trim()     || undefined,
      referrerJobTitle:    form.referrerJobTitle.trim()    || undefined,
      targetRole:          form.targetRole.trim()          || undefined,
      jobPostingUrl:       form.jobPostingUrl.trim()       || undefined,
      relationshipContext: form.relationshipContext.trim() || undefined,
      messageToReferrer:   form.messageToReferrer.trim()   || undefined,
      status:              form.status                     || undefined,
      requestedDate:       form.requestedDate              || undefined,
      followUpDate:        form.followUpDate               || undefined,
      notes:               form.notes.trim()               || undefined,
    }
    try {
      referral ? await updateReferral(referral.id, payload) : await addReferral(payload)
      onSaved()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setFieldErrors(data.errors)
      else setError(data?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (field) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
    }`
  const FieldError = ({ field }) =>
    fieldErrors[field] ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p> : null

  return (
    <ModalShell
      open={open} onClose={onClose}
      title={referral ? 'Edit Referral Request' : 'New Referral Request'}
      subtitle={referral ? 'Update referral details' : 'Track a referral you are requesting'}
      maxWidth="max-w-2xl"
    >
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Referrer ── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Referrer Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.referrerName} onChange={set('referrerName')}
                placeholder="Jane Doe" maxLength={100} className={inputCls('referrerName')} required />
              <FieldError field="referrerName" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Company <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.referrerCompany} onChange={set('referrerCompany')}
                placeholder="Google" maxLength={150} className={inputCls('referrerCompany')} required />
              <FieldError field="referrerCompany" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job Title</label>
              <input type="text" value={form.referrerJobTitle} onChange={set('referrerJobTitle')}
                placeholder="Senior Engineer" maxLength={100} className={inputCls('referrerJobTitle')} />
              <FieldError field="referrerJobTitle" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={form.referrerEmail} onChange={set('referrerEmail')}
                placeholder="jane@google.com" maxLength={150} className={inputCls('referrerEmail')} />
              <FieldError field="referrerEmail" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">LinkedIn URL</label>
              <input type="url" value={form.referrerLinkedIn} onChange={set('referrerLinkedIn')}
                placeholder="https://linkedin.com/in/..." maxLength={300} className={inputCls('referrerLinkedIn')} />
              <FieldError field="referrerLinkedIn" />
            </div>
          </div>

          {/* ── Role ── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">Role Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Target Role <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.targetRole} onChange={set('targetRole')}
                placeholder="Software Engineer – Backend" maxLength={150} className={inputCls('targetRole')} required />
              <FieldError field="targetRole" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job Posting URL</label>
              <input type="url" value={form.jobPostingUrl} onChange={set('jobPostingUrl')}
                placeholder="https://careers.google.com/..." maxLength={500} className={inputCls('jobPostingUrl')} />
              <FieldError field="jobPostingUrl" />
            </div>
          </div>

          {/* ── Context & Message ── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">Context & Message</p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">How do you know them?</label>
            <textarea value={form.relationshipContext} onChange={set('relationshipContext')} rows={2}
              maxLength={1000} placeholder="e.g. College classmate, previous coworker, LinkedIn connection..."
              className={`${inputCls('relationshipContext')} resize-none`} />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.relationshipContext.length}/1000</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message to Referrer</label>
            <textarea value={form.messageToReferrer} onChange={set('messageToReferrer')} rows={4}
              maxLength={3000} placeholder="Hi Jane, I hope you're doing well! I noticed Google is hiring for..."
              className={`${inputCls('messageToReferrer')} resize-none`} />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.messageToReferrer.length}/3000</p>
          </div>

          {/* ── Tracking ── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">Tracking</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls('status')}>
                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date Requested</label>
              <input type="date" value={form.requestedDate} onChange={set('requestedDate')}
                className={inputCls('requestedDate')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Follow-Up Date</label>
              <input type="date" value={form.followUpDate} onChange={set('followUpDate')}
                className={inputCls('followUpDate')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              maxLength={2000} placeholder="Any extra context, reminders, or outcomes..."
              className={`${inputCls('notes')} resize-none`} />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.notes.length}/2000</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {saving && <CircularProgress size={14} color="inherit" />}
              {referral ? 'Save Changes' : 'Add Referral Request'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Referrals() {
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy]           = useState('createdAt')
  const [order, setOrder]             = useState('desc')

  const [viewMode, setViewMode]       = useState('list')

  const [modalOpen, setModalOpen]     = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget]   = useState(null)

  const fetchReferrals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReferrals({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        sortBy, order,
      })
      setReferrals(res.data)
    } catch {
      setError('Failed to load referral requests.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sortBy, order])

  useEffect(() => { fetchReferrals() }, [fetchReferrals])

  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (r) => { setEditTarget(r); setModalOpen(true) }

  const handleSaved = () => {
    setModalOpen(false)
    setSuccess(editTarget ? 'Referral request updated.' : 'Referral request added.')
    fetchReferrals()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleStatusChanged = (updated) => {
    setReferrals(prev => prev.map(r => r.id === updated.id ? updated : r))
    if (viewTarget?.id === updated.id) setViewTarget(updated)
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setViewTarget(null)
    setSuccess('Referral request removed.')
    fetchReferrals()
    setTimeout(() => setSuccess(''), 3000)
  }

  const isFiltered = search.trim() || statusFilter

  return (
    <Layout>
      <PageHeader
        title="Referral Requests"
        subtitle="Track who you've asked for referrals and their outcomes"
        action={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
            <Add fontSize="small" />New Request
          </button>
        }
      />

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Status summary bar */}
      {!loading && referrals.length > 0 && (
        <StatusSummaryBar
          items={referrals}
          statusConfig={STATUS_CONFIG}
          activeFilter={statusFilter}
          onFilter={setStatusFilter}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex">
            <Search fontSize="small" />
          </span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, role or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition" />
        </div>

        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition cursor-pointer">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <KeyboardArrowDown fontSize="small" />
          </span>
        </div>

        <div className="relative">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <KeyboardArrowDown fontSize="small" />
          </span>
        </div>

        <button onClick={() => setOrder(o => o === 'desc' ? 'asc' : 'desc')}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition bg-white whitespace-nowrap">
          {order === 'desc' ? '↓ Desc' : '↑ Asc'}
        </button>

        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><CircularProgress /></div>
      ) : referrals.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={isFiltered ? 'No referrals match your filters' : 'No referral requests yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Start tracking who you are asking for referrals.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
              Add your first request
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            {referrals.length} {referrals.length === 1 ? 'request' : 'requests'}
          </p>
          {referrals.map(r => (
            <ReferralCard key={r.id} referral={r}
              onView={setViewTarget}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onStatusChanged={handleStatusChanged}
            />
          ))}
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-4">
            {referrals.length} {referrals.length === 1 ? 'request' : 'requests'}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {referrals.map(r => (
              <DirectoryCard key={r.id} referral={r}
                onView={setViewTarget}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onStatusChanged={handleStatusChanged}
              />
            ))}
          </div>
        </div>
      )}

      <AddEditModal open={modalOpen} referral={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteReferral(deleteTarget.id); handleDeleted() }}
        title="Delete Referral Request"
        message={deleteTarget && (
          <>Remove referral request from <span className="font-semibold text-gray-700">{deleteTarget.referrerName}</span> for <span className="font-semibold text-gray-700">{deleteTarget.targetRole}</span>?</>
        )}
      />

      <DetailModal
        open={!!viewTarget}
        referral={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={r => { setEditTarget(r); setModalOpen(true) }}
        onDelete={r => setDeleteTarget(r)}
        onStatusChanged={handleStatusChanged}
      />
    </Layout>
  )
}
