import { useState, useCallback } from 'react'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import { EditOutlined, DeleteOutlineRounded, RuleRounded, ToggleOnRounded, ToggleOffRounded } from '@mui/icons-material'
import Layout from '../components/Layout'
import { ConfirmDeleteModal } from '../components/ModalShell'
import { getFollowUpRules, addFollowUpRule, updateFollowUpRule, deleteFollowUpRule } from '../api/followUpRule'
import EmptyState from '../components/EmptyState'
import { CardMenu } from '../components/EntityCard'
import usePagedList from '../hooks/usePagedList'
import useTransientMessage from '../hooks/useTransientMessage'
import useCrudModals from '../hooks/useCrudModals'
import { DrawerShell, DrawerHeader } from '../components/DrawerShell'
import { fieldInputCls, FieldErrorText, FieldLabel, FormFooterButtons } from '../components/formKit'
import FilterSelect from '../components/FilterSelect'
import HeaderAddButton from '../components/HeaderAddButton'

const TRIGGER_LABELS = {
  AFTER_APPLICATION_SUBMITTED: 'After application is submitted',
  AFTER_INTERVIEW_COMPLETED:   'After an interview is completed',
  AFTER_REFERRAL_REQUESTED:    'After a referral is requested',
  AFTER_OFFER_RECEIVED:        'After an offer is received',
}

const ACTION_TYPE_LABELS = {
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

const EMPTY_FORM = {
  name: '', triggerEvent: 'AFTER_APPLICATION_SUBMITTED', delayDays: 5,
  actionType: 'FOLLOW_UP_RECRUITER', actionTitle: 'Follow up on {entity}', enabled: true,
}

function RuleRow({ rule, onEdit, onDelete, onToggle }) {
  return (
    <div className="group relative rounded-card border border-white/[0.06] bg-app-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 px-4 sm:px-5 py-3.5 w-full">
        <button onClick={() => onToggle(rule)} title={rule.enabled ? 'Disable rule' : 'Enable rule'}
          className={`shrink-0 transition ${rule.enabled ? 'text-app-success' : 'text-white/25'}`}>
          {rule.enabled ? <ToggleOnRounded sx={{ fontSize: 30 }} /> : <ToggleOffRounded sx={{ fontSize: 30 }} />}
        </button>

        <div className="w-full sm:flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${rule.enabled ? 'text-white/90' : 'text-white/40'}`}>{rule.name}</p>
          <p className="text-xs text-white/40 truncate mt-0.5">
            {TRIGGER_LABELS[rule.triggerEvent] || rule.triggerEvent} → {ACTION_TYPE_LABELS[rule.actionType] || rule.actionType}
            {' '}(due in {rule.delayDays} day{rule.delayDays === 1 ? '' : 's'})
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <CardMenu items={[
            { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(rule) },
            { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(rule), tone: 'danger' },
          ]} />
        </div>
      </div>
    </div>
  )
}

function AddEditDrawer({ open, rule, onClose, onSaved }) {
  const [form, setForm] = useState(() => rule ? {
    name:         rule.name         || '',
    triggerEvent: rule.triggerEvent || 'AFTER_APPLICATION_SUBMITTED',
    delayDays:    rule.delayDays ?? 5,
    actionType:   rule.actionType   || 'FOLLOW_UP_RECRUITER',
    actionTitle:  rule.actionTitle  || '',
    enabled:      rule.enabled ?? true,
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
      name:         form.name.trim(),
      triggerEvent: form.triggerEvent,
      delayDays:    Number(form.delayDays) || 0,
      actionType:   form.actionType,
      actionTitle:  form.actionTitle.trim(),
      enabled:      form.enabled,
    }
    try {
      rule ? await updateFollowUpRule(rule.id, payload) : await addFollowUpRule(payload)
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
      <DrawerHeader onClose={onClose} title={rule ? 'Edit Rule' : 'New Follow-Up Rule'} subtitle="Automatically create action items after key events" />
      <div className="px-6 py-5 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>
              Rule Name <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.name} onChange={set('name')}
              placeholder="Follow up 5 days after applying" maxLength={150} className={inputCls('name')} required />
            <FieldErrorText error={fieldErrors.name} />
          </div>

          <div>
            <FieldLabel>Trigger</FieldLabel>
            <FilterSelect
              value={form.triggerEvent}
              onChange={setVal('triggerEvent')}
              options={Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ value, label }))}
              hideAll
              className="w-full"
            />
          </div>

          <div>
            <FieldLabel>Remind Me In (days)</FieldLabel>
            <input type="number" min={0} value={form.delayDays} onChange={set('delayDays')} className={inputCls('delayDays')} />
            <p className="text-xs text-white/35 mt-1">0 = due the same day the trigger fires.</p>
          </div>

          <div>
            <FieldLabel>Action Type</FieldLabel>
            <FilterSelect
              value={form.actionType}
              onChange={setVal('actionType')}
              options={Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              hideAll
              className="w-full"
            />
          </div>

          <div>
            <FieldLabel>
              Action Title <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.actionTitle} onChange={set('actionTitle')}
              placeholder="Follow up on {entity}" maxLength={200} className={inputCls('actionTitle')} required />
            <p className="text-xs text-white/35 mt-1">Use <code className="text-white/50">{'{entity}'}</code> to insert the role/company that triggered this rule.</p>
            <FieldErrorText error={fieldErrors.actionTitle} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="w-4 h-4 rounded accent-app-accent" />
            <span className="text-sm text-white/70">Enabled</span>
          </label>

          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={rule ? 'Save Changes' : 'Create Rule'} saveFirst heightCls="py-2.5" />
        </form>
      </div>
    </DrawerShell>
  )
}

export default function FollowUpRules() {
  const [success, setSuccess] = useTransientMessage()

  const {
    items: rules, setItems: setRules, loading, error, setError, refetch: fetchRules,
  } = usePagedList(useCallback((page, size) => getFollowUpRules({ page, size }), []), 'Failed to load follow-up rules.', 50)

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Follow-up rule', setSuccess, [fetchRules])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (r) => { setEditTarget(r); setModalOpen(true) }

  const handleToggle = async (rule) => {
    const { data } = await updateFollowUpRule(rule.id, { enabled: !rule.enabled })
    setRules(prev => prev.map(r => r.id === data.id ? data : r))
  }

  return (
    <Layout headerAction={<HeaderAddButton label="New Rule" onClick={openAdd} />}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <PageSpinner />
      ) : rules.length === 0 ? (
        <EmptyState
          icon="🤖"
          title="No follow-up rules yet"
          description="Automate reminders — e.g. 'follow up 5 days after applying' or 'send a thank-you note the same day as an interview'."
          action={
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Create your first rule
            </button>
          }
        />
      ) : (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4 flex items-center gap-2">
            <RuleRounded sx={{ fontSize: 18 }} className="text-app-accent-soft" />
            {rules.length} {rules.length === 1 ? 'Rule' : 'Rules'}
          </h2>
          <div className="space-y-3">
            {rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}

      <AddEditDrawer key={editTarget?.id ?? 'new'} open={modalOpen} rule={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteFollowUpRule(deleteTarget.id); handleDeleted() }}
        title="Delete Rule"
        message={deleteTarget && (
          <>Delete "<span className="font-semibold text-white/80">{deleteTarget.name}</span>"? Action items already created by it will not be removed.</>
        )}
      />
    </Layout>
  )
}
