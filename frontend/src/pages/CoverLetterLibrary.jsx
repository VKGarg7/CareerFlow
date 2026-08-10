import React, { useCallback, useEffect, useState } from 'react'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import { Search, ArticleOutlined, VisibilityOutlined, DownloadOutlined, EditOutlined, DeleteOutlineRounded } from '@mui/icons-material'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import { ConfirmDeleteModal } from '../components/ModalShell'
import { getCoverLetters, addCoverLetter, updateCoverLetter, deleteCoverLetter, downloadCoverLetterDocument, viewCoverLetterDocument } from '../api/coverLetter'
import EmptyState from '../components/EmptyState'
import InlineStatusChanger from '../components/InlineStatusChanger'
import { EntityDirectoryCard, CardMenu } from '../components/EntityCard'
import FilterSelect from '../components/FilterSelect'
import { fmtFileSize, isAllowedDocExt, openDocInNewTab, downloadDoc } from '../utils/documents'
import { fmtDate } from '../utils/followup'
import useSearchShortcut from '../hooks/useSearchShortcut'
import useAddQueryParam from '../hooks/useAddQueryParam'
import useTransientMessage from '../hooks/useTransientMessage'
import usePagedList from '../hooks/usePagedList'
import { DrawerShell } from '../components/DrawerShell'
import { FieldLabel, FormFooterButtons } from '../components/formKit'
import { CloseGlyphIcon } from '../components/CloseGlyphIcon'
import HeaderAddButton from '../components/HeaderAddButton'
import useCrudModals from '../hooks/useCrudModals'
import useFilterState from '../hooks/useFilterState'

const STATUS_CONFIG = {
  ACTIVE:   { label: 'Active',   badge: 'bg-app-success/10 text-app-success', hex: '#22C55E' },
  INACTIVE: { label: 'Inactive', badge: 'bg-white/[0.06] text-white/50',      hex: '#6B7280' },
}

const SORT_OPTIONS = [
  { value: 'createdAt',          label: 'Date Added' },
  { value: 'title',              label: 'Title' },
  { value: 'targetRoleCategory', label: 'Target Role' },
  { value: 'status',             label: 'Status' },
  { value: 'updatedAt',          label: 'Last Updated' },
]

const EMPTY_FORM = { title: '', targetRoleCategory: '', notes: '', status: 'ACTIVE' }

const triggerDocView = (doc) => openDocInNewTab((d) => viewCoverLetterDocument(d.documentId), doc)
const triggerDocDownload = (doc) => downloadDoc((d) => downloadCoverLetterDocument(d.documentId), doc)

function CoverLetterStatusChanger({ coverLetter, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={coverLetter}
      statusConfig={STATUS_CONFIG}
      defaultStatus="ACTIVE"
      updateFn={(id, payload) => updateCoverLetter(id, payload)}
      onStatusChanged={onStatusChanged}
    />
  )
}

function CoverLetterCard({ coverLetter, onEdit, onDelete, onStatusChanged }) {
  const cfg = STATUS_CONFIG[coverLetter.status] || STATUS_CONFIG.ACTIVE
  return (
    <EntityDirectoryCard
      borderTopColor={cfg.hex}
      avatarSlot={
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner-highlight bg-app-accent2/70">
          <ArticleOutlined sx={{ fontSize: 20 }} />
        </div>
      }
      titleSlot={
        <>
          <p className="text-[15px] font-bold text-white/90 truncate leading-snug">{coverLetter.title}</p>
          <p className="text-[13px] text-white/40 truncate mt-0.5">
            {coverLetter.originalName} · {fmtFileSize(coverLetter.fileSize)}
          </p>
          <div className="mt-2">
            <CoverLetterStatusChanger coverLetter={coverLetter} onStatusChanged={onStatusChanged} />
          </div>
        </>
      }
      chips={
        coverLetter.targetRoleCategory && (
          <span className="text-[13px] text-white/50 truncate">{coverLetter.targetRoleCategory}</span>
        )
      }
      note={coverLetter.notes}
      actionsSlot={
        <CardMenu items={[
          { key: 'view', label: 'View', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => triggerDocView(coverLetter) },
          { key: 'download', label: 'Download', icon: <DownloadOutlined sx={{ fontSize: 16 }} />, onClick: () => triggerDocDownload(coverLetter) },
          { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(coverLetter) },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(coverLetter), tone: 'danger' },
        ]} />
      }
      footNote={
        <>
          <span className="text-white/40">Added</span>
          <span className="font-medium text-white/80">{fmtDate(coverLetter.createdAt)}</span>
        </>
      }
    />
  )
}

function AddEditModal({ open, coverLetter, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the modal's form state when it opens for a given cover letter is the intended effect
      setForm(coverLetter ? {
        title: coverLetter.title || '',
        targetRoleCategory: coverLetter.targetRoleCategory || '', notes: coverLetter.notes || '',
        status: coverLetter.status || 'ACTIVE',
      } : EMPTY_FORM)
      setFile(null)
      setFileError('')
      setError('')
    }
  }, [open, coverLetter])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleFilePick = (e) => {
    const picked = e.target.files[0]
    e.target.value = ''
    if (!picked) return
    if (!isAllowedDocExt(picked)) { setFileError('Only PDF, DOC, and DOCX files are supported.'); return }
    setFileError('')
    setFile(picked)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!coverLetter && !file) { setError('Please upload a cover letter file.'); return }
    setSaving(true)
    setError('')
    try {
      if (coverLetter) {
        await updateCoverLetter(coverLetter.id, form)
      } else {
        await addCoverLetter({ file, ...form })
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
        <h2 className="text-base font-bold text-white">{coverLetter ? 'Edit Cover Letter' : 'Add Cover Letter'}</h2>
        <button onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition">
          <CloseGlyphIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
      <div className="px-5 py-4 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>
              Title <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.title} onChange={set('title')} placeholder="e.g. Backend SDE Cover Letter" className={inputCls} />
          </div>
          <div>
            <FieldLabel>Target Role Category</FieldLabel>
            <input type="text" value={form.targetRoleCategory} onChange={set('targetRoleCategory')} placeholder="e.g. Backend" className={inputCls} />
          </div>
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
          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="What this version emphasizes, when to use it..." className={`${inputCls} resize-none`} />
          </div>

          <div>
            <FieldLabel>
              Cover Letter File <span className="text-white/30 normal-case font-normal">(PDF, DOC, DOCX)</span>
            </FieldLabel>
            {coverLetter && (
              <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <ArticleOutlined sx={{ fontSize: 16 }} className="text-app-accent-soft shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{coverLetter.originalName}</p>
                  <p className="text-xs text-white/35">{fmtFileSize(coverLetter.fileSize)}</p>
                </div>
                <span className="text-xs text-white/35">To replace the file, add a new cover letter entry.</span>
              </div>
            )}
            {!coverLetter && (
              <>
                {file ? (
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-app-accent/25 bg-app-accent/10">
                    <ArticleOutlined sx={{ fontSize: 16 }} className="text-app-accent-soft shrink-0" />
                    <span className="text-sm text-app-accent-soft truncate flex-1">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)}
                      className="text-app-accent-soft hover:text-app-danger font-bold text-base leading-none px-1 transition">×</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-white/[0.10] hover:border-app-accent/40 cursor-pointer transition w-full">
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFilePick} className="sr-only" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/35">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    <span className="text-sm text-white/35">Upload cover letter</span>
                  </label>
                )}
              </>
            )}
            {fileError && <p className="mt-1 text-xs text-app-danger">{fileError}</p>}
          </div>

          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={coverLetter ? 'Save Changes' : 'Add Cover Letter'} />
        </form>
      </div>
    </DrawerShell>
  )
}

function DeleteModal({ open, coverLetter, onClose, onDeleted }) {
  const [force, setForce] = useState(false)
  const [warning, setWarning] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the modal's confirm state when it opens is the intended effect
    if (open) { setForce(false); setWarning('') }
  }, [open])

  const handleDelete = async () => {
    try {
      await deleteCoverLetter(coverLetter.id, force)
      onDeleted()
    } catch (err) {
      if (err.response?.status === 409) { setWarning(err.response.data.message); throw err }
      throw err
    }
  }

  return (
    <ConfirmDeleteModal
      open={open && !!coverLetter}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Cover Letter"
      message={
        <>
          Remove <span className="font-semibold text-white/80">{coverLetter?.title}</span> from your library?
          <span className="block text-xs text-app-danger mt-1">This action cannot be undone.</span>
        </>
      }
      warning={warning && (
        <div className="p-3 rounded-xl bg-app-warning/10 border border-app-warning/20 text-app-warning text-sm">
          <p>{warning}</p>
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-app-danger" />
            <span className="text-sm font-medium text-white/75">Yes, delete anyway</span>
          </label>
        </div>
      )}
    />
  )
}

export default function CoverLetterLibrary() {
  const [success, setSuccess] = useTransientMessage()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const searchInputRef = React.useRef(null)

  const {
    items: coverLetters, loading, error, setError,
    setPage, setSize, refetch: fetchCoverLetters,
  } = usePagedList(
    useCallback(
      (page, size) => getCoverLetters({ search: search.trim() || undefined, status: statusFilter || undefined, sortBy, order, page, size }),
      [search, statusFilter, sortBy, order]
    ),
    'Failed to load cover letters.'
  )

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Cover Letter', setSuccess, [fetchCoverLetters])

  useSearchShortcut(searchInputRef)

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (c) => { setEditTarget(c); setModalOpen(true) }
  useAddQueryParam(openAdd)

  const handleStatusChanged = () => fetchCoverLetters()

  const { activeFilterCount, isFiltered, clearAllFilters } = useFilterState(search, setSearch, [
    [statusFilter, setStatusFilter],
  ])

  const cardProps = { onEdit: openEdit, onDelete: setDeleteTarget, onStatusChanged: handleStatusChanged }
  const drawerOpen = modalOpen

  return (
    <Layout
      drawerOpen={drawerOpen}
      headerAction={<HeaderAddButton label="Add Cover Letter" onClick={openAdd} drawerOpen={drawerOpen} />}
    >
      <div className={`overflow-x-hidden transition-[margin] duration-300 ease-out ${drawerOpen ? 'lg:mr-[26rem]' : ''}`}>
        <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
        <PageAlert severity="error" message={error} onClose={() => setError('')} />

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[14rem]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none flex">
                <Search fontSize="small" />
              </span>
              <input ref={searchInputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cover letters by title..."
                className="w-full h-11 pl-11 pr-16 border border-white/[0.06] rounded-xl text-sm text-app-text bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition placeholder:text-app-text-muted/80" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] text-[11px] font-medium text-app-text-muted pointer-events-none">
                ⌘K
              </span>
            </div>

            <FilterSelect value={statusFilter} onChange={setStatusFilter} allLabel="All Statuses" className="shrink-0 w-40"
              options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))} />

            <FilterSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} hideAll className="shrink-0 w-44" />

            <button onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="h-11 px-4 border border-white/[0.06] rounded-xl text-sm font-medium text-app-text-soft hover:bg-white/[0.05] hover:border-white/[0.12] transition bg-white/[0.03] whitespace-nowrap">
              {order === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>

            {isFiltered && (
              <button onClick={clearAllFilters}
                className="text-sm font-medium text-app-accent-soft hover:text-white transition whitespace-nowrap">
                Clear All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <PageSpinner />
        ) : coverLetters.length === 0 ? (
          <EmptyState
            icon="📝"
            title={activeFilterCount > 0 ? 'No cover letters match your filters' : 'No cover letters yet'}
            description={activeFilterCount > 0 ? 'Try adjusting your search or filter.' : 'Upload your first cover letter version to build your library.'}
            action={activeFilterCount === 0 && (
              <button onClick={openAdd}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
                Add your first cover letter
              </button>
            )}
          />
        ) : (
          <div>
            <h2 className="text-[18px] font-semibold text-app-text mb-4">
              {coverLetters.length} {coverLetters.length === 1 ? 'Cover Letter' : 'Cover Letters'}
            </h2>
            <div className={`grid gap-6 ${drawerOpen ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {coverLetters.map((c) => (
                <CoverLetterCard key={c.id} coverLetter={c} {...cardProps} />
              ))}
            </div>
            <Pagination page={coverLetters.page} totalPages={coverLetters.totalPages}
              totalElements={coverLetters.totalElements} size={coverLetters.size} onPageChange={setPage} onSizeChange={setSize} />
          </div>
        )}
      </div>

      <AddEditModal open={modalOpen} coverLetter={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} coverLetter={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
    </Layout>
  )
}
