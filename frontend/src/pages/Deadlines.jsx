import { useState, useCallback, useRef } from 'react'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  Search, KeyboardArrowDown, FilterListRounded, EventBusyRounded,
  EditOutlined, DeleteOutlineRounded, CancelOutlined, CheckCircleOutlineRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import { ConfirmDeleteModal } from '../components/ModalShell'
import {
  getDeadlines, addDeadline, updateDeadline, deleteDeadline, completeDeadline, cancelDeadline,
} from '../api/deadline'
import EmptyState from '../components/EmptyState'
import { CardMenu } from '../components/EntityCard'
import { fmt } from '../utils/followup'
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
  UPCOMING:  { label: 'Upcoming',  badge: 'bg-app-accent/10 text-app-accent-soft', border: 'border-l-app-accent'  },
  COMPLETED: { label: 'Completed', badge: 'bg-app-success/10 text-app-success',    border: 'border-l-app-success' },
  MISSED:    { label: 'Missed',    badge: 'bg-app-danger/10 text-app-danger',      border: 'border-l-app-danger'  },
  CANCELLED: { label: 'Cancelled', badge: 'bg-white/[0.06] text-white/40',         border: 'border-l-white/10'    },
}

const TYPE_LABELS = {
  OA_DEADLINE:                 'OA Deadline',
  ASSIGNMENT_SUBMISSION:       'Assignment Submission',
  INTERVIEW_AVAILABILITY_FORM: 'Interview Availability Form',
  OFFER_ACCEPTANCE:            'Offer Acceptance',
  DOCUMENT_SUBMISSION:         'Document Submission',
  OTHER:                       'Other',
}

const ENTITY_TYPE_LABELS = {
  OPPORTUNITY: 'Opportunity', APPLICATION: 'Application', CONTACT: 'Contact',
  INTERVIEW: 'Interview', REFERRAL: 'Referral', OFFER: 'Offer',
}

const SORT_OPTIONS = [
  { value: 'dueAt',     label: 'Due Date'    },
  { value: 'status',    label: 'Status'      },
  { value: 'createdAt', label: 'Date Added'  },
]

const EMPTY_FORM = {
  title: '', type: 'OTHER', dueAt: '', entityType: 'APPLICATION', entityId: '', notes: '',
}

function statusBadge(d) {
  if (d.missed && d.status === 'UPCOMING') return STATUS_CONFIG.MISSED
  return STATUS_CONFIG[d.status] || STATUS_CONFIG.UPCOMING
}

function DeadlineRow({ item, onEdit, onDelete, onComplete, onCancel }) {
  const cfg = statusBadge(item)
  const canAct = item.status === 'UPCOMING'

  return (
    <div className={`group relative rounded-card border border-white/[0.06] border-l-4 ${cfg.border} bg-app-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover`}>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 px-4 sm:px-5 py-3.5 w-full">
        <div className="w-full sm:flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${item.missed ? 'text-app-danger' : 'text-white/90'}`}>{item.title}</p>
          <p className="text-xs text-white/40 truncate mt-0.5">
            {TYPE_LABELS[item.type] || item.type} · {ENTITY_TYPE_LABELS[item.entityType] || item.entityType} #{item.entityId}
          </p>
        </div>

        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
          {cfg.label}
        </span>

        <div className="w-40 shrink-0 hidden md:block">
          <p className="text-[11px] text-white/35">Due</p>
          <p className={`text-sm font-medium mt-0.5 ${item.missed ? 'text-app-danger font-semibold' : 'text-white/70'}`}>
            {fmt(item.dueAt)}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <CardMenu items={[
            ...(canAct ? [
              { key: 'complete', label: 'Mark Completed', icon: <CheckCircleOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onComplete(item) },
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

function AddEditDrawer({ open, item, onClose, onSaved }) {
  const [form, setForm] = useState(() => item ? {
    title:      item.title      || '',
    type:       item.type       || 'OTHER',
    dueAt:      item.dueAt      ? item.dueAt.slice(0, 16) : '',
    entityType: item.entityType || 'APPLICATION',
    entityId:   item.entityId   || '',
    notes:      item.notes      || '',
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  if (!open) return null

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setVal = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.entityId) { setFieldErrors({ entityId: 'Linked record ID is required.' }); return }
    setSaving(true)
    setError('')
    setFieldErrors({})
    const payload = {
      title:      form.title.trim(),
      type:       form.type,
      dueAt:      form.dueAt || undefined,
      entityType: form.entityType,
      entityId:   Number(form.entityId),
      notes:      form.notes.trim() || undefined,
    }
    try {
      item ? await updateDeadline(item.id, payload) : await addDeadline(payload)
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
      <DrawerHeader onClose={onClose} title={item ? 'Edit Deadline' : 'New Deadline'} subtitle={item ? 'Update this deadline' : 'Track an OA, assignment, or acceptance deadline'} />
      <div className="px-6 py-5 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>
              Title <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.title} onChange={set('title')}
              placeholder="Submit OA for Acme SWE role" maxLength={200} className={inputCls('title')} required />
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

          <div>
            <FieldLabel>
              Due Date/Time <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="datetime-local" value={form.dueAt} onChange={set('dueAt')} className={inputCls('dueAt')} required />
          </div>

          <p className="text-xs font-bold text-white/40 uppercase tracking-wider pt-1">Linked Record</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Entity Type</FieldLabel>
              <FilterSelect
                value={form.entityType}
                onChange={setVal('entityType')}
                options={Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                hideAll
                className="w-full"
              />
            </div>
            <div>
              <FieldLabel>
                Entity ID <span className="text-app-danger">*</span>
              </FieldLabel>
              <input type="number" value={form.entityId} onChange={set('entityId')}
                placeholder="e.g. 42" className={inputCls('entityId')} required />
              <FieldErrorText error={fieldErrors.entityId} />
            </div>
          </div>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              maxLength={2000} placeholder="Any extra context..."
              className={`${inputCls('notes')} resize-none`} />
            <p className="text-xs text-white/35 mt-1 text-right">{form.notes.length}/2000</p>
          </div>

          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={item ? 'Save Changes' : 'Add Deadline'} saveFirst heightCls="py-2.5" />
        </form>
      </div>
    </DrawerShell>
  )
}

export default function Deadlines() {
  const [success, setSuccess] = useTransientMessage()

  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('dueAt')
  const [order, setOrder] = useState('asc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)

  const {
    items: deadlines, setItems: setDeadlines, loading, error, setError,
    setPage, setSize, refetch: fetchDeadlines,
  } = usePagedList(
    useCallback(
      (page, size) => getDeadlines({ status: statusFilter || undefined, sortBy, order, page, size }),
      [statusFilter, sortBy, order]
    ),
    'Failed to load deadlines.'
  )

  useSearchShortcut(searchInputRef)

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Deadline', setSuccess, [fetchDeadlines])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (i) => { setEditTarget(i); setModalOpen(true) }
  useAddQueryParam(openAdd)

  const handleComplete = async (item) => {
    const { data } = await completeDeadline(item.id)
    setDeadlines(prev => prev.map(d => d.id === data.id ? data : d))
    setSuccess('Deadline marked completed.')
  }

  const handleCancel = async (item) => {
    const { data } = await cancelDeadline(item.id)
    setDeadlines(prev => prev.map(d => d.id === data.id ? data : d))
    setSuccess('Deadline cancelled.')
  }

  const filteredItems = search.trim()
    ? deadlines.filter(i => i.title.toLowerCase().includes(search.trim().toLowerCase()))
    : deadlines

  const isFiltered = search.trim() || statusFilter

  return (
    <Layout headerAction={<HeaderAddButton label="New Deadline" onClick={openAdd} />}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[14rem]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none flex">
              <Search fontSize="small" />
            </span>
            <input ref={searchInputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deadline titles..."
              className="w-full h-11 pl-11 pr-16 border border-white/[0.06] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition placeholder:text-white/25" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] text-[11px] font-medium text-white/30 pointer-events-none">
              ⌘K
            </span>
          </div>

          <button onClick={() => setFiltersOpen((o) => !o)}
            className={`h-11 px-4 flex items-center gap-2 border rounded-xl text-sm font-medium transition whitespace-nowrap ${
              filtersOpen || statusFilter
                ? 'border-app-accent/40 bg-app-accent/10 text-app-accent-soft'
                : 'border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.05] hover:border-white/[0.12]'
            }`}>
            <FilterListRounded fontSize="small" />
            Filters
            <KeyboardArrowDown fontSize="small" className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFiltered && (
            <button onClick={() => { setSearch(''); setStatusFilter('') }}
              className="text-sm font-medium text-app-accent-soft hover:text-white transition whitespace-nowrap">
              Clear All
            </button>
          )}
        </div>

        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect value={statusFilter} onChange={setStatusFilter} allLabel="All Statuses" className="flex-1 min-w-[9rem]"
              options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))} />

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
          icon="⏰"
          title={isFiltered ? 'No deadlines match your filters' : 'No deadlines yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Track OA deadlines, assignment due dates, and offer acceptance windows here.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Add your first deadline
            </button>
          )}
        />
      ) : (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4 flex items-center gap-2">
            <EventBusyRounded sx={{ fontSize: 18 }} className="text-app-accent-soft" />
            {filteredItems.length} {filteredItems.length === 1 ? 'Deadline' : 'Deadlines'}
          </h2>
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <DeadlineRow
                key={item.id}
                item={item}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onComplete={handleComplete}
                onCancel={handleCancel}
              />
            ))}
          </div>
          <Pagination page={deadlines.page} totalPages={deadlines.totalPages}
            totalElements={deadlines.totalElements} size={deadlines.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      )}

      <AddEditDrawer key={editTarget?.id ?? 'new'} open={modalOpen} item={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteDeadline(deleteTarget.id); handleDeleted() }}
        title="Delete Deadline"
        message={deleteTarget && (
          <>Delete "<span className="font-semibold text-white/80">{deleteTarget.title}</span>"?</>
        )}
      />
    </Layout>
  )
}
