import { useState, useEffect, useCallback, useRef } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import {
  Add, Search, KeyboardArrowDown, LinkedIn, Email, Phone,
  Close, Send, Check, Clear, EditNote,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { getRecruiters, getRecruiter, addRecruiter, updateRecruiter, deleteRecruiter } from '../api/recruiter'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  NEW:               { label: 'New',               badge: 'bg-gray-100 text-gray-600',   border: 'border-l-gray-300',   dot: 'bg-gray-400'   },
  REACHED_OUT:       { label: 'Reached Out',       badge: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400',   dot: 'bg-blue-500'   },
  RESPONDED:         { label: 'Responded',         badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-400',  dot: 'bg-amber-500'  },
  MEETING_SCHEDULED: { label: 'Meeting Scheduled', badge: 'bg-purple-100 text-purple-700', border: 'border-l-purple-400', dot: 'bg-purple-500' },
  ACTIVELY_HELPING:  { label: 'Actively Helping',  badge: 'bg-green-100 text-green-700', border: 'border-l-green-400',  dot: 'bg-green-500'  },
  CLOSED:            { label: 'Closed',            badge: 'bg-red-100 text-red-700',     border: 'border-l-red-400',    dot: 'bg-red-400'    },
}

const SOURCE_LABELS = {
  LINKEDIN: 'LinkedIn', EMAIL: 'Email', REFERRAL: 'Referral',
  JOB_FAIR: 'Job Fair', COLD_OUTREACH: 'Cold Outreach',
  COMPANY_WEBSITE: 'Company Website', OTHER: 'Other',
}

const SORT_OPTIONS = [
  { value: 'createdAt',       label: 'Date Added' },
  { value: 'name',            label: 'Name' },
  { value: 'company',         label: 'Company' },
  { value: 'status',          label: 'Status' },
  { value: 'lastContactedAt', label: 'Last Contacted' },
  { value: 'updatedAt',       label: 'Last Updated' },
]

const EMPTY_FORM = {
  name: '', email: '', phone: '', linkedIn: '',
  company: '', jobTitle: '', status: 'NEW', source: '',
  lastContactedAt: '', notes: '',
}

const NOTE_MAX = 1000

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function fmt(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEW
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

// ─── Recruiter Card ───────────────────────────────────────────────────────────
function RecruiterCard({ recruiter, onView, onEdit, onDelete, onNotes }) {
  const noteCount = recruiter.noteCount ?? 0
  const cfg = STATUS_CONFIG[recruiter.status] || STATUS_CONFIG.NEW

  return (
    <div
      onClick={() => onView(recruiter)}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${cfg.border} p-5 hover:shadow-md transition-all duration-200 cursor-pointer`}
    >
      <div className="flex items-start gap-4">

        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
          {initials(recruiter.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-0.5">
            <h3 className="text-base font-bold text-gray-800">{recruiter.name}</h3>
            <StatusBadge status={recruiter.status} />
          </div>

          {(recruiter.jobTitle || recruiter.company) && (
            <p className="text-sm text-gray-500 mb-2">
              {recruiter.jobTitle && <span className="font-medium text-gray-600">{recruiter.jobTitle}</span>}
              {recruiter.jobTitle && recruiter.company && <span className="text-gray-400"> @ </span>}
              {recruiter.company && <span>{recruiter.company}</span>}
            </p>
          )}

          {/* Contact chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            {recruiter.email && (
              <a href={`mailto:${recruiter.email}`} onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition">
                <Email sx={{ fontSize: 12 }} />{recruiter.email}
              </a>
            )}
            {recruiter.phone && (
              <a href={`tel:${recruiter.phone}`} onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition">
                <Phone sx={{ fontSize: 12 }} />{recruiter.phone}
              </a>
            )}
            {recruiter.linkedIn && (
              <a href={recruiter.linkedIn} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition">
                <LinkedIn sx={{ fontSize: 12 }} />LinkedIn
              </a>
            )}
            {recruiter.source && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
                via {SOURCE_LABELS[recruiter.source] || recruiter.source}
              </span>
            )}
            {recruiter.lastContactedAt && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full">
                Last contact: {new Date(recruiter.lastContactedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {recruiter.notes && (
            <p className="text-xs text-gray-400 line-clamp-1 italic">"{recruiter.notes}"</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Notes button */}
          <button onClick={() => onNotes(recruiter)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
              border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white hover:border-blue-600">
            <EditNote sx={{ fontSize: 15 }} />
            Notes
            {noteCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {noteCount}
              </span>
            )}
          </button>

          <div className="flex gap-1.5">
            {/* Edit button */}
            <button onClick={() => onEdit(recruiter)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
              </svg>
              Edit
            </button>

            {/* Delete button */}
            <button onClick={() => onDelete(recruiter)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Directory Card (compact grid view) ──────────────────────────────────────
function DirectoryCard({ recruiter, onView, onEdit, onDelete, onNotes }) {
  const cfg = STATUS_CONFIG[recruiter.status] || STATUS_CONFIG.NEW
  const noteCount = recruiter.noteCount ?? 0

  return (
    <div
      onClick={() => onView(recruiter)}
      className={`bg-white rounded-xl border border-gray-100 border-t-4 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-3`}
      style={{ borderTopColor: borderColor(recruiter.status) }}
    >
      {/* Top: avatar + name */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
          {initials(recruiter.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{recruiter.name}</p>
          {(recruiter.jobTitle || recruiter.company) && (
            <p className="text-xs text-gray-400 truncate">
              {[recruiter.jobTitle, recruiter.company].filter(Boolean).join(' @ ')}
            </p>
          )}
        </div>
      </div>

      {/* Status badge */}
      <StatusBadge status={recruiter.status} />

      {/* Quick contact icons */}
      <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {recruiter.email && (
          <a href={`mailto:${recruiter.email}`} title={recruiter.email}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition">
            <Email sx={{ fontSize: 14 }} />
          </a>
        )}
        {recruiter.phone && (
          <a href={`tel:${recruiter.phone}`} title={recruiter.phone}
            className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition">
            <Phone sx={{ fontSize: 14 }} />
          </a>
        )}
        {recruiter.linkedIn && (
          <a href={recruiter.linkedIn} target="_blank" rel="noreferrer" title="LinkedIn"
            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
            <LinkedIn sx={{ fontSize: 14 }} />
          </a>
        )}
        {recruiter.source && (
          <span className="text-[11px] text-gray-400 italic ml-auto">
            {SOURCE_LABELS[recruiter.source] || recruiter.source}
          </span>
        )}
      </div>

      {/* Footer: note count + actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onNotes(recruiter)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition">
          <EditNote sx={{ fontSize: 14 }} />
          {noteCount > 0 ? `${noteCount} note${noteCount > 1 ? 's' : ''}` : 'Notes'}
        </button>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => onEdit(recruiter)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
              <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
            </svg>
          </button>
          <button onClick={() => onDelete(recruiter)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function borderColor(status) {
  const map = {
    NEW: '#9ca3af', REACHED_OUT: '#60a5fa', RESPONDED: '#fbbf24',
    MEETING_SCHEDULED: '#a78bfa', ACTIVELY_HELPING: '#4ade80', CLOSED: '#f87171',
  }
  return map[status] || map.NEW
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ open, recruiterId, onClose, onEdit, onNotes, onDelete }) {
  const [recruiter, setRecruiter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !recruiterId) return
    setLoading(true)
    setError('')
    setRecruiter(null)
    getRecruiter(recruiterId)
      .then((res) => setRecruiter(res.data[0] ?? null))
      .catch(() => setError('Failed to load recruiter details.'))
      .finally(() => setLoading(false))
  }, [open, recruiterId])

  if (!open) return null

  const cfg = recruiter ? (STATUS_CONFIG[recruiter.status] || STATUS_CONFIG.NEW) : STATUS_CONFIG.NEW

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
        <div className={`rounded-t-2xl px-6 pt-6 pb-5 border-b border-gray-100`}>
          {loading ? (
            <div className="flex justify-center py-4"><CircularProgress size={24} /></div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : recruiter ? (
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${cfg.dot}`}>
                {initials(recruiter.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-800 leading-tight">{recruiter.name}</h2>
                {(recruiter.jobTitle || recruiter.company) && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {[recruiter.jobTitle, recruiter.company].filter(Boolean).join(' @ ')}
                  </p>
                )}
                <div className="mt-2">
                  <StatusBadge status={recruiter.status} />
                </div>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0">
                <Close sx={{ fontSize: 18 }} />
              </button>
            </div>
          ) : null}
        </div>

        {/* Body */}
        {recruiter && !loading && (
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* Contact info */}
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact</p>
              <Row label="Email"
                value={recruiter.email && (
                  <a href={`mailto:${recruiter.email}`}
                    className="text-blue-600 hover:underline flex items-center gap-1">
                    <Email sx={{ fontSize: 14 }} />{recruiter.email}
                  </a>
                )}
              />
              <Row label="Phone"
                value={recruiter.phone && (
                  <a href={`tel:${recruiter.phone}`}
                    className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
                    <Phone sx={{ fontSize: 14 }} />{recruiter.phone}
                  </a>
                )}
              />
              <Row label="LinkedIn"
                value={recruiter.linkedIn && (
                  <a href={recruiter.linkedIn} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1">
                    <LinkedIn sx={{ fontSize: 14 }} />View Profile
                  </a>
                )}
              />
            </div>

            {/* Details */}
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Details</p>
              <Row label="Source" value={recruiter.source ? SOURCE_LABELS[recruiter.source] || recruiter.source : null} />
              <Row label="Last Contacted" value={
                recruiter.lastContactedAt
                  ? new Date(recruiter.lastContactedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : null
              } />
              <Row label="Added On" value={
                recruiter.createdAt
                  ? new Date(recruiter.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : null
              } />
              <Row label="Last Updated" value={
                recruiter.updatedAt
                  ? fmt(recruiter.updatedAt)
                  : null
              } />
            </div>

            {/* General notes */}
            {recruiter.notes && (
              <div className="mb-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">General Notes</p>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{recruiter.notes}</p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer actions */}
        {recruiter && !loading && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={() => { onClose(); onNotes(recruiter) }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition">
              <EditNote sx={{ fontSize: 16 }} />Notes
              {recruiter.noteCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {recruiter.noteCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { onClose(); onEdit(recruiter) }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-700 hover:text-white hover:border-gray-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
              </svg>
              Edit
            </button>
            <button
              onClick={() => { onClose(); onDelete(recruiter) }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-500 bg-white border border-red-200 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd"/>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Notes Modal ──────────────────────────────────────────────────────────────
function NotesModal({ open, recruiter, onClose, onNotesChanged }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [editing, setEditing] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const loadNotes = useCallback(async () => {
    if (!recruiter) return
    setLoading(true)
    setError('')
    try {
      const res = await getRecruiter(recruiter.id)
      setNotes(res.data[0]?.interactionNotes ?? [])
    } catch {
      setError('Failed to load notes.')
    } finally {
      setLoading(false)
    }
  }, [recruiter])

  useEffect(() => {
    if (open && recruiter) {
      setDraft('')
      setAddError('')
      setEditing({})
      setDeleteConfirm(null)
      loadNotes()
    }
  }, [open, recruiter, loadNotes])

  useEffect(() => {
    if (notes.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes])

  if (!open || !recruiter) return null

  const patchAndSync = async (payload) => {
    const res = await updateRecruiter(recruiter.id, payload)
    const updated = res.data
    setNotes(updated.interactionNotes ?? [])
    onNotesChanged(recruiter.id, updated.noteCount)
    return updated
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) { setAddError('Note cannot be empty.'); return }
    if (text.length > NOTE_MAX) { setAddError(`Max ${NOTE_MAX} characters.`); return }
    setAdding(true)
    setAddError('')
    try {
      await patchAndSync({ addNote: text })
      setDraft('')
      textareaRef.current?.focus()
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add note.')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (note) => {
    setEditing((p) => ({ ...p, [note.id]: { text: note.content, saving: false, error: '' } }))
    setDeleteConfirm(null)
  }
  const cancelEdit = (id) =>
    setEditing((p) => { const n = { ...p }; delete n[id]; return n })

  const saveEdit = async (noteId) => {
    const text = editing[noteId]?.text?.trim() ?? ''
    if (!text) { setEditing((p) => ({ ...p, [noteId]: { ...p[noteId], error: 'Cannot be empty.' } })); return }
    if (text.length > NOTE_MAX) { setEditing((p) => ({ ...p, [noteId]: { ...p[noteId], error: `Max ${NOTE_MAX} chars.` } })); return }
    setEditing((p) => ({ ...p, [noteId]: { ...p[noteId], saving: true, error: '' } }))
    try {
      await patchAndSync({ editNote: { id: noteId, content: text } })
      cancelEdit(noteId)
    } catch (err) {
      setEditing((p) => ({ ...p, [noteId]: { ...p[noteId], saving: false, error: err.response?.data?.message || 'Failed.' } }))
    }
  }

  const handleDelete = async (noteId) => {
    setDeleting(true)
    try {
      await patchAndSync({ deleteNoteId: noteId })
      setDeleteConfirm(null)
    } catch {
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  const cfg = STATUS_CONFIG[recruiter.status] || STATUS_CONFIG.NEW

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
            {initials(recruiter.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 leading-tight">{recruiter.name}</h2>
            <p className="text-xs text-gray-400 truncate">
              {[recruiter.jobTitle, recruiter.company].filter(Boolean).join(' @ ') || 'Interaction log'}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <Close sx={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Notes timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-12"><CircularProgress size={28} /></div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <EditNote sx={{ fontSize: 28, color: '#3b82f6' }} />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">No interaction notes yet</p>
              <p className="text-xs text-gray-400">Start logging your interactions below.</p>
            </div>
          ) : (
            notes.map((note) => {
              const isEditing = !!editing[note.id]
              const isConfirmDelete = deleteConfirm === note.id

              return (
                <div key={note.id} className="group relative">
                  {isEditing ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                      <textarea
                        rows={3}
                        value={editing[note.id].text}
                        onChange={(e) => setEditing((p) => ({ ...p, [note.id]: { ...p[note.id], text: e.target.value } }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${editing[note.id].text.length > NOTE_MAX ? 'text-red-500' : 'text-gray-400'}`}>
                          {editing[note.id].text.length}/{NOTE_MAX}
                          {editing[note.id].error && <span className="ml-2 text-red-500">{editing[note.id].error}</span>}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(note.id)} disabled={editing[note.id].saving}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
                            {editing[note.id].saving ? <CircularProgress size={10} color="inherit" /> : <Check sx={{ fontSize: 13 }} />}
                            Save
                          </button>
                          <button onClick={() => cancelEdit(note.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                            <Clear sx={{ fontSize: 13 }} />Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : isConfirmDelete ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-700 mb-1">Delete this note?</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 italic">"{note.content}"</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(note.id)} disabled={deleting}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-60">
                          {deleting && <CircularProgress size={10} color="inherit" />}Yes, Delete
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        <div className="w-px flex-1 bg-gray-100 mt-1" />
                      </div>

                      {/* Bubble */}
                      <div className="flex-1 min-w-0 mb-2">
                        <div className="bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-colors">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1 px-1">
                          <span className="text-[11px] text-gray-400">
                            {fmt(note.createdAt)}
                            {note.edited && <span className="ml-1.5 text-gray-400 italic">(edited)</span>}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(note)}
                              className="flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
                                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                              </svg>
                              Edit
                            </button>
                            <button onClick={() => { setDeleteConfirm(note.id); cancelEdit(note.id) }}
                              className="flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Add note */}
        <div className="px-6 pb-5 pt-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
          {addError && <p className="text-xs text-red-500 mb-2">{addError}</p>}
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                rows={2}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setAddError('') }}
                placeholder='"Sent referral request on LinkedIn."'
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none transition ${
                  draft.length > NOTE_MAX ? 'border-red-400' : 'border-gray-200'
                }`}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(e) } }}
              />
              <div className="flex justify-between mt-1 px-1">
                <p className="text-[11px] text-gray-400">Enter to submit · Shift+Enter for new line</p>
                <p className={`text-[11px] ${draft.length > NOTE_MAX ? 'text-red-500' : 'text-gray-400'}`}>
                  {draft.length}/{NOTE_MAX}
                </p>
              </div>
            </div>
            <button type="submit" disabled={adding || !draft.trim()}
              className="mb-5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-sm">
              {adding ? <CircularProgress size={14} color="inherit" /> : <Send sx={{ fontSize: 16 }} />}
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Add / Edit Recruiter Modal ───────────────────────────────────────────────
function AddEditModal({ open, recruiter, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(recruiter ? {
        name: recruiter.name || '', email: recruiter.email || '',
        phone: recruiter.phone || '', linkedIn: recruiter.linkedIn || '',
        company: recruiter.company || '', jobTitle: recruiter.jobTitle || '',
        status: recruiter.status || 'NEW', source: recruiter.source || '',
        lastContactedAt: recruiter.lastContactedAt || '', notes: recruiter.notes || '',
      } : EMPTY_FORM)
      setError('')
      setFieldErrors({})
    }
  }, [open, recruiter])

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.'
    if (form.phone && !/^[+]?[0-9()\-\s.]{7,20}$/.test(form.phone)) errs.phone = 'Enter a valid phone (7–20 digits).'
    if (form.linkedIn && !/^https?:\/\/.+/.test(form.linkedIn)) errs.linkedIn = 'Must start with http:// or https://'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(), email: form.email.trim() || null,
      phone: form.phone.trim() || null, linkedIn: form.linkedIn.trim() || null,
      company: form.company.trim() || null, jobTitle: form.jobTitle.trim() || null,
      status: form.status || 'NEW', source: form.source || null,
      lastContactedAt: form.lastContactedAt || null, notes: form.notes.trim() || null,
    }
    try {
      recruiter ? await updateRecruiter(recruiter.id, payload) : await addRecruiter(payload)
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
      title={recruiter ? 'Edit Recruiter Contact' : 'Add Recruiter Contact'}
      subtitle={recruiter ? 'Update contact information' : 'Add a new recruiter to your network'}
    >
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name} onChange={set('name')}
              placeholder="e.g. Priya Sharma" className={inputCls('name')} />
            <FieldError field="name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job Title</label>
              <input type="text" value={form.jobTitle} onChange={set('jobTitle')}
                placeholder="Technical Recruiter" className={inputCls('jobTitle')} />
              <FieldError field="jobTitle" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company</label>
              <input type="text" value={form.company} onChange={set('company')}
                placeholder="e.g. Google" className={inputCls('company')} />
              <FieldError field="company" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="priya@google.com" className={inputCls('email')} />
            <FieldError field="email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+91 98765 43210" className={inputCls('phone')} />
              <FieldError field="phone" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">LinkedIn URL</label>
              <input type="url" value={form.linkedIn} onChange={set('linkedIn')}
                placeholder="https://linkedin.com/in/..." className={inputCls('linkedIn')} />
              <FieldError field="linkedIn" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls('status')}>
                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Source</label>
              <select value={form.source} onChange={set('source')} className={inputCls('source')}>
                <option value="">— Select —</option>
                {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Last Contacted</label>
            <input type="date" value={form.lastContactedAt} onChange={set('lastContactedAt')}
              max={new Date().toISOString().split('T')[0]} className={inputCls('lastContactedAt')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">General Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Background info, referrals, context..."
              className={`${inputCls('notes')} resize-none`} />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.notes.length}/2000</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {saving && <CircularProgress size={14} color="inherit" />}
              {recruiter ? 'Save Changes' : 'Add Recruiter'}
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

// ─── Delete Recruiter Modal ───────────────────────────────────────────────────
function DeleteModal({ open, recruiter, onClose, onDeleted }) {
  return (
    <ConfirmDeleteModal
      open={open && !!recruiter}
      onClose={onClose}
      onConfirm={async () => { await deleteRecruiter(recruiter.id); onDeleted() }}
      title="Delete Recruiter Contact"
      message={
        <>
          Remove <span className="font-semibold text-gray-700">{recruiter?.name}</span> and all interaction notes?
          <span className="block text-xs text-red-500 mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Recruiters() {
  const [recruiters, setRecruiters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')

  const [viewMode, setViewMode] = useState('list') // 'list' | 'directory'

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notesTarget, setNotesTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)

  const fetchRecruiters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getRecruiters({ search: search.trim() || undefined, status: statusFilter || undefined, sortBy, order })
      setRecruiters(res.data)
    } catch {
      setError('Failed to load recruiter contacts.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sortBy, order])

  useEffect(() => { fetchRecruiters() }, [fetchRecruiters])

  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (r) => { setEditTarget(r); setModalOpen(true) }

  const handleSaved = () => {
    setModalOpen(false)
    setSuccess(editTarget ? 'Recruiter contact updated.' : 'Recruiter contact added.')
    fetchRecruiters()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setSuccess('Recruiter contact removed.')
    fetchRecruiters()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleNotesChanged = (recruiterId, newCount) => {
    setRecruiters((prev) => prev.map((r) => r.id === recruiterId ? { ...r, noteCount: newCount } : r))
  }

  const isFiltered = search.trim() || statusFilter


  // For directory: group alphabetically
  const grouped = recruiters.reduce((acc, r) => {
    const letter = r.name[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(r)
    return acc
  }, {})
  const sortedLetters = Object.keys(grouped).sort()

  const cardProps = {
    onView: (rec) => setViewTarget(rec.id),
    onEdit: openEdit,
    onDelete: setDeleteTarget,
    onNotes: setNotesTarget,
  }

  return (
    <Layout>
      <PageHeader
        title="Recruiter Directory"
        subtitle="Your complete recruiter network at a glance"
        action={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
            <Add fontSize="small" />Add Recruiter
          </button>
        }
      />

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Status summary bar */}
      {!loading && recruiters.length > 0 && (
        <StatusSummaryBar
          items={recruiters}
          statusConfig={STATUS_CONFIG}
          activeFilter={statusFilter}
          onFilter={setStatusFilter}
        />
      )}

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex">
            <Search fontSize="small" />
          </span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition" />
        </div>

        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
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
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition cursor-pointer">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <KeyboardArrowDown fontSize="small" />
          </span>
        </div>

        <button onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition bg-white whitespace-nowrap">
          {order === 'desc' ? '↓ Desc' : '↑ Asc'}
        </button>

        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><CircularProgress /></div>
      ) : recruiters.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={isFiltered ? 'No recruiters match your filters' : 'No recruiter contacts yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Start building your recruiter network.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
              Add your first recruiter
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            {recruiters.length} {recruiters.length === 1 ? 'recruiter' : 'recruiters'}
          </p>
          {recruiters.map((r) => (
            <RecruiterCard key={r.id} recruiter={r} {...cardProps} />
          ))}
        </div>
      ) : (
        /* Directory view — alphabetical groups */
        <div>
          <p className="text-xs text-gray-400 font-medium mb-4">
            {recruiters.length} {recruiters.length === 1 ? 'recruiter' : 'recruiters'}
          </p>
          {sortedLetters.map((letter) => (
            <div key={letter} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {letter}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">{grouped[letter].length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[letter].map((r) => (
                  <DirectoryCard key={r.id} recruiter={r} {...cardProps} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEditModal open={modalOpen} recruiter={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} recruiter={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <NotesModal open={!!notesTarget} recruiter={notesTarget}
        onClose={() => setNotesTarget(null)} onNotesChanged={handleNotesChanged} />
      <DetailModal
        open={!!viewTarget}
        recruiterId={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(r) => { setEditTarget(r); setModalOpen(true) }}
        onNotes={(r) => setNotesTarget(r)}
        onDelete={(r) => setDeleteTarget(r)}
      />
    </Layout>
  )
}
