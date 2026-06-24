import { useState, useEffect, useCallback } from 'react'
import { Alert, CircularProgress, Tooltip, IconButton } from '@mui/material'
import { Edit, Delete, Add, Search, KeyboardArrowDown, LinkedIn, Email, Phone } from '@mui/icons-material'
import Layout from '../components/Layout'
import { getRecruiters, addRecruiter, updateRecruiter, deleteRecruiter } from '../api/recruiter'

const STATUS_CONFIG = {
  NEW:               { label: 'New',               color: 'bg-gray-100 text-gray-600' },
  REACHED_OUT:       { label: 'Reached Out',       color: 'bg-blue-100 text-blue-700' },
  RESPONDED:         { label: 'Responded',         color: 'bg-amber-100 text-amber-700' },
  MEETING_SCHEDULED: { label: 'Meeting Scheduled', color: 'bg-purple-100 text-purple-700' },
  ACTIVELY_HELPING:  { label: 'Actively Helping',  color: 'bg-green-100 text-green-700' },
  CLOSED:            { label: 'Closed',            color: 'bg-red-100 text-red-700' },
}

const SOURCE_LABELS = {
  LINKEDIN:         'LinkedIn',
  EMAIL:            'Email',
  REFERRAL:         'Referral',
  JOB_FAIR:         'Job Fair',
  COLD_OUTREACH:    'Cold Outreach',
  COMPANY_WEBSITE:  'Company Website',
  OTHER:            'Other',
}

const SORT_OPTIONS = [
  { value: 'createdAt',      label: 'Date Added' },
  { value: 'name',           label: 'Name' },
  { value: 'company',        label: 'Company' },
  { value: 'status',         label: 'Status' },
  { value: 'lastContactedAt', label: 'Last Contacted' },
  { value: 'updatedAt',      label: 'Last Updated' },
]

const EMPTY_FORM = {
  name: '', email: '', phone: '', linkedIn: '',
  company: '', jobTitle: '', status: 'NEW', source: '',
  lastContactedAt: '', notes: '',
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEW
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

// ─── Recruiter Card ───────────────────────────────────────────────────────────
function RecruiterCard({ recruiter, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        {/* Name + Status */}
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <h3 className="text-base font-semibold text-gray-800">{recruiter.name}</h3>
          <StatusBadge status={recruiter.status} />
        </div>

        {/* Job title + company */}
        {(recruiter.jobTitle || recruiter.company) && (
          <p className="text-sm text-gray-500 mb-1.5">
            {[recruiter.jobTitle, recruiter.company].filter(Boolean).join(' @ ')}
          </p>
        )}

        {/* Contact chips */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          {recruiter.email && (
            <a href={`mailto:${recruiter.email}`} className="flex items-center gap-1 text-blue-500 hover:underline">
              <Email sx={{ fontSize: 14 }} />
              {recruiter.email}
            </a>
          )}
          {recruiter.phone && (
            <a href={`tel:${recruiter.phone}`} className="flex items-center gap-1 hover:text-gray-700">
              <Phone sx={{ fontSize: 14 }} />
              {recruiter.phone}
            </a>
          )}
          {recruiter.linkedIn && (
            <a
              href={recruiter.linkedIn}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <LinkedIn sx={{ fontSize: 14 }} />
              LinkedIn
            </a>
          )}
          {recruiter.source && (
            <span className="text-gray-400">via {SOURCE_LABELS[recruiter.source] || recruiter.source}</span>
          )}
          {recruiter.lastContactedAt && (
            <span className="text-gray-400">
              Last contact: {new Date(recruiter.lastContactedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {recruiter.notes && (
          <p className="mt-2 text-xs text-gray-400 line-clamp-2">{recruiter.notes}</p>
        )}
      </div>

      <div className="flex gap-0.5 shrink-0">
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(recruiter)} sx={{ color: 'text.secondary' }}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => onDelete(recruiter)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AddEditModal({ open, recruiter, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(
        recruiter
          ? {
              name:             recruiter.name || '',
              email:            recruiter.email || '',
              phone:            recruiter.phone || '',
              linkedIn:         recruiter.linkedIn || '',
              company:          recruiter.company || '',
              jobTitle:         recruiter.jobTitle || '',
              status:           recruiter.status || 'NEW',
              source:           recruiter.source || '',
              lastContactedAt:  recruiter.lastContactedAt || '',
              notes:            recruiter.notes || '',
            }
          : EMPTY_FORM
      )
      setError('')
      setFieldErrors({})
    }
  }, [open, recruiter])

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.'
    if (form.phone && !/^[+]?[0-9()\-\s.]{7,20}$/.test(form.phone))
      errs.phone = 'Enter a valid phone number (7–20 digits).'
    if (form.linkedIn && !/^https?:\/\/.+/.test(form.linkedIn))
      errs.linkedIn = 'LinkedIn must start with http:// or https://'
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
      name:            form.name.trim(),
      email:           form.email.trim() || null,
      phone:           form.phone.trim() || null,
      linkedIn:        form.linkedIn.trim() || null,
      company:         form.company.trim() || null,
      jobTitle:        form.jobTitle.trim() || null,
      status:          form.status || 'NEW',
      source:          form.source || null,
      lastContactedAt: form.lastContactedAt || null,
      notes:           form.notes.trim() || null,
    }

    try {
      recruiter
        ? await updateRecruiter(recruiter.id, payload)
        : await addRecruiter(payload)
      onSaved()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        setFieldErrors(data.errors)
      } else {
        setError(data?.message || 'Something went wrong.')
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (field) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
      fieldErrors[field] ? 'border-red-400' : 'border-gray-300'
    }`

  const FieldError = ({ field }) =>
    fieldErrors[field] ? (
      <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p>
    ) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          {recruiter ? 'Edit Recruiter Contact' : 'Add Recruiter Contact'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Priya Sharma"
              className={inputCls('name')}
            />
            <FieldError field="name" />
          </div>

          {/* Job title + Company */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={set('jobTitle')}
                placeholder="e.g. Technical Recruiter"
                className={inputCls('jobTitle')}
              />
              <FieldError field="jobTitle" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={form.company}
                onChange={set('company')}
                placeholder="e.g. Google"
                className={inputCls('company')}
              />
              <FieldError field="company" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="priya@google.com"
              className={inputCls('email')}
            />
            <FieldError field="email" />
          </div>

          {/* Phone + LinkedIn */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98765 43210"
                className={inputCls('phone')}
              />
              <FieldError field="phone" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={form.linkedIn}
                onChange={set('linkedIn')}
                placeholder="https://linkedin.com/in/..."
                className={inputCls('linkedIn')}
              />
              <FieldError field="linkedIn" />
            </div>
          </div>

          {/* Status + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls('status')}>
                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select value={form.source} onChange={set('source')} className={inputCls('source')}>
                <option value="">— Select source —</option>
                {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Last Contacted */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Contacted</label>
            <input
              type="date"
              value={form.lastContactedAt}
              onChange={set('lastContactedAt')}
              max={new Date().toISOString().split('T')[0]}
              className={inputCls('lastContactedAt')}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Any notes about this recruiter or your interactions..."
              className={`${inputCls('notes')} resize-none`}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.notes.length}/2000</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <CircularProgress size={14} color="inherit" />}
              {recruiter ? 'Save Changes' : 'Add Recruiter'}
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
function DeleteModal({ open, recruiter, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  if (!open || !recruiter) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteRecruiter(recruiter.id)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Recruiter Contact</h2>
        <p className="text-sm text-gray-500 mb-6">
          Remove{' '}
          <span className="font-semibold text-gray-700">{recruiter.name}</span> from your
          contacts? This cannot be undone.
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
export default function Recruiters() {
  const [recruiters, setRecruiters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchRecruiters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getRecruiters({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        sortBy,
        order,
      })
      setRecruiters(res.data)
    } catch {
      setError('Failed to load recruiter contacts.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sortBy, order])

  useEffect(() => {
    fetchRecruiters()
  }, [fetchRecruiters])

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

  const isFiltered = search.trim() || statusFilter

  return (
    <Layout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recruiter Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track recruiters and your interactions</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <Add fontSize="small" />
          Add Recruiter
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

      {/* Search + Filter + Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex">
            <Search fontSize="small" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
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

        {/* Sort */}
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

        {/* Order toggle */}
        <button
          onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition bg-white whitespace-nowrap"
        >
          {order === 'desc' ? '↓ Desc' : '↑ Asc'}
        </button>
      </div>

      {/* Recruiter list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <CircularProgress />
        </div>
      ) : recruiters.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🤝</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {isFiltered ? 'No recruiters match your filters' : 'No recruiter contacts yet'}
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {isFiltered
              ? 'Try adjusting your search or filter.'
              : 'Start building your recruiter network.'}
          </p>
          {!isFiltered && (
            <button
              onClick={openAdd}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Add your first recruiter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {recruiters.length} {recruiters.length === 1 ? 'recruiter' : 'recruiters'}
          </p>
          {recruiters.map((r) => (
            <RecruiterCard
              key={r.id}
              recruiter={r}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AddEditModal
        open={modalOpen}
        recruiter={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
      <DeleteModal
        open={!!deleteTarget}
        recruiter={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </Layout>
  )
}
