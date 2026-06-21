import { useState, useEffect, useCallback } from 'react'
import { Alert, CircularProgress, Tooltip, IconButton } from '@mui/material'
import { Edit, Delete, Add, Search, KeyboardArrowDown } from '@mui/icons-material'
import Layout from '../components/Layout'
import { getCompanies, addCompany, updateCompany, deleteCompany } from '../api/company'

const STATUS_CONFIG = {
  TARGETING:    { label: 'Targeting',    color: 'bg-blue-100 text-blue-700' },
  APPLIED:      { label: 'Applied',      color: 'bg-amber-100 text-amber-700' },
  INTERVIEWING: { label: 'Interviewing', color: 'bg-purple-100 text-purple-700' },
  OFFER:        { label: 'Offer',        color: 'bg-green-100 text-green-700' },
  REJECTED:     { label: 'Rejected',     color: 'bg-red-100 text-red-700' },
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'name',      label: 'Name' },
  { value: 'status',    label: 'Status' },
  { value: 'industry',  label: 'Industry' },
  { value: 'location',  label: 'Location' },
  { value: 'updatedAt', label: 'Last Updated' },
]

const EMPTY_FORM = {
  name: '', website: '', industry: '', location: '',
  description: '', notes: '', status: 'TARGETING',
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.TARGETING
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

// ─── Company Card ────────────────────────────────────────────────────────────
function CompanyCard({ company, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1.5">
          <h3 className="text-base font-semibold text-gray-800">{company.name}</h3>
          <StatusBadge status={company.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          {company.industry && <span>🏭 {company.industry}</span>}
          {company.location && <span>📍 {company.location}</span>}
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              🔗 {company.website.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          )}
        </div>

        {company.notes && (
          <p className="mt-2 text-xs text-gray-400 line-clamp-2">{company.notes}</p>
        )}
      </div>

      <div className="flex gap-0.5 shrink-0">
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(company)} sx={{ color: 'text.secondary' }}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => onDelete(company)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  )
}

// ─── Add / Edit Modal ────────────────────────────────────────────────────────
function AddEditModal({ open, company, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(
        company
          ? {
              name: company.name || '',
              website: company.website || '',
              industry: company.industry || '',
              location: company.location || '',
              description: company.description || '',
              notes: company.notes || '',
              status: company.status || 'TARGETING',
            }
          : EMPTY_FORM
      )
      setError('')
    }
  }, [open, company])

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Company name is required.'); return }
    setSaving(true)
    setError('')
    try {
      company ? await updateCompany(company.id, form) : await addCompany(form)
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
          {company ? 'Edit Company' : 'Add Company'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Google"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={set('website')}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={form.industry}
                onChange={set('industry')}
                placeholder="e.g. Fintech"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. Bangalore, India"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={2}
              placeholder="Brief company description..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Personal notes, referral contacts..."
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
              {company ? 'Save Changes' : 'Add Company'}
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
function DeleteModal({ open, company, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [force, setForce] = useState(false)
  const [warning, setWarning] = useState('')

  useEffect(() => {
    if (open) { setForce(false); setWarning('') }
  }, [open])

  if (!open || !company) return null

  const handleDelete = async () => {
    setDeleting(true)
    setWarning('')
    try {
      await deleteCompany(company.id, force)
      onDeleted()
    } catch (err) {
      if (err.response?.status === 409) {
        setWarning(err.response.data.message)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Company</h2>
        <p className="text-sm text-gray-500 mb-4">
          Remove{' '}
          <span className="font-semibold text-gray-700">{company.name}</span> from your
          list? This cannot be undone.
        </p>

        {warning && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <p>{warning}</p>
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="accent-red-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Yes, delete along with all applications
              </span>
            </label>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting || (!!warning && !force)}
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
export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCompanies({
        search: search.trim() || undefined,
        sortBy,
        order,
      })
      setCompanies(res.data)
    } catch {
      setError('Failed to load companies.')
    } finally {
      setLoading(false)
    }
  }, [search, sortBy, order])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (company) => { setEditTarget(company); setModalOpen(true) }

  const handleSaved = () => {
    setModalOpen(false)
    setSuccess(editTarget ? 'Company updated successfully.' : 'Company added successfully.')
    fetchCompanies()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setSuccess('Company removed from your list.')
    fetchCompanies()
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <Layout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track companies you&apos;re targeting</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <Add fontSize="small" />
          Add Company
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

      {/* Search + Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex">
            <Search fontSize="small" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
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

      {/* Company list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <CircularProgress />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {search ? 'No companies match your search' : 'No companies yet'}
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {search
              ? 'Try a different keyword.'
              : 'Start building your target list.'}
          </p>
          {!search && (
            <button
              onClick={openAdd}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Add your first company
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
          {companies.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AddEditModal
        open={modalOpen}
        company={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
      <DeleteModal
        open={!!deleteTarget}
        company={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </Layout>
  )
}
