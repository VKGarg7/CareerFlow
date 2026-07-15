import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  Add, Search, KeyboardArrowDown, LinkedIn, Email, Phone,
  Close, Send, Check, Clear, EditNote, FilterListRounded,
  VisibilityOutlined, EditOutlined, DeleteOutlineRounded,
  FormatBoldRounded, FormatItalicRounded, FormatListBulletedRounded,
  AttachFileRounded, InsertEmoticonOutlined, CalendarTodayOutlined,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ConfirmDeleteModal } from '../components/ModalShell'
import { getRecruiters, getRecruiter, addRecruiter, updateRecruiter, deleteRecruiter, getRecruiterStats } from '../api/recruiter'
import EmptyState from '../components/EmptyState'
import InlineStatusChanger from '../components/InlineStatusChanger'
import { EntityDirectoryCard, CardMenu } from '../components/EntityCard'
import { initials, fmt, fmtDate } from '../utils/followup'
import useSearchShortcut from '../hooks/useSearchShortcut'
import useAddQueryParam from '../hooks/useAddQueryParam'
import useTransientMessage from '../hooks/useTransientMessage'
import usePagedList from '../hooks/usePagedList'
import useFetchOnce from '../hooks/useFetchOnce'
import { DrawerShell, DrawerHeader, CloseIconButton } from '../components/DrawerShell'
import { fieldInputCls, FieldErrorText, FieldLabel, FormFooterButtons } from '../components/formKit'
import EntityListRow from '../components/EntityListRow'

const STATUS_CONFIG = {
  NEW:               { label: 'New',               badge: 'bg-white/[0.06] text-white/60',           border: 'border-l-white/10',    dot: 'bg-white/40',     hex: '#8B8FA3' },
  REACHED_OUT:       { label: 'Reached Out',       badge: 'bg-app-accent/10 text-app-accent-soft',   border: 'border-l-app-accent',  dot: 'bg-app-accent',   hex: '#5B5FEF' },
  RESPONDED:         { label: 'Responded',         badge: 'bg-app-warning/10 text-app-warning',      border: 'border-l-app-warning', dot: 'bg-app-warning',  hex: '#F59E0B' },
  MEETING_SCHEDULED: { label: 'Meeting Scheduled', badge: 'bg-app-accent2/10 text-app-accent-soft',  border: 'border-l-app-accent2', dot: 'bg-app-accent2',  hex: '#8B5CF6' },
  ACTIVELY_HELPING:  { label: 'Actively Helping',  badge: 'bg-app-success/10 text-app-success',      border: 'border-l-app-success', dot: 'bg-app-success',  hex: '#22C55E' },
  CLOSED:            { label: 'Closed',            badge: 'bg-app-danger/10 text-app-danger',        border: 'border-l-app-danger',  dot: 'bg-app-danger',   hex: '#F43F5E' },
}

const SOURCE_LABELS = {
  LINKEDIN: 'LinkedIn', EMAIL: 'Email', REFERRAL: 'Referral',
  JOB_FAIR: 'Job Fair', COLD_OUTREACH: 'Cold Outreach',
  COMPANY_WEBSITE: 'Company Website', OTHER: 'Other',
}

const SORT_OPTIONS = [
  { value: 'createdAt',       label: 'Date Added' },
  { value: 'name',            label: 'Name' },
  { value: 'company',         label: 'Company' },
  { value: 'status',          label: 'Status' },
  { value: 'lastContactedAt', label: 'Last Contacted' },
  { value: 'updatedAt',       label: 'Last Updated' },
]

const EMPTY_FORM = {
  name: '', email: '', phone: '', linkedIn: '',
  company: '', jobTitle: '', status: 'NEW', source: '',
  lastContactedAt: '', notes: '',
}

const NOTE_MAX = 1000

function RecruiterStatusChanger({ recruiter, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={recruiter}
      statusConfig={STATUS_CONFIG}
      defaultStatus="NEW"
      updateFn={(id, payload) => updateRecruiter(id, payload)}
      onStatusChanged={onStatusChanged}
    />
  )
}

function RecruiterListRow({ recruiter, drawerOpen, onView, onEdit, onDelete, onNotes, onStatusChanged }) {
  const cfg = STATUS_CONFIG[recruiter.status] || STATUS_CONFIG.NEW
  const noteCount = recruiter.noteCount ?? 0

  return (
    <EntityListRow
      onClick={() => onView(recruiter)}
      accentBorder={cfg.border}
      avatarColor={cfg.dot}
      name={recruiter.name}
      subtitle={recruiter.jobTitle}
      statusSlot={<RecruiterStatusChanger recruiter={recruiter} onStatusChanged={onStatusChanged} />}
      email={recruiter.email}
      linkedIn={recruiter.linkedIn}
      menuItems={[
        { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(recruiter) },
        { key: 'notes', label: `Notes${noteCount > 0 ? ` (${noteCount})` : ''}`, icon: <EditNote sx={{ fontSize: 16 }} />, onClick: () => onNotes(recruiter) },
        { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(recruiter) },
        { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(recruiter), tone: 'danger' },
      ]}
    >
      <div className={`w-36 min-w-0 shrink-0 hidden ${drawerOpen ? 'xl:block' : 'md:block'}`}>
        <p className="text-sm text-white/70 truncate">{recruiter.company || '—'}</p>
      </div>

      <div className={`w-28 shrink-0 hidden ${drawerOpen ? 'xl:block' : 'lg:block'}`}>
        <p className="text-[11px] text-white/35">Source</p>
        <p className="text-sm font-medium text-white/70 truncate mt-0.5">
          {recruiter.source ? (SOURCE_LABELS[recruiter.source] || recruiter.source) : '—'}
        </p>
      </div>

      <div className={`w-28 shrink-0 hidden ${drawerOpen ? '2xl:block' : 'xl:block'}`}>
        <p className="text-[11px] text-white/35">Last Contact</p>
        <p className="text-sm font-medium text-white/70 mt-0.5">
          {recruiter.lastContactedAt ? fmtDate(recruiter.lastContactedAt) : '—'}
        </p>
      </div>

      <div className={`w-20 shrink-0 hidden ${drawerOpen ? '2xl:block' : 'lg:block'}`}>
        <p className="text-[11px] text-white/35">Notes</p>
        <p className="flex items-center gap-1 text-sm font-semibold text-white/80 mt-0.5">
          {noteCount > 0 && <EditNote sx={{ fontSize: 13 }} className="text-app-accent-soft" />}
          {noteCount}
        </p>
      </div>

    </EntityListRow>
  )
}

function DirectoryCard({ recruiter, onView, onEdit, onDelete, onNotes }) {
  const cfg = STATUS_CONFIG[recruiter.status] || STATUS_CONFIG.NEW
  const noteCount = recruiter.noteCount ?? 0
  const sourceLabel = recruiter.source ? (SOURCE_LABELS[recruiter.source] || recruiter.source) : null

  return (
    <EntityDirectoryCard
      onClick={() => onView(recruiter)}
      statusBarColor={cfg.dot}
      avatarColor={cfg.dot}
      avatarText={initials(recruiter.name)}
      titleSlot={
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white/90 truncate leading-tight">{recruiter.name}</p>
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          {(recruiter.jobTitle || recruiter.company) && (
            <p className="text-xs text-white/50 truncate mt-0.5">
              {[recruiter.jobTitle, recruiter.company].filter(Boolean).join(' @ ')}
            </p>
          )}
        </>
      }
      actionsSlot={
        <CardMenu items={[
          { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(recruiter) },
        ]} />
      }
      chips={
        <div className="flex flex-col gap-2 w-full">
          {recruiter.email && (
            <a href={`mailto:${recruiter.email}`}
              className="flex items-center gap-2 text-[13px] text-app-accent-soft hover:underline min-w-0">
              <Email sx={{ fontSize: 15 }} className="shrink-0" />
              <span className="truncate">{recruiter.email}</span>
            </a>
          )}
          {recruiter.phone && (
            <a href={`tel:${recruiter.phone}`}
              className="flex items-center gap-2 text-[13px] text-white/70 hover:text-white min-w-0">
              <Phone sx={{ fontSize: 15 }} className="shrink-0 text-white/40" />
              <span className="truncate">{recruiter.phone}</span>
            </a>
          )}
          {recruiter.linkedIn && (
            <a href={recruiter.linkedIn} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[13px] text-app-accent-soft hover:underline min-w-0">
              <LinkedIn sx={{ fontSize: 15 }} className="shrink-0" />
              <span className="truncate">View Profile</span>
              {sourceLabel && <span className="text-white/30 shrink-0">via {sourceLabel}</span>}
            </a>
          )}
          {recruiter.lastContactedAt && (
            <p className="flex items-center gap-2 text-[13px] text-white/40">
              <CalendarTodayOutlined sx={{ fontSize: 13 }} className="shrink-0" />
              Last contact: {fmtDate(recruiter.lastContactedAt)}
            </p>
          )}
        </div>
      }
      actions={[
        { key: 'notes', label: `Notes${noteCount > 0 ? ` (${noteCount})` : ''}`, icon: <EditNote sx={{ fontSize: 14 }} />, onClick: () => onNotes(recruiter), tone: 'info' },
        { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 14 }} />, onClick: () => onEdit(recruiter) },
        { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 14 }} />, onClick: () => onDelete(recruiter), tone: 'danger' },
      ]}
    />
  )
}

function ComposerToolbar({ textareaRef, value, onChange }) {
  const wrapSelection = (before, after = before) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const selected = value.slice(s, e) || 'text'
    const next = value.slice(0, s) + before + selected + after + value.slice(e)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + before.length, s + before.length + selected.length)
    })
  }

  const insertBullet = () => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: s } = el
    const lineStart = value.lastIndexOf('\n', s - 1) + 1
    const next = value.slice(0, lineStart) + '- ' + value.slice(lineStart)
    onChange(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + 2, s + 2) })
  }

  const btnCls = 'flex items-center justify-center w-7 h-7 rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition'

  return (
    <div className="flex items-center gap-0.5">
      <button type="button" title="Bold" onClick={() => wrapSelection('**')} className={btnCls}>
        <FormatBoldRounded sx={{ fontSize: 16 }} />
      </button>
      <button type="button" title="Italic" onClick={() => wrapSelection('_')} className={btnCls}>
        <FormatItalicRounded sx={{ fontSize: 16 }} />
      </button>
      <button type="button" title="Bullet list" onClick={insertBullet} className={btnCls}>
        <FormatListBulletedRounded sx={{ fontSize: 16 }} />
      </button>
      <button type="button" title="Attach file (coming soon)" disabled className={`${btnCls} opacity-40 cursor-not-allowed`}>
        <AttachFileRounded sx={{ fontSize: 16 }} />
      </button>
      <button type="button" title="Emoji (coming soon)" disabled className={`${btnCls} opacity-40 cursor-not-allowed`}>
        <InsertEmoticonOutlined sx={{ fontSize: 16 }} />
      </button>
    </div>
  )
}

function DetailDrawer({ open, recruiterId, focusNotes, onClose, onEdit, onDelete, onStatusChanged, onNotesChanged }) {
  const [recruiter, setRecruiter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [editing, setEditing] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const textareaRef = useRef(null)
  const notesSectionRef = useRef(null)

  useEffect(() => {
    if (!open || !recruiterId) return
    setLoading(true)
    setError('')
    setRecruiter(null)
    setDraft('')
    setAddError('')
    setEditing({})
    setDeleteConfirm(null)
    getRecruiter(recruiterId)
      .then((res) => setRecruiter(res.data[0] ?? null))
      .catch(() => setError('Failed to load recruiter details.'))
      .finally(() => setLoading(false))
  }, [open, recruiterId])

  useEffect(() => {
    if (!open || !focusNotes || loading || !recruiter) return
    notesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    textareaRef.current?.focus()
  }, [open, focusNotes, loading, recruiter])

  if (!open) return null

  const cfg = recruiter ? (STATUS_CONFIG[recruiter.status] || STATUS_CONFIG.NEW) : STATUS_CONFIG.NEW
  const notes = recruiter?.interactionNotes ?? []

  const Row = ({ label, value }) =>
    value ? (
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm text-white/85 break-words">{value}</p>
      </div>
    ) : null

  const patchAndSync = async (payload) => {
    const res = await updateRecruiter(recruiter.id, payload)
    const updated = res.data
    setRecruiter(updated)
    onNotesChanged?.(recruiter.id, updated.noteCount)
    return updated
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) { setAddError('Note cannot be empty.'); return }
    if (text.length > NOTE_MAX) { setAddError(`Max ${NOTE_MAX} characters.`); return }
    setAdding(true)
    setAddError('')
    try {
      await patchAndSync({ addNote: text })
      setDraft('')
      textareaRef.current?.focus()
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add note.')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (note) => {
    setEditing((p) => ({ ...p, [note.id]: { text: note.content, saving: false, error: '' } }))
    setDeleteConfirm(null)
  }
  const cancelEdit = (id) =>
    setEditing((p) => { const n = { ...p }; delete n[id]; return n })

  const saveEdit = async (noteId) => {
    const text = editing[noteId]?.text?.trim() ?? ''
    if (!text) { setEditing((p) => ({ ...p, [noteId]: { ...p[noteId], error: 'Cannot be empty.' } })); return }
    if (text.length > NOTE_MAX) { setEditing((p) => ({ ...p, [noteId]: { ...p[noteId], error: `Max ${NOTE_MAX} chars.` } })); return }
    setEditing((p) => ({ ...p, [noteId]: { ...p[noteId], saving: true, error: '' } }))
    try {
      await patchAndSync({ editNote: { id: noteId, content: text } })
      cancelEdit(noteId)
    } catch (err) {
      setEditing((p) => ({ ...p, [noteId]: { ...p[noteId], saving: false, error: err.response?.data?.message || 'Failed.' } }))
    }
  }

  const handleDelete = async (noteId) => {
    setDeleting(true)
    try {
      await patchAndSync({ deleteNoteId: noteId })
      setDeleteConfirm(null)
    } catch {
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DrawerShell>

      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
        {loading ? (
          <div className="flex justify-center py-4"><CircularProgress size={24} /></div>
        ) : error ? (
          <p className="text-sm text-app-danger">{error}</p>
        ) : recruiter ? (
          <div className="flex items-start gap-3">
            <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner-highlight ${cfg.dot}`}>
              {initials(recruiter.name)}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-app-success border-2 border-app-surface" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white leading-tight truncate">{recruiter.name}</h2>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
              {(recruiter.jobTitle || recruiter.company) && (
                <p className="text-sm text-white/50 mt-0.5 truncate">
                  {[recruiter.jobTitle, recruiter.company].filter(Boolean).join(' @ ')}
                </p>
              )}
            </div>
            <CloseIconButton onClose={onClose} className="shrink-0" />
          </div>
        ) : null}
      </div>

      {recruiter && !loading && (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">

          <RecruiterStatusChanger recruiter={recruiter} onStatusChanged={(updated) => { setRecruiter(updated); onStatusChanged?.(updated) }} />

          <div>
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Contact</p>
            <div className="space-y-2">
              <Row label="Email"
                value={recruiter.email && (
                  <a href={`mailto:${recruiter.email}`}
                    className="text-app-accent-soft hover:underline flex items-center gap-1.5 truncate">
                    <Email sx={{ fontSize: 14 }} className="shrink-0" /><span className="truncate">{recruiter.email}</span>
                  </a>
                )}
              />
              <Row label="Phone"
                value={recruiter.phone && (
                  <a href={`tel:${recruiter.phone}`}
                    className="text-white/80 hover:text-app-accent-soft flex items-center gap-1.5">
                    <Phone sx={{ fontSize: 14 }} className="shrink-0" />{recruiter.phone}
                  </a>
                )}
              />
              <Row label="LinkedIn"
                value={recruiter.linkedIn && (
                  <a href={recruiter.linkedIn} target="_blank" rel="noreferrer"
                    className="text-app-accent-soft hover:underline flex items-center gap-1.5">
                    <LinkedIn sx={{ fontSize: 14 }} className="shrink-0" />View Profile
                  </a>
                )}
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Details</p>
            <div className="space-y-2">
              <Row label="Source" value={recruiter.source ? (SOURCE_LABELS[recruiter.source] || recruiter.source) : null} />
              <Row label="Added on" value={recruiter.createdAt ? fmtDate(recruiter.createdAt) : null} />
              <Row label="Last contacted" value={recruiter.lastContactedAt ? fmtDate(recruiter.lastContactedAt) : null} />
              <Row label="Last updated" value={recruiter.updatedAt ? fmt(recruiter.updatedAt) : null} />
            </div>
          </div>

          <div ref={notesSectionRef}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Notes</p>
              {notes.length > 0 && (
                <span className="text-[11px] font-semibold text-app-accent-soft">
                  View all notes ({notes.length})
                </span>
              )}
            </div>

            {addError && <p className="text-xs text-app-danger mb-2">{addError}</p>}

            {notes.length > 0 && (
              <div className="relative mb-3">
                {notes.length > 1 && (
                  <div className="absolute left-[4px] top-[6px] bottom-[6px] w-px bg-white/[0.08]" />
                )}
                <div className="space-y-3">
                  {[...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((note) => {
                    const isEditing = !!editing[note.id]
                    const isConfirmDelete = deleteConfirm === note.id
                    return (
                      <div key={note.id} className="group relative flex gap-3 pl-0.5">
                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="bg-app-accent/10 border border-app-accent/20 rounded-xl p-3 space-y-2">
                              <textarea
                                rows={3}
                                value={editing[note.id].text}
                                onChange={(e) => setEditing((p) => ({ ...p, [note.id]: { ...p[note.id], text: e.target.value } }))}
                                className="w-full px-3 py-2 border border-app-accent/30 rounded-lg text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-app-accent/40 bg-white/[0.04] resize-none"
                                autoFocus
                              />
                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${editing[note.id].text.length > NOTE_MAX ? 'text-app-danger' : 'text-white/40'}`}>
                                  {editing[note.id].text.length}/{NOTE_MAX}
                                  {editing[note.id].error && <span className="ml-2 text-app-danger">{editing[note.id].error}</span>}
                                </span>
                                <div className="flex gap-2">
                                  <button onClick={() => saveEdit(note.id)} disabled={editing[note.id].saving}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-app-accent rounded-lg hover:brightness-110 transition disabled:opacity-60">
                                    {editing[note.id].saving ? <CircularProgress size={10} color="inherit" /> : <Check sx={{ fontSize: 13 }} />}
                                    Save
                                  </button>
                                  <button onClick={() => cancelEdit(note.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white/60 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition">
                                    <Clear sx={{ fontSize: 13 }} />Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : isConfirmDelete ? (
                            <div className="bg-app-danger/10 border border-app-danger/20 rounded-xl p-3">
                              <p className="text-xs font-semibold text-app-danger mb-1">Delete this note?</p>
                              <p className="text-xs text-white/50 line-clamp-2 mb-2.5 italic">"{note.content}"</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleDelete(note.id)} disabled={deleting}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-app-danger rounded-lg hover:brightness-110 transition disabled:opacity-60">
                                  {deleting && <CircularProgress size={10} color="inherit" />}Yes, Delete
                                </button>
                                <button onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white/60 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="bg-white/[0.03] rounded-xl px-3.5 py-2.5">
                                <p className="text-sm text-white/80 whitespace-pre-wrap break-words leading-relaxed">{note.content}</p>
                              </div>
                              <div className="flex items-center justify-between mt-1 px-0.5">
                                <span className="text-[11px] text-white/35">
                                  {fmt(note.createdAt)}{note.edited && <span className="italic"> (edited)</span>}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEdit(note)}
                                    className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-white/45 hover:text-app-accent-soft hover:bg-app-accent/10 rounded-md transition">
                                    <EditOutlined sx={{ fontSize: 11 }} />Edit
                                  </button>
                                  <button onClick={() => { setDeleteConfirm(note.id); cancelEdit(note.id) }}
                                    className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-white/45 hover:text-app-danger hover:bg-app-danger/10 rounded-md transition">
                                    <DeleteOutlineRounded sx={{ fontSize: 11 }} />Delete
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-app-accent/40 focus-within:ring-2 focus-within:ring-app-accent/20 transition">
              <textarea
                ref={textareaRef}
                rows={2}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setAddError('') }}
                placeholder="Add a note or follow-up..."
                className="w-full px-3.5 pt-3 pb-1 bg-transparent text-sm text-white/85 focus:outline-none resize-none placeholder:text-white/25"
              />
              <div className="flex items-center justify-end px-3 pb-1">
                <span className={`text-[11px] ${draft.length > NOTE_MAX ? 'text-app-danger' : 'text-white/30'}`}>
                  {draft.length}/{NOTE_MAX}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 pb-2 pt-1 border-t border-white/[0.06]">
                <ComposerToolbar textareaRef={textareaRef} value={draft} onChange={setDraft} />
                <button type="button" onClick={handleAdd} disabled={adding || !draft.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-app-accent rounded-lg hover:brightness-110 transition disabled:opacity-50 shrink-0 shadow-glow shadow-app-accent/30">
                  {adding ? <CircularProgress size={12} color="inherit" /> : <Send sx={{ fontSize: 14 }} />}
                  Add Note
                </button>
              </div>
            </div>
            <p className="text-[11px] text-white/30 mt-1.5">Press Shift + Enter for new line</p>
          </div>
        </div>
      )}

      {recruiter && !loading && (
        <div className="flex gap-3 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02] shrink-0">
          <button
            onClick={() => { onClose(); onEdit(recruiter) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white/70 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.10] hover:text-white transition">
            <EditOutlined sx={{ fontSize: 16 }} />
            Edit
          </button>
          <button
            onClick={() => { onClose(); onDelete(recruiter) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-app-danger bg-white/[0.03] border border-app-danger/20 rounded-xl hover:bg-app-danger hover:text-white hover:border-app-danger transition ml-auto">
            <DeleteOutlineRounded sx={{ fontSize: 16 }} />
            Delete
          </button>
        </div>
      )}
    </DrawerShell>
  )
}

function AddEditDrawer({ open, recruiter, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(recruiter ? {
        name: recruiter.name || '', email: recruiter.email || '',
        phone: recruiter.phone || '', linkedIn: recruiter.linkedIn || '',
        company: recruiter.company || '', jobTitle: recruiter.jobTitle || '',
        status: recruiter.status || 'NEW', source: recruiter.source || '',
        lastContactedAt: recruiter.lastContactedAt || '', notes: recruiter.notes || '',
      } : EMPTY_FORM)
      setError('')
      setFieldErrors({})
    }
  }, [open, recruiter])

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.'
    if (form.phone && !/^[+]?[0-9()\-\s.]{7,20}$/.test(form.phone)) errs.phone = 'Enter a valid phone (7–20 digits).'
    if (form.linkedIn && !/^https?:\/\/.+/.test(form.linkedIn)) errs.linkedIn = 'Must start with http:// or https://'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(), email: form.email.trim() || null,
      phone: form.phone.trim() || null, linkedIn: form.linkedIn.trim() || null,
      company: form.company.trim() || null, jobTitle: form.jobTitle.trim() || null,
      status: form.status || 'NEW', source: form.source || null,
      lastContactedAt: form.lastContactedAt || null, notes: form.notes.trim() || null,
    }
    try {
      recruiter ? await updateRecruiter(recruiter.id, payload) : await addRecruiter(payload)
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
  const FieldError = ({ field }) => <FieldErrorText error={fieldErrors[field]} />

  return (
    <DrawerShell>
      <DrawerHeader onClose={onClose} title={recruiter ? 'Edit Recruiter Contact' : 'Add Recruiter Contact'} subtitle={recruiter ? 'Update contact information' : 'Add a new recruiter to your network'} />
      <div className="px-6 py-5 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>
              Full Name <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.name} onChange={set('name')}
              placeholder="e.g. Priya Sharma" className={inputCls('name')} />
            <FieldError field="name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Job Title</FieldLabel>
              <input type="text" value={form.jobTitle} onChange={set('jobTitle')}
                placeholder="Technical Recruiter" className={inputCls('jobTitle')} />
              <FieldError field="jobTitle" />
            </div>
            <div>
              <FieldLabel>Company</FieldLabel>
              <input type="text" value={form.company} onChange={set('company')}
                placeholder="e.g. Google" className={inputCls('company')} />
              <FieldError field="company" />
            </div>
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="priya@google.com" className={inputCls('email')} />
            <FieldError field="email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Phone</FieldLabel>
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+91 98765 43210" className={inputCls('phone')} />
              <FieldError field="phone" />
            </div>
            <div>
              <FieldLabel>LinkedIn URL</FieldLabel>
              <input type="url" value={form.linkedIn} onChange={set('linkedIn')}
                placeholder="https://linkedin.com/in/..." className={inputCls('linkedIn')} />
              <FieldError field="linkedIn" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={form.status} onChange={set('status')} className={inputCls('status')}>
                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                  <option key={val} value={val} className="bg-app-surface text-white">{label}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Source</FieldLabel>
              <select value={form.source} onChange={set('source')} className={inputCls('source')}>
                <option value="" className="bg-app-surface text-white">— Select —</option>
                {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                  <option key={val} value={val} className="bg-app-surface text-white">{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <FieldLabel>Last Contacted</FieldLabel>
            <input type="date" value={form.lastContactedAt} onChange={set('lastContactedAt')}
              max={new Date().toISOString().split('T')[0]} className={inputCls('lastContactedAt')} />
          </div>
          <div>
            <FieldLabel>General Notes</FieldLabel>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Background info, referrals, context..."
              className={`${inputCls('notes')} resize-none`} />
            <p className="text-xs text-white/35 mt-1 text-right">{form.notes.length}/2000</p>
          </div>
          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={recruiter ? 'Save Changes' : 'Add Recruiter'} saveFirst heightCls="py-2.5" />
        </form>
      </div>
    </DrawerShell>
  )
}

function DeleteModal({ open, recruiter, onClose, onDeleted }) {
  return (
    <ConfirmDeleteModal
      open={open && !!recruiter}
      onClose={onClose}
      onConfirm={async () => { await deleteRecruiter(recruiter.id); onDeleted() }}
      title="Delete Recruiter Contact"
      message={
        <>
          Remove <span className="font-semibold text-white/80">{recruiter?.name}</span> and all interaction notes?
          <span className="block text-xs text-app-danger mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

export default function Recruiters() {
  const [success, setSuccess] = useTransientMessage()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'directory'
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchInputRef = useRef(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [viewFocusNotes, setViewFocusNotes] = useState(false)

  const {
    items: recruiters, setItems: setRecruiters, loading, error, setError,
    setPage, refetch: fetchRecruiters,
  } = usePagedList(
    useCallback(
      (page) => getRecruiters({ search: search.trim() || undefined, status: statusFilter || undefined, sortBy, order, page }),
      [search, statusFilter, sortBy, order]
    ),
    'Failed to load recruiter contacts.'
  )

  const { data: allRecruiters, setData: setAllRecruiters, refetch: fetchAllRecruiters } = useFetchOnce(
    useCallback(() => getRecruiters({ sortBy, order, size: 1000 }), [sortBy, order]), []
  )
  const { data: stats, refetch: fetchStats } = useFetchOnce(getRecruiterStats)

  useSearchShortcut(searchInputRef)

  const sourceOptions = useMemo(
    () => [...new Set(allRecruiters.map((r) => r.source).filter(Boolean))].sort(),
    [allRecruiters]
  )

  const filteredRecruiters = useMemo(
    () => sourceFilter ? recruiters.filter((r) => r.source === sourceFilter) : recruiters,
    [recruiters, sourceFilter]
  )

  const openAdd   = () => { setViewTarget(null); setEditTarget(null); setModalOpen(true) }
  const openEdit  = (r) => { setViewTarget(null); setEditTarget(r); setModalOpen(true) }
  const openView  = (r) => { setModalOpen(false); setViewFocusNotes(false); setViewTarget(r.id) }
  const openNotes = (r) => { setModalOpen(false); setViewFocusNotes(true); setViewTarget(r.id) }

  useAddQueryParam(openAdd)

  const handleSaved = () => {
    setModalOpen(false)
    setSuccess(editTarget ? 'Recruiter contact updated.' : 'Recruiter contact added.')
    fetchRecruiters()
    fetchAllRecruiters()
    fetchStats()
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setSuccess('Recruiter contact removed.')
    fetchRecruiters()
    fetchAllRecruiters()
    fetchStats()
  }

  const handleNotesChanged = (recruiterId, newCount) => {
    setRecruiters((prev) => prev.map((r) => r.id === recruiterId ? { ...r, noteCount: newCount } : r))
    setAllRecruiters((prev) => prev.map((r) => r.id === recruiterId ? { ...r, noteCount: newCount } : r))
  }

  const handleStatusChanged = (updated) => {
    setRecruiters(prev => prev.map(r => r.id === updated.id ? updated : r))
    setAllRecruiters(prev => prev.map(r => r.id === updated.id ? updated : r))
    fetchStats()
  }

  const activeFilterCount = [statusFilter, sourceFilter].filter(Boolean).length
  const isFiltered = search.trim() || activeFilterCount > 0

  const clearAllFilters = () => {
    setSearch('')
    setStatusFilter('')
    setSourceFilter('')
  }

  const drawerOpen = modalOpen || viewTarget !== null

  const cardProps = {
    onView: openView,
    onEdit: openEdit,
    onDelete: setDeleteTarget,
    onNotes: openNotes,
    onStatusChanged: handleStatusChanged,
    drawerOpen,
  }

  return (
    <Layout
      headerAction={
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 hover:-translate-y-0.5 transition-all shadow-glow shadow-app-accent/40">
          <Add fontSize="small" />Add Recruiter
        </button>
      }
    >
      <div className={`overflow-x-hidden transition-[margin] duration-300 ease-out ${drawerOpen ? 'lg:mr-[26rem]' : ''}`}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      {!loading && stats && stats.total > 0 && (
        <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card px-5 py-4 mb-6 [&>div]:mb-0">
          <StatusSummaryBar
            items={allRecruiters}
            counts={stats.byStatus}
            total={stats.total}
            statusConfig={STATUS_CONFIG}
            activeFilter={statusFilter}
            onFilter={setStatusFilter}
          />
        </div>
      )}

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[14rem]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none flex">
              <Search fontSize="small" />
            </span>
            <input ref={searchInputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, or email..."
              className="w-full h-11 pl-11 pr-16 border border-white/[0.06] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition placeholder:text-white/25" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] text-[11px] font-medium text-white/30 pointer-events-none">
              ⌘K
            </span>
          </div>

          <button onClick={() => setFiltersOpen((o) => !o)}
            className={`h-11 px-4 flex items-center gap-2 border rounded-xl text-sm font-medium transition whitespace-nowrap ${
              filtersOpen || activeFilterCount > 0
                ? 'border-app-accent/40 bg-app-accent/10 text-app-accent-soft'
                : 'border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.05] hover:border-white/[0.12]'
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
            <div className="relative flex-1 min-w-[9rem]">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 appearance-none pl-4 pr-9 border border-white/[0.06] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition cursor-pointer">
                <option value="" className="bg-app-surface text-white">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                  <option key={val} value={val} className="bg-app-surface text-white">{label}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                <KeyboardArrowDown fontSize="small" />
              </span>
            </div>

            <div className="relative flex-1 min-w-[9rem]">
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full h-11 appearance-none pl-4 pr-9 border border-white/[0.06] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition cursor-pointer">
                <option value="" className="bg-app-surface text-white">All Sources</option>
                {sourceOptions.map((s) => (
                  <option key={s} value={s} className="bg-app-surface text-white">{SOURCE_LABELS[s] || s}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                <KeyboardArrowDown fontSize="small" />
              </span>
            </div>

            <div className="relative flex-1 min-w-[9rem]">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-11 appearance-none pl-4 pr-9 border border-white/[0.06] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.12] transition cursor-pointer">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-app-surface text-white">{o.label}</option>)}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                <KeyboardArrowDown fontSize="small" />
              </span>
            </div>

            <button onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="h-11 px-4 border border-white/[0.06] rounded-xl text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:border-white/[0.12] transition bg-white/[0.03] whitespace-nowrap">
              {order === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <PageSpinner />
      ) : filteredRecruiters.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={isFiltered ? 'No recruiters match your filters' : 'No recruiter contacts yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Start building your recruiter network.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Add your first recruiter
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4">
            {filteredRecruiters.length} {filteredRecruiters.length === 1 ? 'Recruiter' : 'Recruiters'}
          </h2>
          <div className="space-y-3">
            {filteredRecruiters.map((r) => (
              <RecruiterListRow key={r.id} recruiter={r} {...cardProps} />
            ))}
          </div>
          <Pagination page={recruiters.page} totalPages={recruiters.totalPages}
            totalElements={recruiters.totalElements} size={recruiters.size} onPageChange={setPage} />
        </div>
      ) : (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4">
            {filteredRecruiters.length} {filteredRecruiters.length === 1 ? 'Recruiter' : 'Recruiters'}
          </h2>
          <div className={`grid grid-cols-1 gap-3 ${drawerOpen ? 'lg:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
            {filteredRecruiters.map((r) => (
              <DirectoryCard key={r.id} recruiter={r} {...cardProps} />
            ))}
          </div>
          <Pagination page={recruiters.page} totalPages={recruiters.totalPages}
            totalElements={recruiters.totalElements} size={recruiters.size} onPageChange={setPage} />
        </div>
      )}
      </div>

      <AddEditDrawer open={modalOpen} recruiter={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} recruiter={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <DetailDrawer
        open={!!viewTarget}
        recruiterId={viewTarget}
        focusNotes={viewFocusNotes}
        onClose={() => setViewTarget(null)}
        onEdit={(r) => { setEditTarget(r); setModalOpen(true) }}
        onDelete={(r) => setDeleteTarget(r)}
        onStatusChanged={handleStatusChanged}
        onNotesChanged={handleNotesChanged}
      />
    </Layout>
  )
}
