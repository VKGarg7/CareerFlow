import React, { useState, useCallback, useMemo } from 'react'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  Search, KeyboardArrowDown, CalendarTodayOutlined, PlaceOutlined,
  EditOutlined, DeleteOutlineRounded, VisibilityOutlined, FolderOutlined,
  FilterListRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import Pagination from '../components/Pagination'
import StatTilesBar from '../components/StatTilesBar'
import { ConfirmDeleteModal } from '../components/ModalShell'
import { getWorkspaces, addWorkspace, updateWorkspace, deleteWorkspace } from '../api/workspace'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'
import InlineStatusChanger from '../components/InlineStatusChanger'
import WorkspaceDetailModal from '../components/WorkspaceDetailModal'
import { EntityDirectoryCard, CardMenu } from '../components/EntityCard'
import { fmtDate } from '../utils/followup'
import FilterSelect from '../components/FilterSelect'
import useSearchShortcut from '../hooks/useSearchShortcut'
import useAddQueryParam from '../hooks/useAddQueryParam'
import useTransientMessage from '../hooks/useTransientMessage'
import usePagedList from '../hooks/usePagedList'
import { DrawerShell } from '../components/DrawerShell'
import { FormFooterButtons } from '../components/formKit'
import { CloseGlyphIcon } from '../components/CloseGlyphIcon'
import HeaderAddButton from '../components/HeaderAddButton'
import useCrudModals from '../hooks/useCrudModals'
import useFilterState from '../hooks/useFilterState'

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    badge: 'bg-app-success/10 text-app-success',     border: 'border-l-app-success',  dot: 'bg-app-success',  hex: '#22C55E' },
  PAUSED:    { label: 'Paused',    badge: 'bg-app-warning/10 text-app-warning',     border: 'border-l-app-warning',  dot: 'bg-app-warning',  hex: '#F59E0B' },
  COMPLETED: { label: 'Completed', badge: 'bg-app-accent/10 text-app-accent-soft', border: 'border-l-app-accent',   dot: 'bg-app-accent',   hex: '#5B5FEF' },
  ARCHIVED:  { label: 'Archived',  badge: 'bg-white/[0.06] text-white/50',          border: 'border-l-white/20',     dot: 'bg-white/30',     hex: '#9CA3AF' },
}

const WORK_MODE_OPTIONS = [
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

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

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

const dotHex = (status) => (STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE).hex

function WorkspaceListRow({ workspace, onEdit, onDelete, onView, onStatusChanged, order, onToggleOrder, compact }) {
  const cfg = STATUS_CONFIG[workspace.status] || STATUS_CONFIG.ACTIVE
  const roles = workspace.targetRoles || []
  const locations = workspace.preferredLocations || []

  return (
    <div onClick={() => onView(workspace.id)}
      className={`group relative flex items-center gap-2 sm:gap-4 min-w-0 rounded-card border border-white/[0.06] border-l-4 ${cfg.border} bg-app-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover cursor-pointer px-3 sm:px-5 py-3.5`}>

      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner-highlight" style={{ backgroundColor: dotHex(workspace.status) }}>
        <FolderOutlined sx={{ fontSize: 18 }} />
      </div>

      <div className={`min-w-0 shrink-0 ${compact ? 'w-24' : 'w-28 sm:w-44'}`}>
        <p className="text-sm font-bold text-white/90 truncate">{workspace.name}</p>
        {roles.length > 0 && <p className="text-xs text-white/40 truncate mt-0.5">{roles.join(', ')}</p>}
      </div>

      <div className={`shrink-0 min-w-0 w-[6.5rem] ${compact ? 'ml-auto' : 'sm:w-28'}`} onClick={(e) => e.stopPropagation()}>
        <WorkspaceStatusChanger workspace={workspace} onStatusChanged={onStatusChanged} />
      </div>

      <div className={`min-w-[6rem] max-w-[10rem] flex-1 shrink basis-0 ${compact ? 'hidden' : 'hidden md:block'}`}>
        {locations.length > 0 && (
          <p className="flex items-center gap-1 text-xs text-white/50 truncate">
            <PlaceOutlined sx={{ fontSize: 13 }} className="text-app-danger shrink-0" />
            <span className="truncate">{locations.join(', ')}</span>
          </p>
        )}
        {workspace.workMode && (
          <p className="text-xs text-app-accent-soft truncate mt-0.5">{workspace.workMode}</p>
        )}
      </div>

      <div className={`w-20 shrink-0 ${compact ? 'hidden' : 'hidden lg:block'}`}>
        <p className="text-[11px] text-white/35">Applications Goal</p>
        <p className="text-sm font-semibold text-white/80 mt-0.5">{workspace.goalApplicationsTarget ?? '—'}</p>
      </div>

      <div className={`w-24 shrink-0 ${compact ? 'hidden' : 'hidden xl:block'}`}>
        <p className="text-[11px] text-white/35">Search Started</p>
        <p className="text-sm font-medium text-white/70 mt-0.5">{workspace.searchStartDate ? fmtDate(workspace.searchStartDate) : '—'}</p>
      </div>

      <div className="ml-auto flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {onToggleOrder && (
          <button onClick={onToggleOrder} title={order === 'desc' ? 'Sort ascending' : 'Sort descending'}
            className={`items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.08] transition ${compact ? 'hidden' : 'hidden sm:flex'}`}>
            <CalendarTodayOutlined sx={{ fontSize: 15 }} />
          </button>
        )}
        <CardMenu items={[
          { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(workspace.id) },
          { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(workspace) },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(workspace), tone: 'danger' },
        ]} />
      </div>
    </div>
  )
}

function WorkspaceDirectoryCard({ workspace, onEdit, onDelete, onView, onStatusChanged }) {
  const roles = workspace.targetRoles || []
  const locations = workspace.preferredLocations || []
  return (
    <EntityDirectoryCard
      onClick={() => onView(workspace.id)}
      borderTopColor={dotHex(workspace.status)}
      avatarSlot={
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner-highlight" style={{ backgroundColor: dotHex(workspace.status) }}>
          <FolderOutlined sx={{ fontSize: 20 }} />
        </div>
      }
      titleSlot={
        <>
          <p className="text-[15px] font-bold text-white/90 truncate leading-snug">{workspace.name}</p>
          {roles.length > 0 && (
            <p className="text-[13px] text-white/40 truncate mt-0.5">{roles.join(', ')}</p>
          )}
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <WorkspaceStatusChanger workspace={workspace} onStatusChanged={onStatusChanged} />
          </div>
        </>
      }
      chips={
        <>
          {locations.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[13px] text-white/50 min-w-0 shrink truncate">
              <PlaceOutlined sx={{ fontSize: 15 }} className="text-app-danger shrink-0" />
              <span className="truncate">{locations.join(', ')}</span>
            </span>
          )}
          {workspace.workMode && (
            <span className="inline-flex items-center text-[13px] text-app-accent-soft shrink-0">{workspace.workMode}</span>
          )}
        </>
      }
      note={workspace.description}
      actionsSlot={
        <CardMenu items={[
          { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(workspace.id) },
          { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(workspace) },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(workspace), tone: 'danger' },
        ]} />
      }
      footer={
        <div className="grid grid-cols-2">
          <div className="px-3 py-3 text-center">
            <p className="font-display text-base font-bold text-white leading-none">{workspace.goalApplicationsTarget ?? '—'}</p>
            <p className="text-[11px] text-white/35 mt-1.5">Applications Goal</p>
          </div>
          <div className="px-3 py-3 text-center border-l border-white/[0.06]">
            <p className="text-xs font-semibold text-white/70">{workspace.searchStartDate ? fmtDate(workspace.searchStartDate) : '—'}</p>
            <p className="text-[11px] text-white/35 mt-1.5">Search Started</p>
          </div>
        </div>
      }
    />
  )
}

function AddEditModal({ open, workspace, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
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

  const inputCls = 'w-full h-11 px-4 border border-white/[0.06] rounded-xl text-sm text-app-text bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition placeholder:text-app-text-muted/80'
  const labelCls = 'block text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1.5'

  if (!open) return null

  return (
    <DrawerShell>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
        <h2 className="text-base font-bold text-white">{workspace ? 'Edit Workspace' : 'Create Workspace'}</h2>
        <button onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition">
          <CloseGlyphIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
      <div className="px-5 py-4 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>
              Workspace Name <span className="text-app-danger">*</span>
            </label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Backend SDE 2026" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Status</label>
            <FilterSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val }))}
              options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))}
              hideAll
              className="w-full"
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              placeholder="What's the strategy or goal for this workspace?" className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <p className="text-[11px] text-white/30 -mt-2">Separate multiple values with commas.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Work Mode</label>
              <FilterSelect
                value={form.workMode}
                onChange={(val) => setForm((f) => ({ ...f, workMode: val }))}
                allLabel="Not specified"
                options={WORK_MODE_OPTIONS}
                className="w-full"
              />
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
                      ? 'bg-app-accent/10 border-app-accent/40 text-app-accent-soft'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/[0.16]'
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
              <input type="number" min="0" value={form.goalApplicationsTarget} onChange={set('goalApplicationsTarget')}
                placeholder="Applications" className={inputCls} />
              <input type="number" min="0" value={form.goalInterviewsTarget} onChange={set('goalInterviewsTarget')}
                placeholder="Interviews" className={inputCls} />
              <input type="number" min="0" value={form.goalOffersTarget} onChange={set('goalOffersTarget')}
                placeholder="Offers" className={inputCls} />
            </div>
          </div>

          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={workspace ? 'Save Changes' : 'Create Workspace'} />
        </form>
      </div>
    </DrawerShell>
  )
}

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
          Remove <span className="font-semibold text-white/80">{workspace?.name}</span> and all of its settings?
          <span className="block text-xs text-app-danger mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

export default function Workspaces() {
  const [success, setSuccess] = useTransientMessage()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [workModeFilter, setWorkModeFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchInputRef = React.useRef(null)

  const {
    items: workspaces, setItems: setWorkspaces, loading, error, setError,
    page, setPage, size, setSize, refetch: fetchWorkspaces,
  } = usePagedList(
    useCallback(
      (page, size) => getWorkspaces({ search: search.trim() || undefined, status: statusFilter || undefined, sortBy, order, page, size }),
      [search, statusFilter, sortBy, order]
    ),
    'Failed to load workspaces.'
  )

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Workspace', setSuccess, [fetchWorkspaces])
  const [viewId, setViewId] = useState(null)

  useSearchShortcut(searchInputRef)

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((w) => {
      if (workModeFilter && w.workMode !== workModeFilter) return false
      return true
    })
  }, [workspaces, workModeFilter])

  const openAdd  = () => { setViewId(null); setEditTarget(null); setModalOpen(true) }
  const openEdit = (w) => { setViewId(null); setEditTarget(w); setModalOpen(true) }

  useAddQueryParam(openAdd)

  const handleStatusChanged = (updated) => {
    setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w))
  }

  const { activeFilterCount, isFiltered, clearAllFilters } = useFilterState(search, setSearch, [
    [statusFilter, setStatusFilter],
    [workModeFilter, setWorkModeFilter],
  ])

  const openView = (id) => { setModalOpen(false); setViewId(id) }
  const cardProps = { onEdit: openEdit, onDelete: setDeleteTarget, onView: openView, onStatusChanged: handleStatusChanged }
  const drawerOpen = modalOpen || viewId !== null

  return (
    <Layout
      drawerOpen={drawerOpen}
      headerAction={<HeaderAddButton label="Add Workspace" onClick={openAdd} drawerOpen={drawerOpen} />}
    >
      <div className={`overflow-x-hidden transition-[margin] duration-300 ease-out ${drawerOpen ? 'lg:mr-[26rem]' : ''}`}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      {!loading && workspaces.length > 0 && (
        <div className="mb-8">
          <StatTilesBar
            items={workspaces}
            statusConfig={STATUS_CONFIG}
            activeFilter={statusFilter}
            onFilter={setStatusFilter}
            totalLabel="Total Workspaces"
            totalIcon={<FolderOutlined sx={{ fontSize: 18 }} />}
            compact={drawerOpen}
          />
        </div>
      )}

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[14rem]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none flex">
              <Search fontSize="small" />
            </span>
            <input ref={searchInputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full h-11 pl-11 pr-16 border border-white/[0.06] rounded-xl text-sm text-app-text bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition placeholder:text-app-text-muted/80" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] text-[11px] font-medium text-app-text-muted pointer-events-none">
              ⌘K
            </span>
          </div>

          <button onClick={() => setFiltersOpen((o) => !o)}
            className={`h-11 px-4 flex items-center gap-2 border rounded-xl text-sm font-medium transition whitespace-nowrap ${
              filtersOpen || activeFilterCount > 0
                ? 'border-app-accent/40 bg-app-accent/10 text-app-accent-soft'
                : 'border-white/[0.06] bg-white/[0.03] text-app-text-soft hover:bg-white/[0.05] hover:border-white/[0.12]'
            }`}>
            <FilterListRounded fontSize="small" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-app-accent text-white text-[11px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
            <KeyboardArrowDown fontSize="small" className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFiltered && (
            <button onClick={clearAllFilters}
              className="text-sm font-medium text-app-accent-soft hover:text-white transition whitespace-nowrap">
              Clear All
            </button>
          )}

          <div className="ml-auto">
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect value={statusFilter} onChange={setStatusFilter} allLabel="All Statuses" className="flex-1 min-w-[7rem]"
              options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))} />
            <FilterSelect value={workModeFilter} onChange={setWorkModeFilter} allLabel="All Work Modes" className="flex-1 min-w-[7rem]"
              options={WORK_MODE_OPTIONS} />

            <FilterSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} hideAll className="flex-1 min-w-[7rem]" />

            <button onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="h-11 px-4 border border-white/[0.06] rounded-xl text-sm font-medium text-app-text-soft hover:bg-white/[0.05] hover:border-white/[0.12] transition bg-white/[0.03] whitespace-nowrap">
              {order === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <PageSpinner />
      ) : filteredWorkspaces.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title={isFiltered ? 'No workspaces match your filters' : 'No workspaces yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Create a workspace to start organizing your job search.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Create your first workspace
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div>
          <h2 className="text-[18px] font-semibold text-app-text mb-4">
            {filteredWorkspaces.length} {filteredWorkspaces.length === 1 ? 'Workspace' : 'Workspaces'}
          </h2>
          <div className="space-y-3">
            {filteredWorkspaces.map((w) => (
              <WorkspaceListRow key={w.id} workspace={w} {...cardProps}
                order={order} onToggleOrder={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))} compact={drawerOpen} />
            ))}
          </div>
          <Pagination page={workspaces.page} totalPages={workspaces.totalPages}
            totalElements={workspaces.totalElements} size={workspaces.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      ) : (
        <div>
          <h2 className="text-[18px] font-semibold text-app-text mb-4">
            {filteredWorkspaces.length} {filteredWorkspaces.length === 1 ? 'Workspace' : 'Workspaces'}
          </h2>
          <div className={`grid gap-6 ${drawerOpen ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {filteredWorkspaces.map((w) => (
              <WorkspaceDirectoryCard key={w.id} workspace={w} {...cardProps} />
            ))}
          </div>
          <Pagination page={workspaces.page} totalPages={workspaces.totalPages}
            totalElements={workspaces.totalElements} size={workspaces.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      )}
      </div>

      <AddEditModal open={modalOpen} workspace={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} workspace={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <WorkspaceDetailModal open={viewId !== null} workspaceId={viewId}
        onClose={() => setViewId(null)} onStatusChanged={handleStatusChanged}
        onEdit={(w) => { setViewId(null); openEdit(w) }}
        onDelete={(w) => { setViewId(null); setDeleteTarget(w) }} />
    </Layout>
  )
}
