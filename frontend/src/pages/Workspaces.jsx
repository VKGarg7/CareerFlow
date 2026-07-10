import React, { useState, useEffect, useCallback } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import { Add, Search, KeyboardArrowDown } from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { getWorkspaces, addWorkspace, updateWorkspace, deleteWorkspace } from '../api/workspace'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'
import InlineStatusChanger from '../components/InlineStatusChanger'
import WorkspaceDetailModal from '../components/WorkspaceDetailModal'
import { EntityCard, EntityDirectoryCard } from '../components/EntityCard'
import { initials, fmtDate } from '../utils/followup'

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    badge: 'bg-green-100 text-green-700',  border: 'border-l-green-400',  dot: 'bg-green-500'  },
  PAUSED:    { label: 'Paused',    badge: 'bg-amber-100 text-amber-700',  border: 'border-l-amber-400',  dot: 'bg-amber-500'  },
  COMPLETED: { label: 'Completed', badge: 'bg-blue-100 text-blue-700',    border: 'border-l-blue-400',   dot: 'bg-blue-500'   },
  ARCHIVED:  { label: 'Archived',  badge: 'bg-gray-100 text-gray-600',    border: 'border-l-gray-400',   dot: 'bg-gray-400'   },
}

const WORK_MODE_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'ONSITE', label: 'Onsite' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
]

const JOB_TYPE_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name',      label: 'Name' },
  { value: 'status',    label: 'Status' },
  { value: 'updatedAt', label: 'Last Updated' },
]

const EMPTY_FORM = {
  name: '', description: '', targetRoles: '', preferredLocations: '',
  compensationMin: '', compensationMax: '', workMode: '', jobTypes: [],
  searchStartDate: '', goalApplicationsTarget: '', goalInterviewsTarget: '', goalOffersTarget: '',
  status: 'ACTIVE',
}

function toFormState(workspace) {
  if (!workspace) return EMPTY_FORM
  return {
    name: workspace.name || '',
    description: workspace.description || '',
    targetRoles: (workspace.targetRoles || []).join(', '),
    preferredLocations: (workspace.preferredLocations || []).join(', '),
    compensationMin: workspace.compensationMin ?? '',
    compensationMax: workspace.compensationMax ?? '',
    workMode: workspace.workMode || '',
    jobTypes: workspace.jobTypes || [],
    searchStartDate: workspace.searchStartDate || '',
    goalApplicationsTarget: workspace.goalApplicationsTarget ?? '',
    goalInterviewsTarget: workspace.goalInterviewsTarget ?? '',
    goalOffersTarget: workspace.goalOffersTarget ?? '',
    status: workspace.status || 'ACTIVE',
  }
}

function toPayload(form) {
  const csvToList = (s) => s.split(',').map(v => v.trim()).filter(Boolean)
  const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
  return {
    name: form.name.trim(),
    description: form.description || null,
    targetRoles: csvToList(form.targetRoles),
    preferredLocations: csvToList(form.preferredLocations),
    compensationMin: numOrNull(form.compensationMin),
    compensationMax: numOrNull(form.compensationMax),
    workMode: form.workMode || null,
    jobTypes: form.jobTypes,
    searchStartDate: form.searchStartDate || null,
    goalApplicationsTarget: numOrNull(form.goalApplicationsTarget),
    goalInterviewsTarget: numOrNull(form.goalInterviewsTarget),
    goalOffersTarget: numOrNull(form.goalOffersTarget),
    status: form.status,
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

// ─── Inline Status Changer ────────────────────────────────────────────────────
function WorkspaceStatusChanger({ workspace, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={workspace}
      statusConfig={STATUS_CONFIG}
      defaultStatus="ACTIVE"
      updateFn={(id, payload) => updateWorkspace(id, payload)}
      onStatusChanged={onStatusChanged}
    />
  )
}

// ─── Workspace List Card ──────────────────────────────────────────────────────
function WorkspaceCard({ workspace, onEdit, onDelete, onView, onStatusChanged }) {
  const cfg = STATUS_CONFIG[workspace.status] || STATUS_CONFIG.ACTIVE
  const roles = workspace.targetRoles || []
  const locations = workspace.preferredLocations || []
  return (
    <EntityCard
      onClick={() => onView(workspace.id)}
      accentColor={cfg.border}
      avatarColor={cfg.dot}
      avatarText={initials(workspace.name)}
      titleSlot={
        <>
          <h3 className="text-base font-bold text-gray-800 truncate mb-1.5">{workspace.name}</h3>
          <WorkspaceStatusChanger workspace={workspace} onStatusChanged={onStatusChanged} />
        </>
      }
      chips={
        <>
          {roles.slice(0, 3).map((r) => (
            <span key={r} className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
              🎯 {r}
            </span>
          ))}
          {locations.slice(0, 2).map((l) => (
            <span key={l} className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
              📍 {l}
            </span>
          ))}
          {workspace.workMode && (
            <span className="inline-flex items-center text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full">
              {workspace.workMode}
            </span>
          )}
          {roles.length === 0 && locations.length === 0 && !workspace.workMode && workspace.createdAt && (
            <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gray-50 text-gray-400 rounded-full">
              Created {fmtDate(workspace.createdAt)}
            </span>
          )}
        </>
      }
      note={workspace.description}
      actions={[
        { label: 'Edit', icon: 'edit', onClick: () => onEdit(workspace) },
        { label: 'Delete', icon: 'delete', onClick: () => onDelete(workspace), tone: 'danger' },
      ]}
    />
  )
}

// ─── Workspace Directory Card (compact grid) ──────────────────────────────────
function WorkspaceDirectoryCard({ workspace, onEdit, onDelete, onView, onStatusChanged }) {
  const roles = workspace.targetRoles || []
  return (
    <EntityDirectoryCard
      onClick={() => onView(workspace.id)}
      borderTopColor={dotHex(workspace.status)}
      avatarColor={STATUS_CONFIG[workspace.status]?.dot || STATUS_CONFIG.ACTIVE.dot}
      avatarText={initials(workspace.name)}
      titleSlot={
        <>
          <p className="text-sm font-bold text-gray-800 truncate">{workspace.name}</p>
          {roles.length > 0 && (
            <p className="text-xs text-gray-400 truncate">🎯 {roles.join(', ')}</p>
          )}
          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
            <WorkspaceStatusChanger workspace={workspace} onStatusChanged={onStatusChanged} />
          </div>
        </>
      }
      chips={
        <>
          {(workspace.preferredLocations || []).slice(0, 2).map((l) => (
            <span key={l} className="text-[11px] text-gray-400">📍 {l}</span>
          ))}
          {workspace.workMode && (
            <span className="text-[11px] text-indigo-500">{workspace.workMode}</span>
          )}
        </>
      }
      note={workspace.description}
      actions={[
        { label: 'Edit', icon: <EditGlyph />, onClick: () => onEdit(workspace) },
        { label: 'Delete', icon: <DeleteGlyph />, onClick: () => onDelete(workspace), tone: 'danger' },
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
    ACTIVE: '#22c55e', PAUSED: '#f59e0b', COMPLETED: '#3b82f6', ARCHIVED: '#9ca3af',
  }
  return map[status] || map.ACTIVE
}

// ─── Add / Edit Modal ────────────────────────────────────────────────────────
function AddEditModal({ open, workspace, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(toFormState(workspace))
      setError('')
    }
  }, [open, workspace])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const toggleJobType = (value) => {
    setForm((f) => ({
      ...f,
      jobTypes: f.jobTypes.includes(value)
        ? f.jobTypes.filter((v) => v !== value)
        : [...f.jobTypes, value],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Workspace name is required.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = toPayload(form)
      workspace ? await updateWorkspace(workspace.id, payload) : await addWorkspace(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition'
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

  return (
    <ModalShell
      open={open} onClose={onClose}
      title={workspace ? 'Edit Workspace' : 'Create Workspace'}
      subtitle={workspace ? 'Update your job search workspace' : 'Set up a new job search workspace'}
      maxWidth="max-w-xl"
    >
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Backend SDE 2026" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              placeholder="What's the strategy or goal for this workspace?" className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Target Roles</label>
              <input type="text" value={form.targetRoles} onChange={set('targetRoles')}
                placeholder="SDE-2, Backend Engineer" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Preferred Locations</label>
              <input type="text" value={form.preferredLocations} onChange={set('preferredLocations')}
                placeholder="Bangalore, Remote" className={inputCls} />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-2">Separate multiple values with commas.</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Compensation Min</label>
              <input type="number" value={form.compensationMin} onChange={set('compensationMin')}
                placeholder="e.g. 1500000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Compensation Max</label>
              <input type="number" value={form.compensationMax} onChange={set('compensationMax')}
                placeholder="e.g. 2500000" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Work Mode</label>
              <select value={form.workMode} onChange={set('workMode')} className={inputCls}>
                {WORK_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Search Start Date</label>
              <input type="date" value={form.searchStartDate} onChange={set('searchStartDate')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Job Types</label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPE_OPTIONS.map((o) => (
                <label key={o.value}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer select-none transition ${
                    form.jobTypes.includes(o.value)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  <input type="checkbox" className="hidden" checked={form.jobTypes.includes(o.value)}
                    onChange={() => toggleJobType(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Goal Metrics</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input type="number" min="0" value={form.goalApplicationsTarget} onChange={set('goalApplicationsTarget')}
                  placeholder="Applications" className={inputCls} />
              </div>
              <div>
                <input type="number" min="0" value={form.goalInterviewsTarget} onChange={set('goalInterviewsTarget')}
                  placeholder="Interviews" className={inputCls} />
              </div>
              <div>
                <input type="number" min="0" value={form.goalOffersTarget} onChange={set('goalOffersTarget')}
                  placeholder="Offers" className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {saving && <CircularProgress size={14} color="inherit" />}
              {workspace ? 'Save Changes' : 'Create Workspace'}
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
function DeleteModal({ open, workspace, onClose, onDeleted }) {
  const handleDelete = async () => {
    await deleteWorkspace(workspace.id)
    onDeleted()
  }

  return (
    <ConfirmDeleteModal
      open={open && !!workspace}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Workspace"
      message={
        <>
          Remove <span className="font-semibold text-gray-700">{workspace?.name}</span> and all of its settings?
          <span className="block text-xs text-red-500 mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([])
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

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWorkspaces({ search: search.trim() || undefined, sortBy, order })
      setWorkspaces(res.data)
    } catch {
      setError('Failed to load workspaces.')
    } finally {
      setLoading(false)
    }
  }, [search, sortBy, order])

  useEffect(() => { fetchWorkspaces() }, [fetchWorkspaces])

  const openAdd  = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (w) => { setEditTarget(w); setModalOpen(true) }

  const handleSaved = () => {
    setModalOpen(false)
    setSuccess(editTarget ? 'Workspace updated.' : 'Workspace created.')
    fetchWorkspaces()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setSuccess('Workspace removed.')
    fetchWorkspaces()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleStatusChanged = (updated) => {
    setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w))
  }

  const filtered = statusFilter ? workspaces.filter((w) => w.status === statusFilter) : workspaces
  const isFiltered = search.trim() || statusFilter
  const cardProps = { onEdit: openEdit, onDelete: setDeleteTarget, onView: setViewId, onStatusChanged: handleStatusChanged }

  return (
    <Layout>
      <PageHeader
        title="Workspaces"
        subtitle="Organize your job search into focused strategies and hiring cycles"
        icon="🗂️"
        gradient="from-indigo-500 to-purple-600"
        action={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all shadow-sm">
            <Add fontSize="small" />New Workspace
          </button>
        }
      />

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Status summary bar */}
      {!loading && workspaces.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6 [&>div]:mb-0">
          <StatusSummaryBar
            items={workspaces}
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
            placeholder="Search workspaces..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title={isFiltered ? 'No workspaces match your filters' : 'No workspaces yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Create a workspace to start organizing your job search.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm">
              Create your first workspace
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            {filtered.length} {filtered.length === 1 ? 'Workspace' : 'Workspaces'}
          </h2>
          {filtered.map((w) => <WorkspaceCard key={w.id} workspace={w} {...cardProps} />)}
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {filtered.length} {filtered.length === 1 ? 'Workspace' : 'Workspaces'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((w) => (
              <WorkspaceDirectoryCard key={w.id} workspace={w} {...cardProps} />
            ))}
          </div>
        </div>
      )}

      <AddEditModal open={modalOpen} workspace={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} workspace={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <WorkspaceDetailModal open={viewId !== null} workspaceId={viewId}
        onClose={() => setViewId(null)} onStatusChanged={handleStatusChanged} />
    </Layout>
  )
}
