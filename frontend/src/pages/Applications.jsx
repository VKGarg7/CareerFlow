import { useState, useEffect, useCallback, useRef } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  Close, WorkOutlineRounded, SendRounded, BoltRounded,
  TrackChangesRounded, PsychologyRounded, TrendingUpRounded, TrendingDownRounded,
  KeyboardArrowDown, FilterListRounded, VisibilityOutlined, EditOutlined,
  DeleteOutlineRounded, NotificationsNoneOutlined, BookmarkBorderRounded, BookmarkRounded,
  PlaceRounded, LanguageRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ModalShell, ConfirmDeleteModal } from '../components/ModalShell'
import { getApplications, addApplication, updateApplication, deleteApplication, uploadApplicationDocuments, downloadApplicationDocument, viewApplicationDocument, getApplicationStats } from '../api/application'
import { getCompanies } from '../api/company'
import { getProfile } from '../api/user'
import { getFollowUpsForApplication, createFollowUp, updateFollowUp, deleteFollowUp } from '../api/followup'
import { getInterviewsForApplication, createInterview, updateInterview, deleteInterview } from '../api/interview'
import { todayStr, fmtDate, fmt } from '../utils/followup'
import { fmtFileSize, isAllowedDocExt, openDocInNewTab, downloadDoc } from '../utils/documents'
import RescheduleInline from '../components/RescheduleInline'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'
import CompanyDetailModal from '../components/CompanyDetailModal'
import InlineStatusChanger from '../components/InlineStatusChanger'
import { CardMenu } from '../components/EntityCard'
import CompanyLogo from '../components/CompanyLogo'
import MonthlyTrendChart from '../components/MonthlyTrendChart'
import MostAppliedCard from '../components/MostAppliedCard'
import FilterSelect from '../components/FilterSelect'
import HeaderAddButton from '../components/HeaderAddButton'
import useCrudModals from '../hooks/useCrudModals'
import useFilterState from '../hooks/useFilterState'
import useSearchShortcut from '../hooks/useSearchShortcut'
import useAddQueryParam from '../hooks/useAddQueryParam'
import useTransientMessage from '../hooks/useTransientMessage'
import usePagedList from '../hooks/usePagedList'
import useFetchOnce from '../hooks/useFetchOnce'
import ApplicationSourcesCard from '../components/ApplicationSourcesCard'
import AnalyticsCard from '../components/AnalyticsCard'
import { DrawerShell, CloseIconButton } from '../components/DrawerShell'
import { FieldLabel, FormFooterButtons } from '../components/formKit'
import { APP_STATUS_CONFIG as STATUS_CONFIG, appStatusHex as dotHex } from '../constants/applicationStatus'

const SOURCE_LABELS = {
  CAREERS_PAGE: 'Careers Page', LINKEDIN: 'LinkedIn', REFERRAL: 'Referral',
  NAUKRI: 'Naukri', INTERNSHALA: 'Internshala', JOB_PORTAL: 'Job Portal', OTHER: 'Other',
}

const SORT_OPTIONS = [
  { value: 'applicationDate', label: 'Date',    clientSide: false },
  { value: 'company',         label: 'Company', clientSide: true  },
  { value: 'status',          label: 'Status',  clientSide: false },
  { value: 'createdAt',       label: 'Added',   clientSide: false },
]

const EMPTY_FORM = {
  companyId: '', role: '',
  applicationDate: todayStr(),
  deadline: '',
  source: '', status: 'SAVED', expectedSalary: '', notes: '',
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.APPLIED
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

function AppStatusChanger({ app, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={app}
      statusConfig={STATUS_CONFIG}
      defaultStatus="SAVED"
      updateFn={(id, payload) => updateApplication(id, payload)}
      onStatusChanged={onStatusChanged}
    />
  )
}

function useLocalBookmark(appId) {
  const key = `cf_app_bookmark_${appId}`
  const [bookmarked, setBookmarked] = useState(() => localStorage.getItem(key) === '1')

  useEffect(() => {
    setBookmarked(localStorage.getItem(key) === '1')
  }, [key])

  const toggle = () => {
    const next = !bookmarked
    localStorage.setItem(key, next ? '1' : '0')
    setBookmarked(next)
  }

  return [bookmarked, toggle]
}

function ApplicationDirectoryCard({ app, company, onView, onEdit, onDelete, onFollowUp, onStatusChanged }) {
  const [bookmarked, toggleBookmark] = useLocalBookmark(app.id)
  const step = nextStepInfo(app)

  return (
    <div onClick={() => onView(app)}
      style={{ borderTopColor: dotHex(app.status) }}
      className="group relative flex cursor-pointer flex-col gap-3.5 overflow-hidden rounded-card border border-white/[0.06] border-t-4 bg-app-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover">

      <div className="flex items-start gap-3">
        <CompanyLogo name={app.companyName} website={company?.website} dotColor={dotHex(app.status)} className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-white/90">{app.companyName}</p>
          <p className="truncate text-xs text-white/50 mt-0.5">{app.role}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={toggleBookmark} title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.08] hover:text-white">
            {bookmarked ? <BookmarkRounded sx={{ fontSize: 17 }} className="text-app-accent-soft" /> : <BookmarkBorderRounded sx={{ fontSize: 17 }} />}
          </button>
          <CardMenu items={[
            { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(app) },
            { key: 'followup', label: 'Follow-Up', icon: <NotificationsNoneOutlined sx={{ fontSize: 16 }} />, onClick: () => onFollowUp(app) },
            { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(app) },
            { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(app), tone: 'danger' },
          ]} />
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <AppStatusChanger app={app} onStatusChanged={onStatusChanged} />
      </div>

      {(company?.location || app.source) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
          {company?.location && (
            <span className="flex items-center gap-1 min-w-0">
              <PlaceRounded sx={{ fontSize: 13 }} className="shrink-0 text-white/25" />
              <span className="truncate">{company.location}</span>
            </span>
          )}
          {app.source && (
            <span className="flex items-center gap-1 min-w-0">
              <LanguageRounded sx={{ fontSize: 13 }} className="shrink-0 text-white/25" />
              <span className="truncate">{SOURCE_LABELS[app.source] || app.source}</span>
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/[0.02] px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/30">Applied On</p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-white/80">{app.applicationDate ? fmtDate(app.applicationDate) : '—'}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/30">CTC</p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-white/80">{app.expectedSalary || '—'}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/30">Next Step</p>
          <p className={`mt-0.5 truncate text-[13px] font-semibold ${NEXT_STEP_TONE[step.tone]}`}>{step.label}</p>
        </div>
      </div>

      {(app.nextFollowUpDate && app.nextFollowUpDate < todayStr()) && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onFollowUp(app) }}
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-app-danger/10 px-2.5 py-1 text-[11px] font-semibold text-app-danger transition hover:bg-app-danger/20">
          <NotificationsNoneOutlined sx={{ fontSize: 13 }} />
          {fmtDate(app.nextFollowUpDate)} · Overdue
        </button>
      )}
    </div>
  )
}

function AnalyticsTile({ icon, tint, value, label, trend, subtext, valueClassName = 'text-white' }) {
  const hasTrend = typeof trend === 'number'
  const positive = trend >= 0
  return (
    <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card px-4 py-3.5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-inner-highlight"
        style={{ background: `linear-gradient(160deg, ${tint}26, ${tint}0D)`, color: tint }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={`text-2xl font-display font-black leading-none ${valueClassName}`}>{value}</p>
        <p className="text-[11px] text-white/40 font-medium mt-1 truncate">{label}</p>
        {hasTrend && (
          <p className={`flex items-center gap-0.5 text-[11px] font-semibold mt-1 ${positive ? 'text-app-success' : 'text-app-danger'}`}>
            {positive ? <TrendingUpRounded sx={{ fontSize: 13 }} /> : <TrendingDownRounded sx={{ fontSize: 13 }} />}
            {Math.abs(trend)}% vs last month
          </p>
        )}
        {subtext && <p className="text-[10px] text-white/30 leading-tight mt-1">{subtext}</p>}
      </div>
    </div>
  )
}

function DetailField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-white/85 truncate">{value || <span className="text-white/25">—</span>}</p>
    </div>
  )
}

function nextStepInfo(app) {
  const today = todayStr()
  if (app.nextFollowUpDate) {
    const days = Math.round((new Date(app.nextFollowUpDate) - new Date(today)) / 86400000)
    const overdue = app.nextFollowUpDate < today
    return {
      label: overdue ? `Follow-up ${Math.abs(days)}d overdue` : days === 0 ? 'Follow-up today' : `Follow-up in ${days}d`,
      tone: overdue ? 'danger' : 'accent',
    }
  }
  if (app.deadline) {
    const days = Math.round((new Date(app.deadline) - new Date(today)) / 86400000)
    const past = app.deadline < today
    return {
      label: past ? 'Deadline passed' : days === 0 ? 'Deadline today' : `Deadline in ${days}d`,
      tone: past ? 'danger' : days <= 3 ? 'warning' : 'neutral',
    }
  }
  if (app.expectedSalary) {
    return { label: app.expectedSalary, tone: 'success' }
  }
  return { label: 'None', tone: 'muted' }
}

const NEXT_STEP_TONE = {
  danger:  'text-app-danger',
  accent:  'text-app-accent-soft',
  warning: 'text-app-warning',
  success: 'text-app-success',
  neutral: 'text-white/60',
  muted:   'text-white/25',
}

function ApplicationTableRow({ app, company, onView, onEdit, onDelete, onFollowUp, onStatusChanged }) {
  const step = nextStepInfo(app)
  return (
    <div onClick={() => onView(app)}
      className="group flex items-center gap-2.5 sm:gap-4 border-b border-white/[0.05] px-3 sm:px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.025] last:border-0 min-w-0 md:min-w-0">
      <div className="w-28 sm:w-56 min-w-0 shrink-0 flex items-center gap-2 sm:gap-3">
        <CompanyLogo name={app.companyName} website={company?.website} dotColor={dotHex(app.status)} className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white/90 truncate">{app.companyName}</p>
          {company?.location && <p className="text-xs text-white/35 truncate mt-0.5">{company.location}</p>}
        </div>
      </div>

      <div className="w-24 sm:w-36 min-w-0 shrink-0" onClick={(e) => e.stopPropagation()}>
        <AppStatusChanger app={app} onStatusChanged={onStatusChanged} />
      </div>

      <div className="w-44 min-w-0 shrink-0 hidden md:block">
        <p className="text-sm text-white/75 truncate">{app.role}</p>
      </div>

      <div className="w-32 min-w-0 shrink-0 hidden lg:block">
        <p className="text-sm text-white/70 truncate">{app.companyName}</p>
      </div>

      <div className="w-28 shrink-0 hidden lg:block">
        <p className="text-sm text-white/60 truncate">{SOURCE_LABELS[app.source] || app.source || '—'}</p>
      </div>

      <div className="w-28 shrink-0 hidden xl:block">
        <p className="text-sm text-white/60">{app.applicationDate ? fmtDate(app.applicationDate) : '—'}</p>
      </div>

      <div className="w-36 min-w-0 shrink-0 hidden xl:block" onClick={(e) => e.stopPropagation()}>
        {step.label !== 'None' && (app.nextFollowUpDate || app.deadline) ? (
          <button type="button" onClick={() => onFollowUp(app)} className={`text-sm font-medium truncate hover:underline ${NEXT_STEP_TONE[step.tone]}`}>
            {step.label}
          </button>
        ) : (
          <p className={`text-sm truncate ${NEXT_STEP_TONE[step.tone]}`}>{step.label}</p>
        )}
      </div>

      <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
        <CardMenu items={[
          { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(app) },
          { key: 'followup', label: 'Follow-Up', icon: <NotificationsNoneOutlined sx={{ fontSize: 16 }} />, onClick: () => onFollowUp(app) },
          { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(app) },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(app), tone: 'danger' },
        ]} />
      </div>
    </div>
  )
}

function ApplicationTableHeader() {
  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white/35 border-b border-white/[0.06]">
      <div className="w-40 sm:w-56 shrink-0">Application</div>
      <div className="w-28 sm:w-36 shrink-0">Status</div>
      <div className="w-44 shrink-0">Role</div>
      <div className="w-32 shrink-0 hidden lg:block">Company</div>
      <div className="w-28 shrink-0 hidden lg:block">Source</div>
      <div className="w-28 shrink-0 hidden xl:block">Applied On</div>
      <div className="w-36 shrink-0 hidden xl:block">Next Step</div>
      <div className="ml-auto w-8 shrink-0" />
    </div>
  )
}

const triggerDocDownload = (doc) => downloadDoc((d) => downloadApplicationDocument(d.id), doc)
const triggerDocView     = (doc) => openDocInNewTab((d) => viewApplicationDocument(d.id), doc)

// ─── Detail (View) Modal ──────────────────────────────────────────────────────
function DetailModal({ open, app: initialApp, company, onClose, onEdit, onDelete, onStatusChanged, onCompany }) {
  const [app, setApp] = useState(initialApp)
  const [interviews, setInterviews] = useState([])
  const [interviewsLoading, setInterviewsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_INTERVIEW_FORM)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_INTERVIEW_FORM)
  const [editSaving, setEditSaving] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [ivFlash, setIvFlash] = useTransientMessage(2500)

  useEffect(() => { setApp(initialApp) }, [initialApp])

  const fetchInterviews = useCallback(async () => {
    if (!initialApp) return
    setInterviewsLoading(true)
    try {
      const res = await getInterviewsForApplication(initialApp.id)
      setInterviews(res.data)
    } catch { /* silently ignore */ }
    finally { setInterviewsLoading(false) }
  }, [initialApp])

  useEffect(() => {
    if (open && initialApp) {
      setShowAddForm(false)
      setAddForm(EMPTY_INTERVIEW_FORM)
      setAddError('')
      setEditingId(null)
      setIvFlash('')
      fetchInterviews()
    }
  }, [open, initialApp, fetchInterviews])

  if (!open) return null

  const handleStatusChanged = (updated) => {
    setApp(updated)
    onStatusChanged?.(updated)
  }

  const flash = setIvFlash

  const setAddField  = (key) => (e) => setAddForm(f  => ({ ...f,  [key]: e.target.value }))
  const setEditField = (key) => (e) => setEditForm(f => ({ ...f,  [key]: e.target.value }))

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!addForm.scheduledAt) { setAddError('Date & time is required.'); return }
    setAddSaving(true); setAddError('')
    try {
      await createInterview(app.id, {
        scheduledAt:      addForm.scheduledAt || undefined,
        round:            addForm.round.trim() || undefined,
        interviewType:    addForm.interviewType || undefined,
        location:         addForm.location.trim() || undefined,
        interviewerName:  addForm.interviewerName.trim() || undefined,
        questionsAsked:   addForm.questionsAsked.trim() || undefined,
        feedbackReceived: addForm.feedbackReceived.trim() || undefined,
        outcome:          addForm.outcome || 'PENDING',
      })
      setAddForm(EMPTY_INTERVIEW_FORM)
      setShowAddForm(false)
      flash('Round added.')
      fetchInterviews()
    } catch (err) {
      setAddError(err.response?.data?.message || 'Something went wrong.')
    } finally { setAddSaving(false) }
  }

  const startEdit = (iv) => {
    setEditingId(iv.id)
    setEditForm({
      scheduledAt:      iv.scheduledAt ? iv.scheduledAt.slice(0, 16) : '',
      round:            iv.round || '',
      interviewType:    iv.interviewType || '',
      location:         iv.location || '',
      interviewerName:  iv.interviewerName || '',
      questionsAsked:   iv.questionsAsked || '',
      feedbackReceived: iv.feedbackReceived || '',
      outcome:          iv.outcome || 'PENDING',
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.scheduledAt) return
    setEditSaving(true)
    try {
      await updateInterview(editingId, {
        scheduledAt:      editForm.scheduledAt || undefined,
        round:            editForm.round.trim() || undefined,
        interviewType:    editForm.interviewType || undefined,
        location:         editForm.location.trim() || undefined,
        interviewerName:  editForm.interviewerName.trim() || undefined,
        questionsAsked:   editForm.questionsAsked.trim() || undefined,
        feedbackReceived: editForm.feedbackReceived.trim() || undefined,
        outcome:          editForm.outcome || 'PENDING',
      })
      setEditingId(null)
      flash('Round updated.')
      fetchInterviews()
    } catch { flash('Update failed.') }
    finally { setEditSaving(false) }
  }

  const handleDeleteRound = async (id) => {
    setProcessingId(id)
    try {
      await deleteInterview(id)
      flash('Round deleted.')
      fetchInterviews()
    } catch { flash('Delete failed.') }
    finally { setProcessingId(null) }
  }

  const fmtDateTime = (dt) => fmt(dt) || '—'

  const inputCls = 'w-full px-3 py-2 border border-white/[0.08] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.14] transition placeholder:text-white/25'

  const timelineEvents = app ? [
    app.updatedAt && app.updatedAt !== app.createdAt && {
      label: 'Application Updated',
      at: app.updatedAt,
    },
    app.createdAt && {
      label: 'Application Created',
      at: app.createdAt,
    },
  ].filter(Boolean) : []

  return (
    <DrawerShell>

      <div className="px-6 pt-6 pb-5 border-b border-white/[0.06] shrink-0">
        {app && (
          <div className="flex items-start gap-3">
            <CompanyLogo name={app.companyName} website={company?.website} dotColor={dotHex(app.status)} className="h-12 w-12 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white leading-tight truncate">{app.companyName || '—'}</h2>
                {app.companyId && (
                  <button onClick={() => { onClose(); onCompany(app.companyId) }}
                    className="text-[11px] font-semibold text-app-accent-soft hover:text-white hover:underline transition shrink-0">
                    View Company →
                  </button>
                )}
              </div>
              {company?.location && <p className="text-xs text-white/40 truncate mt-0.5">{company.location}</p>}
              <div className="mt-2">
                <AppStatusChanger app={app} onStatusChanged={handleStatusChanged} />
              </div>
            </div>
            <CloseIconButton onClose={onClose} className="shrink-0" />
          </div>
        )}
      </div>

      {app && (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 no-scrollbar">

          <div>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest mb-3">Role & Application</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <DetailField label="Role" value={app.role} />
              <DetailField label="Applied On" value={app.applicationDate ? fmtDate(app.applicationDate) : null} />
              <DetailField label="Source" value={SOURCE_LABELS[app.source] || app.source} />
              <DetailField label="Expected CTC" value={app.expectedSalary} />
              <DetailField label="Deadline" value={app.deadline ? fmtDate(app.deadline) : null} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest">Notes</p>
              <button onClick={() => { onClose(); onEdit(app) }}
                className="flex items-center gap-1 text-[11px] font-semibold text-app-accent-soft hover:text-white transition">
                <EditOutlined sx={{ fontSize: 12 }} /> Edit
              </button>
            </div>
            <div className="bg-white/[0.03] rounded-xl px-4 py-3">
              <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">
                {app.notes || <span className="text-white/25 italic">No notes yet.</span>}
              </p>
            </div>
          </div>

            {(app.resume || app.coverLetter) && (
              <div>
                <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest mb-2">Documents</p>
                <div className="flex gap-2 flex-wrap">
                  {app.resume && (
                    <button onClick={() => triggerDocView(app.resume)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-app-accent/10 text-app-accent-soft rounded-lg hover:bg-app-accent/20 transition font-medium">
                      📄 {app.resume.originalName || 'Resume'}
                    </button>
                  )}
                  {app.coverLetter && (
                    <button onClick={() => triggerDocView(app.coverLetter)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-app-accent2/10 text-app-accent-soft rounded-lg hover:bg-app-accent2/20 transition font-medium">
                      📋 {app.coverLetter.originalName || 'Cover Letter'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest">
                  Interview Rounds {interviews.length > 0 && `(${interviews.length})`}
                </p>
                <button
                  onClick={() => { setShowAddForm(v => !v); setAddError('') }}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                    showAddForm
                      ? 'bg-app-accent2 text-white border-app-accent2'
                      : 'border-app-accent2/30 text-app-accent-soft bg-white/[0.03] hover:bg-app-accent2 hover:text-white hover:border-app-accent2'
                  }`}>
                  {showAddForm ? '✕ Cancel' : '+ Add Round'}
                </button>
              </div>

              {ivFlash && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-app-success/10 border border-app-success/20 text-app-success text-xs font-medium">
                  {ivFlash}
                </div>
              )}

              {showAddForm && (
                <form onSubmit={handleAddSubmit} className="mb-4 bg-app-accent2/10 rounded-xl p-3 space-y-2.5">
                  {addError && <p className="text-xs text-app-danger">{addError}</p>}
                  <InterviewFormFields form={addForm} setField={setAddField} inputCls={inputCls} />
                  <button type="submit" disabled={addSaving}
                    className="w-full py-2 text-xs font-semibold text-white bg-app-accent2 rounded-xl hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {addSaving && <CircularProgress size={11} color="inherit" />}
                    Add Round
                  </button>
                </form>
              )}

              {interviewsLoading ? (
                <div className="flex justify-center py-4"><CircularProgress size={20} /></div>
              ) : interviews.length === 0 ? (
                <p className="text-xs text-white/35 text-center py-3">No rounds yet — add one above.</p>
              ) : (
                <div className="relative">
                  {interviews.length > 1 && (
                    <div className="absolute left-[15px] top-[30px] bottom-[30px] w-0.5 bg-white/[0.06] z-0" />
                  )}
                  <div className="space-y-3">
                    {interviews.map((iv, idx) => {
                      const outcomeCfg = INTERVIEW_OUTCOME_CONFIG[iv.outcome] || INTERVIEW_OUTCOME_CONFIG.AWAITING_RESPONSE
                      const isProc = processingId === iv.id
                      const isEditingThis = editingId === iv.id
                      const dotBg =
                        iv.outcome === 'PASSED'      ? 'bg-app-success ring-app-success/15'  :
                        iv.outcome === 'FAILED'      ? 'bg-app-danger ring-app-danger/15'      :
                        iv.outcome === 'NO_SHOW'     ? 'bg-white/40 ring-white/10'    :
                        iv.outcome === 'RESCHEDULED' ? 'bg-app-accent ring-app-accent/15'    :
                                                       'bg-app-warning ring-app-warning/15'
                      return (
                        <div key={iv.id} className="relative flex gap-3 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ring-4 ${dotBg}`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                            {isEditingThis ? (
                              <form onSubmit={handleEditSubmit} className="space-y-2">
                                <p className="text-[10px] font-semibold text-app-accent-soft uppercase tracking-wide">Editing Round {idx + 1}</p>
                                <InterviewFormFields form={editForm} setField={setEditField} inputCls={inputCls} />
                                <div className="flex gap-2 pt-1">
                                  <button type="submit" disabled={editSaving}
                                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-app-accent2 rounded-lg hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-1.5">
                                    {editSaving && <CircularProgress size={10} color="inherit" />}
                                    Save
                                  </button>
                                  <button type="button" onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 text-xs font-semibold text-white/60 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition">
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-bold text-white/85">{iv.round || `Round ${idx + 1}`}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${outcomeCfg.cls}`}>{outcomeCfg.label}</span>
                                  </div>
                                  <p className="text-[11px] text-white/35 mb-1">🗓 {fmtDateTime(iv.scheduledAt)}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {iv.interviewType && <span className="text-[10px] px-1.5 py-0.5 bg-app-accent2/10 text-app-accent-soft rounded-md font-medium">{INTERVIEW_TYPE_LABELS[iv.interviewType]}</span>}
                                    {iv.location && <span className="text-[10px] px-1.5 py-0.5 bg-app-accent/10 text-app-accent-soft rounded-md font-medium truncate max-w-[140px]" title={iv.location}>📍 {iv.location}</span>}
                                    {iv.interviewerName && <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] text-white/60 rounded-md font-medium">👤 {iv.interviewerName}</span>}
                                  </div>
                                  {iv.questionsAsked && <p className="mt-1 text-[11px] text-white/35"><span className="font-semibold not-italic">Q:</span> <span className="italic line-clamp-2">{iv.questionsAsked}</span></p>}
                                  {iv.feedbackReceived && <p className="mt-0.5 text-[11px] text-white/35"><span className="font-semibold not-italic">FB:</span> <span className="italic line-clamp-2">{iv.feedbackReceived}</span></p>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => startEdit(iv)} disabled={isProc}
                                    className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-white/[0.08] text-white/60 bg-white/[0.03] hover:bg-white/[0.12] hover:text-white hover:border-white/[0.16] transition disabled:opacity-50">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteRound(iv.id)} disabled={isProc}
                                    className="px-2 py-1 text-[10px] font-semibold rounded-lg border border-app-danger/20 text-app-danger bg-white/[0.03] hover:bg-app-danger hover:text-white hover:border-app-danger transition disabled:opacity-50 flex items-center">
                                    {isProc ? <CircularProgress size={9} color="inherit" /> : '×'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {timelineEvents.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest mb-3">Activity Timeline</p>
                <div className="relative">
                  {timelineEvents.length > 1 && (
                    <div className="absolute left-[3px] top-[6px] bottom-[6px] w-px bg-white/[0.08]" />
                  )}
                  <div className="space-y-3">
                    {timelineEvents.map((ev, i) => (
                      <div key={i} className="relative flex gap-3 pl-0.5">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-app-accent-soft shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-white/75">{ev.label}</p>
                          <p className="text-xs text-white/35 mt-0.5">{fmtDateTime(ev.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {app && (
          <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] shrink-0">
            <button onClick={() => { onClose(); onEdit(app) }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white/70 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.10] hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
              </svg>
              Edit
            </button>
            <button onClick={() => { onClose(); onDelete(app) }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-app-danger bg-white/[0.03] border border-app-danger/20 rounded-xl hover:bg-app-danger hover:text-white hover:border-app-danger transition ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd"/>
              </svg>
              Delete
            </button>
          </div>
        )}
    </DrawerShell>
  )
}

function AddEditModal({ open, app, companies, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [liveApp, setLiveApp] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [coverLetterFile, setCoverLetterFile] = useState(null)
  const [coverLetterError, setCoverLetterError] = useState('')
  const [profileResumes, setProfileResumes] = useState([])
  const [selectedProfileResumeDocId, setSelectedProfileResumeDocId] = useState('')

  useEffect(() => {
    if (open) {
      setLiveApp(app ?? null)
      setForm(app ? {
        companyId: app.companyId || '', role: app.role || '',
        applicationDate: app.applicationDate || todayStr(),
        deadline: app.deadline || '',
        source: app.source || '', status: app.status || 'APPLIED',
        expectedSalary: app.expectedSalary || '', notes: app.notes || '',
      } : EMPTY_FORM)
      setResumeFile(null)
      setResumeError('')
      setCoverLetterFile(null)
      setCoverLetterError('')
      setError('')
      setSelectedProfileResumeDocId('')
      getProfile().then((res) => setProfileResumes(res.data?.resumes ?? [])).catch(() => {})
    }
  }, [open, app])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setVal = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  const handleResumePick = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!isAllowedDocExt(file)) {
      setResumeError('Only PDF, DOC, and DOCX files are supported.')
      return
    }
    setResumeError('')
    setResumeFile(file)
    setSelectedProfileResumeDocId('')
  }

  const handleCoverLetterChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!isAllowedDocExt(file)) {
      setCoverLetterError('Only PDF, DOC, and DOCX files are supported.')
      e.target.value = ''
      return
    }
    setCoverLetterError('')
    setCoverLetterFile(file)
  }

  const handleRemoveResume = async () => {
    if (!liveApp?.resume) return
    setDeletingId('resume')
    try {
      const res = await deleteApplication(liveApp.id, liveApp.resume.id)
      setLiveApp(res.data)
    } catch {
      setError('Failed to remove resume.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteCoverLetter = async () => {
    if (!liveApp?.coverLetter) return
    setDeletingId('coverLetter')
    try {
      const res = await deleteApplication(liveApp.id, liveApp.coverLetter.id)
      setLiveApp(res.data)
    } catch {
      setError('Failed to delete cover letter.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.companyId) { setError('Please select a company.'); return }
    if (!form.role.trim()) { setError('Role is required.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        companyId: Number(form.companyId), role: form.role.trim(),
        applicationDate: form.applicationDate || undefined,
        deadline: form.deadline || undefined,
        source: form.source || undefined, status: form.status || undefined,
        expectedSalary: form.expectedSalary.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      let savedId
      if (liveApp) {
        await updateApplication(liveApp.id, payload)
        savedId = liveApp.id
      } else {
        const res = await addApplication(payload)
        savedId = res.data.id
      }
      if (selectedProfileResumeDocId) {
        await uploadApplicationDocuments(savedId, { profileResumeDocumentId: Number(selectedProfileResumeDocId) })
      } else if (resumeFile) {
        await uploadApplicationDocuments(savedId, { resume: resumeFile })
      }
      if (coverLetterFile) {
        await uploadApplicationDocuments(savedId, { coverLetter: coverLetterFile })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.14] transition placeholder:text-white/25'

  if (!open) return null

  return (
    <DrawerShell>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
        <h2 className="text-base font-bold text-white">{app ? 'Edit Application' : 'Add Application'}</h2>
        <CloseIconButton onClose={onClose} />
      </div>
      <div className="px-5 py-4 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>
              Company <span className="text-app-danger">*</span>
            </FieldLabel>
            <FilterSelect
              value={form.companyId}
              onChange={setVal('companyId')}
              allLabel="Select a company"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>
              Role <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.role} onChange={set('role')} placeholder="e.g. SDE Intern" className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Application Date</FieldLabel>
              <input type="date" value={form.applicationDate} onChange={set('applicationDate')} className={inputCls} />
            </div>
            <div>
              <FieldLabel>
                Deadline <span className="text-white/30 normal-case font-normal">(optional)</span>
              </FieldLabel>
              <input type="date" value={form.deadline} onChange={set('deadline')} className={inputCls} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Source</FieldLabel>
              <FilterSelect
                value={form.source}
                onChange={setVal('source')}
                allLabel="Select source"
                options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
                className="w-full"
              />
            </div>
            <div>
              <FieldLabel>Expected Salary</FieldLabel>
              <input type="text" value={form.expectedSalary} onChange={set('expectedSalary')} placeholder="e.g. 6 LPA" className={inputCls} />
            </div>
          </div>
          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Referral contact, interview prep notes..." className={`${inputCls} resize-none`} />
          </div>

          <div>
            <FieldLabel>
              Resume <span className="text-white/30 normal-case font-normal">(PDF, DOC, DOCX)</span>
            </FieldLabel>

            {liveApp?.resume && (
              <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-app-accent-soft shrink-0">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{liveApp.resume.originalName}</p>
                  <p className="text-xs text-white/35">{fmtFileSize(liveApp.resume.fileSize)}</p>
                </div>
                <button type="button"
                  onClick={() => triggerDocView(liveApp.resume)}
                  className="text-xs font-semibold text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/[0.08] transition">
                  View
                </button>
                <button type="button"
                  onClick={() => triggerDocDownload(liveApp.resume)}
                  className="text-xs font-semibold text-app-accent-soft hover:text-white px-2 py-1 rounded-lg hover:bg-app-accent/10 transition">
                  Download
                </button>
                <button type="button"
                  onClick={handleRemoveResume}
                  disabled={deletingId === 'resume'}
                  className="text-xs font-semibold text-app-danger/80 hover:text-app-danger px-2 py-1 rounded-lg hover:bg-app-danger/10 transition disabled:opacity-50 flex items-center gap-1">
                  {deletingId === 'resume' && <CircularProgress size={10} color="inherit" />}
                  Delete
                </button>
              </div>
            )}

            {!liveApp?.resume && (
              <>
                {profileResumes.length > 0 && (
                  <div className="mb-2">
                    <label className="block text-xs text-white/40 mb-1">Select from profile</label>
                    <select
                      value={selectedProfileResumeDocId}
                      onChange={(e) => { setSelectedProfileResumeDocId(e.target.value); setResumeFile(null) }}
                      className="w-full px-3 py-2 border border-white/[0.08] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.14] transition">
                      <option value="" className="bg-app-surface text-white">— choose a resume —</option>
                      {profileResumes.map((r) => (
                        <option key={r.id} value={r.documentId} className="bg-app-surface text-white">{r.originalName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {profileResumes.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-px bg-white/[0.08]" />
                    <span className="text-xs text-white/35">or upload new</span>
                    <div className="flex-1 h-px bg-white/[0.08]" />
                  </div>
                )}

                {resumeFile && (
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-app-accent/25 bg-app-accent/10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-app-accent-soft shrink-0">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-app-accent-soft truncate flex-1">{resumeFile.name}</span>
                    <span className="text-xs text-app-accent-soft/70">pending upload</span>
                    <button type="button" onClick={() => setResumeFile(null)}
                      className="text-app-accent-soft hover:text-app-danger font-bold text-base leading-none px-1 transition">×</button>
                  </div>
                )}

                {!resumeFile && (
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-white/[0.10] hover:border-app-accent/40 cursor-pointer transition w-full">
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumePick} className="sr-only" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/35">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    <span className="text-sm text-white/35">Upload resume</span>
                  </label>
                )}
              </>
            )}
            {resumeError && <p className="mt-1 text-xs text-app-danger">{resumeError}</p>}
          </div>

          <div>
            <FieldLabel>
              Cover Letter <span className="text-white/30 normal-case font-normal">(PDF, DOC, DOCX)</span>
            </FieldLabel>
            {liveApp?.coverLetter && (
              <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-app-accent-soft shrink-0">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{liveApp.coverLetter.originalName}</p>
                  <p className="text-xs text-white/35">{fmtFileSize(liveApp.coverLetter.fileSize)}</p>
                </div>
                <button type="button" onClick={() => triggerDocView(liveApp.coverLetter)}
                  className="text-xs font-semibold text-white/60 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/[0.08]">
                  View
                </button>
                <button type="button" onClick={() => triggerDocDownload(liveApp.coverLetter)}
                  className="text-xs font-semibold text-app-accent-soft hover:text-white transition px-2 py-1 rounded-lg hover:bg-app-accent2/10">
                  Download
                </button>
                <button type="button" onClick={handleDeleteCoverLetter}
                  disabled={deletingId === 'coverLetter'}
                  className="text-xs font-semibold text-app-danger/80 hover:text-app-danger transition px-2 py-1 rounded-lg hover:bg-app-danger/10 disabled:opacity-50 flex items-center gap-1">
                  {deletingId === 'coverLetter' && <CircularProgress size={10} color="inherit" />}
                  Delete
                </button>
              </div>
            )}
            {!liveApp?.coverLetter && (
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-white/[0.10] hover:border-app-accent2/40 cursor-pointer transition">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleCoverLetterChange} className="sr-only" />
                  {coverLetterFile ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-app-accent-soft shrink-0">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-white/80 truncate flex-1">{coverLetterFile.name}</span>
                      <button type="button" onClick={(e) => { e.preventDefault(); setCoverLetterFile(null) }}
                        className="text-white/35 hover:text-app-danger transition font-bold text-base leading-none px-1">×</button>
                    </div>
                  ) : (
                    <span className="text-sm text-white/35">Click to upload cover letter</span>
                  )}
                </label>
                {coverLetterError && <p className="text-xs text-app-danger">{coverLetterError}</p>}
              </div>
            )}
          </div>

          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={liveApp ? 'Save Changes' : 'Add Application'} />
        </form>
      </div>
    </DrawerShell>
  )
}

function FollowUpModal({ open, app, onClose, onChanged }) {
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useTransientMessage(2500)
  const [form, setForm] = useState({ followUpDate: todayStr(), note: '', daysFromNow: '' })
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [useDays, setUseDays] = useState(true)

  const fetch = useCallback(async () => {
    if (!app) return
    setLoading(true)
    setError('')
    try {
      const res = await getFollowUpsForApplication(app.id)
      setFollowUps(res.data)
    } catch {
      setError('Failed to load follow-ups.')
    } finally {
      setLoading(false)
    }
  }, [app])

  useEffect(() => {
    if (open) {
      setForm({ followUpDate: todayStr(), note: '', daysFromNow: '' })
      setUseDays(true)
      setError('')
      setSuccessMsg('')
      fetch()
    }
  }, [open, fetch])

  const handleAdd = async (e) => {
    e.preventDefault()
    let date = form.followUpDate
    if (useDays) {
      const days = parseInt(form.daysFromNow, 10)
      if (!days || days < 1) { setError('Enter a valid number of days (≥ 1).'); return }
      const d = new Date()
      d.setDate(d.getDate() + days)
      date = d.toISOString().slice(0, 10)
    }
    if (!date) { setError('Follow-up date is required.'); return }
    setSaving(true)
    setError('')
    try {
      await createFollowUp(app.id, { followUpDate: date, note: form.note.trim() || undefined })
      setForm({ followUpDate: todayStr(), note: '', daysFromNow: '' })
      flash('Follow-up scheduled.')
      fetch()
      onChanged?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add follow-up.')
    } finally {
      setSaving(false)
    }
  }

  const flash = setSuccessMsg

  const markDone = async (fu) => {
    setProcessingId(fu.id)
    try {
      await updateFollowUp(fu.id, { status: 'DONE' })
      flash('Marked as completed.')
      fetch()
      onChanged?.()
    } catch {
      setError('Failed to update follow-up.')
    } finally {
      setProcessingId(null)
    }
  }

  const markPending = async (fu) => {
    setProcessingId(fu.id)
    try {
      await updateFollowUp(fu.id, { status: 'PENDING' })
      flash('Moved back to pending.')
      fetch()
      onChanged?.()
    } catch {
      setError('Failed to update follow-up.')
    } finally {
      setProcessingId(null)
    }
  }

  const remove = async (id) => {
    setProcessingId(id)
    try {
      await deleteFollowUp(id)
      flash('Follow-up deleted.')
      fetch()
      onChanged?.()
    } catch {
      setError('Failed to delete follow-up.')
    } finally {
      setProcessingId(null)
    }
  }

  const reschedule = async (fu, newDate) => {
    try {
      await updateFollowUp(fu.id, { followUpDate: newDate })
      flash('Follow-up rescheduled.')
      fetch()
      onChanged?.()
    } catch {
      setError('Failed to reschedule follow-up.')
      throw new Error('reschedule failed')
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-white/[0.08] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.14] transition placeholder:text-white/25'

  const pending = followUps.filter((f) => f.status === 'PENDING')
  const done = followUps.filter((f) => f.status === 'DONE')

  return (
    <ModalShell
      open={open} onClose={onClose}
      title="Follow-Up Reminders"
      subtitle={app ? `${app.role} at ${app.companyName}` : ''}
      maxWidth="max-w-lg"
    >
      <div className="px-6 py-5 space-y-5">
        {successMsg && (
          <div className="p-3 rounded-xl bg-app-success/10 border border-app-success/20 text-app-success text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}
        {error && <div className="p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}

        <form onSubmit={handleAdd} className="bg-app-accent/10 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-app-accent-soft uppercase tracking-wide">Schedule a Follow-Up</p>

          <div className="flex gap-2">
            <button type="button"
              onClick={() => setUseDays(true)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${useDays ? 'bg-app-accent text-white border-app-accent' : 'bg-white/[0.03] text-white/60 border-white/[0.08] hover:border-white/[0.16]'}`}>
              Days from now
            </button>
            <button type="button"
              onClick={() => setUseDays(false)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${!useDays ? 'bg-app-accent text-white border-app-accent' : 'bg-white/[0.03] text-white/60 border-white/[0.08] hover:border-white/[0.16]'}`}>
              Pick a date
            </button>
          </div>

          {useDays ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60 whitespace-nowrap">Follow up in</span>
              <input
                type="number" min="1" max="365"
                value={form.daysFromNow}
                onChange={(e) => setForm((f) => ({ ...f, daysFromNow: e.target.value }))}
                placeholder="5"
                className="w-20 px-3 py-2 border border-white/[0.08] rounded-xl text-sm text-center text-white/85 focus:outline-none focus:ring-2 focus:ring-app-accent/40 bg-white/[0.03] placeholder:text-white/25"
              />
              <span className="text-sm text-white/60">days</span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wide mb-1">Date</label>
              <input type="date" value={form.followUpDate}
                onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                className={inputCls} />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wide mb-1">Note (optional)</label>
            <input type="text" value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. Email HR about status update"
              className={inputCls} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-2 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <CircularProgress size={13} color="inherit" />}
            Add Follow-Up
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-6"><CircularProgress size={24} /></div>
        ) : followUps.length === 0 ? (
          <p className="text-sm text-white/35 text-center py-4">No follow-ups scheduled yet.</p>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Pending</p>
                <div className="space-y-2">
                  {pending.map((fu) => (
                    <FollowUpRow key={fu.id} fu={fu} onDone={() => markDone(fu)} onDelete={() => remove(fu.id)} onReschedule={(d) => reschedule(fu, d)} loading={processingId === fu.id} />
                  ))}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Completed</p>
                <div className="space-y-2">
                  {done.map((fu) => (
                    <FollowUpRow key={fu.id} fu={fu} onUndo={() => markPending(fu)} onDelete={() => remove(fu.id)} loading={processingId === fu.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  )
}

function FollowUpRow({ fu, onDone, onUndo, onDelete, onReschedule, loading }) {
  const isDone = fu.status === 'DONE'
  const isOverdue = fu.overdue
  const [editing, setEditing] = useState(false)

  return (
    <div className={`p-3 rounded-xl border ${isDone ? 'bg-white/[0.02] border-white/[0.05] opacity-70' : isOverdue ? 'bg-app-danger/10 border-app-danger/20' : 'bg-white/[0.03] border-white/[0.06]'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold ${isDone ? 'text-white/35 line-through' : isOverdue ? 'text-app-danger' : 'text-white/80'}`}>
              📅 {fmtDate(fu.followUpDate)}
            </span>
            {isOverdue && !isDone && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-app-danger/15 text-app-danger">Overdue</span>
            )}
            {isDone && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-app-success/15 text-app-success">Done</span>
            )}
          </div>
          {fu.note && (
            <p className={`text-xs mt-0.5 ${isDone ? 'text-white/30' : 'text-white/50'}`}>{fu.note}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {!isDone && onDone && (
            <button onClick={onDone} disabled={loading}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-app-success/25 text-app-success bg-white/[0.03] hover:bg-app-success hover:text-white hover:border-app-success transition disabled:opacity-50 flex items-center gap-1">
              {loading ? <CircularProgress size={10} color="inherit" /> : null}
              Done
            </button>
          )}
          {!isDone && onReschedule && (
            <button onClick={() => setEditing((e) => !e)} disabled={loading}
              title="Reschedule"
              className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition disabled:opacity-50 ${editing ? 'bg-app-warning text-white border-app-warning' : 'border-app-warning/25 text-app-warning bg-white/[0.03] hover:bg-app-warning hover:text-white hover:border-app-warning'}`}>
              📅
            </button>
          )}
          {isDone && onUndo && (
            <button onClick={onUndo} disabled={loading}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-white/[0.08] text-white/60 bg-white/[0.03] hover:bg-white/[0.10] transition disabled:opacity-50 flex items-center gap-1">
              {loading ? <CircularProgress size={10} color="inherit" /> : null}
              Undo
            </button>
          )}
          <button onClick={onDelete} disabled={loading}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-app-danger/25 text-app-danger bg-white/[0.03] hover:bg-app-danger hover:text-white hover:border-app-danger transition disabled:opacity-50">
            ×
          </button>
        </div>
      </div>
      {editing && (
        <RescheduleInline
          currentDate={fu.followUpDate}
          onSave={async (d) => { await onReschedule(d); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

const INTERVIEW_TYPE_LABELS = {
  PHONE_SCREEN: 'Phone Screen', VIDEO_CALL: 'Video Call', ONSITE: 'Onsite',
  TECHNICAL: 'Technical', HR: 'HR', BEHAVIORAL: 'Behavioral',
  CASE_STUDY: 'Case Study', GROUP: 'Group', OTHER: 'Other',
}

const INTERVIEW_OUTCOME_CONFIG = {
  AWAITING_RESPONSE: { label: 'Awaiting Response', cls: 'bg-app-warning/15 text-app-warning'   },
  PASSED:            { label: 'Passed',             cls: 'bg-app-success/15 text-app-success'   },
  FAILED:            { label: 'Failed',             cls: 'bg-app-danger/15 text-app-danger'       },
  NO_SHOW:           { label: 'No Show',            cls: 'bg-white/[0.08] text-white/50'     },
  RESCHEDULED:       { label: 'Rescheduled',        cls: 'bg-app-accent/15 text-app-accent-soft'     },
}

const EMPTY_INTERVIEW_FORM = {
  scheduledAt: '', round: '', interviewType: '', location: '', interviewerName: '',
  questionsAsked: '', feedbackReceived: '', outcome: 'AWAITING_RESPONSE',
}

function InterviewFormFields({ form, setField, inputCls }) {
  return (
    <>
      <div>
        <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">Date & Time <span className="text-app-danger">*</span></label>
        <input type="datetime-local" value={form.scheduledAt} onChange={setField('scheduledAt')} className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">Round Name</label>
          <input type="text" value={form.round} onChange={setField('round')} placeholder="e.g. HR Round" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">Type</label>
          <FilterSelect
            value={form.interviewType}
            onChange={(val) => setField('interviewType')({ target: { value: val } })}
            allLabel="Select type"
            options={Object.entries(INTERVIEW_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            className="w-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">Location / Link</label>
          <input type="text" value={form.location} onChange={setField('location')} placeholder="Zoom / office" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">Interviewer</label>
          <input type="text" value={form.interviewerName} onChange={setField('interviewerName')} placeholder="Name" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">Outcome</label>
        <FilterSelect
          value={form.outcome}
          onChange={(val) => setField('outcome')({ target: { value: val } })}
          options={Object.entries(INTERVIEW_OUTCOME_CONFIG).map(([value, { label }]) => ({ value, label }))}
          hideAll
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">Questions Asked</label>
        <textarea value={form.questionsAsked} onChange={setField('questionsAsked')} rows={2} placeholder="What questions were asked?" className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">Feedback Received</label>
        <textarea value={form.feedbackReceived} onChange={setField('feedbackReceived')} rows={2} placeholder="What feedback did you get?" className={`${inputCls} resize-none`} />
      </div>
    </>
  )
}

function DeleteModal({ open, app, onClose, onDeleted }) {
  return (
    <ConfirmDeleteModal
      open={open && !!app}
      onClose={onClose}
      onConfirm={async () => { await deleteApplication(app.id); onDeleted() }}
      title="Delete Application"
      message={
        <>
          Remove <span className="font-semibold text-white/80">{app?.role}</span> at{' '}
          <span className="font-semibold text-white/80">{app?.companyName}</span>?
          <span className="block text-xs text-app-danger mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

export default function Applications() {
  const [companies, setCompanies] = useState([])
  const [success, setSuccess] = useTransientMessage()

  const [filterStatus, setFilterStatus] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [search, setSearch] = useState('')
  const [datePreset, setDatePreset] = useState('')  // 'week' | 'month' | '3months' | 'year' | 'custom'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchInputRef = useRef(null)

  const [viewTarget, setViewTarget] = useState(null)
  const [followUpTarget, setFollowUpTarget] = useState(null)
  const [companyDetailId, setCompanyDetailId] = useState(null)

  useEffect(() => {
    getCompanies({ size: 1000 }).then((res) => setCompanies(res.data)).catch(() => {})
  }, [])

  const activeSortOption = SORT_OPTIONS.find((o) => o.value === sortBy)

  const {
    items: applications, setItems: setApplications, loading, error, setError,
    setPage, size, setSize, refetch: fetchApplications,
  } = usePagedList(
    useCallback((page, size) => {
      const isClientSort = activeSortOption?.clientSide
      return getApplications({
        status: filterStatus || undefined,
        sortBy: isClientSort ? 'createdAt' : sortBy,
        order: isClientSort ? 'desc' : order,
        page,
        size,
      })
    }, [filterStatus, sortBy, order, activeSortOption]),
    'Failed to load applications.'
  )

  const { data: allApplications, setData: setAllApplications, refetch: fetchAllApplications } = useFetchOnce(
    useCallback(() => getApplications({ size: 1000 }), []), []
  )
  const { data: stats, refetch: fetchStats } = useFetchOnce(getApplicationStats)

  useSearchShortcut(searchInputRef)

  const {
    modalOpen, setModalOpen, editTarget, deleteTarget, setDeleteTarget,
    openAdd, openEdit, handleSaved, handleDeleted,
  } = useCrudModals('Application', setSuccess, [fetchApplications, fetchAllApplications, fetchStats])
  const openView     = (a) => { setViewTarget(a) }
  const openFollowUp = (a) => { setFollowUpTarget(a) }

  useAddQueryParam(openAdd)

  const effectiveDateRange = (() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const toStr = (d) => d.toISOString().slice(0, 10)
    if (datePreset === 'week') {
      const from = new Date(today)
      from.setDate(today.getDate() - today.getDay())  
      return { from: toStr(from), to: toStr(today) }
    }
    if (datePreset === 'month') {
      return { from: toStr(new Date(today.getFullYear(), today.getMonth(), 1)), to: toStr(today) }
    }
    if (datePreset === '3months') {
      const from = new Date(today)
      from.setMonth(today.getMonth() - 3)
      return { from: toStr(from), to: toStr(today) }
    }
    if (datePreset === 'year') {
      return { from: toStr(new Date(today.getFullYear(), 0, 1)), to: toStr(today) }
    }
    if (datePreset === 'custom') {
      return { from: dateFrom || null, to: dateTo || null }
    }
    return { from: null, to: null }
  })()

  const q = search.trim().toLowerCase()
  const filteredApplications = applications.filter((a) => {
    if (q && !(
      a.companyName?.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q) ||
      (SOURCE_LABELS[a.source] || a.source || '').toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q)
    )) return false
    if (companyFilter && String(a.companyId ?? '') !== companyFilter) return false
    if (roleFilter && a.role !== roleFilter) return false
    if (sourceFilter && a.source !== sourceFilter) return false
    if (effectiveDateRange.from && a.applicationDate && a.applicationDate < effectiveDateRange.from) return false
    if (effectiveDateRange.to   && a.applicationDate && a.applicationDate > effectiveDateRange.to)   return false
    return true
  })

  const roleOptions = [...new Set(allApplications.map((a) => a.role).filter(Boolean))].sort()

  const companyById = Object.fromEntries(companies.map((c) => [c.id, c]))

  const { activeFilterCount, isFiltered, clearAllFilters } = useFilterState(search, setSearch, [
    [companyFilter, setCompanyFilter],
    [roleFilter, setRoleFilter],
    [sourceFilter, setSourceFilter],
    [filterStatus, setFilterStatus],
  ])

  const displayApplications = activeSortOption?.clientSide
    ? [...filteredApplications].sort((a, b) => {
        const va = (a.companyName || '').toLowerCase()
        const vb = (b.companyName || '').toLowerCase()
        const cmp = va < vb ? -1 : va > vb ? 1 : 0
        return order === 'asc' ? cmp : -cmp
      })
    : filteredApplications

  const dateOfApp = (a) => a.applicationDate ? new Date(a.applicationDate) : null
  const inMonth = (d, y, m) => d && d.getFullYear() === y && d.getMonth() === m

  const now = new Date()
  const curY = now.getFullYear(), curM = now.getMonth()
  const prevDate = new Date(curY, curM - 1, 1)
  const prevY = prevDate.getFullYear(), prevM = prevDate.getMonth()

  const createdThisMonth = allApplications.filter((a) => inMonth(dateOfApp(a), curY, curM))
  const createdLastMonth = allApplications.filter((a) => inMonth(dateOfApp(a), prevY, prevM))

  const pctChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  const thisMonth = createdThisMonth.length
  const thisMonthTrend = pctChange(createdThisMonth.length, createdLastMonth.length)

  const activeCount = allApplications.filter(
    (a) => !['REJECTED', 'JOINED'].includes(a.status)
  ).length
  const activeCreatedThisMonth = createdThisMonth.filter((a) => !['REJECTED', 'JOINED'].includes(a.status)).length
  const activeCreatedLastMonth = createdLastMonth.filter((a) => !['REJECTED', 'JOINED'].includes(a.status)).length
  const activeTrend = pctChange(activeCreatedThisMonth, activeCreatedLastMonth)

  const totalTrend = thisMonthTrend
  const totalApplications = stats?.total ?? allApplications.length
  const offerCount = stats?.byStatus?.OFFER_RECEIVED ?? allApplications.filter((a) => a.status === 'OFFER_RECEIVED').length
  const conversionRate = totalApplications > 0
    ? ((offerCount / totalApplications) * 100).toFixed(1)
    : null
  const interviewsScheduled = allApplications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length
  const interviewsCleared   = allApplications.filter((a) => a.status === 'INTERVIEW_CLEARED').length
  const totalInterviews     = interviewsScheduled + interviewsCleared
  const interviewSuccessRate = totalInterviews > 0
    ? ((interviewsCleared / totalInterviews) * 100).toFixed(1)
    : null

  const monthlyTrend = (() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const y = d.getFullYear(), m = d.getMonth()
      const count = allApplications.filter((a) => {
        if (!a.applicationDate) return false
        const ad = new Date(a.applicationDate)
        return ad.getFullYear() === y && ad.getMonth() === m
      }).length
      return {
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        count,
        isCurrent: y === now.getFullYear() && m === now.getMonth(),
      }
    })
  })()

  const topCompanies = (() => {
    const map = {}
    allApplications.forEach((a) => {
      if (!a.companyId) return
      if (!map[a.companyId]) map[a.companyId] = { name: a.companyName, website: companyById[a.companyId]?.website, count: 0, statuses: [] }
      map[a.companyId].count++
      map[a.companyId].statuses.push(a.status)
    })
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  })()

  const sourceAnalysis = (() => {
    const map = {}
    allApplications.forEach((a) => {
      const key = a.source || 'OTHER'
      if (!map[key]) map[key] = { total: 0, offers: 0, interviews: 0 }
      map[key].total++
      if (a.status === 'OFFER_RECEIVED') map[key].offers++
      if (a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEW_CLEARED') map[key].interviews++
    })
    return Object.entries(map)
      .map(([key, { total, offers, interviews }]) => ({
        key,
        label: SOURCE_LABELS[key] || key,
        total,
        offers,
        interviews,
        offerRate: total > 0 ? (offers / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  })()
  const bestSource = sourceAnalysis.filter((s) => s.total >= 2).sort((a, b) => b.offerRate - a.offerRate)[0] ?? null

  const grouped = displayApplications.reduce((acc, a) => {
    const letter = a.companyName?.[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(a)
    return acc
  }, {})
  const sortedLetters = Object.keys(grouped).sort()

  const handleStatusChanged = (updated) => {
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a))
    setAllApplications(prev => prev.map(a => a.id === updated.id ? updated : a))
    setViewTarget(prev => prev?.id === updated.id ? updated : prev)
    fetchStats()
  }

  const cardProps = { onView: openView, onEdit: openEdit, onDelete: setDeleteTarget, onFollowUp: openFollowUp, onCompany: setCompanyDetailId, onStatusChanged: handleStatusChanged }
  const drawerOpen = !!viewTarget || modalOpen

  return (
    <Layout
      drawerOpen={drawerOpen}
      headerAction={<HeaderAddButton label="Add Application" onClick={openAdd} drawerOpen={drawerOpen} />}
    >
      <div className={`overflow-x-hidden transition-[margin] duration-300 ease-out ${drawerOpen ? 'lg:mr-[26rem]' : ''}`}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      {!loading && (
        <div className={`grid gap-3 mb-6 ${drawerOpen ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
          <AnalyticsTile icon={<WorkOutlineRounded sx={{ fontSize: 18 }} />} tint="#8184F5"
            value={totalApplications} label="Total Applications" trend={totalTrend} />
          <AnalyticsTile icon={<SendRounded sx={{ fontSize: 18 }} />} tint="#8184F5"
            value={thisMonth} label="Applied This Month" trend={thisMonthTrend} />
          <AnalyticsTile icon={<BoltRounded sx={{ fontSize: 18 }} />} tint="#F59E0B"
            value={activeCount} label="Active Applications" trend={activeTrend} />
          <AnalyticsTile icon={<TrackChangesRounded sx={{ fontSize: 18 }} />} tint="#22C55E"
            value={conversionRate !== null ? `${conversionRate}%` : '—'} label="Offer Rate"
            subtext={conversionRate !== null ? `${offerCount} of ${totalApplications}` : null} valueClassName="text-app-success" />
          <AnalyticsTile icon={<PsychologyRounded sx={{ fontSize: 18 }} />} tint="#EC4899"
            value={interviewSuccessRate !== null ? `${interviewSuccessRate}%` : '—'} label="Interview Rate"
            subtext={totalInterviews > 0 ? `${interviewsCleared} of ${totalInterviews}` : null} valueClassName="text-app-accent-soft" />
        </div>
      )}

      {!loading && allApplications.length > 0 && (
        <div className="mb-8 space-y-6">
          <div className={`grid grid-cols-1 gap-6 ${drawerOpen ? 'xl:grid-cols-3' : 'lg:grid-cols-3'}`}>
            <AnalyticsCard className={drawerOpen ? 'xl:col-span-2' : 'lg:col-span-2'}>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Monthly Trend</p>
                <p className="text-xs text-white/30">Last 12 months</p>
              </div>
              <div className="mt-5">
                <MonthlyTrendChart data={monthlyTrend} />
              </div>
            </AnalyticsCard>

            <MostAppliedCard
              companies={topCompanies}
              onViewAll={() => {
                setFiltersOpen(true)
                searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            />
          </div>

          {sourceAnalysis.length > 0 && (
            <ApplicationSourcesCard
              sources={sourceAnalysis}
              bestSource={bestSource}
              onViewAll={() => {
                setFiltersOpen(true)
                searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[14rem]">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, role, source..."
              className="w-full h-11 pl-11 pr-16 border border-white/[0.06] rounded-xl text-sm text-app-text bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition placeholder:text-app-text-muted/80"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none flex">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
            </span>
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
            <FilterSelect value={companyFilter} onChange={setCompanyFilter} allLabel="All Companies" className="flex-1 min-w-[8rem]"
              options={companies.map((c) => ({ value: String(c.id), label: c.name }))} />
            <FilterSelect value={roleFilter} onChange={setRoleFilter} allLabel="All Roles" className="flex-1 min-w-[8rem]"
              options={roleOptions.map((r) => ({ value: r, label: r }))} />
            <FilterSelect value={sourceFilter} onChange={setSourceFilter} allLabel="All Sources" className="flex-1 min-w-[8rem]"
              options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))} />
            <FilterSelect value={filterStatus} onChange={setFilterStatus} allLabel="All Statuses" className="flex-1 min-w-[8rem]"
              options={Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))} />

            <FilterSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} hideAll className="flex-1 min-w-[8rem]" />

            <button onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="h-11 px-4 border border-white/[0.06] rounded-xl text-sm font-medium text-app-text-soft hover:bg-white/[0.05] hover:border-white/[0.12] transition bg-white/[0.03] whitespace-nowrap shrink-0">
              {order === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        )}
      </div>

      {!loading && stats && stats.total > 0 && (
        <StatusSummaryBar
          items={allApplications}
          counts={stats.byStatus}
          total={stats.total}
          statusConfig={STATUS_CONFIG}
          activeFilter={filterStatus}
          onFilter={setFilterStatus}
        />
      )}

      {(() => {
        const DATE_PRESETS = [
          { value: 'week',    label: 'This Week' },
          { value: 'month',   label: 'This Month' },
          { value: '3months', label: 'Last 3 Months' },
          { value: 'year',    label: 'This Year' },
          { value: 'custom',  label: 'Custom Range' },
        ]
        const togglePreset = (v) => {
          setDatePreset((p) => (p === v ? '' : v))
          if (v !== 'custom') { setDateFrom(''); setDateTo('') }
        }
        return (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-white/35 uppercase tracking-wide mr-1">Applied:</span>
              {DATE_PRESETS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => togglePreset(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    datePreset === value
                      ? 'bg-app-accent text-white border-app-accent shadow-card'
                      : 'bg-white/[0.03] text-white/50 border-white/[0.08] hover:border-white/[0.16] hover:text-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
              {datePreset && (
                <button
                  onClick={() => { setDatePreset(''); setDateFrom(''); setDateTo('') }}
                  className="ml-1 text-xs text-white/35 hover:text-white/70 transition"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-white/[0.08] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.14] transition"
                />
                <span className="text-xs text-white/35">to</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-white/[0.08] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.14] transition"
                />
              </div>
            )}

            {datePreset && datePreset !== 'custom' && (
              <p className="mt-1.5 text-xs text-white/35">
                {effectiveDateRange.from} → {effectiveDateRange.to}
              </p>
            )}
          </div>
        )
      })()}

      {/* Content */}
      {loading ? (
        <PageSpinner />
      ) : applications.length === 0 ? (
        <EmptyState
          icon="📋"
          title={filterStatus ? `No ${STATUS_CONFIG[filterStatus]?.label ?? filterStatus} applications` : 'No applications yet'}
          description={filterStatus ? 'Try a different status filter above.' : 'Start recording your job applications.'}
          action={!filterStatus && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Add your first application
            </button>
          )}
        />
      ) : displayApplications.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          description="Try adjusting your search or filters."
          action={
            <button onClick={clearAllFilters}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Clear All
            </button>
          }
        />
      ) : viewMode === 'list' ? (
        <div>
          <p className="text-xs text-white/35 font-medium mb-3">
            {displayApplications.length} {displayApplications.length === 1 ? 'application' : 'applications'}
            {(q || datePreset) && applications.length !== displayApplications.length && (
              <span className="ml-1 text-white/35">of {applications.length}</span>
            )}
          </p>
          <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card overflow-x-auto">
            <ApplicationTableHeader />
            {displayApplications.map((a) => (
              <ApplicationTableRow key={a.id} app={a} company={companyById[a.companyId]} {...cardProps} />
            ))}
          </div>
          <Pagination page={applications.page} totalPages={applications.totalPages}
            totalElements={applications.totalElements} size={applications.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      ) : (
        <div>
          <p className="text-xs text-white/35 font-medium mb-4">
            {displayApplications.length} {displayApplications.length === 1 ? 'application' : 'applications'}
            {(q || datePreset) && applications.length !== displayApplications.length && (
              <span className="ml-1 text-white/35">of {applications.length}</span>
            )}
          </p>
          <div className={`grid gap-3 ${drawerOpen ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {displayApplications.map((a) => (
              <ApplicationDirectoryCard key={a.id} app={a} company={companyById[a.companyId]} {...cardProps} />
            ))}
          </div>
          <Pagination page={applications.page} totalPages={applications.totalPages}
            totalElements={applications.totalElements} size={applications.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      )}
      </div>

      <DetailModal open={!!viewTarget} app={viewTarget} company={viewTarget ? companyById[viewTarget.companyId] : null}
        onClose={() => setViewTarget(null)} onEdit={openEdit} onDelete={setDeleteTarget} onStatusChanged={handleStatusChanged} onCompany={setCompanyDetailId} />
      <AddEditModal open={modalOpen} app={editTarget} companies={companies}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} app={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <FollowUpModal open={!!followUpTarget} app={followUpTarget}
        onClose={() => setFollowUpTarget(null)} onChanged={fetchApplications} />
      <CompanyDetailModal open={companyDetailId !== null} companyId={companyDetailId}
        onClose={() => setCompanyDetailId(null)} />
    </Layout>
  )
}
