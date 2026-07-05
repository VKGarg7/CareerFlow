import React, { useState, useEffect, useCallback } from 'react'
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
import CompanyDetailModal from '../components/CompanyDetailModal'
import InlineStatusChanger from '../components/InlineStatusChanger'
import { EntityCard, EntityDirectoryCard } from '../components/EntityCard'
import { initials, fmtDate } from '../utils/followup'

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

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.TARGETING
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

// ─── Inline Status Changer ────────────────────────────────────────────────────
function CompanyStatusChanger({ company, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={company}
      statusConfig={STATUS_CONFIG}
      defaultStatus="TARGETING"
      updateFn={(id, payload) => updateCompany(id, payload)}
      onStatusChanged={onStatusChanged}
    />
  )
}

// ─── Company List Card ────────────────────────────────────────────────────────
function CompanyCard({ company, onEdit, onDelete, onView, onStatusChanged }) {
  const cfg = STATUS_CONFIG[company.status] || STATUS_CONFIG.TARGETING
  return (
    <EntityCard
      onClick={() => onView(company.id)}
      accentColor={cfg.border}
      avatarColor={cfg.dot}
      avatarText={initials(company.name)}
      titleSlot={
        <>
          <h3 className="text-base font-bold text-gray-800 truncate mb-1.5">{company.name}</h3>
          <CompanyStatusChanger company={company} onStatusChanged={onStatusChanged} />
        </>
      }
      chips={
        <>
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
            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank" rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition">
              <Language sx={{ fontSize: 12 }} />
              {company.website.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          )}
          {!company.industry && !company.location && !company.website && company.createdAt && (
            <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-400 rounded-full">
              Added {fmtDate(company.createdAt)}
            </span>
          )}
        </>
      }
      note={company.notes}
      actions={[
        { label: 'Edit', icon: 'edit', onClick: () => onEdit(company) },
        { label: 'Delete', icon: 'delete', onClick: () => onDelete(company), tone: 'danger' },
      ]}
    />
  )
}

// ─── Company Directory Card (compact grid) ────────────────────────────────────
function CompanyDirectoryCard({ company, onEdit, onDelete, onView, onStatusChanged }) {
  return (
    <EntityDirectoryCard
      onClick={() => onView(company.id)}
      borderTopColor={dotHex(company.status)}
      avatarColor={STATUS_CONFIG[company.status]?.dot || STATUS_CONFIG.TARGETING.dot}
      avatarText={initials(company.name)}
      titleSlot={
        <>
          <p className="text-sm font-bold text-gray-800 truncate">{company.name}</p>
          {company.industry && (
            <p className="text-xs text-gray-400 truncate">🏭 {company.industry}</p>
          )}
          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
            <CompanyStatusChanger company={company} onStatusChanged={onStatusChanged} />
          </div>
        </>
      }
      chips={
        <>
          {company.location && (
            <span className="text-[11px] text-gray-400">📍 {company.location}</span>
          )}
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-[11px] text-blue-500 hover:underline">
              <Language sx={{ fontSize: 11 }} />Website
            </a>
          )}
        </>
      }
      note={company.notes}
      actions={[
        { label: 'Edit', icon: <EditGlyph />, onClick: () => onEdit(company) },
        { label: 'Delete', icon: <DeleteGlyph />, onClick: () => onDelete(company), tone: 'danger' },
      ]}
    />
  )
}

function EditGlyph() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
      <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9a.75.75 0 0 1 1.5 0v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
    </svg>
  )
}

function DeleteGlyph() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
    </svg>
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
  const [viewId, setViewId] = useState(null)

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

  const handleStatusChanged = (updated) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c))
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

  const cardProps = { onEdit: openEdit, onDelete: setDeleteTarget, onView: setViewId, onStatusChanged: handleStatusChanged }

  return (
    <Layout>
      <PageHeader
        title="Companies"
        subtitle="Track companies you're targeting in your job search"
        icon="🏢"
        gradient="from-blue-500 to-blue-600"
        action={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all shadow-sm">
            <Add fontSize="small" />Add Company
          </button>
        }
      />

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Status summary bar */}
      {!loading && companies.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6 [&>div]:mb-0">
          <StatusSummaryBar
            items={companies}
            statusConfig={STATUS_CONFIG}
            activeFilter={statusFilter}
            onFilter={setStatusFilter}
          />
        </div>
      )}

      {/* Filters + view toggle */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex">
            <Search fontSize="small" />
          </span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[9rem]">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition cursor-pointer">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <KeyboardArrowDown fontSize="small" />
            </span>
          </div>

          <div className="relative flex-1 min-w-[9rem]">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition cursor-pointer">
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
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            {companies.length} {companies.length === 1 ? 'Company' : 'Companies'}
          </h2>
          {companies.map((c) => <CompanyCard key={c.id} company={c} {...cardProps} />)}
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {companies.length} {companies.length === 1 ? 'Company' : 'Companies'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {companies.map((c) => (
              <CompanyDirectoryCard key={c.id} company={c} {...cardProps} />
            ))}
          </div>
        </div>
      )}

      <AddEditModal open={modalOpen} company={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} company={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <CompanyDetailModal open={viewId !== null} companyId={viewId}
        onClose={() => setViewId(null)} onStatusChanged={handleStatusChanged} />
    </Layout>
  )
}
