import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  Search, KeyboardArrowDown, Language, CalendarTodayOutlined,
  VisibilityOutlined, EditOutlined, DeleteOutlineRounded, Place, BusinessCenterOutlined,
  FilterListRounded, SwapVertRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import Pagination from '../components/Pagination'
import StatTilesBar from '../components/StatTilesBar'
import { ConfirmDeleteModal } from '../components/ModalShell'
import { getCompanies, addCompany, updateCompany, deleteCompany, getCompanyStats, getApplicationCountsByCompany, getCompanyCreationTrend, getCompanyActivitySummary } from '../api/company'
import { getRecruiters } from '../api/recruiter'
import EmptyState from '../components/EmptyState'
import SharedStatusBadge from '../components/StatusBadge'
import CompanyDetailModal from '../components/CompanyDetailModal'
import InlineStatusChanger from '../components/InlineStatusChanger'
import { EntityDirectoryCard, CardMenu } from '../components/EntityCard'
import CompanyLogo from '../components/CompanyLogo'
import { initials, fmtDate, domainOf } from '../utils/followup'
import FilterSelect from '../components/FilterSelect'
import useSearchShortcut from '../hooks/useSearchShortcut'
import useAddQueryParam from '../hooks/useAddQueryParam'
import useTransientMessage from '../hooks/useTransientMessage'
import usePagedList from '../hooks/usePagedList'
import useFetchOnce from '../hooks/useFetchOnce'
import { DrawerShell } from '../components/DrawerShell'
import { FormFooterButtons } from '../components/formKit'
import { CloseGlyphIcon } from '../components/CloseGlyphIcon'
import HeaderAddButton from '../components/HeaderAddButton'
import useCrudModals from '../hooks/useCrudModals'
import useFilterState from '../hooks/useFilterState'

const STATUS_CONFIG = {
  TARGETING:    { label: 'Targeting',    badge: 'bg-app-accent/10 text-app-accent-soft',  border: 'border-l-app-accent',   dot: 'bg-app-accent',   hex: '#5B5FEF' },
  APPLIED:      { label: 'Applied',      badge: 'bg-app-warning/10 text-app-warning',     border: 'border-l-app-warning',  dot: 'bg-app-warning',  hex: '#F59E0B' },
  INTERVIEWING: { label: 'Interviewing', badge: 'bg-app-accent2/10 text-app-accent-soft', border: 'border-l-app-accent2',  dot: 'bg-app-accent2',  hex: '#8B5CF6' },
  OFFER:        { label: 'Offer',        badge: 'bg-app-success/10 text-app-success',     border: 'border-l-app-success',  dot: 'bg-app-success',  hex: '#22C55E' },
  REJECTED:     { label: 'Rejected',     badge: 'bg-app-danger/10 text-app-danger',        border: 'border-l-app-danger',   dot: 'bg-app-danger',   hex: '#F43F5E' },
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

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.TARGETING
  return <SharedStatusBadge badge={cfg.badge} dot={cfg.dot} label={cfg.label} />
}

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

function CompanyListRow({ company, onEdit, onDelete, onView, onStatusChanged, stats, order, onToggleOrder, compact }) {
  const { applicationCount, recruiter, lastActivity, nextFollowUp } = stats
  const cfg = STATUS_CONFIG[company.status] || STATUS_CONFIG.TARGETING

  return (
    <div onClick={() => onView(company.id)}
      className={`group relative flex items-center gap-2 sm:gap-4 min-w-0 rounded-card border border-white/[0.06] border-l-4 ${cfg.border} bg-app-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-card-hover cursor-pointer px-3 sm:px-5 py-3.5`}>

      <CompanyLogo name={company.name} website={company.website} dotColor={dotHex(company.status)} className="w-10 h-10 shrink-0" />

      <div className={`min-w-0 shrink-0 ${compact ? 'w-24' : 'w-28 sm:w-44'}`}>
        <p className="text-sm font-bold text-white/90 truncate">{company.name}</p>
        {company.industry && <p className="text-xs text-white/40 truncate mt-0.5">{company.industry}</p>}
      </div>

      <div className={`shrink-0 min-w-0 w-[6.5rem] ${compact ? 'ml-auto' : 'sm:w-28'}`} onClick={(e) => e.stopPropagation()}>
        <CompanyStatusChanger company={company} onStatusChanged={onStatusChanged} />
      </div>

      <div className={`min-w-[6rem] max-w-[10rem] flex-1 shrink basis-0 ${compact ? 'hidden' : 'hidden md:block'}`}>
        {company.location && (
          <p className="flex items-center gap-1 text-xs text-white/50 truncate">
            <Place sx={{ fontSize: 13 }} className="text-app-danger shrink-0" />
            <span className="truncate">{company.location}</span>
          </p>
        )}
        {company.website && (
          <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
            target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-app-accent-soft hover:underline truncate mt-0.5">
            <Language sx={{ fontSize: 13 }} className="shrink-0" />
            <span className="truncate">{domainOf(company.website)}</span>
          </a>
        )}
      </div>

      <div className={`w-16 shrink-0 ${compact ? 'hidden' : 'hidden lg:block'}`}>
        <p className="text-[11px] text-white/35">Applications</p>
        <p className="text-sm font-semibold text-white/80 mt-0.5">{applicationCount}</p>
      </div>

      <div className={`min-w-[5rem] max-w-[8rem] flex-1 shrink basis-0 ${compact ? 'hidden' : 'hidden lg:block'}`}>
        <p className="text-[11px] text-white/35">Recruiter</p>
        <p className="text-sm font-semibold text-white/80 truncate mt-0.5">{recruiter ? recruiter.name : '—'}</p>
      </div>

      <div className={`w-24 shrink-0 ${compact ? 'hidden' : 'hidden xl:block'}`}>
        <p className="text-[11px] text-white/35">Last Activity</p>
        <p className="flex items-center gap-1.5 text-sm font-medium text-white/70 mt-0.5">
          {lastActivity && <span className="w-1.5 h-1.5 rounded-full bg-app-success shrink-0" />}
          {lastActivity ? fmtDate(lastActivity) : '—'}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {onToggleOrder && (
          <button onClick={onToggleOrder} title={order === 'desc' ? 'Sort ascending' : 'Sort descending'}
            className={`items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.08] transition ${compact ? 'hidden' : 'hidden sm:flex'}`}>
            <SwapVertRounded sx={{ fontSize: 18 }} />
          </button>
        )}
        <button onClick={() => onView(company.id)} title={nextFollowUp ? `Next follow-up: ${fmtDate(nextFollowUp)}` : 'No pending follow-up'}
          className={`items-center justify-center w-9 h-9 rounded-lg border transition ${compact ? 'hidden' : 'hidden sm:flex'} ${
            nextFollowUp
              ? 'border-app-accent/25 bg-app-accent/10 text-app-accent-soft hover:bg-app-accent/20'
              : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.08]'
          }`}>
          <CalendarTodayOutlined sx={{ fontSize: 15 }} />
        </button>
        <CardMenu items={[
          { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(company.id) },
          { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(company) },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(company), tone: 'danger' },
        ]} />
      </div>
    </div>
  )
}

function CompanyDirectoryCard({ company, onEdit, onDelete, onView, onStatusChanged, stats }) {
  const { applicationCount, recruiter, lastActivity, nextFollowUp } = stats
  return (
    <EntityDirectoryCard
      onClick={() => onView(company.id)}
      borderTopColor={dotHex(company.status)}
      avatarSlot={<CompanyLogo name={company.name} website={company.website} dotColor={dotHex(company.status)} className="w-12 h-12" />}
      titleSlot={
        <>
          <p className="text-[15px] font-bold text-white/90 truncate leading-snug">{company.name}</p>
          {company.industry && (
            <p className="flex items-center gap-1.5 text-[13px] text-white/40 truncate mt-0.5">
              <BusinessCenterOutlined sx={{ fontSize: 13 }} className="text-white/25 shrink-0" />
              {company.industry}
            </p>
          )}
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <CompanyStatusChanger company={company} onStatusChanged={onStatusChanged} />
          </div>
        </>
      }
      chips={
        <>
          {company.location && (
            <span className="inline-flex items-center gap-1 text-[13px] text-white/50 min-w-0 shrink truncate">
              <Place sx={{ fontSize: 15 }} className="text-app-danger shrink-0" />
              <span className="truncate">{company.location}</span>
            </span>
          )}
          {company.website && (
            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank" rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[13px] text-app-accent-soft hover:underline min-w-0 shrink truncate">
              <Language sx={{ fontSize: 15 }} className="text-app-accent-soft shrink-0" />
              <span className="truncate">{domainOf(company.website)}</span>
            </a>
          )}
        </>
      }
      note={company.notes}
      actionsSlot={
        <CardMenu items={[
          { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(company.id) },
          { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(company) },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(company), tone: 'danger' },
        ]} />
      }
      footer={
        <>
          <div className="grid grid-cols-2">
            <div className="px-3 py-3 text-center">
              <p className="font-display text-base font-bold text-white leading-none">{applicationCount}</p>
              <p className="text-[11px] text-white/35 mt-1.5">Applications</p>
            </div>
            <div className="px-3 py-3 text-center border-l border-white/[0.06]">
              <p className="text-xs font-semibold text-white/70">{lastActivity ? fmtDate(lastActivity) : '—'}</p>
              <p className="text-[11px] text-white/35 mt-1.5">Last Activity</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-white/[0.06]">
            {recruiter ? (
              <>
                <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/70 shrink-0">
                  {initials(recruiter.name)}
                </div>
                <p className="text-xs font-semibold text-white/80 truncate min-w-0">{recruiter.name}</p>
                <span className="text-[11px] text-white/35 shrink-0 ml-auto">Recruiter</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-white/[0.04] shrink-0" />
                <p className="text-xs text-white/25 truncate min-w-0">No recruiter</p>
              </>
            )}
          </div>
        </>
      }
      footNote={
        <>
          <span className="text-white/40">Next Follow-up</span>
          {nextFollowUp ? (
            <span className="flex items-center gap-1.5 font-medium text-white/80">
              {fmtDate(nextFollowUp)}
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/[0.06] text-white/40">
                <CalendarTodayOutlined sx={{ fontSize: 12 }} />
              </span>
            </span>
          ) : (
            <span className="text-white/25">None scheduled</span>
          )}
        </>
      }
    />
  )
}

const dotHex = (status) => (STATUS_CONFIG[status] || STATUS_CONFIG.TARGETING).hex

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

  const inputCls = 'w-full h-11 px-4 border border-white/[0.06] rounded-xl text-sm text-app-text bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition placeholder:text-app-text-muted/80'

  if (!open) return null

  return (
    <DrawerShell>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
        <h2 className="text-base font-bold text-white">{company ? 'Edit Company' : 'Add Company'}</h2>
        <button onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition">
          <CloseGlyphIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
      <div className="px-5 py-4 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1.5">
              Company Name <span className="text-app-danger">*</span>
            </label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Google" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1.5">Status</label>
            <FilterSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val }))}
              options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))}
              hideAll
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1.5">Website</label>
              <input type="url" value={form.website} onChange={set('website')} placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1.5">Industry</label>
              <input type="text" value={form.industry} onChange={set('industry')} placeholder="e.g. Fintech" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1.5">Location</label>
            <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Bangalore, India" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              placeholder="Brief company description..." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-app-text-muted uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Personal notes, referral contacts..." className={`${inputCls} resize-none`} />
          </div>
          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={company ? 'Save Changes' : 'Add Company'} />
        </form>
      </div>
    </DrawerShell>
  )
}

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
          Remove <span className="font-semibold text-white/80">{company?.name}</span> from your list?
          <span className="block text-xs text-app-danger mt-1">This action cannot be undone.</span>
        </>
      }
      warning={warning && (
        <div className="p-3 rounded-xl bg-app-warning/10 border border-app-warning/20 text-app-warning text-sm">
          <p>{warning}</p>
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-app-danger" />
            <span className="text-sm font-medium text-white/75">Yes, delete along with all applications</span>
          </label>
        </div>
      )}
    />
  )
}

export default function Companies() {
  const [success, setSuccess] = useTransientMessage()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [recruiterFilter, setRecruiterFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchInputRef = React.useRef(null)

  const {
    items: companies, setItems: setCompanies, loading, error, setError,
    page, setPage, size, setSize, refetch: fetchCompanies,
  } = usePagedList(
    useCallback(
      (page, size) => getCompanies({ search: search.trim() || undefined, status: statusFilter || undefined, sortBy, order, page, size }),
      [search, statusFilter, sortBy, order]
    ),
    'Failed to load companies.'
  )

  const { data: allCompanies, setData: setAllCompanies, refetch: fetchAllCompanies } = useFetchOnce(
    useCallback(() => getCompanies({ sortBy, order, size: 1000 }), [sortBy, order]), []
  )
  const { data: stats, refetch: fetchStats } = useFetchOnce(getCompanyStats)
  const { data: applicationCountsByCompany, refetch: fetchApplicationCounts } = useFetchOnce(getApplicationCountsByCompany, {})
  const { data: trendByStatus, refetch: fetchCreationTrend } = useFetchOnce(
    useCallback(() => getCompanyCreationTrend(7), []), {}
  )
  const { data: activitySummaryByCompany, refetch: fetchActivitySummary } = useFetchOnce(getCompanyActivitySummary, {})

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Company', setSuccess, [fetchCompanies, fetchAllCompanies, fetchStats, fetchApplicationCounts, fetchCreationTrend, fetchActivitySummary])
  const [viewId, setViewId] = useState(null)

  const [recruiters, setRecruiters] = useState([])

  useSearchShortcut(searchInputRef)

  useEffect(() => {
    getRecruiters({ size: 1000 }).then((r) => setRecruiters(r.data || [])).catch(() => {})
  }, [])

  const statsByCompany = activitySummaryByCompany

  const recruiterByCompanyName = React.useMemo(() => {
    const map = {}
    for (const r of recruiters) {
      const key = r.company?.trim().toLowerCase()
      if (key && !map[key]) map[key] = r
    }
    return map
  }, [recruiters])

  const industryOptions = useMemo(
    () => [...new Set(companies.map((c) => c.industry).filter(Boolean))].sort(),
    [companies]
  )
  const locationOptions = useMemo(
    () => [...new Set(companies.map((c) => c.location).filter(Boolean))].sort(),
    [companies]
  )
  const recruiterOptions = useMemo(
    () => [...new Map(recruiters.filter((r) => r.company?.trim()).map((r) => [r.id, r])).values()]
      .sort((a, b) => a.name.localeCompare(b.name)),
    [recruiters]
  )

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (industryFilter && c.industry !== industryFilter) return false
      if (locationFilter && c.location !== locationFilter) return false
      if (recruiterFilter) {
        const recruiter = recruiterByCompanyName[c.name?.trim().toLowerCase()]
        if (String(recruiter?.id ?? '') !== recruiterFilter) return false
      }
      return true
    })
  }, [companies, industryFilter, locationFilter, recruiterFilter, recruiterByCompanyName])

  const getCardStats = (company) => {
    const s = statsByCompany[company.id]
    const recruiter = recruiterByCompanyName[company.name?.trim().toLowerCase()]
    return {
      applicationCount: applicationCountsByCompany[company.id] || 0,
      lastActivity: s?.lastActivity || null,
      nextFollowUp: s?.nextFollowUp || null,
      recruiter: recruiter || null,
    }
  }

  const openAdd  = () => { setViewId(null); setEditTarget(null); setModalOpen(true) }
  const openEdit = (c) => { setViewId(null); setEditTarget(c); setModalOpen(true) }

  useAddQueryParam(openAdd)

  const handleStatusChanged = (updated) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c))
    setAllCompanies(prev => prev.map(c => c.id === updated.id ? updated : c))
    fetchStats()
  }

  const { activeFilterCount, isFiltered, clearAllFilters } = useFilterState(search, setSearch, [
    [statusFilter, setStatusFilter],
    [industryFilter, setIndustryFilter],
    [locationFilter, setLocationFilter],
    [recruiterFilter, setRecruiterFilter],
  ])

  const grouped = filteredCompanies.reduce((acc, c) => {
    const letter = c.name[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(c)
    return acc
  }, {})
  const sortedLetters = Object.keys(grouped).sort()

  const openView = (id) => { setModalOpen(false); setViewId(id) }
  const cardProps = { onEdit: openEdit, onDelete: setDeleteTarget, onView: openView, onStatusChanged: handleStatusChanged }
  const drawerOpen = modalOpen || viewId !== null

  return (
    <Layout
      drawerOpen={drawerOpen}
      headerAction={<HeaderAddButton label="Add Company" onClick={openAdd} drawerOpen={drawerOpen} />}
    >
      <div className={`overflow-x-hidden transition-[margin] duration-300 ease-out ${drawerOpen ? 'lg:mr-[26rem]' : ''}`}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      {!loading && stats && stats.total > 0 && (
        <div className="mb-8">
          <StatTilesBar
            items={allCompanies}
            counts={stats.byStatus}
            total={stats.total}
            statusConfig={STATUS_CONFIG}
            activeFilter={statusFilter}
            onFilter={setStatusFilter}
            totalLabel="Total Companies"
            totalIcon={<BusinessCenterOutlined sx={{ fontSize: 18 }} />}
            trendByStatus={trendByStatus}
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
              placeholder="Search companies, notes, recruiters..."
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
            <FilterSelect value={industryFilter} onChange={setIndustryFilter} allLabel="All Industries" className="flex-1 min-w-[7rem]"
              options={industryOptions.map((i) => ({ value: i, label: i }))} />
            <FilterSelect value={locationFilter} onChange={setLocationFilter} allLabel="All Locations" className="flex-1 min-w-[7rem]"
              options={locationOptions.map((l) => ({ value: l, label: l }))} />
            <FilterSelect value={recruiterFilter} onChange={setRecruiterFilter} allLabel="All Recruiters" className="flex-1 min-w-[7rem]"
              options={recruiterOptions.map((r) => ({ value: String(r.id), label: r.name }))} />

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
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          icon="🏢"
          title={isFiltered ? 'No companies match your filters' : 'No companies yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Start building your target list.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Add your first company
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div>
          <h2 className="text-[18px] font-semibold text-app-text mb-4">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? 'Company' : 'Companies'}
          </h2>
          <div className="space-y-3">
            {filteredCompanies.map((c) => (
              <CompanyListRow key={c.id} company={c} {...cardProps} stats={getCardStats(c)}
                order={order} onToggleOrder={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))} compact={drawerOpen} />
            ))}
          </div>
          <Pagination page={companies.page} totalPages={companies.totalPages}
            totalElements={companies.totalElements} size={companies.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      ) : (
        <div>
          <h2 className="text-[18px] font-semibold text-app-text mb-4">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? 'Company' : 'Companies'}
          </h2>
          <div className={`grid gap-6 ${drawerOpen ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {filteredCompanies.map((c) => (
              <CompanyDirectoryCard key={c.id} company={c} {...cardProps} stats={getCardStats(c)} />
            ))}
          </div>
          <Pagination page={companies.page} totalPages={companies.totalPages}
            totalElements={companies.totalElements} size={companies.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      )}
      </div>

      <AddEditModal open={modalOpen} company={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} company={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <CompanyDetailModal open={viewId !== null} companyId={viewId}
        onClose={() => setViewId(null)} onStatusChanged={handleStatusChanged}
        onEdit={(c) => { setViewId(null); openEdit(c) }}
        onDelete={(c) => { setViewId(null); setDeleteTarget(c) }} />
    </Layout>
  )
}
