import { useState, useCallback, useRef } from 'react'
import { CircularProgress } from '@mui/material'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  Search, KeyboardArrowDown, FilterListRounded, TaskAltRounded,
  EditOutlined, DeleteOutlineRounded, SnoozeRounded, CancelOutlined, CheckCircleOutlineRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import { ConfirmDeleteModal } from '../components/ModalShell'
import {
  getActionItems, addActionItem, updateActionItem, deleteActionItem,
  completeActionItem, snoozeActionItem, cancelActionItem,
} from '../api/actionItem'
import EmptyState from '../components/EmptyState'
import InlineStatusChanger from '../components/InlineStatusChanger'
import { CardMenu } from '../components/EntityCard'
import { fmtDate } from '../utils/followup'
import useSearchShortcut from '../hooks/useSearchShortcut'
import useAddQueryParam from '../hooks/useAddQueryParam'
import useTransientMessage from '../hooks/useTransientMessage'
import usePagedList from '../hooks/usePagedList'
import { DrawerShell, DrawerHeader } from '../components/DrawerShell'
import { fieldInputCls, FieldErrorText, FieldLabel, FormFooterButtons } from '../components/formKit'
import FilterSelect from '../components/FilterSelect'
import HeaderAddButton from '../components/HeaderAddButton'
import useCrudModals from '../hooks/useCrudModals'

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        badge: 'bg-white/[0.06] text-white/60',          border: 'border-l-white/10',    dot: 'bg-white/40'    },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-app-accent/10 text-app-accent-soft',  border: 'border-l-app-accent',  dot: 'bg-app-accent'  },
  COMPLETED:   { label: 'Completed',   badge: 'bg-app-success/10 text-app-success',     border: 'border-l-app-success', dot: 'bg-app-success' },
  SNOOZED:     { label: 'Snoozed',     badge: 'bg-app-warning/10 text-app-warning',     border: 'border-l-app-warning', dot: 'bg-app-warning' },
  CANCELLED:   { label: 'Cancelled',   badge: 'bg-white/[0.06] text-white/40',          border: 'border-l-white/10',    dot: 'bg-white/30'    },
}

const TYPE_LABELS = {
  TAILOR_RESUME:       'Tailor Resume',
  APPLY_TO_ROLE:       'Apply to Role',
  ASK_FOR_REFERRAL:    'Ask for Referral',
  FOLLOW_UP_RECRUITER: 'Follow Up Recruiter',
  PREPARE_INTERVIEW:   'Prepare Interview',
  SUBMIT_ASSIGNMENT:   'Submit Assignment',
  SEND_THANK_YOU_NOTE: 'Send Thank-You Note',
  COMPARE_OFFER:       'Compare Offer',
  OTHER:               'Other',
}

const PRIORITY_CONFIG = {
  LOW:    { label: 'Low',    badge: 'bg-white/[0.06] text-white/50' },
  MEDIUM: { label: 'Medium', badge: 'bg-app-accent/10 text-app-accent-soft' },
  HIGH:   { label: 'High',   badge: 'bg-app-warning/10 text-app-warning' },
  URGENT: { label: 'Urgent', badge: 'bg-app-danger/10 text-app-danger' },
}

const SORT_OPTIONS = [
  { value: 'dueDate',   label: 'Due Date'    },
  { value: 'priority',  label: 'Priority'    },
  { value: 'status',    label: 'Status'      },
  { value: 'createdAt', label: 'Date Added'  },
  { value: 'updatedAt', label: 'Last Updated'},
]

const EMPTY_FORM = {
  title: '', type: 'OTHER', status: 'OPEN', priority: 'MEDIUM', dueDate: '', notes: '',
}

function ActionStatusChanger({ item, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={item}
      statusConfig={STATUS_CONFIG}
      defaultStatus="OPEN"
      updateFn={updateActionItem}
      onStatusChanged={onStatusChanged}
    />
  )
}

function ActionRow({ item, onEdit, onDelete, onComplete, onSnooze, onCancel, onStatusChanged }) {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN
  const pCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.MEDIUM
  const canAct = item.status !== 'COMPLETED' && item.status !== 'CANCELLED'

  return (
    <div className={`group relative rounded-card border border-white/[0.06] border-l-4 ${cfg.border} bg-app-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover`}>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 px-4 sm:px-5 py-3.5 w-full">
        <div className="w-full sm:flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${item.overdue ? 'text-app-danger' : 'text-white/90'}`}>{item.title}</p>
          <p className="text-xs text-white/40 truncate mt-0.5">{TYPE_LABELS[item.type] || item.type}</p>
        </div>

        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${pCfg.badge}`}>
          {pCfg.label}
        </span>

        <div className="w-32 shrink-0">
          <ActionStatusChanger item={item} onStatusChanged={onStatusChanged} />
        </div>

        <div className="w-28 shrink-0 hidden md:block">
          <p className="text-[11px] text-white/35">Due</p>
          <p className={`text-sm font-medium mt-0.5 ${item.overdue ? 'text-app-danger font-semibold' : 'text-white/70'}`}>
            {item.dueDate ? fmtDate(item.dueDate) : '—'}
          </p>
        </div>

        {item.overdue && (
          <span className="shrink-0 text-[10px] font-semibold text-app-danger bg-app-danger/10 px-2 py-0.5 rounded-full hidden lg:inline-flex">
            Overdue
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <CardMenu items={[
            ...(canAct ? [
              { key: 'complete', label: 'Mark Complete', icon: <CheckCircleOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onComplete(item) },
              { key: 'snooze', label: 'Snooze', icon: <SnoozeRounded sx={{ fontSize: 16 }} />, onClick: () => onSnooze(item) },
              { key: 'cancel', label: 'Cancel', icon: <CancelOutlined sx={{ fontSize: 16 }} />, onClick: () => onCancel(item) },
            ] : []),
            { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(item) },
            { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(item), tone: 'danger' },
          ]} />
        </div>
      </div>
    </div>
  )
}

function SnoozeModal({ open, item, onClose, onConfirm }) {
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleConfirm = async () => {
    if (!date) { setError('Pick a date to snooze until.'); return }
    setSaving(true)
    setError('')
    try {
      await onConfirm(date)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to snooze.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative rounded-card border border-white/[0.06] bg-app-surface shadow-card w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-white mb-1">Snooze Action</h2>
        <p className="text-sm text-white/50 mb-4">"{item?.title}" — pick a date to reopen this action.</p>
        <FieldLabel>Snooze Until</FieldLabel>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setError('') }}
          className={fieldInputCls(!!error)} />
        <FieldErrorText error={error} />
        <div className="flex gap-3 mt-4">
          <button onClick={handleConfirm} disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <CircularProgress size={14} color="inherit" />}
            Snooze
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-white/70 bg-white/[0.06] rounded-xl hover:bg-white/[0.10] transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function AddEditDrawer({ open, item, onClose, onSaved }) {
  const [form, setForm] = useState(() => item ? {
    title:    item.title    || '',
    type:     item.type     || 'OTHER',
    status:   item.status   || 'OPEN',
    priority: item.priority || 'MEDIUM',
    dueDate:  item.dueDate  || '',
    notes:    item.notes    || '',
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  if (!open) return null

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setVal = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const payload = {
      title:    form.title.trim(),
      type:     form.type,
      status:   form.status || undefined,
      priority: form.priority || undefined,
      dueDate:  form.dueDate || undefined,
      notes:    form.notes.trim() || undefined,
    }
    try {
      item ? await updateActionItem(item.id, payload) : await addActionItem(payload)
      onSaved()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setFieldErrors(data.errors)
      else setError(data?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (field) => fieldInputCls(!!fieldErrors[field])

  return (
    <DrawerShell>
      <DrawerHeader onClose={onClose} title={item ? 'Edit Action' : 'New Action'} subtitle={item ? 'Update this action item' : 'Add a next step to your job search'} />
      <div className="px-6 py-5 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>
              Title <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.title} onChange={set('title')}
              placeholder="Follow up with recruiter at Acme" maxLength={200} className={inputCls('title')} required />
            <FieldErrorText error={fieldErrors.title} />
          </div>

          <div>
            <FieldLabel>Type</FieldLabel>
            <FilterSelect
              value={form.type}
              onChange={setVal('type')}
              options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              hideAll
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Priority</FieldLabel>
              <FilterSelect
                value={form.priority}
                onChange={setVal('priority')}
                options={Object.entries(PRIORITY_CONFIG).map(([value, { label }]) => ({ value, label }))}
                hideAll
                className="w-full"
              />
            </div>
            <div>
              <FieldLabel>Due Date</FieldLabel>
              <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inputCls('dueDate')} />
            </div>
          </div>

          {item && (
            <div>
              <FieldLabel>Status</FieldLabel>
              <FilterSelect
                value={form.status}
                onChange={setVal('status')}
                options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))}
                hideAll
                className="w-full"
              />
            </div>
          )}

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              maxLength={2000} placeholder="Any extra context..."
              className={`${inputCls('notes')} resize-none`} />
            <p className="text-xs text-white/35 mt-1 text-right">{form.notes.length}/2000</p>
          </div>

          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={item ? 'Save Changes' : 'Add Action'} saveFirst heightCls="py-2.5" />
        </form>
      </div>
    </DrawerShell>
  )
}

export default function ActionItems() {
  const [success, setSuccess] = useTransientMessage()

  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('dueDate')
  const [order, setOrder] = useState('asc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)

  const [snoozeTarget, setSnoozeTarget] = useState(null)

  const {
    items: actionItems, setItems: setActionItems, loading, error, setError,
    setPage, setSize, refetch: fetchActionItems,
  } = usePagedList(
    useCallback(
      (page, size) => getActionItems({ status: statusFilter || undefined, type: typeFilter || undefined, sortBy, order, page, size }),
      [statusFilter, typeFilter, sortBy, order]
    ),
    'Failed to load action items.'
  )

  useSearchShortcut(searchInputRef)

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Action item', setSuccess, [fetchActionItems])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (i) => { setEditTarget(i); setModalOpen(true) }
  useAddQueryParam(openAdd)

  const handleStatusChanged = (updated) => {
    setActionItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  const handleComplete = async (item) => {
    const { data } = await completeActionItem(item.id)
    handleStatusChanged(data)
    setSuccess('Action marked complete.')
  }

  const handleCancel = async (item) => {
    const { data } = await cancelActionItem(item.id)
    handleStatusChanged(data)
    setSuccess('Action cancelled.')
  }

  const handleSnoozeConfirm = async (date) => {
    const { data } = await snoozeActionItem(snoozeTarget.id, date)
    handleStatusChanged(data)
    setSnoozeTarget(null)
    setSuccess('Action snoozed.')
  }

  const filteredItems = search.trim()
    ? actionItems.filter(i => i.title.toLowerCase().includes(search.trim().toLowerCase()))
    : actionItems

  const isFiltered = search.trim() || statusFilter || typeFilter

  return (
    <Layout headerAction={<HeaderAddButton label="New Action" onClick={openAdd} />}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[14rem]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none flex">
              <Search fontSize="small" />
            </span>
            <input ref={searchInputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action titles..."
              className="w-full h-11 pl-11 pr-16 border border-white/[0.06] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition placeholder:text-white/25" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] text-[11px] font-medium text-white/30 pointer-events-none">
              ⌘K
            </span>
          </div>

          <button onClick={() => setFiltersOpen((o) => !o)}
            className={`h-11 px-4 flex items-center gap-2 border rounded-xl text-sm font-medium transition whitespace-nowrap ${
              filtersOpen || statusFilter || typeFilter
                ? 'border-app-accent/40 bg-app-accent/10 text-app-accent-soft'
                : 'border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.05] hover:border-white/[0.12]'
            }`}>
            <FilterListRounded fontSize="small" />
            Filters
            <KeyboardArrowDown fontSize="small" className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFiltered && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter('') }}
              className="text-sm font-medium text-app-accent-soft hover:text-white transition whitespace-nowrap">
              Clear All
            </button>
          )}
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect value={statusFilter} onChange={setStatusFilter} allLabel="All Statuses" className="flex-1 min-w-[9rem]"
              options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))} />

            <FilterSelect value={typeFilter} onChange={setTypeFilter} allLabel="All Types" className="flex-1 min-w-[9rem]"
              options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))} />

            <FilterSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} hideAll className="flex-1 min-w-[9rem]" />

            <button onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="h-11 px-4 border border-white/[0.06] rounded-xl text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:border-white/[0.12] transition bg-white/[0.03] whitespace-nowrap">
              {order === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <PageSpinner />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="✅"
          title={isFiltered ? 'No actions match your filters' : 'No action items yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Create your first next step — tailor a resume, follow up, or prep for an interview.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Add your first action
            </button>
          )}
        />
      ) : (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4 flex items-center gap-2">
            <TaskAltRounded sx={{ fontSize: 18 }} className="text-app-accent-soft" />
            {filteredItems.length} {filteredItems.length === 1 ? 'Action' : 'Actions'}
          </h2>
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onComplete={handleComplete}
                onSnooze={setSnoozeTarget}
                onCancel={handleCancel}
                onStatusChanged={handleStatusChanged}
              />
            ))}
          </div>
          <Pagination page={actionItems.page} totalPages={actionItems.totalPages}
            totalElements={actionItems.totalElements} size={actionItems.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      )}

      <AddEditDrawer key={editTarget?.id ?? 'new'} open={modalOpen} item={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteActionItem(deleteTarget.id); handleDeleted() }}
        title="Delete Action Item"
        message={deleteTarget && (
          <>Delete "<span className="font-semibold text-white/80">{deleteTarget.title}</span>"?</>
        )}
      />

      <SnoozeModal
        open={!!snoozeTarget}
        item={snoozeTarget}
        onClose={() => setSnoozeTarget(null)}
        onConfirm={handleSnoozeConfirm}
      />
    </Layout>
  )
}
