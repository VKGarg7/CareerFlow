import { useState, useEffect, useCallback } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import { Add, Close } from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { getApplications, addApplication, updateApplication, deleteApplication, uploadApplicationDocuments, downloadApplicationDocument, viewApplicationDocument } from '../api/application'
import { getCompanies } from '../api/company'
import { getProfile } from '../api/user'
import { getFollowUpsForApplication, createFollowUp, updateFollowUp, deleteFollowUp } from '../api/followup'
import { getInterviewsForApplication, createInterview, updateInterview, deleteInterview } from '../api/interview'
import { todayStr, fmtDate, initials } from '../utils/followup'
import RescheduleInline from '../components/RescheduleInline'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'
import CompanyDetailModal from '../components/CompanyDetailModal'
import InlineStatusChanger from '../components/InlineStatusChanger'

const STATUS_CONFIG = {
  SAVED:               { label: 'Saved',               badge: 'bg-gray-100 text-gray-600',    border: 'border-l-gray-300',    dot: 'bg-gray-400'    },
  APPLIED:             { label: 'Applied',             badge: 'bg-blue-100 text-blue-700',    border: 'border-l-blue-400',    dot: 'bg-blue-500'    },
  OA_SCHEDULED:        { label: 'OA Scheduled',        badge: 'bg-amber-100 text-amber-700',  border: 'border-l-amber-400',   dot: 'bg-amber-500'   },
  OA_CLEARED:          { label: 'OA Cleared',          badge: 'bg-cyan-100 text-cyan-700',    border: 'border-l-cyan-400',    dot: 'bg-cyan-500'    },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', badge: 'bg-purple-100 text-purple-700', border: 'border-l-purple-400', dot: 'bg-purple-500'  },
  INTERVIEW_CLEARED:   { label: 'Interview Cleared',   badge: 'bg-violet-100 text-violet-700', border: 'border-l-violet-400', dot: 'bg-violet-500'  },
  OFFER_RECEIVED:      { label: 'Offer Received',      badge: 'bg-green-100 text-green-700',  border: 'border-l-green-400',   dot: 'bg-green-500'   },
  REJECTED:            { label: 'Rejected',            badge: 'bg-red-100 text-red-700',      border: 'border-l-red-400',     dot: 'bg-red-400'     },
  JOINED:              { label: 'Joined',              badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-400', dot: 'bg-emerald-500' },
}

const SOURCE_LABELS = {
  CAREERS_PAGE: 'Careers Page', LINKEDIN: 'LinkedIn', REFERRAL: 'Referral',
  NAUKRI: 'Naukri', INTERNSHALA: 'Internshala', JOB_PORTAL: 'Job Portal', OTHER: 'Other',
}

const SORT_OPTIONS = [
  { value: 'applicationDate', label: 'Date',    clientSide: false },
  { value: 'company',         label: 'Company', clientSide: true  },
  { value: 'status',          label: 'Status',  clientSide: false },
  { value: 'createdAt',       label: 'Added',   clientSide: false },
]

const EMPTY_FORM = {
  companyId: '', role: '',
  applicationDate: new Date().toISOString().slice(0, 10),
  deadline: '',
  source: '', status: 'SAVED', expectedSalary: '', notes: '',
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.APPLIED
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

// ─── Inline Status Changer ────────────────────────────────────────────────────
function AppStatusChanger({ app, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={app}
      statusConfig={STATUS_CONFIG}
      defaultStatus="SAVED"
      updateFn={(id, payload) => updateApplication(id, payload)}
      onStatusChanged={onStatusChanged}
    />
  )
}

// ─── Application List Card ────────────────────────────────────────────────────
function ApplicationCard({ app, onView, onEdit, onDelete, onFollowUp, onCompany, onStatusChanged }) {
  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED
  return (
    <div onClick={() => onView(app)} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${cfg.border} p-5 hover:shadow-md transition-all duration-200 cursor-pointer`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
          {initials(app.companyName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="min-w-0 mb-2">
            <span className="block w-full text-base font-bold text-gray-800 truncate mb-1.5">
              {app.companyName}
            </span>
            <div><AppStatusChanger app={app} onStatusChanged={onStatusChanged} /></div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">💼 {app.role}</p>
          <div className="flex flex-wrap gap-2">
            {app.applicationDate && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
                📅 {new Date(app.applicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {app.source && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
                via {SOURCE_LABELS[app.source] || app.source}
              </span>
            )}
            {app.expectedSalary && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-full">
                💰 {app.expectedSalary}
              </span>
            )}
            {app.deadline && (() => {
              const today = new Date().toISOString().slice(0, 10)
              const daysLeft = Math.round((new Date(app.deadline) - new Date(today)) / 86400000)
              const isUrgent = daysLeft <= 3
              const isPast   = daysLeft < 0
              return (
                <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
                  isPast ? 'bg-red-100 text-red-600' : isUrgent ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'
                }`}>
                  ⏰ {isPast ? 'Deadline passed' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                </span>
              )
            })()}
            {app.nextFollowUpDate && (() => {
              const today = new Date().toISOString().slice(0, 10)
              const isOverdue = app.nextFollowUpDate < today
              const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              const showUpcoming = isOverdue && app.nextUpcomingFollowUpDate && app.nextUpcomingFollowUpDate !== app.nextFollowUpDate
              return (
                <>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onFollowUp(app) }} className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium hover:opacity-80 transition ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    🔔 {fmt(app.nextFollowUpDate)}
                    {isOverdue && <span className="ml-1 text-[10px] font-bold">Overdue</span>}
                  </button>
                  {showUpcoming && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onFollowUp(app) }} className="inline-flex items-center text-xs px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full font-medium hover:opacity-80 transition">
                      🔔 {fmt(app.nextUpcomingFollowUpDate)}
                    </button>
                  )}
                </>
              )
            })()}
            {app.resume && (
              <button type="button"
                onClick={(e) => { e.stopPropagation(); triggerDocView(app.resume) }}
                className="inline-flex items-center text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition"
                title={`View ${app.resume.originalName}`}>
                📄 {app.resume.originalName.replace(/\.[^/.]+$/, '')}
              </button>
            )}
            {app.coverLetter && (
              <button type="button" onClick={(e) => { e.stopPropagation(); triggerDocView(app.coverLetter) }}
                className="inline-flex items-center text-xs px-2.5 py-1 bg-violet-50 text-violet-600 rounded-full hover:bg-violet-100 transition"
                title={`View ${app.coverLetter.originalName}`}>
                ✉ Cover Letter
              </button>
            )}
          </div>
          {app.notes && (
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-1 italic">"{app.notes}"</p>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onFollowUp(app)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 text-amber-600 bg-white hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
            title="Schedule follow-up">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M4.214 3.227a.75.75 0 00-1.156-.956 8.97 8.97 0 00-1.856 3.826.75.75 0 001.466.316 7.47 7.47 0 011.546-3.186zM16.942 2.271a.75.75 0 00-1.156.956 7.47 7.47 0 011.547 3.186.75.75 0 001.466-.316 8.971 8.971 0 00-1.857-3.826zM10 6a4 4 0 00-4 4v.667l-1.166 2.333a.75.75 0 000 .666.75.75 0 00.666.334h9a.75.75 0 00.666-.334.75.75 0 000-.666L14 10.667V10a4 4 0 00-4-4zm0 13a2.5 2.5 0 01-2.45-2h4.9A2.5 2.5 0 0110 19z"/>
            </svg>
            Follow-Up
          </button>
          <button onClick={() => onEdit(app)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
            </svg>
            Edit
          </button>
          <button onClick={() => onDelete(app)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
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

// ─── Application Grid Card ─────────────────────────────────────────────────────
function ApplicationDirectoryCard({ app, onView, onEdit, onDelete, onFollowUp, onCompany, onStatusChanged }) {
  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED
  const today = new Date().toISOString().slice(0, 10)
  const hasOverdue = app.nextFollowUpDate && app.nextFollowUpDate < today
  const hasUpcoming = app.nextFollowUpDate && app.nextFollowUpDate >= today
  const showUpcoming = hasOverdue && app.nextUpcomingFollowUpDate && app.nextUpcomingFollowUpDate !== app.nextFollowUpDate
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  return (
    <div onClick={() => onView(app)} style={{ borderTopColor: dotHex(app.status) }}
      className="bg-white rounded-2xl border border-gray-100 border-t-4 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer overflow-hidden group">

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Avatar + company + role */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
            {initials(app.companyName)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-gray-800 truncate leading-tight">
              {app.companyName}
            </span>
            <p className="text-xs text-gray-500 truncate mt-0.5">{app.role}</p>
          </div>
        </div>

        {/* Status + date row */}
        <div className="flex items-center justify-between gap-2">
          <AppStatusChanger app={app} onStatusChanged={onStatusChanged} />
          {app.applicationDate && (
            <span className="text-[11px] text-gray-400 shrink-0">
              {new Date(app.applicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Deadline chip */}
        {app.deadline && (() => {
          const todayStr = new Date().toISOString().slice(0, 10)
          const daysLeft = Math.round((new Date(app.deadline) - new Date(todayStr)) / 86400000)
          const isPast   = daysLeft < 0
          const isUrgent = daysLeft >= 0 && daysLeft <= 3
          return (
            <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium ${
              isPast ? 'bg-red-100 text-red-600' : isUrgent ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'
            }`}>
              ⏰ {isPast ? 'Deadline passed' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
            </span>
          )
        })()}

        {/* Follow-up chips */}
        {(hasOverdue || hasUpcoming || showUpcoming) && (
          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
            {hasOverdue && (
              <button type="button" onClick={() => onFollowUp(app)}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition">
                🔔 {fmtDate(app.nextFollowUpDate)} · Overdue
              </button>
            )}
            {(hasUpcoming && !hasOverdue) && (
              <button type="button" onClick={() => onFollowUp(app)}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition">
                🔔 {fmtDate(app.nextFollowUpDate)}
              </button>
            )}
            {showUpcoming && (
              <button type="button" onClick={() => onFollowUp(app)}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition">
                🔔 {fmtDate(app.nextUpcomingFollowUpDate)}
              </button>
            )}
          </div>
        )}

        {/* Doc + salary indicators */}
        {(app.resume || app.coverLetter || app.expectedSalary) && (
          <div className="flex flex-wrap gap-1.5">
            {app.resume && (
              <span className="inline-flex items-center text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                📄 Resume
              </span>
            )}
            {app.coverLetter && (
              <span className="inline-flex items-center text-[11px] px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium">
                ✉ Cover Letter
              </span>
            )}
            {app.expectedSalary && (
              <span className="inline-flex items-center text-[11px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-medium">
                {app.expectedSalary}
              </span>
            )}
          </div>
        )}

        {app.notes && (
          <p className="text-[11px] text-gray-400 line-clamp-1 italic">"{app.notes}"</p>
        )}
      </div>

      {/* Action footer */}
      <div className="flex border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onFollowUp(app)}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors">
          🔔 Follow-Up
        </button>
        <div className="w-px bg-gray-100" />
        <button onClick={() => onEdit(app)}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          ✏️ Edit
        </button>
        <div className="w-px bg-gray-100" />
        <button onClick={() => onDelete(app)}
          className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-50 transition-colors">
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}

function dotHex(status) {
  const map = {
    SAVED: '#9ca3af', APPLIED: '#3b82f6', OA_SCHEDULED: '#f59e0b',
    OA_CLEARED: '#06b6d4', INTERVIEW_SCHEDULED: '#a855f7', INTERVIEW_CLEARED: '#7c3aed',
    OFFER_RECEIVED: '#22c55e', REJECTED: '#f87171', JOINED: '#10b981',
  }
  return map[status] || map.APPLIED
}

function formatSize(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

async function triggerDocDownload(doc) {
  try {
    const res = await downloadApplicationDocument(doc.id)
    const url = URL.createObjectURL(new Blob([res.data], { type: doc.contentType }))
    const a = document.createElement('a')
    a.href = url; a.download = doc.originalName; a.click()
    URL.revokeObjectURL(url)
  } catch {}
}

async function triggerDocView(doc) {
  try {
    const res = await viewApplicationDocument(doc.id)
    const url = URL.createObjectURL(new Blob([res.data], { type: doc.contentType }))
    window.open(url, '_blank')
  } catch {}
}

// ─── Detail (View) Modal ──────────────────────────────────────────────────────
function DetailModal({ open, app: initialApp, onClose, onEdit, onDelete, onStatusChanged, onCompany }) {
  const [app, setApp] = useState(initialApp)
  const [interviews, setInterviews] = useState([])
  const [interviewsLoading, setInterviewsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_INTERVIEW_FORM)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_INTERVIEW_FORM)
  const [editSaving, setEditSaving] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [ivFlash, setIvFlash] = useState('')

  useEffect(() => { setApp(initialApp) }, [initialApp])

  const fetchInterviews = useCallback(async () => {
    if (!initialApp) return
    setInterviewsLoading(true)
    try {
      const res = await getInterviewsForApplication(initialApp.id)
      setInterviews(res.data)
    } catch { /* silently ignore */ }
    finally { setInterviewsLoading(false) }
  }, [initialApp])

  useEffect(() => {
    if (open && initialApp) {
      setShowAddForm(false)
      setAddForm(EMPTY_INTERVIEW_FORM)
      setAddError('')
      setEditingId(null)
      setIvFlash('')
      fetchInterviews()
    }
  }, [open, initialApp, fetchInterviews])

  if (!open) return null

  const cfg = app ? (STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED) : STATUS_CONFIG.APPLIED

  const handleStatusChanged = (updated) => {
    setApp(updated)
    onStatusChanged?.(updated)
  }

  const flash = (msg) => { setIvFlash(msg); setTimeout(() => setIvFlash(''), 2500) }

  const setAddField  = (key) => (e) => setAddForm(f  => ({ ...f,  [key]: e.target.value }))
  const setEditField = (key) => (e) => setEditForm(f => ({ ...f,  [key]: e.target.value }))

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!addForm.scheduledAt) { setAddError('Date & time is required.'); return }
    setAddSaving(true); setAddError('')
    try {
      await createInterview(app.id, {
        scheduledAt:      addForm.scheduledAt || undefined,
        round:            addForm.round.trim() || undefined,
        interviewType:    addForm.interviewType || undefined,
        location:         addForm.location.trim() || undefined,
        interviewerName:  addForm.interviewerName.trim() || undefined,
        questionsAsked:   addForm.questionsAsked.trim() || undefined,
        feedbackReceived: addForm.feedbackReceived.trim() || undefined,
        outcome:          addForm.outcome || 'PENDING',
      })
      setAddForm(EMPTY_INTERVIEW_FORM)
      setShowAddForm(false)
      flash('Round added.')
      fetchInterviews()
    } catch (err) {
      setAddError(err.response?.data?.message || 'Something went wrong.')
    } finally { setAddSaving(false) }
  }

  const startEdit = (iv) => {
    setEditingId(iv.id)
    setEditForm({
      scheduledAt:      iv.scheduledAt ? iv.scheduledAt.slice(0, 16) : '',
      round:            iv.round || '',
      interviewType:    iv.interviewType || '',
      location:         iv.location || '',
      interviewerName:  iv.interviewerName || '',
      questionsAsked:   iv.questionsAsked || '',
      feedbackReceived: iv.feedbackReceived || '',
      outcome:          iv.outcome || 'PENDING',
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.scheduledAt) return
    setEditSaving(true)
    try {
      await updateInterview(editingId, {
        scheduledAt:      editForm.scheduledAt || undefined,
        round:            editForm.round.trim() || undefined,
        interviewType:    editForm.interviewType || undefined,
        location:         editForm.location.trim() || undefined,
        interviewerName:  editForm.interviewerName.trim() || undefined,
        questionsAsked:   editForm.questionsAsked.trim() || undefined,
        feedbackReceived: editForm.feedbackReceived.trim() || undefined,
        outcome:          editForm.outcome || 'PENDING',
      })
      setEditingId(null)
      flash('Round updated.')
      fetchInterviews()
    } catch { flash('Update failed.') }
    finally { setEditSaving(false) }
  }

  const handleDeleteRound = async (id) => {
    setProcessingId(id)
    try {
      await deleteInterview(id)
      flash('Round deleted.')
      fetchInterviews()
    } catch { flash('Delete failed.') }
    finally { setProcessingId(null) }
  }

  const fmtDateTime = (dt) => dt
    ? new Date(dt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white hover:border-gray-300 transition'

  const Row = ({ label, value }) => value ? (
    <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 flex-1 break-words">{value}</span>
    </div>
  ) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="rounded-t-2xl px-6 pt-6 pb-5 border-b border-gray-100 shrink-0">
          {app && (
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${cfg.dot}`}>
                {(app.companyName || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-800 leading-tight">{app.companyName || '—'}</h2>
                  {app.companyId && (
                    <button onClick={() => { onClose(); onCompany(app.companyId) }}
                      className="text-[11px] font-semibold text-blue-500 hover:text-blue-700 hover:underline transition shrink-0">
                      View Company →
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">💼 {app.role}</p>
                <div className="mt-2">
                  <AppStatusChanger app={app} onStatusChanged={handleStatusChanged} />
                </div>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0">
                <Close sx={{ fontSize: 18 }} />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        {app && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* Application details */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Application Details</p>
              <Row label="Applied On"   value={app.applicationDate ? new Date(app.applicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <Row label="Deadline"     value={app.deadline ? new Date(app.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <Row label="Source"       value={SOURCE_LABELS[app.source] || app.source || null} />
              <Row label="Expected CTC" value={app.expectedSalary || null} />
            </div>

            {app.notes && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.notes}</p>
                </div>
              </div>
            )}

            {(app.resume || app.coverLetter) && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Documents</p>
                <div className="flex gap-2 flex-wrap">
                  {app.resume && (
                    <button onClick={() => triggerDocView(app.resume)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium">
                      📄 {app.resume.originalName || 'Resume'}
                    </button>
                  )}
                  {app.coverLetter && (
                    <button onClick={() => triggerDocView(app.coverLetter)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition font-medium">
                      📋 {app.coverLetter.originalName || 'Cover Letter'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Interview Rounds ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Interview Rounds {interviews.length > 0 && `(${interviews.length})`}
                </p>
                <button
                  onClick={() => { setShowAddForm(v => !v); setAddError('') }}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                    showAddForm
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-purple-200 text-purple-600 bg-white hover:bg-purple-600 hover:text-white hover:border-purple-600'
                  }`}>
                  {showAddForm ? '✕ Cancel' : '+ Add Round'}
                </button>
              </div>

              {ivFlash && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                  {ivFlash}
                </div>
              )}

              {/* Add round form */}
              {showAddForm && (
                <form onSubmit={handleAddSubmit} className="mb-4 bg-purple-50 rounded-xl p-3 space-y-2.5">
                  {addError && <p className="text-xs text-red-500">{addError}</p>}
                  <InterviewFormFields form={addForm} setField={setAddField} inputCls={inputCls} />
                  <button type="submit" disabled={addSaving}
                    className="w-full py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {addSaving && <CircularProgress size={11} color="inherit" />}
                    Add Round
                  </button>
                </form>
              )}

              {/* Timeline */}
              {interviewsLoading ? (
                <div className="flex justify-center py-4"><CircularProgress size={20} /></div>
              ) : interviews.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No rounds yet — add one above.</p>
              ) : (
                <div className="relative">
                  {interviews.length > 1 && (
                    <div className="absolute left-[15px] top-[30px] bottom-[30px] w-0.5 bg-gray-100 z-0" />
                  )}
                  <div className="space-y-3">
                    {interviews.map((iv, idx) => {
                      const outcomeCfg = INTERVIEW_OUTCOME_CONFIG[iv.outcome] || INTERVIEW_OUTCOME_CONFIG.AWAITING_RESPONSE
                      const isProc = processingId === iv.id
                      const isEditingThis = editingId === iv.id
                      const dotBg =
                        iv.outcome === 'PASSED'      ? 'bg-green-500 ring-green-100'  :
                        iv.outcome === 'FAILED'      ? 'bg-red-400 ring-red-100'      :
                        iv.outcome === 'NO_SHOW'     ? 'bg-gray-400 ring-gray-100'    :
                        iv.outcome === 'RESCHEDULED' ? 'bg-blue-400 ring-blue-100'    :
                                                       'bg-amber-400 ring-amber-100'
                      return (
                        <div key={iv.id} className="relative flex gap-3 z-10">
                          {/* Dot */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ring-4 ${dotBg}`}>
                            {idx + 1}
                          </div>
                          {/* Card */}
                          <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-xl p-3">
                            {isEditingThis ? (
                              <form onSubmit={handleEditSubmit} className="space-y-2">
                                <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Editing Round {idx + 1}</p>
                                <InterviewFormFields form={editForm} setField={setEditField} inputCls={inputCls} />
                                <div className="flex gap-2 pt-1">
                                  <button type="submit" disabled={editSaving}
                                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5">
                                    {editSaving && <CircularProgress size={10} color="inherit" />}
                                    Save
                                  </button>
                                  <button type="button" onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition">
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-bold text-gray-800">{iv.round || `Round ${idx + 1}`}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${outcomeCfg.cls}`}>{outcomeCfg.label}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 mb-1">🗓 {fmtDateTime(iv.scheduledAt)}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {iv.interviewType && <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-md font-medium">{INTERVIEW_TYPE_LABELS[iv.interviewType]}</span>}
                                    {iv.location && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium truncate max-w-[140px]" title={iv.location}>📍 {iv.location}</span>}
                                    {iv.interviewerName && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-medium">👤 {iv.interviewerName}</span>}
                                  </div>
                                  {iv.questionsAsked && <p className="mt-1 text-[11px] text-gray-400"><span className="font-semibold not-italic">Q:</span> <span className="italic line-clamp-2">{iv.questionsAsked}</span></p>}
                                  {iv.feedbackReceived && <p className="mt-0.5 text-[11px] text-gray-400"><span className="font-semibold not-italic">FB:</span> <span className="italic line-clamp-2">{iv.feedbackReceived}</span></p>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => startEdit(iv)} disabled={isProc}
                                    className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-gray-200 text-gray-500 bg-white hover:bg-gray-700 hover:text-white hover:border-gray-700 transition disabled:opacity-50">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteRound(iv.id)} disabled={isProc}
                                    className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-red-200 text-red-400 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition disabled:opacity-50 flex items-center">
                                    {isProc ? <CircularProgress size={9} color="inherit" /> : '×'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        {app && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
            <button onClick={() => { onClose(); onEdit(app) }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-700 hover:text-white hover:border-gray-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
              </svg>
              Edit
            </button>
            <button onClick={() => { onClose(); onDelete(app) }}
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

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AddEditModal({ open, app, companies, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // liveApp mirrors app but reflects immediate deletions without closing the modal
  const [liveApp, setLiveApp] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [coverLetterFile, setCoverLetterFile] = useState(null)
  const [coverLetterError, setCoverLetterError] = useState('')
  const [profileResumes, setProfileResumes] = useState([])
  const [selectedProfileResumeDocId, setSelectedProfileResumeDocId] = useState('')

  useEffect(() => {
    if (open) {
      setLiveApp(app ?? null)
      setForm(app ? {
        companyId: app.companyId || '', role: app.role || '',
        applicationDate: app.applicationDate || new Date().toISOString().slice(0, 10),
        deadline: app.deadline || '',
        source: app.source || '', status: app.status || 'APPLIED',
        expectedSalary: app.expectedSalary || '', notes: app.notes || '',
      } : EMPTY_FORM)
      setResumeFile(null)
      setResumeError('')
      setCoverLetterFile(null)
      setCoverLetterError('')
      setError('')
      setSelectedProfileResumeDocId('')
      getProfile().then((res) => setProfileResumes(res.data?.resumes ?? [])).catch(() => {})
    }
  }, [open, app])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleResumePick = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setResumeError('Only PDF, DOC, and DOCX files are supported.')
      return
    }
    setResumeError('')
    setResumeFile(file)
    setSelectedProfileResumeDocId('')
  }

  const handleCoverLetterChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setCoverLetterError('Only PDF, DOC, and DOCX files are supported.')
      e.target.value = ''
      return
    }
    setCoverLetterError('')
    setCoverLetterFile(file)
  }

  const handleRemoveResume = async () => {
    if (!liveApp?.resume) return
    setDeletingId('resume')
    try {
      const res = await deleteApplication(liveApp.id, liveApp.resume.id)
      setLiveApp(res.data)
    } catch {
      setError('Failed to remove resume.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteCoverLetter = async () => {
    if (!liveApp?.coverLetter) return
    setDeletingId('coverLetter')
    try {
      const res = await deleteApplication(liveApp.id, liveApp.coverLetter.id)
      setLiveApp(res.data)
    } catch {
      setError('Failed to delete cover letter.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.companyId) { setError('Please select a company.'); return }
    if (!form.role.trim()) { setError('Role is required.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        companyId: Number(form.companyId), role: form.role.trim(),
        applicationDate: form.applicationDate || undefined,
        deadline: form.deadline || undefined,
        source: form.source || undefined, status: form.status || undefined,
        expectedSalary: form.expectedSalary.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      let savedId
      if (liveApp) {
        await updateApplication(liveApp.id, payload)
        savedId = liveApp.id
      } else {
        const res = await addApplication(payload)
        savedId = res.data.id
      }
      if (selectedProfileResumeDocId) {
        await uploadApplicationDocuments(savedId, { profileResumeDocumentId: Number(selectedProfileResumeDocId) })
      } else if (resumeFile) {
        await uploadApplicationDocuments(savedId, { resume: resumeFile })
      }
      if (coverLetterFile) {
        await uploadApplicationDocuments(savedId, { coverLetter: coverLetterFile })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition'

  return (
    <ModalShell
      open={open} onClose={onClose}
      title={app ? 'Edit Application' : 'Add Application'}
      subtitle={app ? 'Update application details' : 'Record a new job application'}
    >
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Company <span className="text-red-500">*</span>
            </label>
            <select value={form.companyId} onChange={set('companyId')} className={inputCls}>
              <option value="">Select a company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.role} onChange={set('role')} placeholder="e.g. SDE Intern" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Application Date</label>
              <input type="date" value={form.applicationDate} onChange={set('applicationDate')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Deadline <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <input type="date" value={form.deadline} onChange={set('deadline')} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Source</label>
              <select value={form.source} onChange={set('source')} className={inputCls}>
                <option value="">Select source</option>
                {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Expected Salary</label>
              <input type="text" value={form.expectedSalary} onChange={set('expectedSalary')} placeholder="e.g. 6 LPA" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Referral contact, interview prep notes..." className={`${inputCls} resize-none`} />
          </div>

          {/* Resume — single */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Resume <span className="text-gray-400 normal-case font-normal">(PDF, DOC, DOCX)</span>
            </label>

            {liveApp?.resume && (
              <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-gray-200 bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-500 shrink-0">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{liveApp.resume.originalName}</p>
                  <p className="text-xs text-gray-400">{formatSize(liveApp.resume.fileSize)}</p>
                </div>
                <button type="button"
                  onClick={() => triggerDocView(liveApp.resume)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition">
                  View
                </button>
                <button type="button"
                  onClick={() => triggerDocDownload(liveApp.resume)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition">
                  Download
                </button>
                <button type="button"
                  onClick={handleRemoveResume}
                  disabled={deletingId === 'resume'}
                  className="text-xs font-semibold text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-50 flex items-center gap-1">
                  {deletingId === 'resume' && <CircularProgress size={10} color="inherit" />}
                  Delete
                </button>
              </div>
            )}

            {/* All upload options — only shown when no resume is attached yet */}
            {!liveApp?.resume && (
              <>
                {/* Profile resume dropdown */}
                {profileResumes.length > 0 && (
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">Select from profile</label>
                    <select
                      value={selectedProfileResumeDocId}
                      onChange={(e) => { setSelectedProfileResumeDocId(e.target.value); setResumeFile(null) }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white hover:border-gray-300 transition">
                      <option value="">— choose a resume —</option>
                      {profileResumes.map((r) => (
                        <option key={r.id} value={r.documentId}>{r.originalName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* OR divider when profile resumes exist */}
                {profileResumes.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">or upload new</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}

                {/* Pending new file */}
                {resumeFile && (
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-indigo-200 bg-indigo-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-400 shrink-0">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-indigo-700 truncate flex-1">{resumeFile.name}</span>
                    <span className="text-xs text-indigo-400">pending upload</span>
                    <button type="button" onClick={() => setResumeFile(null)}
                      className="text-indigo-400 hover:text-red-500 font-bold text-base leading-none px-1 transition">×</button>
                  </div>
                )}

                {/* Upload zone */}
                {!resumeFile && (
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 cursor-pointer transition w-full">
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumePick} className="sr-only" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    <span className="text-sm text-gray-400">Upload resume</span>
                  </label>
                )}
              </>
            )}
            {resumeError && <p className="mt-1 text-xs text-red-500">{resumeError}</p>}
          </div>

          {/* Cover Letter section */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Cover Letter <span className="text-gray-400 normal-case font-normal">(PDF, DOC, DOCX)</span>
            </label>
            {liveApp?.coverLetter && (
              <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-gray-200 bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-violet-500 shrink-0">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{liveApp.coverLetter.originalName}</p>
                  <p className="text-xs text-gray-400">{formatSize(liveApp.coverLetter.fileSize)}</p>
                </div>
                <button type="button" onClick={() => triggerDocView(liveApp.coverLetter)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100">
                  View
                </button>
                <button type="button" onClick={() => triggerDocDownload(liveApp.coverLetter)}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition px-2 py-1 rounded-lg hover:bg-violet-50">
                  Download
                </button>
                <button type="button" onClick={handleDeleteCoverLetter}
                  disabled={deletingId === 'coverLetter'}
                  className="text-xs font-semibold text-red-400 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-1">
                  {deletingId === 'coverLetter' && <CircularProgress size={10} color="inherit" />}
                  Delete
                </button>
              </div>
            )}
            {!liveApp?.coverLetter && (
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-300 cursor-pointer transition">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleCoverLetterChange} className="sr-only" />
                  {coverLetterFile ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-violet-500 shrink-0">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700 truncate flex-1">{coverLetterFile.name}</span>
                      <button type="button" onClick={(e) => { e.preventDefault(); setCoverLetterFile(null) }}
                        className="text-gray-400 hover:text-red-500 transition font-bold text-base leading-none px-1">×</button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Click to upload cover letter</span>
                  )}
                </label>
                {coverLetterError && <p className="text-xs text-red-500">{coverLetterError}</p>}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {saving && <CircularProgress size={14} color="inherit" />}
              {liveApp ? 'Save Changes' : 'Add Application'}
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

// ─── Follow-Up Modal ──────────────────────────────────────────────────────────
function FollowUpModal({ open, app, onClose, onChanged }) {
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState({ followUpDate: todayStr(), note: '', daysFromNow: '' })
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [useDays, setUseDays] = useState(true)

  const fetch = useCallback(async () => {
    if (!app) return
    setLoading(true)
    setError('')
    try {
      const res = await getFollowUpsForApplication(app.id)
      setFollowUps(res.data)
    } catch {
      setError('Failed to load follow-ups.')
    } finally {
      setLoading(false)
    }
  }, [app])

  useEffect(() => {
    if (open) {
      setForm({ followUpDate: todayStr(), note: '', daysFromNow: '' })
      setUseDays(true)
      setError('')
      setSuccessMsg('')
      fetch()
    }
  }, [open, fetch])

  const handleAdd = async (e) => {
    e.preventDefault()
    let date = form.followUpDate
    if (useDays) {
      const days = parseInt(form.daysFromNow, 10)
      if (!days || days < 1) { setError('Enter a valid number of days (≥ 1).'); return }
      const d = new Date()
      d.setDate(d.getDate() + days)
      date = d.toISOString().slice(0, 10)
    }
    if (!date) { setError('Follow-up date is required.'); return }
    setSaving(true)
    setError('')
    try {
      await createFollowUp(app.id, { followUpDate: date, note: form.note.trim() || undefined })
      setForm({ followUpDate: todayStr(), note: '', daysFromNow: '' })
      flash('Follow-up scheduled.')
      fetch()
      onChanged?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add follow-up.')
    } finally {
      setSaving(false)
    }
  }

  const flash = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 2500)
  }

  const markDone = async (fu) => {
    setProcessingId(fu.id)
    try {
      await updateFollowUp(fu.id, { status: 'DONE' })
      flash('Marked as completed.')
      fetch()
      onChanged?.()
    } catch {
      setError('Failed to update follow-up.')
    } finally {
      setProcessingId(null)
    }
  }

  const markPending = async (fu) => {
    setProcessingId(fu.id)
    try {
      await updateFollowUp(fu.id, { status: 'PENDING' })
      flash('Moved back to pending.')
      fetch()
      onChanged?.()
    } catch {
      setError('Failed to update follow-up.')
    } finally {
      setProcessingId(null)
    }
  }

  const remove = async (id) => {
    setProcessingId(id)
    try {
      await deleteFollowUp(id)
      flash('Follow-up deleted.')
      fetch()
      onChanged?.()
    } catch {
      setError('Failed to delete follow-up.')
    } finally {
      setProcessingId(null)
    }
  }

  const reschedule = async (fu, newDate) => {
    try {
      await updateFollowUp(fu.id, { followUpDate: newDate })
      flash('Follow-up rescheduled.')
      fetch()
      onChanged?.()
    } catch {
      setError('Failed to reschedule follow-up.')
      throw new Error('reschedule failed')
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition'

  const pending = followUps.filter((f) => f.status === 'PENDING')
  const done = followUps.filter((f) => f.status === 'DONE')

  return (
    <ModalShell
      open={open} onClose={onClose}
      title="Follow-Up Reminders"
      subtitle={app ? `${app.role} at ${app.companyName}` : ''}
      maxWidth="max-w-lg"
    >
      <div className="px-6 py-5 space-y-5">
        {successMsg && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}

        {/* Add new follow-up */}
        <form onSubmit={handleAdd} className="bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Schedule a Follow-Up</p>

          {/* Toggle between days and date */}
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setUseDays(true)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${useDays ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              Days from now
            </button>
            <button type="button"
              onClick={() => setUseDays(false)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${!useDays ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              Pick a date
            </button>
          </div>

          {useDays ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Follow up in</span>
              <input
                type="number" min="1" max="365"
                value={form.daysFromNow}
                onChange={(e) => setForm((f) => ({ ...f, daysFromNow: e.target.value }))}
                placeholder="5"
                className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <span className="text-sm text-gray-600">days</span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
              <input type="date" value={form.followUpDate}
                onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                className={inputCls} />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Note (optional)</label>
            <input type="text" value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. Email HR about status update"
              className={inputCls} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <CircularProgress size={13} color="inherit" />}
            Add Follow-Up
          </button>
        </form>

        {/* Follow-up list */}
        {loading ? (
          <div className="flex justify-center py-6"><CircularProgress size={24} /></div>
        ) : followUps.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No follow-ups scheduled yet.</p>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pending</p>
                <div className="space-y-2">
                  {pending.map((fu) => (
                    <FollowUpRow key={fu.id} fu={fu} onDone={() => markDone(fu)} onDelete={() => remove(fu.id)} onReschedule={(d) => reschedule(fu, d)} loading={processingId === fu.id} />
                  ))}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Completed</p>
                <div className="space-y-2">
                  {done.map((fu) => (
                    <FollowUpRow key={fu.id} fu={fu} onUndo={() => markPending(fu)} onDelete={() => remove(fu.id)} loading={processingId === fu.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  )
}

function FollowUpRow({ fu, onDone, onUndo, onDelete, onReschedule, loading }) {
  const isDone = fu.status === 'DONE'
  const isOverdue = fu.overdue
  const [editing, setEditing] = useState(false)

  return (
    <div className={`p-3 rounded-xl border ${isDone ? 'bg-gray-50 border-gray-100 opacity-70' : isOverdue ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold ${isDone ? 'text-gray-400 line-through' : isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
              📅 {fmtDate(fu.followUpDate)}
            </span>
            {isOverdue && !isDone && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Overdue</span>
            )}
            {isDone && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">Done</span>
            )}
          </div>
          {fu.note && (
            <p className={`text-xs mt-0.5 ${isDone ? 'text-gray-400' : 'text-gray-500'}`}>{fu.note}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {!isDone && onDone && (
            <button onClick={onDone} disabled={loading}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-green-200 text-green-600 bg-white hover:bg-green-500 hover:text-white hover:border-green-500 transition disabled:opacity-50 flex items-center gap-1">
              {loading ? <CircularProgress size={10} color="inherit" /> : null}
              Done
            </button>
          )}
          {!isDone && onReschedule && (
            <button onClick={() => setEditing((e) => !e)} disabled={loading}
              title="Reschedule"
              className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition disabled:opacity-50 ${editing ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-200 text-amber-600 bg-white hover:bg-amber-500 hover:text-white hover:border-amber-500'}`}>
              📅
            </button>
          )}
          {isDone && onUndo && (
            <button onClick={onUndo} disabled={loading}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-500 bg-white hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-1">
              {loading ? <CircularProgress size={10} color="inherit" /> : null}
              Undo
            </button>
          )}
          <button onClick={onDelete} disabled={loading}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition disabled:opacity-50">
            ×
          </button>
        </div>
      </div>
      {editing && (
        <RescheduleInline
          currentDate={fu.followUpDate}
          onSave={async (d) => { await onReschedule(d); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

// ─── Interview Modal ──────────────────────────────────────────────────────────
const INTERVIEW_TYPE_LABELS = {
  PHONE_SCREEN: 'Phone Screen', VIDEO_CALL: 'Video Call', ONSITE: 'Onsite',
  TECHNICAL: 'Technical', HR: 'HR', BEHAVIORAL: 'Behavioral',
  CASE_STUDY: 'Case Study', GROUP: 'Group', OTHER: 'Other',
}

const INTERVIEW_OUTCOME_CONFIG = {
  AWAITING_RESPONSE: { label: 'Awaiting Response', cls: 'bg-amber-100 text-amber-700'   },
  PASSED:            { label: 'Passed',             cls: 'bg-green-100 text-green-700'   },
  FAILED:            { label: 'Failed',             cls: 'bg-red-100 text-red-600'       },
  NO_SHOW:           { label: 'No Show',            cls: 'bg-gray-100 text-gray-500'     },
  RESCHEDULED:       { label: 'Rescheduled',        cls: 'bg-blue-100 text-blue-700'     },
}

const EMPTY_INTERVIEW_FORM = {
  scheduledAt: '', round: '', interviewType: '', location: '', interviewerName: '',
  questionsAsked: '', feedbackReceived: '', outcome: 'AWAITING_RESPONSE',
}

function InterviewFormFields({ form, setField, inputCls }) {
  return (
    <>
      <div>
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Date & Time <span className="text-red-500">*</span></label>
        <input type="datetime-local" value={form.scheduledAt} onChange={setField('scheduledAt')} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Round Name</label>
          <input type="text" value={form.round} onChange={setField('round')} placeholder="e.g. HR Round" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Type</label>
          <select value={form.interviewType} onChange={setField('interviewType')} className={inputCls}>
            <option value="">Select type</option>
            {Object.entries(INTERVIEW_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Location / Link</label>
          <input type="text" value={form.location} onChange={setField('location')} placeholder="Zoom / office" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Interviewer</label>
          <input type="text" value={form.interviewerName} onChange={setField('interviewerName')} placeholder="Name" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Outcome</label>
        <select value={form.outcome} onChange={setField('outcome')} className={inputCls}>
          {Object.entries(INTERVIEW_OUTCOME_CONFIG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Questions Asked</label>
        <textarea value={form.questionsAsked} onChange={setField('questionsAsked')} rows={2} placeholder="What questions were asked?" className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Feedback Received</label>
        <textarea value={form.feedbackReceived} onChange={setField('feedbackReceived')} rows={2} placeholder="What feedback did you get?" className={`${inputCls} resize-none`} />
      </div>
    </>
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, app, onClose, onDeleted }) {
  return (
    <ConfirmDeleteModal
      open={open && !!app}
      onClose={onClose}
      onConfirm={async () => { await deleteApplication(app.id); onDeleted() }}
      title="Delete Application"
      message={
        <>
          Remove <span className="font-semibold text-gray-700">{app?.role}</span> at{' '}
          <span className="font-semibold text-gray-700">{app?.companyName}</span>?
          <span className="block text-xs text-red-500 mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Applications() {
  const [applications, setApplications] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [datePreset, setDatePreset] = useState('')  // 'week' | 'month' | '3months' | 'year' | 'custom'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [followUpTarget, setFollowUpTarget] = useState(null)
  const [companyDetailId, setCompanyDetailId] = useState(null)

  useEffect(() => {
    getCompanies({}).then((res) => setCompanies(res.data)).catch(() => {})
  }, [])

  const activeSortOption = SORT_OPTIONS.find((o) => o.value === sortBy)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const isClientSort = activeSortOption?.clientSide
      const res = await getApplications({
        status: filterStatus || undefined,
        sortBy: isClientSort ? 'createdAt' : sortBy,
        order: isClientSort ? 'desc' : order,
      })
      setApplications(res.data)
    } catch {
      setError('Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, sortBy, order, activeSortOption])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const openAdd      = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit     = (a) => { setEditTarget(a); setModalOpen(true) }
  const openView     = (a) => { setViewTarget(a) }
  const openFollowUp = (a) => { setFollowUpTarget(a) }

  const handleSaved = () => {
    setModalOpen(false)
    setSuccess(editTarget ? 'Application updated.' : 'Application added.')
    fetchApplications()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setSuccess('Application removed.')
    fetchApplications()
    setTimeout(() => setSuccess(''), 3000)
  }

  // Compute effective date range from preset or custom inputs
  const effectiveDateRange = (() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const toStr = (d) => d.toISOString().slice(0, 10)
    if (datePreset === 'week') {
      const from = new Date(today)
      from.setDate(today.getDate() - today.getDay())  // Sunday start
      return { from: toStr(from), to: toStr(today) }
    }
    if (datePreset === 'month') {
      return { from: toStr(new Date(today.getFullYear(), today.getMonth(), 1)), to: toStr(today) }
    }
    if (datePreset === '3months') {
      const from = new Date(today)
      from.setMonth(today.getMonth() - 3)
      return { from: toStr(from), to: toStr(today) }
    }
    if (datePreset === 'year') {
      return { from: toStr(new Date(today.getFullYear(), 0, 1)), to: toStr(today) }
    }
    if (datePreset === 'custom') {
      return { from: dateFrom || null, to: dateTo || null }
    }
    return { from: null, to: null }
  })()

  // Client-side search + date filter
  const q = search.trim().toLowerCase()
  const filteredApplications = applications.filter((a) => {
    if (q && !(
      a.companyName?.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q) ||
      (SOURCE_LABELS[a.source] || a.source || '').toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q)
    )) return false
    if (effectiveDateRange.from && a.applicationDate && a.applicationDate < effectiveDateRange.from) return false
    if (effectiveDateRange.to   && a.applicationDate && a.applicationDate > effectiveDateRange.to)   return false
    return true
  })

  // Client-side sort (for fields not handled server-side)
  const displayApplications = activeSortOption?.clientSide
    ? [...filteredApplications].sort((a, b) => {
        const va = (a.companyName || '').toLowerCase()
        const vb = (b.companyName || '').toLowerCase()
        const cmp = va < vb ? -1 : va > vb ? 1 : 0
        return order === 'asc' ? cmp : -cmp
      })
    : filteredApplications

  // Analytics — derived from full unfiltered list
  const thisMonth = (() => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    return applications.filter((a) => {
      if (!a.applicationDate) return false
      const d = new Date(a.applicationDate)
      return d.getFullYear() === y && d.getMonth() === m
    }).length
  })()
  const activeCount = applications.filter(
    (a) => !['REJECTED', 'JOINED'].includes(a.status)
  ).length
  const offerCount = applications.filter((a) => a.status === 'OFFER_RECEIVED').length
  const conversionRate = applications.length > 0
    ? ((offerCount / applications.length) * 100).toFixed(1)
    : null
  const interviewsScheduled = applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length
  const interviewsCleared   = applications.filter((a) => a.status === 'INTERVIEW_CLEARED').length
  const totalInterviews     = interviewsScheduled + interviewsCleared
  const interviewSuccessRate = totalInterviews > 0
    ? ((interviewsCleared / totalInterviews) * 100).toFixed(1)
    : null

  // Monthly trend — last 12 months
  const monthlyTrend = (() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const y = d.getFullYear(), m = d.getMonth()
      const count = applications.filter((a) => {
        if (!a.applicationDate) return false
        const ad = new Date(a.applicationDate)
        return ad.getFullYear() === y && ad.getMonth() === m
      }).length
      return {
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        count,
        isCurrent: y === now.getFullYear() && m === now.getMonth(),
      }
    })
  })()
  const trendMax = Math.max(...monthlyTrend.map((m) => m.count), 1)

  // Top companies by application count
  const topCompanies = (() => {
    const map = {}
    applications.forEach((a) => {
      if (!a.companyId) return
      if (!map[a.companyId]) map[a.companyId] = { name: a.companyName, count: 0, statuses: [] }
      map[a.companyId].count++
      map[a.companyId].statuses.push(a.status)
    })
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  })()
  const topCompanyMax = topCompanies[0]?.count || 1

  // Source analysis
  const sourceAnalysis = (() => {
    const map = {}
    applications.forEach((a) => {
      const key = a.source || 'OTHER'
      if (!map[key]) map[key] = { total: 0, offers: 0, interviews: 0 }
      map[key].total++
      if (a.status === 'OFFER_RECEIVED') map[key].offers++
      if (a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEW_CLEARED') map[key].interviews++
    })
    return Object.entries(map)
      .map(([key, { total, offers, interviews }]) => ({
        key,
        label: SOURCE_LABELS[key] || key,
        total,
        offers,
        interviews,
        offerRate: total > 0 ? (offers / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  })()
  const sourceMax = sourceAnalysis[0]?.total || 1
  const bestSource = sourceAnalysis.filter((s) => s.total >= 2).sort((a, b) => b.offerRate - a.offerRate)[0] ?? null

  // Directory view: group by company name alphabetically
  const grouped = displayApplications.reduce((acc, a) => {
    const letter = a.companyName?.[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(a)
    return acc
  }, {})
  const sortedLetters = Object.keys(grouped).sort()

  const handleStatusChanged = (updated) => {
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a))
    setViewTarget(prev => prev?.id === updated.id ? updated : prev)
  }

  const cardProps = { onView: openView, onEdit: openEdit, onDelete: setDeleteTarget, onFollowUp: openFollowUp, onCompany: setCompanyDetailId, onStatusChanged: handleStatusChanged }

  return (
    <Layout>
      <PageHeader
        title="Applications"
        subtitle="Track every job application you submit"
        action={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
            <Add fontSize="small" />Add Application
          </button>
        }
      />

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Analytics bar */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Submitted', value: applications.length, icon: '📨', color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'This Month',      value: thisMonth,           icon: '📅', color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Active',          value: activeCount,         icon: '⚡', color: 'text-amber-600',  bg: 'bg-amber-50'  },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl px-4 py-3 flex items-center gap-3`}>
              <span className="text-xl shrink-0">{icon}</span>
              <div className="min-w-0">
                <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">{label}</p>
              </div>
            </div>
          ))}
          {/* Offer conversion rate */}
          <div className="bg-green-50 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl shrink-0">🎯</span>
            <div className="min-w-0">
              <p className="text-2xl font-black leading-none text-green-600">
                {conversionRate !== null ? `${conversionRate}%` : '—'}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Offer Rate</p>
              {conversionRate !== null && (
                <p className="text-[10px] text-gray-400 leading-tight">{offerCount} of {applications.length}</p>
              )}
            </div>
          </div>
          {/* Interview success rate */}
          <div className="bg-purple-50 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl shrink-0">🧠</span>
            <div className="min-w-0">
              <p className="text-2xl font-black leading-none text-purple-600">
                {interviewSuccessRate !== null ? `${interviewSuccessRate}%` : '—'}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Interview Rate</p>
              {interviewSuccessRate !== null && (
                <p className="text-[10px] text-gray-400 leading-tight">{interviewsCleared} of {totalInterviews}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly trend + top companies */}
      {!loading && applications.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Monthly trend chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 pt-4 pb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Monthly Trend</p>
            <div className="flex items-end gap-1.5 h-24">
              {monthlyTrend.map(({ label, fullLabel, count, isCurrent }) => {
                const heightPct = trendMax > 0 ? (count / trendMax) * 100 : 0
                return (
                  <div key={fullLabel} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10
                      hidden group-hover:flex flex-col items-center pointer-events-none">
                      <div className="bg-gray-800 text-white text-[11px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                        {fullLabel}: {count}
                      </div>
                      <div className="w-1.5 h-1.5 bg-gray-800 rotate-45 -mt-[3px]" />
                    </div>
                    <div className="w-full flex items-end" style={{ height: '80px' }}>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isCurrent ? 'bg-blue-500' : count === 0 ? 'bg-gray-100' : 'bg-blue-200 group-hover:bg-blue-400'
                        }`}
                        style={{ height: count === 0 ? '3px' : `${Math.max(heightPct, 6)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top companies */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 pt-4 pb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Most Applied</p>
            {topCompanies.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topCompanies.map(({ name, count, statuses }, i) => {
                  const barPct = (count / topCompanyMax) * 100
                  const hasOffer = statuses.includes('OFFER_RECEIVED')
                  const hasInterview = statuses.some((s) => s.startsWith('INTERVIEW'))
                  const tag = hasOffer ? { label: 'Offer', cls: 'bg-green-100 text-green-700' }
                    : hasInterview ? { label: 'Interview', cls: 'bg-purple-100 text-purple-700' }
                    : null
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] font-bold text-gray-400 w-4 shrink-0">#{i + 1}</span>
                          <span className="text-xs font-semibold text-gray-700 truncate">{name}</span>
                          {tag && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${tag.cls}`}>
                              {tag.label}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-gray-500 shrink-0 ml-2">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source analysis */}
      {!loading && sourceAnalysis.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 pt-4 pb-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Application Sources</p>
            {bestSource && (
              <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                🏆 Best: {bestSource.label} ({bestSource.offerRate.toFixed(0)}% offer rate)
              </span>
            )}
          </div>
          <div className="space-y-3">
            {sourceAnalysis.map(({ key, label, total, offers, interviews, offerRate }) => {
              const isBest = bestSource?.key === key
              return (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-semibold w-28 shrink-0 truncate ${isBest ? 'text-green-700' : 'text-gray-700'}`}>
                      {label}
                      {isBest && <span className="ml-1 text-green-500">★</span>}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isBest ? 'bg-green-400' : 'bg-blue-300'}`}
                        style={{ width: `${(total / sourceMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-500 w-5 text-right shrink-0">{total}</span>
                    <div className="flex gap-2 shrink-0">
                      {interviews > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">
                          {interviews} interview{interviews !== 1 ? 's' : ''}
                        </span>
                      )}
                      {offers > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">
                          {offers} offer{offers !== 1 ? 's' : ''} · {offerRate.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status summary bar */}
      {!loading && applications.length > 0 && (
        <StatusSummaryBar
          items={applications}
          statusConfig={STATUS_CONFIG}
          activeFilter={filterStatus}
          onFilter={setFilterStatus}
        />
      )}

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, role, source..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pr-1">Sort</span>
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortBy === opt.value
            const dir = isActive ? order : null
            return (
              <button
                key={opt.value}
                onClick={() => {
                  if (isActive) {
                    setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))
                  } else {
                    setSortBy(opt.value)
                    setOrder('desc')
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white'
                }`}
              >
                {opt.label}
                {isActive && (
                  <span className="text-gray-400 text-[11px]">{dir === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>
            )
          })}
        </div>

        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Date range filter */}
      {(() => {
        const DATE_PRESETS = [
          { value: 'week',    label: 'This Week' },
          { value: 'month',   label: 'This Month' },
          { value: '3months', label: 'Last 3 Months' },
          { value: 'year',    label: 'This Year' },
          { value: 'custom',  label: 'Custom Range' },
        ]
        const togglePreset = (v) => {
          setDatePreset((p) => (p === v ? '' : v))
          if (v !== 'custom') { setDateFrom(''); setDateTo('') }
        }
        return (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Applied:</span>
              {DATE_PRESETS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => togglePreset(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    datePreset === value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
              {datePreset && (
                <button
                  onClick={() => { setDatePreset(''); setDateFrom(''); setDateTo('') }}
                  className="ml-1 text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition"
                />
              </div>
            )}

            {datePreset && datePreset !== 'custom' && (
              <p className="mt-1.5 text-xs text-gray-400">
                {effectiveDateRange.from} → {effectiveDateRange.to}
              </p>
            )}
          </div>
        )
      })()}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><CircularProgress /></div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="📋"
          title={filterStatus ? `No ${STATUS_CONFIG[filterStatus]?.label ?? filterStatus} applications` : 'No applications yet'}
          description={filterStatus ? 'Try a different status filter above.' : 'Start recording your job applications.'}
          action={!filterStatus && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
              Add your first application
            </button>
          )}
        />
      ) : displayApplications.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          description={
            search && datePreset
              ? `No applications match your search and date filter.`
              : search
              ? `No applications match "${search}".`
              : `No applications in this date range.`
          }
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            {displayApplications.length} {displayApplications.length === 1 ? 'application' : 'applications'}
            {(q || datePreset) && applications.length !== displayApplications.length && (
              <span className="ml-1 text-gray-400">of {applications.length}</span>
            )}
          </p>
          {displayApplications.map((a) => <ApplicationCard key={a.id} app={a} {...cardProps} />)}
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-4">
            {displayApplications.length} {displayApplications.length === 1 ? 'application' : 'applications'}
            {(q || datePreset) && applications.length !== displayApplications.length && (
              <span className="ml-1 text-gray-400">of {applications.length}</span>
            )}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {displayApplications.map((a) => (
              <ApplicationDirectoryCard key={a.id} app={a} {...cardProps} />
            ))}
          </div>
        </div>
      )}

      <DetailModal open={!!viewTarget} app={viewTarget}
        onClose={() => setViewTarget(null)} onEdit={openEdit} onDelete={setDeleteTarget} onStatusChanged={handleStatusChanged} onCompany={setCompanyDetailId} />
      <AddEditModal open={modalOpen} app={editTarget} companies={companies}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} app={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <FollowUpModal open={!!followUpTarget} app={followUpTarget}
        onClose={() => setFollowUpTarget(null)} onChanged={fetchApplications} />
      <CompanyDetailModal open={companyDetailId !== null} companyId={companyDetailId}
        onClose={() => setCompanyDetailId(null)} />
    </Layout>
  )
}
