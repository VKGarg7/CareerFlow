import { useState, useEffect, useCallback } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import { Add, Search, KeyboardArrowDown, Language } from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { getCompanies, addCompany, updateCompany, deleteCompany } from '../api/company'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'

const STATUS_CONFIG = {
  TARGETING:    { label: 'Targeting',    badge: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400',    dot: 'bg-blue-500'    },
  APPLIED:      { label: 'Applied',      badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-400',   dot: 'bg-amber-500'   },
  INTERVIEWING: { label: 'Interviewing', badge: 'bg-purple-100 text-purple-700', border: 'border-l-purple-400', dot: 'bg-purple-500' },
  OFFER:        { label: 'Offer',        badge: 'bg-green-100 text-green-700', border: 'border-l-green-400',   dot: 'bg-green-500'   },
  REJECTED:     { label: 'Rejected',     badge: 'bg-red-100 text-red-700',     border: 'border-l-red-400',     dot: 'bg-red-400'     },
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

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.TARGETING
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

// ─── Company List Card ────────────────────────────────────────────────────────
function CompanyCard({ company, onEdit, onDelete }) {
  const cfg = STATUS_CONFIG[company.status] || STATUS_CONFIG.TARGETING
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${cfg.border} p-5 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
          {initials(company.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="min-w-0 mb-2">
            <h3 className="text-base font-bold text-gray-800 truncate mb-1.5">{company.name}</h3>
            <div><StatusBadge status={company.status} /></div>
          </div>
          <div className="flex flex-wrap gap-2 mb-1.5">
            {company.industry && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
                🏭 {company.industry}
              </span>
            )}
            {company.location && (
              <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
                📍 {company.location}
              </span>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition">
                <Language sx={{ fontSize: 12 }} />
                {company.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            )}
          </div>
          {company.notes && (
            <p className="text-xs text-gray-400 line-clamp-1 italic">"{company.notes}"</p>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => onEdit(company)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
            </svg>
            Edit
          </button>
          <button onClick={() => onDelete(company)}
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

// ─── Company Directory Card (compact grid) ────────────────────────────────────
function CompanyDirectoryCard({ company, onEdit, onDelete }) {
  const cfg = STATUS_CONFIG[company.status] || STATUS_CONFIG.TARGETING
  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-t-4 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3`}
      style={{ borderTopColor: dotHex(company.status) }}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${cfg.dot}`}>
          {initials(company.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{company.name}</p>
          {company.industry && (
            <p className="text-xs text-gray-400 truncate">🏭 {company.industry}</p>
          )}
        </div>
      </div>

      <div className="self-start"><StatusBadge status={company.status} /></div>

      <div className="flex flex-wrap gap-1.5">
        {company.location && (
          <span className="text-[11px] text-gray-400">📍 {company.location}</span>
        )}
        {company.website && (
          <a href={company.website} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[11px] text-blue-500 hover:underline">
            <Language sx={{ fontSize: 11 }} />Website
          </a>
        )}
      </div>

      {company.notes && (
        <p className="text-[11px] text-gray-400 line-clamp-2 italic">"{company.notes}"</p>
      )}

      <div className="flex gap-1.5 pt-1 border-t border-gray-50">
        <button onClick={() => onEdit(company)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
            <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
          </svg>
          Edit
        </button>
        <button onClick={() => onDelete(company)}
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
    TARGETING: '#3b82f6', APPLIED: '#f59e0b', INTERVIEWING: '#a855f7',
    OFFER: '#22c55e', REJECTED: '#f87171',
  }
  return map[status] || map.TARGETING
}

// ─── Add / Edit Modal ────────────────────────────────────────────────────────
function AddEditModal({ open, company, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(company ? {
        name: company.name || '', website: company.website || '',
        industry: company.industry || '', location: company.location || '',
        description: company.description || '', notes: company.notes || '',
        status: company.status || 'TARGETING',
      } : EMPTY_FORM)
      setError('')
    }
  }, [open, company])

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

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition'

  return (
    <ModalShell
      open={open} onClose={onClose}
      title={company ? 'Edit Company' : 'Add Company'}
      subtitle={company ? 'Update company details' : 'Add a company to your target list'}
    >
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Google" className={inputCls} />
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Website</label>
              <input type="url" value={form.website} onChange={set('website')} placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Industry</label>
              <input type="text" value={form.industry} onChange={set('industry')} placeholder="e.g. Fintech" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
            <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Bangalore, India" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              placeholder="Brief company description..." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Personal notes, referral contacts..." className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {saving && <CircularProgress size={14} color="inherit" />}
              {company ? 'Save Changes' : 'Add Company'}
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

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ open, company, onClose, onDeleted }) {
  const [force, setForce] = useState(false)
  const [warning, setWarning] = useState('')

  useEffect(() => {
    if (open) { setForce(false); setWarning('') }
  }, [open])

  const handleDelete = async () => {
    try {
      await deleteCompany(company.id, force)
      onDeleted()
    } catch (err) {
      if (err.response?.status === 409) { setWarning(err.response.data.message); throw err }
      throw err
    }
  }

  return (
    <ConfirmDeleteModal
      open={open && !!company}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Company"
      message={
        <>
          Remove <span className="font-semibold text-gray-700">{company?.name}</span> from your list?
          <span className="block text-xs text-red-500 mt-1">This action cannot be undone.</span>
        </>
      }
      warning={warning && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <p>{warning}</p>
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-red-500" />
            <span className="text-sm font-medium text-gray-700">Yes, delete along with all applications</span>
          </label>
        </div>
      )}
    />
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCompanies({ search: search.trim() || undefined, status: statusFilter || undefined, sortBy, order })
      setCompanies(res.data)
    } catch {
      setError('Failed to load companies.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sortBy, order])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (c) => { setEditTarget(c); setModalOpen(true) }

  const handleSaved = () => {
    setModalOpen(false)
    setSuccess(editTarget ? 'Company updated.' : 'Company added.')
    fetchCompanies()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setSuccess('Company removed.')
    fetchCompanies()
    setTimeout(() => setSuccess(''), 3000)
  }

  const isFiltered = search.trim() || statusFilter

  // Alphabetical groups for directory view
  const grouped = companies.reduce((acc, c) => {
    const letter = c.name[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(c)
    return acc
  }, {})
  const sortedLetters = Object.keys(grouped).sort()

  const cardProps = { onEdit: openEdit, onDelete: setDeleteTarget }

  return (
    <Layout>
      <PageHeader
        title="Companies"
        subtitle="Track companies you're targeting in your job search"
        action={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
            <Add fontSize="small" />Add Company
          </button>
        }
      />

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Status summary bar */}
      {!loading && companies.length > 0 && (
        <StatusSummaryBar
          items={companies}
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
            placeholder="Search companies..."
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
      ) : companies.length === 0 ? (
        <EmptyState
          icon="🏢"
          title={isFiltered ? 'No companies match your filters' : 'No companies yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Start building your target list.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
              Add your first company
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
          {companies.map((c) => <CompanyCard key={c.id} company={c} {...cardProps} />)}
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-4">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
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
                {grouped[letter].map((c) => (
                  <CompanyDirectoryCard key={c.id} company={c} {...cardProps} />
                ))}
              </>
            ))}
          </div>
        </div>
      )}

      <AddEditModal open={modalOpen} company={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} company={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
    </Layout>
  )
}
