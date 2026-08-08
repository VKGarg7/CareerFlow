import React, { useState, useCallback, useEffect } from 'react'
import { CircularProgress } from '@mui/material'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  BookmarkAddedOutlined, DeleteOutlineRounded, EditOutlined, ArrowForwardRounded, InsightsOutlined,
  ChecklistOutlined, KeyboardArrowUpRounded, KeyboardArrowDownRounded, AddRounded, CheckCircleRounded,
  WarningAmberRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { FieldLabel, fieldInputCls, FormFooterButtons } from '../components/formKit'
import FilterSelect from '../components/FilterSelect'
import HeaderAddButton from '../components/HeaderAddButton'
import { getOpportunities, addOpportunity, updateOpportunity, deleteOpportunity, convertOpportunity, checkOpportunityDuplicates } from '../api/opportunity'
import { getCompanies } from '../api/company'
import {
  getRoleFitEvaluationForOpportunity, addRoleFitEvaluation, updateRoleFitEvaluation, overrideRoleFitEvaluation,
} from '../api/roleFitEvaluation'
import {
  getStrategyPlan, addStrategyItem, updateStrategyItem, reorderStrategyItems, deleteStrategyItem,
} from '../api/strategyItem'
import useTransientMessage from '../hooks/useTransientMessage'
import usePagedList from '../hooks/usePagedList'
import useCrudModals from '../hooks/useCrudModals'
import useAddQueryParam from '../hooks/useAddQueryParam'
import useFetchOnce from '../hooks/useFetchOnce'
import { SOURCE_LABELS } from '../constants/applicationSource'

const FIT_TIER_CONFIG = {
  STRONG_FIT:   { label: 'Strong Fit',   badge: 'bg-app-success/15 text-app-success' },
  MODERATE_FIT: { label: 'Moderate Fit', badge: 'bg-app-accent/10 text-app-accent-soft' },
  WEAK_FIT:     { label: 'Weak Fit',     badge: 'bg-app-warning/10 text-app-warning' },
  NOT_A_FIT:    { label: 'Not a Fit',    badge: 'bg-app-danger/10 text-app-danger' },
}

const FIT_RATING_OPTIONS = [
  { value: 'GOOD', label: 'Good' },
  { value: 'OK', label: 'OK' },
  { value: 'POOR', label: 'Poor' },
]

const EMPTY_FIT_FORM = {
  requiredSkills: '', preferredSkills: '', userSkills: '',
  requiredExperienceYears: '', userExperienceYears: '',
  locationFit: '', compensationFit: '', riskNotes: '', confidenceNotes: '',
}

const STRATEGY_ACTION_TYPE_OPTIONS = [
  { value: 'RESUME_TAILORING', label: 'Resume Tailoring' },
  { value: 'REFERRAL_REQUEST', label: 'Referral Request' },
  { value: 'COVER_LETTER', label: 'Cover Letter' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'APPLICATION_SUBMISSION', label: 'Application Submission' },
  { value: 'FOLLOW_UP', label: 'Follow-Up' },
  { value: 'INTERVIEW_PREP', label: 'Interview Prep' },
  { value: 'CUSTOM', label: 'Custom' },
]

const STRATEGY_STATUS_CONFIG = {
  PLANNED:     { label: 'Planned',     badge: 'bg-white/[0.06] text-white/50' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-app-accent/10 text-app-accent-soft' },
  COMPLETED:   { label: 'Completed',   badge: 'bg-app-success/10 text-app-success' },
  SKIPPED:     { label: 'Skipped',     badge: 'bg-white/[0.06] text-white/30' },
}

const READINESS_CONFIG = {
  NOT_STARTED:    { label: 'Not Started',     badge: 'bg-white/[0.06] text-white/50' },
  IN_PROGRESS:    { label: 'In Progress',     badge: 'bg-app-accent/10 text-app-accent-soft' },
  READY_TO_APPLY: { label: 'Ready to Apply',  badge: 'bg-app-success/15 text-app-success' },
}

const EMPTY_STRATEGY_ITEM_FORM = { actionType: 'CUSTOM', title: '', dueDate: '', notes: '' }

const STATUS_CONFIG = {
  SAVED:                     { label: 'Saved',                     badge: 'bg-white/[0.06] text-white/50' },
  UNDER_REVIEW:              { label: 'Under Review',              badge: 'bg-app-accent/10 text-app-accent-soft' },
  RESUME_TAILORING_PENDING:  { label: 'Resume Tailoring Pending',  badge: 'bg-app-warning/10 text-app-warning' },
  REFERRAL_PENDING:          { label: 'Referral Pending',          badge: 'bg-app-accent2/10 text-app-accent-soft' },
  READY_TO_APPLY:            { label: 'Ready to Apply',            badge: 'bg-app-success/10 text-app-success' },
  APPLIED:                   { label: 'Applied',                   badge: 'bg-app-success/20 text-app-success' },
  CLOSED:                    { label: 'Closed',                    badge: 'bg-white/[0.06] text-white/30' },
  SKIPPED:                   { label: 'Skipped',                   badge: 'bg-white/[0.06] text-white/30' },
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'roleTitle',  label: 'Role Title' },
  { value: 'status',    label: 'Status' },
]

const EMPTY_FORM = {
  companyId: '', roleTitle: '', jobLink: '', location: '',
  roleCategory: '', salaryInfo: '', requisitionId: '', notes: '', status: 'SAVED',
  sourceType: '', sourceUrl: '', sourceNotes: '',
  requiresCoverLetter: false, requiresAssessment: false, hasSpecialSteps: false,
}

const MATCH_REASON_LABELS = {
  SAME_ROLE: 'Same company & role title',
  SAME_JOB_LINK: 'Same company & job link',
  SAME_REQUISITION_ID: 'Same requisition ID',
}

const CONVERTIBLE_STATUSES = new Set(Object.keys(STATUS_CONFIG).filter((s) => s !== 'APPLIED' && s !== 'CLOSED'))

function OpportunityCard({ opportunity, onEdit, onDelete, onConvert, onFit, onStrategy }) {
  const status = STATUS_CONFIG[opportunity.status] || STATUS_CONFIG.SAVED

  return (
    <div className="rounded-card border border-white/[0.06] bg-app-surface shadow-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white/90 truncate">{opportunity.roleTitle}</p>
          <p className="text-xs text-white/40 mt-0.5 truncate">{opportunity.companyName}</p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${status.badge}`}>{status.label}</span>
      </div>

      {(opportunity.location || opportunity.roleCategory || opportunity.salaryInfo || opportunity.requisitionId) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45 mb-2">
          {opportunity.location && <span>📍 {opportunity.location}</span>}
          {opportunity.roleCategory && <span>🏷 {opportunity.roleCategory}</span>}
          {opportunity.salaryInfo && <span>💰 {opportunity.salaryInfo}</span>}
          {opportunity.requisitionId && <span>#️⃣ {opportunity.requisitionId}</span>}
        </div>
      )}

      {opportunity.jobLink && (
        <a href={opportunity.jobLink} target="_blank" rel="noreferrer"
          className="text-xs text-app-accent-soft hover:underline break-all">
          {opportunity.jobLink}
        </a>
      )}

      {(opportunity.sourceType || opportunity.requiresCoverLetter || opportunity.requiresAssessment || opportunity.hasSpecialSteps) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {opportunity.sourceType && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-app-accent/10 text-app-accent-soft">
              {SOURCE_LABELS[opportunity.sourceType] || opportunity.sourceType}
            </span>
          )}
          {opportunity.requiresCoverLetter && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-white/[0.06] text-white/50">Cover Letter</span>}
          {opportunity.requiresAssessment && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-white/[0.06] text-white/50">Assessment</span>}
          {opportunity.hasSpecialSteps && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-white/[0.06] text-white/50">Special Steps</span>}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.06]">
        <button onClick={() => onFit(opportunity)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-app-accent2/20 text-app-accent-soft bg-app-accent2/[0.04] hover:bg-app-accent2 hover:text-white hover:border-app-accent2 transition">
          <InsightsOutlined sx={{ fontSize: 14 }} /> Fit
        </button>
        <button onClick={() => onStrategy(opportunity)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] text-white/60 bg-white/[0.02] hover:bg-white/[0.08] transition">
          <ChecklistOutlined sx={{ fontSize: 14 }} /> Strategy
        </button>
        {CONVERTIBLE_STATUSES.has(opportunity.status) && (
          <button onClick={() => onConvert(opportunity)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-app-success/20 text-app-success bg-app-success/[0.04] hover:bg-app-success hover:text-white hover:border-app-success transition">
            <ArrowForwardRounded sx={{ fontSize: 14 }} /> Convert
          </button>
        )}
        <button onClick={() => onEdit(opportunity)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/[0.08] text-white/60 bg-white/[0.02] hover:bg-white/[0.08] transition">
          <EditOutlined sx={{ fontSize: 14 }} /> Edit
        </button>
        <button onClick={() => onDelete(opportunity)}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-app-danger/20 text-app-danger bg-app-danger/[0.04] hover:bg-app-danger hover:text-white hover:border-app-danger transition">
          <DeleteOutlineRounded sx={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  )
}

function AddEditModal({ open, opportunity, companies, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [duplicateMatches, setDuplicateMatches] = useState(null)

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the modal's form state when it opens for a given opportunity is the intended effect
      setForm(opportunity ? {
        companyId: opportunity.companyId || '', roleTitle: opportunity.roleTitle || '',
        jobLink: opportunity.jobLink || '', location: opportunity.location || '',
        roleCategory: opportunity.roleCategory || '', salaryInfo: opportunity.salaryInfo || '',
        requisitionId: opportunity.requisitionId || '',
        notes: opportunity.notes || '', status: opportunity.status || 'SAVED',
        sourceType: opportunity.sourceType || '', sourceUrl: opportunity.sourceUrl || '',
        sourceNotes: opportunity.sourceNotes || '',
        requiresCoverLetter: !!opportunity.requiresCoverLetter,
        requiresAssessment: !!opportunity.requiresAssessment,
        hasSpecialSteps: !!opportunity.hasSpecialSteps,
      } : EMPTY_FORM)
      setError('')
      setDuplicateMatches(null)
    }
  }, [open, opportunity])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setVal = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))
  const setChecked = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }))

  const buildPayload = () => ({
    companyId: Number(form.companyId), roleTitle: form.roleTitle.trim(),
    jobLink: form.jobLink.trim() || undefined,
    location: form.location.trim() || undefined,
    roleCategory: form.roleCategory.trim() || undefined,
    salaryInfo: form.salaryInfo.trim() || undefined,
    requisitionId: form.requisitionId.trim() || undefined,
    notes: form.notes.trim() || undefined,
    status: form.status || undefined,
    sourceType: form.sourceType || undefined,
    sourceUrl: form.sourceUrl.trim() || undefined,
    sourceNotes: form.sourceNotes.trim() || undefined,
    requiresCoverLetter: form.requiresCoverLetter,
    requiresAssessment: form.requiresAssessment,
    hasSpecialSteps: form.hasSpecialSteps,
  })

  const persist = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload()
      opportunity ? await updateOpportunity(opportunity.id, payload) : await addOpportunity(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.companyId) { setError('Please select a company.'); return }
    if (!form.roleTitle.trim()) { setError('Role title is required.'); return }
    setCheckingDuplicates(true)
    setError('')
    try {
      const res = await checkOpportunityDuplicates({
        companyId: Number(form.companyId),
        roleTitle: form.roleTitle.trim() || undefined,
        jobLink: form.jobLink.trim() || undefined,
        requisitionId: form.requisitionId.trim() || undefined,
        excludeOpportunityId: opportunity?.id || undefined,
      })
      if (res.data.length > 0) {
        setDuplicateMatches(res.data)
      } else {
        await persist()
      }
    } catch {
      // If the duplicate check itself fails, don't block saving — proceed as normal.
      await persist()
    } finally {
      setCheckingDuplicates(false)
    }
  }

  const handleSaveAnyway = async () => {
    setDuplicateMatches(null)
    await persist()
  }

  return (
    <ModalShell open={open} onClose={onClose} title={opportunity ? 'Edit Opportunity' : 'Save Opportunity'} maxWidth="max-w-xl">
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Company <span className="text-app-danger">*</span></FieldLabel>
            <FilterSelect
              value={form.companyId}
              onChange={setVal('companyId')}
              allLabel="Select a company"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>Role Title <span className="text-app-danger">*</span></FieldLabel>
            <input type="text" value={form.roleTitle} onChange={set('roleTitle')}
              placeholder="e.g. Backend Engineer" className={fieldInputCls(false)} />
          </div>
          <div>
            <FieldLabel>Job Link</FieldLabel>
            <input type="text" value={form.jobLink} onChange={set('jobLink')}
              placeholder="https://..." className={fieldInputCls(false)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Location</FieldLabel>
              <input type="text" value={form.location} onChange={set('location')}
                placeholder="e.g. Remote" className={fieldInputCls(false)} />
            </div>
            <div>
              <FieldLabel>Role Category</FieldLabel>
              <input type="text" value={form.roleCategory} onChange={set('roleCategory')}
                placeholder="e.g. Backend" className={fieldInputCls(false)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Salary Info</FieldLabel>
              <input type="text" value={form.salaryInfo} onChange={set('salaryInfo')}
                placeholder="e.g. 20-25 LPA" className={fieldInputCls(false)} />
            </div>
            <div>
              <FieldLabel>Requisition ID</FieldLabel>
              <input type="text" value={form.requisitionId} onChange={set('requisitionId')}
                placeholder="e.g. REQ-4821" className={fieldInputCls(false)} />
            </div>
          </div>

          <div className="pt-1 border-t border-white/[0.06]">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3 mt-3">Source</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <FieldLabel>Source Type</FieldLabel>
                <FilterSelect
                  value={form.sourceType}
                  onChange={setVal('sourceType')}
                  allLabel="Not specified"
                  options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
                  className="w-full"
                />
              </div>
              <div>
                <FieldLabel>Source URL</FieldLabel>
                <input type="text" value={form.sourceUrl} onChange={set('sourceUrl')}
                  placeholder="https://..." className={fieldInputCls(false)} />
              </div>
            </div>
            <div className="mb-3">
              <FieldLabel>Source Notes</FieldLabel>
              <textarea value={form.sourceNotes} onChange={set('sourceNotes')} rows={2}
                placeholder="e.g. Found via a recruiter's LinkedIn post" className={`${fieldInputCls(false)} resize-none`} />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input type="checkbox" checked={form.requiresCoverLetter} onChange={setChecked('requiresCoverLetter')}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.03] accent-app-accent" />
                Requires cover letter
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input type="checkbox" checked={form.requiresAssessment} onChange={setChecked('requiresAssessment')}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.03] accent-app-accent" />
                Requires assessment
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input type="checkbox" checked={form.hasSpecialSteps} onChange={setChecked('hasSpecialSteps')}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.03] accent-app-accent" />
                Has special steps
              </label>
            </div>
          </div>

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
          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Anything worth remembering..." className={`${fieldInputCls(false)} resize-none`} />
          </div>

          {duplicateMatches && duplicateMatches.length > 0 && (
            <div className="p-4 rounded-xl bg-app-warning/10 border border-app-warning/20">
              <div className="flex items-start gap-2 mb-2">
                <WarningAmberRounded sx={{ fontSize: 18 }} className="text-app-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-app-warning">This looks like it might be a duplicate</p>
                  <p className="text-xs text-white/50 mt-0.5">You can still save it if this is intentionally a different opportunity.</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-3">
                {duplicateMatches.map((m) => (
                  <li key={`${m.opportunityId}-${m.matchReason}`} className="text-xs text-white/70 pl-6">
                    <span className="font-semibold">{m.roleTitle}</span> at {m.companyName}
                    <span className="text-white/35"> — {MATCH_REASON_LABELS[m.matchReason] || m.matchReason}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 pl-6">
                <button type="button" onClick={() => setDuplicateMatches(null)}
                  className="flex-1 h-10 text-sm font-semibold text-white/70 bg-white/[0.06] rounded-xl hover:bg-white/[0.10] transition">
                  Go Back
                </button>
                <button type="button" onClick={handleSaveAnyway} disabled={saving}
                  className="flex-1 h-10 text-sm font-semibold text-white bg-app-warning rounded-xl hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <CircularProgress size={14} color="inherit" />}
                  Save Anyway
                </button>
              </div>
            </div>
          )}

          {!(duplicateMatches && duplicateMatches.length > 0) && (
            <FormFooterButtons saving={saving || checkingDuplicates} onCancel={onClose}
              saveLabel={checkingDuplicates ? 'Checking…' : (opportunity ? 'Save Changes' : 'Save Opportunity')} />
          )}
        </form>
      </div>
    </ModalShell>
  )
}

function DeleteModal({ open, opportunity, onClose, onDeleted }) {
  const handleDelete = async () => { await deleteOpportunity(opportunity.id); onDeleted() }
  return (
    <ConfirmDeleteModal
      open={open && !!opportunity}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Opportunity"
      message={
        <>
          Remove the opportunity <span className="font-semibold text-white/80">{opportunity?.roleTitle}</span> at {opportunity?.companyName}?
          <span className="block text-xs text-app-danger mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

function FitEvaluationModal({ open, opportunity, onClose, onSaved }) {
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FIT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [decisionNote, setDecisionNote] = useState('')
  const [overrideScore, setOverrideScore] = useState('')
  const [overrideTier, setOverrideTier] = useState('')
  const [overriding, setOverriding] = useState(false)

  const load = useCallback(async () => {
    if (!opportunity) return
    setLoading(true)
    setError('')
    try {
      const res = await getRoleFitEvaluationForOpportunity(opportunity.id)
      setEvaluation(res.data)
      setForm({
        requiredSkills: res.data.requiredSkills || '', preferredSkills: res.data.preferredSkills || '',
        userSkills: res.data.userSkills || '',
        requiredExperienceYears: res.data.requiredExperienceYears ?? '', userExperienceYears: res.data.userExperienceYears ?? '',
        locationFit: res.data.locationFit || '', compensationFit: res.data.compensationFit || '',
        riskNotes: res.data.riskNotes || '', confidenceNotes: res.data.confidenceNotes || '',
      })
      setDecisionNote(res.data.decisionNote || '')
      setOverrideScore(res.data.overrideFitScore ?? '')
      setOverrideTier(res.data.overrideFitTier || '')
    } catch (err) {
      if (err.response?.status === 404) {
        setEvaluation(null)
        setForm(EMPTY_FIT_FORM)
        setDecisionNote('')
        setOverrideScore('')
        setOverrideTier('')
      } else {
        setError('Failed to load fit evaluation.')
      }
    } finally {
      setLoading(false)
    }
  }, [opportunity])

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the modal's state when it opens for a given opportunity is the intended effect
      setError('')
      load()
    }
  }, [open, load])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setVal = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        requiredSkills: form.requiredSkills.trim() || undefined,
        preferredSkills: form.preferredSkills.trim() || undefined,
        userSkills: form.userSkills.trim() || undefined,
        requiredExperienceYears: form.requiredExperienceYears !== '' ? Number(form.requiredExperienceYears) : undefined,
        userExperienceYears: form.userExperienceYears !== '' ? Number(form.userExperienceYears) : undefined,
        locationFit: form.locationFit || undefined,
        compensationFit: form.compensationFit || undefined,
        riskNotes: form.riskNotes.trim() || undefined,
        confidenceNotes: form.confidenceNotes.trim() || undefined,
      }
      const res = evaluation
        ? await updateRoleFitEvaluation(evaluation.id, payload)
        : await addRoleFitEvaluation({ opportunityId: opportunity.id, ...payload })
      setEvaluation(res.data)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleOverride = async () => {
    if (!evaluation) return
    setOverriding(true)
    setError('')
    try {
      const res = await overrideRoleFitEvaluation(evaluation.id, {
        overrideFitScore: overrideScore !== '' ? Number(overrideScore) : undefined,
        overrideFitTier: overrideTier || undefined,
        decisionNote: decisionNote.trim() || undefined,
      })
      setEvaluation(res.data)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save your decision.')
    } finally {
      setOverriding(false)
    }
  }

  const tier = evaluation ? FIT_TIER_CONFIG[evaluation.effectiveFitTier] || FIT_TIER_CONFIG.NOT_A_FIT : null

  return (
    <ModalShell open={open && !!opportunity} onClose={onClose}
      title="Role Fit Evaluation" subtitle={opportunity ? `${opportunity.roleTitle} at ${opportunity.companyName}` : undefined}
      maxWidth="max-w-2xl">
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-8"><CircularProgress size={22} /></div>
        ) : (
          <>
            {evaluation && (
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-sm font-semibold text-white/80">Effective Fit Score</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tier.badge}`}>
                    {evaluation.effectiveFitScore}/100 · {tier.label}
                  </span>
                </div>
                {evaluation.overrideFitScore != null && (
                  <p className="text-xs text-white/35 mb-2">Computed score was {evaluation.computedFitScore}; you overrode it below.</p>
                )}
                {evaluation.missingSkills && (
                  <p className="text-xs text-white/50 mb-1"><span className="font-semibold text-white/70">Missing skills:</span> {evaluation.missingSkills}</p>
                )}
                {evaluation.scoreBreakdown && (
                  <pre className="text-xs text-white/40 whitespace-pre-wrap font-sans leading-relaxed mt-2">{evaluation.scoreBreakdown}</pre>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <FieldLabel>Required Skills <span className="text-white/30 normal-case font-normal">(comma-separated)</span></FieldLabel>
                <input type="text" value={form.requiredSkills} onChange={set('requiredSkills')}
                  placeholder="e.g. Java, Spring Boot, PostgreSQL" className={fieldInputCls(false)} />
              </div>
              <div>
                <FieldLabel>Preferred Skills</FieldLabel>
                <input type="text" value={form.preferredSkills} onChange={set('preferredSkills')}
                  placeholder="e.g. Docker, Kubernetes" className={fieldInputCls(false)} />
              </div>
              <div>
                <FieldLabel>Your Skills</FieldLabel>
                <input type="text" value={form.userSkills} onChange={set('userSkills')}
                  placeholder="e.g. Java, Spring Boot" className={fieldInputCls(false)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Required Experience (yrs)</FieldLabel>
                  <input type="number" min="0" value={form.requiredExperienceYears} onChange={set('requiredExperienceYears')}
                    placeholder="e.g. 3" className={fieldInputCls(false)} />
                </div>
                <div>
                  <FieldLabel>Your Experience (yrs)</FieldLabel>
                  <input type="number" min="0" step="0.5" value={form.userExperienceYears} onChange={set('userExperienceYears')}
                    placeholder="e.g. 2.5" className={fieldInputCls(false)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Location Fit</FieldLabel>
                  <FilterSelect value={form.locationFit} onChange={setVal('locationFit')}
                    allLabel="Not rated" options={FIT_RATING_OPTIONS} className="w-full" />
                </div>
                <div>
                  <FieldLabel>Compensation Fit</FieldLabel>
                  <FilterSelect value={form.compensationFit} onChange={setVal('compensationFit')}
                    allLabel="Not rated" options={FIT_RATING_OPTIONS} className="w-full" />
                </div>
              </div>
              <div>
                <FieldLabel>Risk Notes</FieldLabel>
                <textarea value={form.riskNotes} onChange={set('riskNotes')} rows={2}
                  placeholder="Concerns, red flags, unknowns..." className={`${fieldInputCls(false)} resize-none`} />
              </div>
              <div>
                <FieldLabel>Confidence Notes</FieldLabel>
                <textarea value={form.confidenceNotes} onChange={set('confidenceNotes')} rows={2}
                  placeholder="Why you're confident (or not) in this assessment..." className={`${fieldInputCls(false)} resize-none`} />
              </div>
              <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={evaluation ? 'Recalculate Score' : 'Evaluate Fit'} />
            </form>

            {evaluation && (
              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <p className="text-sm font-semibold text-white/80 mb-1">Your Decision</p>
                <p className="text-xs text-white/35 mb-3">Override the computed score or tier if your judgment differs, and record why.</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <FieldLabel>Override Score (0-100)</FieldLabel>
                    <input type="number" min="0" max="100" value={overrideScore} onChange={(e) => setOverrideScore(e.target.value)}
                      placeholder={String(evaluation.computedFitScore ?? '')} className={fieldInputCls(false)} />
                  </div>
                  <div>
                    <FieldLabel>Override Tier</FieldLabel>
                    <FilterSelect value={overrideTier} onChange={setOverrideTier}
                      allLabel="Use computed tier"
                      options={Object.entries(FIT_TIER_CONFIG).map(([value, { label }]) => ({ value, label }))}
                      className="w-full" />
                  </div>
                </div>
                <FieldLabel>Decision Note</FieldLabel>
                <textarea value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} rows={2}
                  placeholder="e.g. Willing to upskill on the missing pieces before applying." className={`${fieldInputCls(false)} resize-none mb-3`} />
                <button type="button" onClick={handleOverride} disabled={overriding}
                  className="w-full h-11 text-sm font-semibold text-white bg-app-accent2 rounded-xl hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {overriding && <CircularProgress size={14} color="inherit" />}
                  Save Decision
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  )
}

function nextStrategyStatus(status) {
  if (status === 'PLANNED') return 'IN_PROGRESS'
  if (status === 'IN_PROGRESS') return 'COMPLETED'
  return 'PLANNED'
}

function StrategyItemRow({ item, index, total, onCycleStatus, onMove, onDelete, onSkipToggle }) {
  const statusCfg = STRATEGY_STATUS_CONFIG[item.status] || STRATEGY_STATUS_CONFIG.PLANNED
  const typeLabel = STRATEGY_ACTION_TYPE_OPTIONS.find((o) => o.value === item.actionType)?.label || item.actionType

  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex flex-col shrink-0 -my-1">
        <button type="button" onClick={() => onMove(item, -1)} disabled={index === 0}
          className="p-0.5 text-white/30 hover:text-white/70 disabled:opacity-20 disabled:hover:text-white/30 transition">
          <KeyboardArrowUpRounded sx={{ fontSize: 16 }} />
        </button>
        <button type="button" onClick={() => onMove(item, 1)} disabled={index === total - 1}
          className="p-0.5 text-white/30 hover:text-white/70 disabled:opacity-20 disabled:hover:text-white/30 transition">
          <KeyboardArrowDownRounded sx={{ fontSize: 16 }} />
        </button>
      </div>

      <button type="button" onClick={() => onCycleStatus(item)} title="Cycle status" className="shrink-0 mt-0.5">
        <CheckCircleRounded sx={{ fontSize: 18 }} className={item.status === 'COMPLETED' ? 'text-app-success' : 'text-white/15 hover:text-white/40 transition'} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold truncate ${item.status === 'COMPLETED' ? 'text-white/40 line-through' : 'text-white/85'}`}>{item.title}</p>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusCfg.badge}`}>{statusCfg.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/35 mt-0.5">
          <span>{typeLabel}</span>
          {item.dueDate && <span>· Due {item.dueDate}</span>}
        </div>
        {item.notes && <p className="text-xs text-white/40 mt-1 whitespace-pre-wrap">{item.notes}</p>}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={() => onSkipToggle(item)}
          className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-white/[0.08] text-white/50 hover:bg-white/[0.08] transition">
          {item.status === 'SKIPPED' ? 'Unskip' : 'Skip'}
        </button>
        <button type="button" onClick={() => onDelete(item)}
          className="p-1 rounded-lg text-app-danger/70 hover:bg-app-danger/10 hover:text-app-danger transition">
          <DeleteOutlineRounded sx={{ fontSize: 15 }} />
        </button>
      </div>
    </div>
  )
}

function StrategyPlanModal({ open, opportunity, onClose, onChanged }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_STRATEGY_ITEM_FORM)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    if (!opportunity) return
    setLoading(true)
    setError('')
    try {
      const res = await getStrategyPlan(opportunity.id)
      setPlan(res.data)
    } catch {
      setError('Failed to load strategy plan.')
    } finally {
      setLoading(false)
    }
  }, [opportunity])

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the modal's state when it opens for a given opportunity is the intended effect
      setForm(EMPTY_STRATEGY_ITEM_FORM)
      setError('')
      load()
    }
  }, [open, load])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setVal = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setAdding(true)
    setError('')
    try {
      await addStrategyItem({
        opportunityId: opportunity.id, actionType: form.actionType, title: form.title.trim(),
        dueDate: form.dueDate || undefined, notes: form.notes.trim() || undefined,
      })
      setForm(EMPTY_STRATEGY_ITEM_FORM)
      await load()
      onChanged()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add strategy step.')
    } finally {
      setAdding(false)
    }
  }

  const handleCycleStatus = async (item) => {
    try {
      await updateStrategyItem(item.id, { status: nextStrategyStatus(item.status) })
      await load()
      onChanged()
    } catch {
      setError('Failed to update step.')
    }
  }

  const handleSkipToggle = async (item) => {
    try {
      await updateStrategyItem(item.id, { status: item.status === 'SKIPPED' ? 'PLANNED' : 'SKIPPED' })
      await load()
      onChanged()
    } catch {
      setError('Failed to update step.')
    }
  }

  const handleDelete = async (item) => {
    try {
      await deleteStrategyItem(item.id)
      await load()
      onChanged()
    } catch {
      setError('Failed to delete step.')
    }
  }

  const handleMove = async (item, direction) => {
    if (!plan) return
    const ids = plan.items.map((i) => i.id)
    const idx = ids.indexOf(item.id)
    const swapWith = idx + direction
    if (swapWith < 0 || swapWith >= ids.length) return
    ;[ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]]
    try {
      const res = await reorderStrategyItems(opportunity.id, ids)
      setPlan(res.data)
    } catch {
      setError('Failed to reorder steps.')
    }
  }

  const readiness = plan ? READINESS_CONFIG[plan.readiness] || READINESS_CONFIG.NOT_STARTED : null

  return (
    <ModalShell open={open && !!opportunity} onClose={onClose}
      title="Application Strategy" subtitle={opportunity ? `${opportunity.roleTitle} at ${opportunity.companyName}` : undefined}
      maxWidth="max-w-2xl">
      <div className="px-6 py-5">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-8"><CircularProgress size={22} /></div>
        ) : (
          <>
            {plan && (
              <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-sm font-semibold text-white/80">Readiness</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${readiness.badge}`}>
                  {readiness.label} · {plan.completedCount}/{plan.totalCount - plan.skippedCount} steps done
                </span>
              </div>
            )}

            <div className="space-y-2 mb-5">
              {plan && plan.items.length === 0 && (
                <p className="text-xs text-white/35 text-center py-4">No strategy steps yet — add one below.</p>
              )}
              {plan && plan.items.map((item, idx) => (
                <StrategyItemRow key={item.id} item={item} index={idx} total={plan.items.length}
                  onCycleStatus={handleCycleStatus} onMove={handleMove} onDelete={handleDelete} onSkipToggle={handleSkipToggle} />
              ))}
            </div>

            <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-white/[0.06]">
              <p className="text-sm font-semibold text-white/80">Add Strategy Step</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Action Type</FieldLabel>
                  <FilterSelect value={form.actionType} onChange={setVal('actionType')}
                    options={STRATEGY_ACTION_TYPE_OPTIONS} hideAll className="w-full" />
                </div>
                <div>
                  <FieldLabel>Due Date</FieldLabel>
                  <input type="date" value={form.dueDate} onChange={set('dueDate')} className={fieldInputCls(false)} />
                </div>
              </div>
              <div>
                <FieldLabel>Title <span className="text-app-danger">*</span></FieldLabel>
                <input type="text" value={form.title} onChange={set('title')}
                  placeholder="e.g. Request referral from Alex" className={fieldInputCls(false)} />
              </div>
              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea value={form.notes} onChange={set('notes')} rows={2}
                  placeholder="Optional details..." className={`${fieldInputCls(false)} resize-none`} />
              </div>
              <button type="submit" disabled={adding}
                className="w-full h-11 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {adding ? <CircularProgress size={14} color="inherit" /> : <AddRounded sx={{ fontSize: 16 }} />}
                Add Step
              </button>
            </form>
          </>
        )}
      </div>
    </ModalShell>
  )
}

function ConvertModal({ open, opportunity, onClose, onConverted }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleConvert = async () => {
    setSaving(true)
    setError('')
    try {
      await convertOpportunity(opportunity.id, {})
      onConverted()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert to application.')
      setSaving(false)
    }
  }

  return (
    <ModalShell open={open && !!opportunity} onClose={onClose} title="Convert to Application" maxWidth="max-w-sm">
      <div className="px-6 py-5">
        <p className="text-sm text-white/60 mb-4">
          This will create an application for <span className="font-semibold text-white/85">{opportunity?.roleTitle}</span> at {opportunity?.companyName}, carrying over the company, role, salary, and notes. The opportunity will be marked as Applied.
        </p>
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-11 text-sm font-semibold text-white/70 bg-white/[0.06] rounded-xl hover:bg-white/[0.10] transition">
            Cancel
          </button>
          <button onClick={handleConvert} disabled={saving}
            className="flex-1 h-11 text-sm font-semibold text-white bg-app-success rounded-xl hover:brightness-110 transition disabled:opacity-60">
            {saving ? 'Converting…' : 'Convert'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

export default function Opportunities() {
  const [success, setSuccess] = useTransientMessage()
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [convertTarget, setConvertTarget] = useState(null)
  const [fitTarget, setFitTarget] = useState(null)
  const [strategyTarget, setStrategyTarget] = useState(null)

  const { data: companies } = useFetchOnce(useCallback(() => getCompanies({ size: 200 }), []), [])

  const {
    items: opportunities, loading, error, setError, setPage, setSize, refetch: fetchOpportunities,
  } = usePagedList(
    useCallback((page, size) => getOpportunities({ status: statusFilter || undefined, sortBy, order, page, size }),
      [statusFilter, sortBy, order]),
    'Failed to load opportunities.'
  )

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Opportunity', setSuccess, [fetchOpportunities])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (o) => { setEditTarget(o); setModalOpen(true) }

  useAddQueryParam(openAdd)

  const handleConverted = () => {
    setConvertTarget(null)
    setSuccess('Opportunity converted to application.')
    fetchOpportunities()
  }

  return (
    <Layout headerAction={<HeaderAddButton label="Save Opportunity" onClick={openAdd} />}>
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
        ) : opportunities.length === 0 ? (
          <EmptyState
            icon="📌"
            title="No opportunities yet"
            description="Save roles you're considering before you're ready to apply."
            action={
              <button onClick={openAdd}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
                Save your first opportunity
              </button>
            }
          />
        ) : (
          <div>
            <h2 className="text-[18px] font-semibold text-app-text mb-4 flex items-center gap-2">
              <BookmarkAddedOutlined sx={{ fontSize: 18 }} className="text-white/40" />
              {opportunities.length} {opportunities.length === 1 ? 'Opportunity' : 'Opportunities'}
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} onEdit={openEdit} onDelete={setDeleteTarget} onConvert={setConvertTarget} onFit={setFitTarget} onStrategy={setStrategyTarget} />
              ))}
            </div>
            <Pagination page={opportunities.page} totalPages={opportunities.totalPages}
              totalElements={opportunities.totalElements} size={opportunities.size} onPageChange={setPage} onSizeChange={setSize} />
          </div>
        )}
      </div>

      <AddEditModal open={modalOpen} opportunity={editTarget} companies={companies || []} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} opportunity={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <ConvertModal open={!!convertTarget} opportunity={convertTarget} onClose={() => setConvertTarget(null)} onConverted={handleConverted} />
      <FitEvaluationModal open={!!fitTarget} opportunity={fitTarget} onClose={() => setFitTarget(null)} onSaved={() => {}} />
      <StrategyPlanModal open={!!strategyTarget} opportunity={strategyTarget} onClose={() => setStrategyTarget(null)} onChanged={() => {}} />
    </Layout>
  )
}
