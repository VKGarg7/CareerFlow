import React, { useState, useCallback, useRef } from 'react'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  FlagOutlined, DeleteOutlineRounded, EditOutlined, PauseCircleOutlineRounded, PlayCircleOutlineRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import InfiniteScrollSentinel from '../components/InfiniteScrollSentinel'
import EmptyState from '../components/EmptyState'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { FieldLabel, fieldInputCls, FormFooterButtons } from '../components/formKit'
import FilterSelect from '../components/FilterSelect'
import HeaderAddButton from '../components/HeaderAddButton'
import MagneticButton from '../components/MagneticButton'
import CursorSpotlight from '../components/CursorSpotlight'
import AchievementToast from '../components/AchievementToast'
import CountUp from '../components/CountUp'
import { getGoals, addGoal, updateGoal, deleteGoal } from '../api/goal'
import { fmtDate } from '../utils/followup'
import useTransientMessage from '../hooks/useTransientMessage'
import useInfiniteList from '../hooks/useInfiniteList'
import useCrudModals from '../hooks/useCrudModals'
import useAddQueryParam from '../hooks/useAddQueryParam'

const METRIC_CONFIG = {
  APPLICATIONS:       { label: 'Applications',      hex: '#5B5FEF' },
  RECRUITER_OUTREACH: { label: 'Recruiter Outreach', hex: '#8B5CF6' },
  REFERRALS:          { label: 'Referrals',          hex: '#F59E0B' },
  INTERVIEWS:         { label: 'Interviews',         hex: '#22C55E' },
  TARGET_COMPANIES:   { label: 'Target Companies',   hex: '#F43F5E' },
}

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    badge: 'bg-app-accent/10 text-app-accent-soft' },
  COMPLETED: { label: 'Completed', badge: 'bg-app-success/10 text-app-success' },
  INACTIVE:  { label: 'Inactive',  badge: 'bg-white/[0.06] text-white/40' },
}

const SORT_OPTIONS = [
  { value: 'createdAt',   label: 'Date Added' },
  { value: 'startDate',   label: 'Start Date' },
  { value: 'endDate',     label: 'End Date' },
  { value: 'targetValue', label: 'Target Value' },
  { value: 'status',      label: 'Status' },
]

const todayISO = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM = {
  metricType: 'APPLICATIONS', targetValue: '', startDate: todayISO(),
  endDate: todayISO(), status: 'ACTIVE',
}

function ProgressBar({ progress, target, hex }) {
  const pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-white/80">
          <CountUp value={progress} duration={0.7} /> / {target}
        </span>
        <span className="text-xs font-medium text-white/40">{pct}%</span>
      </div>
      <div className="engraved-well h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: hex, boxShadow: `0 0 10px -1px ${hex}99` }} />
      </div>
    </div>
  )
}

function GoalCard({ goal, onEdit, onDelete, onToggleActive }) {
  const metric = METRIC_CONFIG[goal.metricType] || METRIC_CONFIG.APPLICATIONS
  const status = STATUS_CONFIG[goal.status] || STATUS_CONFIG.ACTIVE

  return (
    <CursorSpotlight className="glass-surface glass-edge corner-light elevate-float overflow-hidden rounded-hud border-l-4 shadow-glass-1 p-5 transition-shadow duration-300 hover:-translate-y-0.5 hover:shadow-glass-hover"
      style={{ borderLeftColor: metric.hex }}>
      <div className="card-noise bg-noise" />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white/90 truncate">{metric.label}</p>
          <p className="text-xs text-white/40 mt-0.5">{fmtDate(goal.startDate)} – {fmtDate(goal.endDate)}</p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${status.badge}`}>{status.label}</span>
      </div>

      <ProgressBar progress={goal.progress} target={goal.targetValue} hex={metric.hex} />

      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.06]">
        {goal.status !== 'COMPLETED' && (
          <button onClick={() => onToggleActive(goal)}
            className="btn-liquid flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] text-white/60 bg-white/[0.02] hover:bg-white/[0.08] transition">
            {goal.status === 'ACTIVE'
              ? <><PauseCircleOutlineRounded sx={{ fontSize: 14 }} /> Mark Inactive</>
              : <><PlayCircleOutlineRounded sx={{ fontSize: 14 }} /> Reactivate</>}
          </button>
        )}
        <button onClick={() => onEdit(goal)}
          className="btn-liquid flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] text-white/60 bg-white/[0.02] hover:bg-white/[0.08] transition">
          <EditOutlined sx={{ fontSize: 14 }} /> Edit
        </button>
        <button onClick={() => onDelete(goal)}
          className="btn-liquid ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-app-danger/20 text-app-danger bg-app-danger/[0.04] hover:bg-app-danger hover:text-white hover:border-app-danger transition">
          <DeleteOutlineRounded sx={{ fontSize: 14 }} />
        </button>
      </div>
    </CursorSpotlight>
  )
}

function AddEditModal({ open, goal, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the modal's form state when it opens for a given goal is the intended effect
      setForm(goal ? {
        metricType: goal.metricType, targetValue: String(goal.targetValue),
        startDate: goal.startDate, endDate: goal.endDate, status: goal.status,
      } : EMPTY_FORM)
      setError('')
    }
  }, [open, goal])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const target = Number(form.targetValue)
    if (!target || target < 1) { setError('Target value must be at least 1.'); return }
    if (form.endDate < form.startDate) { setError('End date must not be before start date.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, targetValue: target }
      goal ? await updateGoal(goal.id, payload) : await addGoal(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title={goal ? 'Edit Goal' : 'Add Goal'}>
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Metric</FieldLabel>
            <FilterSelect
              value={form.metricType}
              onChange={(val) => setForm((f) => ({ ...f, metricType: val }))}
              options={Object.entries(METRIC_CONFIG).map(([value, { label }]) => ({ value, label }))}
              hideAll
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>Target Value</FieldLabel>
            <input type="number" min="1" value={form.targetValue} onChange={set('targetValue')}
              placeholder="e.g. 20" className={fieldInputCls(false)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Start Date</FieldLabel>
              <input type="date" value={form.startDate} onChange={set('startDate')} className={fieldInputCls(false)} />
            </div>
            <div>
              <FieldLabel>End Date</FieldLabel>
              <input type="date" value={form.endDate} onChange={set('endDate')} className={fieldInputCls(false)} />
            </div>
          </div>
          {goal && (
            <div>
              <FieldLabel>Status</FieldLabel>
              <FilterSelect
                value={form.status}
                onChange={(val) => setForm((f) => ({ ...f, status: val }))}
                options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))}
                hideAll
                className="w-full"
              />
            </div>
          )}
          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={goal ? 'Save Changes' : 'Add Goal'} />
        </form>
      </div>
    </ModalShell>
  )
}

function DeleteModal({ open, goal, onClose, onDeleted }) {
  const handleDelete = async () => { await deleteGoal(goal.id); onDeleted() }
  return (
    <ConfirmDeleteModal
      open={open && !!goal}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Goal"
      message={
        <>
          Remove this <span className="font-semibold text-white/80">{goal && (METRIC_CONFIG[goal.metricType] || {}).label}</span> goal?
          <span className="block text-xs text-app-danger mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

export default function Goals() {
  const [success, setSuccess] = useTransientMessage()
  const [achievement, setAchievement] = useTransientMessage(4500)
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const knownStatuses = useRef({})

  const {
    items: goals, loading, loadingMore, hasMore, loadMore, error, setError, refetch: fetchGoals,
  } = useInfiniteList(
    useCallback((page, size) => getGoals({ status: statusFilter || undefined, sortBy, order, page, size }),
      [statusFilter, sortBy, order]),
    'Failed to load goals.'
  )

  React.useEffect(() => {
    for (const g of goals) {
      const prev = knownStatuses.current[g.id]
      if (prev && prev !== 'COMPLETED' && g.status === 'COMPLETED') {
        const metric = METRIC_CONFIG[g.metricType] || METRIC_CONFIG.APPLICATIONS
        setAchievement(`${metric.label} goal complete — ${g.targetValue}/${g.targetValue}!`)
      }
      knownStatuses.current[g.id] = g.status
    }
  }, [goals, setAchievement])

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Goal', setSuccess, [fetchGoals])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (g) => { setEditTarget(g); setModalOpen(true) }

  useAddQueryParam(openAdd)

  const handleToggleActive = async (goal) => {
    try {
      await updateGoal(goal.id, { status: goal.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
      setSuccess('Goal updated.')
      fetchGoals()
    } catch {
      setError('Failed to update goal.')
    }
  }

  return (
    <Layout headerAction={<HeaderAddButton label="Add Goal" onClick={openAdd} />}>
      <AchievementToast message={achievement} title="Goal achieved" />
      <div className="overflow-x-hidden">
        <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
        <PageAlert severity="error" message={error} onClose={() => setError('')} />

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <FilterSelect value={statusFilter} onChange={setStatusFilter} allLabel="All Statuses" className="flex-1 min-w-[7rem]"
            options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))} />
          <FilterSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} hideAll className="flex-1 min-w-[7rem]" />
          <button onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            className="h-11 px-4 border border-white/[0.06] rounded-xl text-sm font-medium text-app-text-soft hover:bg-white/[0.05] hover:border-white/[0.12] transition bg-white/[0.03] whitespace-nowrap">
            {order === 'desc' ? '↓ Desc' : '↑ Asc'}
          </button>
        </div>

        {loading ? (
          <PageSpinner />
        ) : goals.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No goals yet"
            description="Set measurable targets to keep your job search on track."
            action={
              <MagneticButton onClick={openAdd}
                className="btn-liquid px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-ring-accent">
                Add your first goal
              </MagneticButton>
            }
          />
        ) : (
          <div>
            <h2 className="text-[18px] font-semibold text-app-text mb-4 flex items-center gap-2">
              <FlagOutlined sx={{ fontSize: 18 }} className="text-white/40" />
              {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((g) => (
                <GoalCard key={g.id} goal={g} onEdit={openEdit} onDelete={setDeleteTarget} onToggleActive={handleToggleActive} />
              ))}
            </div>
            <InfiniteScrollSentinel hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />
          </div>
        )}
      </div>

      <AddEditModal open={modalOpen} goal={editTarget} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} goal={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
    </Layout>
  )
}
