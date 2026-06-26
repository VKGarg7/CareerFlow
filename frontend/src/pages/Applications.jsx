import { useState, useEffect, useCallback } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import { Add, KeyboardArrowDown } from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { getApplications, addApplication, updateApplication, deleteApplication } from '../api/application'
import { getCompanies } from '../api/company'
import { getFollowUpsForApplication, createFollowUp, updateFollowUp, deleteFollowUp } from '../api/followup'
import { todayStr, fmtDate } from '../utils/followup'
import RescheduleInline from '../components/RescheduleInline'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'

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
  { value: 'createdAt',       label: 'Date Added' },
  { value: 'applicationDate', label: 'Applied On' },
  { value: 'role',            label: 'Role' },
  { value: 'status',          label: 'Status' },
]

const EMPTY_FORM = {
  companyId: '', role: '',
  applicationDate: new Date().toISOString().slice(0, 10),
  source: '', status: 'SAVED', expectedSalary: '', notes: '',
}

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.APPLIED
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

// ─── Application List Card ────────────────────────────────────────────────────
function ApplicationCard({ app, onEdit, onDelete, onFollowUp }) {
  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${cfg.border} p-5 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
          {initials(app.companyName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="min-w-0 mb-2">
            <h3 className="text-base font-bold text-gray-800 truncate mb-1.5">{app.companyName}</h3>
            <div><StatusBadge status={app.status} /></div>
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
            {app.nextFollowUpDate && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full font-medium">
                🔔 Follow-up {new Date(app.nextFollowUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          {app.notes && (
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-1 italic">"{app.notes}"</p>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0">
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

// ─── Application Directory Card (compact grid) ────────────────────────────────
function ApplicationDirectoryCard({ app, onEdit, onDelete, onFollowUp }) {
  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED
  return (
    <div className="bg-white rounded-xl border border-gray-100 border-t-4 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3"
      style={{ borderTopColor: dotHex(app.status) }}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
          {initials(app.companyName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{app.companyName}</p>
          <p className="text-xs text-gray-500 truncate">💼 {app.role}</p>
        </div>
      </div>

      <div className="self-start"><StatusBadge status={app.status} /></div>

      <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-400">
        {app.applicationDate && (
          <span>📅 {new Date(app.applicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        )}
        {app.source && <span>· via {SOURCE_LABELS[app.source] || app.source}</span>}
        {app.expectedSalary && <span className="text-green-600 font-medium">· 💰 {app.expectedSalary}</span>}
      </div>
      {app.nextFollowUpDate && (
        <span className="inline-flex items-center text-[11px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">
          🔔 {new Date(app.nextFollowUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      )}

      {app.notes && (
        <p className="text-[11px] text-gray-400 line-clamp-2 italic">"{app.notes}"</p>
      )}

      <div className="flex gap-1.5 pt-1 border-t border-gray-50">
        <button onClick={() => onFollowUp(app)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
          title="Schedule follow-up">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h5.5a.75.75 0 0 0 0-1.5H3.5v-9h9v5.5a.75.75 0 0 0 1.5 0V3.5A1.5 1.5 0 0 0 12.5 2h-9ZM8 9.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Zm2.5-1a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 0-1.5h-.5V9.25A.75.75 0 0 0 10.5 8.5Z"/>
          </svg>
          Follow-Up
        </button>
        <button onClick={() => onEdit(app)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
            <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
          </svg>
          Edit
        </button>
        <button onClick={() => onDelete(app)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
          </svg>
          Delete
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

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AddEditModal({ open, app, companies, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(app ? {
        companyId: app.companyId || '', role: app.role || '',
        applicationDate: app.applicationDate || new Date().toISOString().slice(0, 10),
        source: app.source || '', status: app.status || 'APPLIED',
        expectedSalary: app.expectedSalary || '', notes: app.notes || '',
      } : EMPTY_FORM)
      setError('')
    }
  }, [open, app])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

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
        source: form.source || undefined, status: form.status || undefined,
        expectedSalary: form.expectedSalary.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      app ? await updateApplication(app.id, payload) : await addApplication(payload)
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
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
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {saving && <CircularProgress size={14} color="inherit" />}
              {app ? 'Save Changes' : 'Add Application'}
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
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [followUpTarget, setFollowUpTarget] = useState(null)

  useEffect(() => {
    getCompanies({}).then((res) => setCompanies(res.data)).catch(() => {})
  }, [])

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getApplications({ status: filterStatus || undefined, sortBy, order })
      setApplications(res.data)
    } catch {
      setError('Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, sortBy, order])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const openAdd      = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit     = (a) => { setEditTarget(a); setModalOpen(true) }
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

  // Directory view: group by company name alphabetically
  const grouped = applications.reduce((acc, a) => {
    const letter = a.companyName?.[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(a)
    return acc
  }, {})
  const sortedLetters = Object.keys(grouped).sort()

  const cardProps = { onEdit: openEdit, onDelete: setDeleteTarget, onFollowUp: openFollowUp }

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
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none w-full pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition cursor-pointer">
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
      ) : applications.length === 0 ? (
        <EmptyState
          icon="📋"
          title={filterStatus ? 'No applications with this status' : 'No applications yet'}
          description={filterStatus ? 'Try a different filter.' : 'Start recording your job applications.'}
          action={!filterStatus && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
              Add your first application
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </p>
          {applications.map((a) => <ApplicationCard key={a.id} app={a} {...cardProps} />)}
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-4">
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedLetters.map((letter) => (
              <>
                <div key={`hdr-${letter}`} className="col-span-full flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {letter}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">{grouped[letter].length}</span>
                </div>
                {grouped[letter].map((a) => (
                  <ApplicationDirectoryCard key={a.id} app={a} {...cardProps} />
                ))}
              </>
            ))}
          </div>
        </div>
      )}

      <AddEditModal open={modalOpen} app={editTarget} companies={companies}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} app={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <FollowUpModal open={!!followUpTarget} app={followUpTarget}
        onClose={() => setFollowUpTarget(null)} onChanged={fetchApplications} />
    </Layout>
  )
}
