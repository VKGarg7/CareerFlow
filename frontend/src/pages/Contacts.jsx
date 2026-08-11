import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { CircularProgress } from '@mui/material'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  Search, KeyboardArrowDown, LinkedIn, Email, Phone,
  Send, Check, Clear, EditNote, FilterListRounded,
  VisibilityOutlined, EditOutlined, DeleteOutlineRounded,
  FormatBoldRounded, FormatItalicRounded, FormatListBulletedRounded,
  AttachFileRounded, InsertEmoticonOutlined, CalendarTodayOutlined,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import ViewToggle from '../components/ViewToggle'
import StatusSummaryBar from '../components/StatusSummaryBar'
import { ConfirmDeleteModal } from '../components/ModalShell'
import {
  getContacts, getContact, addContact, updateContact, deleteContact,
  getContactStats, getSources, getRelationshipTypes,
} from '../api/contact'
import OutreachLogSection from '../components/OutreachLogSection'
import ContactFollowUpRecommendations from '../components/ContactFollowUpRecommendations'
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
import FilterSelect from '../components/FilterSelect'
import HeaderAddButton from '../components/HeaderAddButton'
import useCrudModals from '../hooks/useCrudModals'
import useFilterState from '../hooks/useFilterState'

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

const RELATIONSHIP_TYPE_LABELS = {
  RECRUITER: 'Recruiter', HIRING_MANAGER: 'Hiring Manager', EMPLOYEE: 'Employee',
  ALUMNI: 'Alumni', FRIEND: 'Friend', REFERRAL_SOURCE: 'Referral Source',
  INTERVIEWER: 'Interviewer', OTHER: 'Other',
}

const RELATIONSHIP_STRENGTH_LABELS = { WEAK: 'Weak', MODERATE: 'Moderate', STRONG: 'Strong' }

const SORT_OPTIONS = [
  { value: 'createdAt',           label: 'Date Added' },
  { value: 'name',                label: 'Name' },
  { value: 'companyName',         label: 'Company' },
  { value: 'status',              label: 'Status' },
  { value: 'lastInteractionDate', label: 'Last Interaction' },
  { value: 'updatedAt',           label: 'Last Updated' },
]

const EMPTY_FORM = {
  name: '', email: '', phone: '', linkedIn: '',
  companyName: '', jobTitle: '', status: 'NEW', relationshipType: '', relationshipStrength: '', source: '',
  lastInteractionDate: '', notes: '',
}

const NOTE_MAX = 1000

function ContactStatusChanger({ contact, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={contact}
      statusConfig={STATUS_CONFIG}
      defaultStatus="NEW"
      updateFn={(id, payload) => updateContact(id, payload)}
      onStatusChanged={onStatusChanged}
    />
  )
}

function ContactListRow({ contact, drawerOpen, onView, onEdit, onDelete, onNotes, onStatusChanged }) {
  const cfg = STATUS_CONFIG[contact.status] || STATUS_CONFIG.NEW
  const noteCount = contact.noteCount ?? 0

  return (
    <EntityListRow
      onClick={() => onView(contact)}
      accentBorder={cfg.border}
      avatarColor={cfg.dot}
      name={contact.name}
      subtitle={contact.jobTitle}
      statusSlot={<ContactStatusChanger contact={contact} onStatusChanged={onStatusChanged} />}
      email={contact.email}
      linkedIn={contact.linkedIn}
      menuItems={[
        { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(contact) },
        { key: 'notes', label: `Notes${noteCount > 0 ? ` (${noteCount})` : ''}`, icon: <EditNote sx={{ fontSize: 16 }} />, onClick: () => onNotes(contact) },
        { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(contact) },
        { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(contact), tone: 'danger' },
      ]}
    >
      <div className={`w-36 min-w-0 shrink-0 hidden ${drawerOpen ? 'xl:block' : 'md:block'}`}>
        <p className="text-sm text-white/70 truncate">{contact.companyName || contact.companyDisplayName || '—'}</p>
      </div>

      <div className={`w-28 shrink-0 hidden ${drawerOpen ? 'xl:block' : 'lg:block'}`}>
        <p className="text-[11px] text-white/35">Relationship</p>
        <p className="text-sm font-medium text-white/70 truncate mt-0.5">
          {contact.relationshipType ? (RELATIONSHIP_TYPE_LABELS[contact.relationshipType] || contact.relationshipType) : '—'}
        </p>
      </div>

      <div className={`w-28 shrink-0 hidden ${drawerOpen ? '2xl:block' : 'xl:block'}`}>
        <p className="text-[11px] text-white/35">Last Interaction</p>
        <p className="text-sm font-medium text-white/70 mt-0.5">
          {contact.lastInteractionDate ? fmtDate(contact.lastInteractionDate) : '—'}
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

function DirectoryCard({ contact, onView, onEdit, onDelete, onNotes }) {
  const cfg = STATUS_CONFIG[contact.status] || STATUS_CONFIG.NEW
  const noteCount = contact.noteCount ?? 0
  const sourceLabel = contact.source ? (SOURCE_LABELS[contact.source] || contact.source) : null

  return (
    <EntityDirectoryCard
      onClick={() => onView(contact)}
      statusBarColor={cfg.dot}
      avatarColor={cfg.dot}
      avatarText={initials(contact.name)}
      titleSlot={
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white/90 truncate leading-tight">{contact.name}</p>
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          {(contact.jobTitle || contact.companyName) && (
            <p className="text-xs text-white/50 truncate mt-0.5">
              {[contact.jobTitle, contact.companyName].filter(Boolean).join(' @ ')}
            </p>
          )}
        </>
      }
      actionsSlot={
        <CardMenu items={[
          { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(contact) },
        ]} />
      }
      chips={
        <div className="flex flex-col gap-2 w-full">
          {contact.email && (
            <a href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-[13px] text-app-accent-soft hover:underline min-w-0">
              <Email sx={{ fontSize: 15 }} className="shrink-0" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-[13px] text-white/70 hover:text-white min-w-0">
              <Phone sx={{ fontSize: 15 }} className="shrink-0 text-white/40" />
              <span className="truncate">{contact.phone}</span>
            </a>
          )}
          {contact.linkedIn && (
            <a href={contact.linkedIn} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-[13px] text-app-accent-soft hover:underline min-w-0">
              <LinkedIn sx={{ fontSize: 15 }} className="shrink-0" />
              <span className="truncate">View Profile</span>
              {sourceLabel && <span className="text-white/30 shrink-0">via {sourceLabel}</span>}
            </a>
          )}
          {contact.lastInteractionDate && (
            <p className="flex items-center gap-2 text-[13px] text-white/40">
              <CalendarTodayOutlined sx={{ fontSize: 13 }} className="shrink-0" />
              Last interaction: {fmtDate(contact.lastInteractionDate)}
            </p>
          )}
        </div>
      }
      actions={[
        { key: 'notes', label: `Notes${noteCount > 0 ? ` (${noteCount})` : ''}`, icon: <EditNote sx={{ fontSize: 14 }} />, onClick: () => onNotes(contact), tone: 'info' },
        { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 14 }} />, onClick: () => onEdit(contact) },
        { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 14 }} />, onClick: () => onDelete(contact), tone: 'danger' },
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

function DetailDrawer({ open, contactId, focusNotes, onClose, onEdit, onDelete, onStatusChanged, onNotesChanged }) {
  const [contact, setContact] = useState(null)
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
    if (!open || !contactId) return
    setLoading(true)
    setError('')
    setContact(null)
    setDraft('')
    setAddError('')
    setEditing({})
    setDeleteConfirm(null)
    getContact(contactId)
      .then((res) => setContact(res.data[0] ?? null))
      .catch(() => setError('Failed to load contact details.'))
      .finally(() => setLoading(false))
  }, [open, contactId])

  useEffect(() => {
    if (!open || !focusNotes || loading || !contact) return
    notesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    textareaRef.current?.focus()
  }, [open, focusNotes, loading, contact])

  if (!open) return null

  const cfg = contact ? (STATUS_CONFIG[contact.status] || STATUS_CONFIG.NEW) : STATUS_CONFIG.NEW
  const notes = contact?.interactionNotes ?? []

  const Row = ({ label, value }) =>
    value ? (
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm text-white/85 break-words">{value}</p>
      </div>
    ) : null

  const patchAndSync = async (payload) => {
    const res = await updateContact(contact.id, payload)
    const updated = res.data
    setContact(updated)
    onNotesChanged?.(contact.id, updated.noteCount)
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
        ) : contact ? (
          <div className="flex items-start gap-3">
            <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner-highlight ${cfg.dot}`}>
              {initials(contact.name)}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-app-success border-2 border-app-surface" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white leading-tight truncate">{contact.name}</h2>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
              {(contact.jobTitle || contact.companyName) && (
                <p className="text-sm text-white/50 mt-0.5 truncate">
                  {[contact.jobTitle, contact.companyName].filter(Boolean).join(' @ ')}
                </p>
              )}
            </div>
            <CloseIconButton onClose={onClose} className="shrink-0" />
          </div>
        ) : null}
      </div>

      {contact && !loading && (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">

          <ContactStatusChanger contact={contact} onStatusChanged={(updated) => { setContact(updated); onStatusChanged?.(updated) }} />

          <div>
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Contact</p>
            <div className="space-y-2">
              <Row label="Email"
                value={contact.email && (
                  <a href={`mailto:${contact.email}`}
                    className="text-app-accent-soft hover:underline flex items-center gap-1.5 truncate">
                    <Email sx={{ fontSize: 14 }} className="shrink-0" /><span className="truncate">{contact.email}</span>
                  </a>
                )}
              />
              <Row label="Phone"
                value={contact.phone && (
                  <a href={`tel:${contact.phone}`}
                    className="text-white/80 hover:text-app-accent-soft flex items-center gap-1.5">
                    <Phone sx={{ fontSize: 14 }} className="shrink-0" />{contact.phone}
                  </a>
                )}
              />
              <Row label="LinkedIn"
                value={contact.linkedIn && (
                  <a href={contact.linkedIn} target="_blank" rel="noreferrer"
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
              <Row label="Relationship" value={contact.relationshipType ? (RELATIONSHIP_TYPE_LABELS[contact.relationshipType] || contact.relationshipType) : null} />
              <Row label="Relationship Strength" value={contact.relationshipStrength ? (RELATIONSHIP_STRENGTH_LABELS[contact.relationshipStrength] || contact.relationshipStrength) : null} />
              <Row label="Source" value={contact.source ? (SOURCE_LABELS[contact.source] || contact.source) : null} />
              <Row label="Added on" value={contact.createdAt ? fmtDate(contact.createdAt) : null} />
              <Row label="Last interaction" value={contact.lastInteractionDate ? fmtDate(contact.lastInteractionDate) : null} />
              <Row label="Last updated" value={contact.updatedAt ? fmt(contact.updatedAt) : null} />
            </div>
          </div>

          <OutreachLogSection contactId={contact.id} />

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

      {contact && !loading && (
        <div className="flex gap-3 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02] shrink-0">
          <button
            onClick={() => { onClose(); onEdit(contact) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white/70 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.10] hover:text-white transition">
            <EditOutlined sx={{ fontSize: 16 }} />
            Edit
          </button>
          <button
            onClick={() => { onClose(); onDelete(contact) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-app-danger bg-white/[0.03] border border-app-danger/20 rounded-xl hover:bg-app-danger hover:text-white hover:border-app-danger transition ml-auto">
            <DeleteOutlineRounded sx={{ fontSize: 16 }} />
            Delete
          </button>
        </div>
      )}
    </DrawerShell>
  )
}

function AddEditDrawer({ open, contact, onClose, onSaved }) {
  const [form, setForm] = useState(() => contact ? {
    name: contact.name || '', email: contact.email || '',
    phone: contact.phone || '', linkedIn: contact.linkedIn || '',
    companyName: contact.companyName || '', jobTitle: contact.jobTitle || '',
    status: contact.status || 'NEW',
    relationshipType: contact.relationshipType || '', relationshipStrength: contact.relationshipStrength || '',
    source: contact.source || '',
    lastInteractionDate: contact.lastInteractionDate || '', notes: contact.notes || '',
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setVal = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

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
      companyName: form.companyName.trim() || null, jobTitle: form.jobTitle.trim() || null,
      status: form.status || 'NEW',
      relationshipType: form.relationshipType || null, relationshipStrength: form.relationshipStrength || null,
      source: form.source || null,
      lastInteractionDate: form.lastInteractionDate || null, notes: form.notes.trim() || null,
    }
    try {
      contact ? await updateContact(contact.id, payload) : await addContact(payload)
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
      <DrawerHeader onClose={onClose} title={contact ? 'Edit Contact' : 'Add Contact'} subtitle={contact ? 'Update contact information' : 'Add a new contact to your network'} />
      <div className="px-6 py-5 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>
              Full Name <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.name} onChange={set('name')}
              placeholder="e.g. Priya Sharma" className={inputCls('name')} />
            <FieldErrorText error={fieldErrors.name} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Job Title</FieldLabel>
              <input type="text" value={form.jobTitle} onChange={set('jobTitle')}
                placeholder="Technical Recruiter" className={inputCls('jobTitle')} />
              <FieldErrorText error={fieldErrors.jobTitle} />
            </div>
            <div>
              <FieldLabel>Company</FieldLabel>
              <input type="text" value={form.companyName} onChange={set('companyName')}
                placeholder="e.g. Google" className={inputCls('companyName')} />
              <FieldErrorText error={fieldErrors.companyName} />
            </div>
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="priya@google.com" className={inputCls('email')} />
            <FieldErrorText error={fieldErrors.email} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Phone</FieldLabel>
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+91 98765 43210" className={inputCls('phone')} />
              <FieldErrorText error={fieldErrors.phone} />
            </div>
            <div>
              <FieldLabel>LinkedIn URL</FieldLabel>
              <input type="url" value={form.linkedIn} onChange={set('linkedIn')}
                placeholder="https://linkedin.com/in/..." className={inputCls('linkedIn')} />
              <FieldErrorText error={fieldErrors.linkedIn} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <FieldLabel>Source</FieldLabel>
              <FilterSelect
                value={form.source}
                onChange={setVal('source')}
                allLabel="— Select —"
                options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Relationship Type</FieldLabel>
              <FilterSelect
                value={form.relationshipType}
                onChange={setVal('relationshipType')}
                allLabel="— Select —"
                options={Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                className="w-full"
              />
            </div>
            <div>
              <FieldLabel>Relationship Strength</FieldLabel>
              <FilterSelect
                value={form.relationshipStrength}
                onChange={setVal('relationshipStrength')}
                allLabel="— Select —"
                options={Object.entries(RELATIONSHIP_STRENGTH_LABELS).map(([value, label]) => ({ value, label }))}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Last Interaction Date</FieldLabel>
            <input type="date" value={form.lastInteractionDate} onChange={set('lastInteractionDate')}
              max={new Date().toISOString().split('T')[0]} className={inputCls('lastInteractionDate')} />
          </div>
          <div>
            <FieldLabel>General Notes</FieldLabel>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Background info, referrals, context..."
              className={`${inputCls('notes')} resize-none`} />
            <p className="text-xs text-white/35 mt-1 text-right">{form.notes.length}/2000</p>
          </div>
          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={contact ? 'Save Changes' : 'Add Contact'} saveFirst heightCls="py-2.5" />
        </form>
      </div>
    </DrawerShell>
  )
}

function DeleteModal({ open, contact, onClose, onDeleted }) {
  return (
    <ConfirmDeleteModal
      open={open && !!contact}
      onClose={onClose}
      onConfirm={async () => { await deleteContact(contact.id); onDeleted() }}
      title="Delete Contact"
      message={
        <>
          Remove <span className="font-semibold text-white/80">{contact?.name}</span> and all interaction notes?
          <span className="block text-xs text-app-danger mt-1">This action cannot be undone.</span>
        </>
      }
    />
  )
}

export default function Contacts() {
  const [success, setSuccess] = useTransientMessage()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'directory'
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchInputRef = useRef(null)

  const [viewTarget, setViewTarget] = useState(null)
  const [viewFocusNotes, setViewFocusNotes] = useState(false)

  const {
    items: contacts, setItems: setContacts, loading, error, setError,
    setPage, setSize, refetch: fetchContacts,
  } = usePagedList(
    useCallback(
      (page, size) => getContacts({
        search: search.trim() || undefined, status: statusFilter || undefined,
        relationshipType: relationshipTypeFilter || undefined, sortBy, order, page, size,
      }),
      [search, statusFilter, relationshipTypeFilter, sortBy, order]
    ),
    'Failed to load contacts.'
  )

  const { data: allContacts, setData: setAllContacts, refetch: fetchAllContacts } = useFetchOnce(
    useCallback(() => getContacts({ sortBy, order, size: 1000 }), [sortBy, order]), []
  )
  const { data: stats, refetch: fetchStats } = useFetchOnce(getContactStats)
  const { data: sourceOptions, refetch: fetchSourceOptions } = useFetchOnce(getSources, [])
  const { data: relationshipTypeOptions } = useFetchOnce(getRelationshipTypes, [])

  useSearchShortcut(searchInputRef)

  const filteredContacts = useMemo(
    () => sourceFilter ? contacts.filter((c) => c.source === sourceFilter) : contacts,
    [contacts, sourceFilter]
  )

  const {
    modalOpen, setModalOpen, editTarget, setEditTarget, deleteTarget, setDeleteTarget,
    handleSaved, handleDeleted,
  } = useCrudModals('Contact', setSuccess, [fetchContacts, fetchAllContacts, fetchStats, fetchSourceOptions])

  const openAdd   = () => { setViewTarget(null); setEditTarget(null); setModalOpen(true) }
  const openEdit  = (r) => { setViewTarget(null); setEditTarget(r); setModalOpen(true) }
  const openView  = (r) => { setModalOpen(false); setViewFocusNotes(false); setViewTarget(r.id) }
  const openNotes = (r) => { setModalOpen(false); setViewFocusNotes(true); setViewTarget(r.id) }

  useAddQueryParam(openAdd)

  const handleNotesChanged = (contactId, newCount) => {
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, noteCount: newCount } : c))
    setAllContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, noteCount: newCount } : c))
  }

  const handleStatusChanged = (updated) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
    setAllContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
    fetchStats()
  }

  const { activeFilterCount, isFiltered, clearAllFilters } = useFilterState(search, setSearch, [
    [statusFilter, setStatusFilter],
    [relationshipTypeFilter, setRelationshipTypeFilter],
    [sourceFilter, setSourceFilter],
  ])

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
      drawerOpen={drawerOpen}
      headerAction={<HeaderAddButton label="Add Contact" onClick={openAdd} drawerOpen={drawerOpen} />}
    >
      <div className={`overflow-x-hidden transition-[margin] duration-300 ease-out ${drawerOpen ? 'lg:mr-[26rem]' : ''}`}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      <ContactFollowUpRecommendations onViewContact={(id) => openView({ id })} />

      {!loading && stats && stats.total > 0 && (
        <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card px-5 py-4 mb-6 [&>div]:mb-0">
          <StatusSummaryBar
            items={allContacts}
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
            <FilterSelect value={statusFilter} onChange={setStatusFilter} allLabel="All Statuses" className="flex-1 min-w-[9rem]"
              options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))} />

            <FilterSelect value={relationshipTypeFilter} onChange={setRelationshipTypeFilter} allLabel="All Relationship Types" className="flex-1 min-w-[9rem]"
              options={relationshipTypeOptions.map((t) => ({ value: t, label: RELATIONSHIP_TYPE_LABELS[t] || t }))} />

            <FilterSelect value={sourceFilter} onChange={setSourceFilter} allLabel="All Sources" className="flex-1 min-w-[9rem]"
              options={sourceOptions.map((s) => ({ value: s, label: SOURCE_LABELS[s] || s }))} />

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
      ) : filteredContacts.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={isFiltered ? 'No contacts match your filters' : 'No contacts yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Start building your network.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Add your first contact
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4">
            {filteredContacts.length} {filteredContacts.length === 1 ? 'Contact' : 'Contacts'}
          </h2>
          <div className="space-y-3">
            {filteredContacts.map((r) => (
              <ContactListRow key={r.id} contact={r} {...cardProps} />
            ))}
          </div>
          <Pagination page={contacts.page} totalPages={contacts.totalPages}
            totalElements={contacts.totalElements} size={contacts.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      ) : (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4">
            {filteredContacts.length} {filteredContacts.length === 1 ? 'Contact' : 'Contacts'}
          </h2>
          <div className={`grid grid-cols-1 gap-3 ${drawerOpen ? 'lg:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
            {filteredContacts.map((r) => (
              <DirectoryCard key={r.id} contact={r} {...cardProps} />
            ))}
          </div>
          <Pagination page={contacts.page} totalPages={contacts.totalPages}
            totalElements={contacts.totalElements} size={contacts.size} onPageChange={setPage} onSizeChange={setSize} />
        </div>
      )}
      </div>

      <AddEditDrawer key={editTarget?.id ?? 'new'} open={modalOpen} contact={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      <DeleteModal open={!!deleteTarget} contact={deleteTarget}
        onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <DetailDrawer
        open={!!viewTarget}
        contactId={viewTarget}
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
