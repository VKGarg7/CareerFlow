import { useState, useEffect, useCallback } from 'react'
import { Alert, CircularProgress, Tooltip, IconButton } from '@mui/material'
import { Edit, Delete, Add, KeyboardArrowDown } from '@mui/icons-material'
import Layout from '../components/Layout'
import { getApplications, addApplication, updateApplication, deleteApplication } from '../api/application'
import { getCompanies } from '../api/company'

const STATUS_CONFIG = {
  SAVED:               { label: 'Saved',               color: 'bg-gray-100 text-gray-600' },
  APPLIED:             { label: 'Applied',             color: 'bg-blue-100 text-blue-700' },
  OA_SCHEDULED:        { label: 'OA Scheduled',        color: 'bg-amber-100 text-amber-700' },
  OA_CLEARED:          { label: 'OA Cleared',          color: 'bg-cyan-100 text-cyan-700' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', color: 'bg-purple-100 text-purple-700' },
  INTERVIEW_CLEARED:   { label: 'Interview Cleared',   color: 'bg-violet-100 text-violet-700' },
  OFFER_RECEIVED:      { label: 'Offer Received',      color: 'bg-green-100 text-green-700' },
  REJECTED:            { label: 'Rejected',            color: 'bg-red-100 text-red-700' },
  JOINED:              { label: 'Joined',              color: 'bg-emerald-100 text-emerald-700' },
}

const SOURCE_LABELS = {
  CAREERS_PAGE: 'Careers Page',
  LINKEDIN:     'LinkedIn',
  REFERRAL:     'Referral',
  NAUKRI:       'Naukri',
  INTERNSHALA:  'Internshala',
  JOB_PORTAL:   'Job Portal',
  OTHER:        'Other',
}

const SORT_OPTIONS = [
  { value: 'createdAt',       label: 'Date Added' },
  { value: 'applicationDate', label: 'Applied On' },
  { value: 'role',            label: 'Role' },
  { value: 'status',          label: 'Status' },
]

const EMPTY_FORM = {
  companyId: '',
  role: '',
  applicationDate: new Date().toISOString().slice(0, 10),
  source: '',
  status: 'SAVED',
  expectedSalary: '',
  notes: '',
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.APPLIED
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

// ─── Application Card ─────────────────────────────────────────────────────────
function ApplicationCard({ app, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1.5">
          <h3 className="text-base font-semibold text-gray-800">{app.companyName}</h3>
          <StatusBadge status={app.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span>💼 {app.role}</span>
          {app.applicationDate && (
            <span>📅 {new Date(app.applicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          )}
        </div>
      </div>

      <div className="flex gap-0.5 shrink-0">
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(app)} sx={{ color: 'text.secondary' }}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => onDelete(app)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AddEditModal({ open, app, companies, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(
        app
          ? {
              companyId: app.companyId || '',
              role: app.role || '',
              applicationDate: app.applicationDate || new Date().toISOString().slice(0, 10),
              source: app.source || '',
              status: app.status || 'APPLIED',
              expectedSalary: app.expectedSalary || '',
              notes: app.notes || '',
            }
          : EMPTY_FORM
      )
      setError('')
    }
  }, [open, app])

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.companyId) { setError('Please select a company.'); return }
    if (!form.role.trim()) { setError('Role is required.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        companyId: Number(form.companyId),
        role: form.role.trim(),
        applicationDate: form.applicationDate || undefined,
        source: form.source || undefined,
        status: form.status || undefined,
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

  const inputCls =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          {app ? 'Edit Application' : 'Add Application'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <select value={form.companyId} onChange={set('companyId')} className={inputCls}>
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.role}
              onChange={set('role')}
              placeholder="e.g. SDE Intern"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Date</label>
              <input
                type="date"
                value={form.applicationDate}
                onChange={set('applicationDate')}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select value={form.source} onChange={set('source')} className={inputCls}>
                <option value="">Select source</option>
                {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
              <input
                type="text"
                value={form.expectedSalary}
                onChange={set('expectedSalary')}
                placeholder="e.g. 6 LPA"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Referral contact, interview prep notes..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <CircularProgress size={14} color="inherit" />}
              {app ? 'Save Changes' : 'Add Application'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ open, app, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  if (!open || !app) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteApplication(app.id)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Application</h2>
        <p className="text-sm text-gray-500 mb-6">
          Remove{' '}
          <span className="font-semibold text-gray-700">{app.role}</span> at{' '}
          <span className="font-semibold text-gray-700">{app.companyName}</span>?
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting && <CircularProgress size={14} color="inherit" />}
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
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

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    getCompanies({}).then((res) => setCompanies(res.data)).catch(() => {})
  }, [])

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getApplications({
        status: filterStatus || undefined,
        sortBy,
        order,
      })
      setApplications(res.data)
    } catch {
      setError('Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, sortBy, order])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (app) => { setEditTarget(app); setModalOpen(true) }

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

  return (
    <Layout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track every job application you submit</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <Add fontSize="small" />
          Add Application
        </button>
      </div>

      {/* Feedback */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filter + Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none w-full pl-4 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <KeyboardArrowDown fontSize="small" />
          </span>
        </div>

        <button
          onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition bg-white whitespace-nowrap"
        >
          {order === 'desc' ? '↓ Desc' : '↑ Asc'}
        </button>
      </div>

      {/* Application list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <CircularProgress />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {filterStatus ? 'No applications with this status' : 'No applications yet'}
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {filterStatus
              ? 'Try a different filter.'
              : 'Start recording your job applications.'}
          </p>
          {!filterStatus && (
            <button
              onClick={openAdd}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Add your first application
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </p>
          {applications.map((a) => (
            <ApplicationCard
              key={a.id}
              app={a}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AddEditModal
        open={modalOpen}
        app={editTarget}
        companies={companies}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
      <DeleteModal
        open={!!deleteTarget}
        app={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </Layout>
  )
}
