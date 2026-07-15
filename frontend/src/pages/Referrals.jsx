import { useState, useEffect, useCallback, useRef } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import {
  Add, Search, KeyboardArrowDown, LinkedIn, Email,
  Close, OpenInNew, Work, FilterListRounded,
  VisibilityOutlined, EditOutlined, DeleteOutlineRounded,
} from '@mui/icons-material'
import Layout from '../components/Layout'
import ViewToggle from '../components/ViewToggle'
import StatTilesBar from '../components/StatTilesBar'
import { ConfirmDeleteModal } from '../components/ModalShell'
import { getReferrals, getReferral, addReferral, updateReferral, deleteReferral, manageNote } from '../api/referral'
import EmptyState from '../components/EmptyState'
import { EntityDirectoryCard, CardMenu } from '../components/EntityCard'
import InlineStatusChanger from '../components/InlineStatusChanger'
import { initials, fmt, fmtDate } from '../utils/followup'
import useSearchShortcut from '../hooks/useSearchShortcut'
import useAddQueryParam from '../hooks/useAddQueryParam'
import useTransientMessage from '../hooks/useTransientMessage'
import { DrawerShell, DrawerHeader, CloseIconButton } from '../components/DrawerShell'
import { fieldInputCls, FieldErrorText, FieldLabel, FormFooterButtons } from '../components/formKit'
import EntityListRow from '../components/EntityListRow'

const STATUS_CONFIG = {
  DRAFT:          { label: 'Draft',          badge: 'bg-white/[0.06] text-white/60',           border: 'border-l-white/10',    dot: 'bg-white/40',     hex: '#8B8FA3' },
  REQUESTED:      { label: 'Requested',      badge: 'bg-app-accent/10 text-app-accent-soft',   border: 'border-l-app-accent',  dot: 'bg-app-accent',   hex: '#5B5FEF' },
  ACKNOWLEDGED:   { label: 'Acknowledged',   badge: 'bg-app-warning/10 text-app-warning',      border: 'border-l-app-warning', dot: 'bg-app-warning',  hex: '#F59E0B' },
  REFERRED:       { label: 'Referred',       badge: 'bg-app-accent2/10 text-app-accent-soft',  border: 'border-l-app-accent2', dot: 'bg-app-accent2',  hex: '#8B5CF6' },
  INTERVIEWING:   { label: 'Interviewing',   badge: 'bg-app-accent2/10 text-app-accent-soft',  border: 'border-l-app-accent2', dot: 'bg-app-accent2',  hex: '#8B5CF6' },
  OFFER_RECEIVED: { label: 'Offer Received', badge: 'bg-app-success/10 text-app-success',      border: 'border-l-app-success', dot: 'bg-app-success',  hex: '#22C55E' },
  REJECTED:       { label: 'Rejected',       badge: 'bg-app-danger/10 text-app-danger',        border: 'border-l-app-danger',  dot: 'bg-app-danger',   hex: '#F43F5E' },
  WITHDRAWN:      { label: 'Withdrawn',      badge: 'bg-app-warning/10 text-app-warning',      border: 'border-l-app-warning', dot: 'bg-app-warning',  hex: '#F59E0B' },
  DECLINED:       { label: 'Declined',       badge: 'bg-app-danger/10 text-app-danger',        border: 'border-l-app-danger',  dot: 'bg-app-danger',   hex: '#F43F5E' },
}

const SORT_OPTIONS = [
  { value: 'createdAt',       label: 'Date Added'    },
  { value: 'referrerName',    label: 'Referrer Name' },
  { value: 'referrerCompany', label: 'Company'       },
  { value: 'targetRole',      label: 'Role'          },
  { value: 'status',          label: 'Status'        },
  { value: 'requestedDate',   label: 'Requested Date' },
  { value: 'followUpDate',    label: 'Follow-Up Date' },
  { value: 'updatedAt',       label: 'Last Updated'  },
]

const EMPTY_FORM = {
  referrerName: '', referrerEmail: '', referrerLinkedIn: '',
  referrerCompany: '', referrerJobTitle: '',
  targetRole: '', jobPostingUrl: '',
  relationshipContext: '', messageToReferrer: '',
  status: 'DRAFT', requestedDate: '', followUpDate: '', notes: '',
}

const isOverdueReferral = (referral) => !!referral.followUpDate
  && new Date(referral.followUpDate) < new Date()
  && !['REFERRED', 'INTERVIEWING', 'OFFER_RECEIVED', 'REJECTED', 'WITHDRAWN', 'DECLINED'].includes(referral.status)

function ReferralStatusChanger({ referral, onStatusChanged }) {
  return (
    <InlineStatusChanger
      item={referral}
      statusConfig={STATUS_CONFIG}
      defaultStatus="DRAFT"
      updateFn={updateReferral}
      onStatusChanged={onStatusChanged}
    />
  )
}

function ReferralListRow({ referral, drawerOpen, onView, onEdit, onDelete, onStatusChanged }) {
  const cfg = STATUS_CONFIG[referral.status] || STATUS_CONFIG.DRAFT
  const overdue = isOverdueReferral(referral)

  return (
    <EntityListRow
      onClick={() => onView(referral)}
      accentBorder={cfg.border}
      avatarColor={cfg.dot}
      name={referral.referrerName}
      subtitle={referral.referrerCompany}
      statusSlot={<ReferralStatusChanger referral={referral} onStatusChanged={onStatusChanged} />}
      email={referral.referrerEmail}
      linkedIn={referral.referrerLinkedIn}
      menuItems={[
        { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(referral) },
        { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => onEdit(referral) },
        { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 16 }} />, onClick: () => onDelete(referral), tone: 'danger' },
      ]}
    >
      <div className={`w-40 min-w-0 shrink-0 hidden ${drawerOpen ? 'xl:block' : 'md:block'}`}>
        <p className="text-[11px] text-white/35">Target Role</p>
        <p className="text-sm font-medium text-white/70 truncate mt-0.5">{referral.targetRole}</p>
      </div>

      <div className={`w-28 shrink-0 hidden ${drawerOpen ? 'xl:block' : 'lg:block'}`}>
        <p className="text-[11px] text-white/35">Requested</p>
        <p className="text-sm font-medium text-white/70 mt-0.5">
          {referral.requestedDate ? fmtDate(referral.requestedDate) : '—'}
        </p>
      </div>

      <div className={`w-28 shrink-0 hidden ${drawerOpen ? '2xl:block' : 'xl:block'}`}>
        <p className="text-[11px] text-white/35">Follow-Up</p>
        <p className={`text-sm font-medium mt-0.5 ${overdue ? 'text-app-danger font-semibold' : 'text-white/70'}`}>
          {referral.followUpDate ? fmtDate(referral.followUpDate) : '—'}
        </p>
      </div>

      {overdue && (
        <span className="hidden lg:inline-flex shrink-0 text-[10px] font-semibold text-app-danger bg-app-danger/10 px-2 py-0.5 rounded-full">
          Overdue
        </span>
      )}

    </EntityListRow>
  )
}

function DirectoryCard({ referral, onView, onEdit, onDelete, onStatusChanged }) {
  const cfg = STATUS_CONFIG[referral.status] || STATUS_CONFIG.DRAFT
  const overdue = isOverdueReferral(referral)

  return (
    <EntityDirectoryCard
      onClick={() => onView(referral)}
      statusBarColor={cfg.dot}
      avatarColor={cfg.dot}
      avatarText={initials(referral.referrerName)}
      titleSlot={
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white/90 truncate leading-tight">{referral.referrerName}</p>
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          {(referral.referrerJobTitle || referral.referrerCompany) && (
            <p className="text-xs text-white/50 truncate mt-0.5">
              {[referral.referrerJobTitle, referral.referrerCompany].filter(Boolean).join(' @ ')}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex w-fit max-w-full items-center gap-1.5 bg-app-accent/10 rounded-lg px-2.5 py-1.5">
              <Work sx={{ fontSize: 11 }} className="text-app-accent-soft shrink-0" />
              <p className="text-xs font-semibold text-app-accent-soft truncate max-w-[160px]">{referral.targetRole}</p>
            </div>
            {overdue && (
              <span className="text-[10px] font-semibold text-app-danger bg-app-danger/10 px-1.5 py-0.5 rounded-full shrink-0">Overdue</span>
            )}
          </div>
          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
            <ReferralStatusChanger referral={referral} onStatusChanged={onStatusChanged} />
          </div>
        </>
      }
      actionsSlot={
        <CardMenu items={[
          { key: 'view', label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 16 }} />, onClick: () => onView(referral) },
        ]} />
      }
      chips={
        <div className="flex items-center gap-2 w-full">
          {referral.referrerEmail && (
            <a href={`mailto:${referral.referrerEmail}`} title={referral.referrerEmail}
              className="p-1.5 rounded-lg text-white/35 hover:text-app-accent-soft hover:bg-app-accent/10 transition">
              <Email sx={{ fontSize: 15 }} />
            </a>
          )}
          {referral.referrerLinkedIn && (
            <a href={referral.referrerLinkedIn} target="_blank" rel="noreferrer" title="LinkedIn"
              className="p-1.5 rounded-lg text-white/35 hover:text-app-accent-soft hover:bg-app-accent/10 transition">
              <LinkedIn sx={{ fontSize: 15 }} />
            </a>
          )}
          {referral.jobPostingUrl && (
            <a href={referral.jobPostingUrl} target="_blank" rel="noreferrer" title="Job Posting"
              className="p-1.5 rounded-lg text-white/35 hover:text-app-accent-soft hover:bg-app-accent/10 transition">
              <OpenInNew sx={{ fontSize: 15 }} />
            </a>
          )}
          {referral.followUpDate && (
            <span className={`text-xs ml-auto font-medium ${overdue ? 'text-app-danger' : 'text-white/35'}`}>
              {new Date(referral.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      }
      note={referral.notes}
      actions={[
        { key: 'edit', label: 'Edit', icon: <EditOutlined sx={{ fontSize: 14 }} />, onClick: () => onEdit(referral) },
        { key: 'delete', label: 'Delete', icon: <DeleteOutlineRounded sx={{ fontSize: 14 }} />, onClick: () => onDelete(referral), tone: 'danger' },
      ]}
    />
  )
}

function DetailDrawer({ open, referralId, onClose, onEdit, onDelete, onStatusChanged }) {
  const [referral, setReferral]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const [history, setHistory]       = useState([])
  const [noteText, setNoteText]     = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteError, setNoteError]   = useState('')
  const [editingNote, setEditingNote] = useState(null)   // { id, text }
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    if (!open || !referralId) return
    setLoading(true)
    setError('')
    setReferral(null)
    setHistory([])
    setNoteText('')
    setNoteError('')
    setEditingNote(null)
    getReferral(referralId)
      .then((res) => { setReferral(res.data); setHistory(res.data.statusHistory ?? []) })
      .catch(() => setError('Failed to load referral details.'))
      .finally(() => setLoading(false))
  }, [open, referralId])

  if (!open) return null

  const cfg = referral ? (STATUS_CONFIG[referral.status] || STATUS_CONFIG.DRAFT) : STATUS_CONFIG.DRAFT
  const overdue = referral ? isOverdueReferral(referral) : false

  const Row = ({ label, value }) =>
    value ? (
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm text-white/85 break-words">{value}</p>
      </div>
    ) : null

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setNoteSubmitting(true)
    setNoteError('')
    try {
      const res = await manageNote(referral.id, { action: 'ADD', note: noteText.trim() })
      setHistory(res.data)
      setNoteText('')
    } catch (e) {
      setNoteError(e.response?.data?.message || 'Failed to add note')
    } finally {
      setNoteSubmitting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingNote?.text.trim()) return
    setEditSaving(true)
    try {
      const res = await manageNote(referral.id, { action: 'EDIT', noteId: editingNote.id, note: editingNote.text.trim() })
      setHistory(res.data)
      setEditingNote(null)
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteNote = async (historyId) => {
    try {
      const res = await manageNote(referral.id, { action: 'DELETE', noteId: historyId })
      setHistory(res.data)
    } catch {
    }
  }

  return (
    <DrawerShell>

      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
        {loading ? (
          <div className="flex justify-center py-4"><CircularProgress size={24} /></div>
        ) : error ? (
          <p className="text-sm text-app-danger">{error}</p>
        ) : referral ? (
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner-highlight ${cfg.dot}`}>
              {initials(referral.referrerName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white leading-tight truncate">{referral.referrerName}</h2>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
              {(referral.referrerJobTitle || referral.referrerCompany) && (
                <p className="text-sm text-white/50 mt-0.5 truncate">
                  {[referral.referrerJobTitle, referral.referrerCompany].filter(Boolean).join(' @ ')}
                </p>
              )}
              {overdue && (
                <span className="inline-flex mt-1.5 text-[10px] font-semibold text-app-danger bg-app-danger/10 px-2 py-0.5 rounded-full">
                  Follow-up overdue
                </span>
              )}
            </div>
            <CloseIconButton onClose={onClose} className="shrink-0" />
          </div>
        ) : null}
      </div>

      {referral && !loading && (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">

          <ReferralStatusChanger referral={referral} onStatusChanged={(updated) => {
            setReferral(updated)
            setHistory(updated.statusHistory ?? [])
            onStatusChanged(updated)
          }} />

          <div>
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Role</p>
            <div className="space-y-2">
              <Row label="Target Role" value={
                <span className="inline-flex items-center gap-1.5 font-semibold text-app-accent-soft">
                  <Work sx={{ fontSize: 14 }} />{referral.targetRole}
                </span>
              } />
              <Row label="Job Posting" value={referral.jobPostingUrl && (
                <a href={referral.jobPostingUrl} target="_blank" rel="noreferrer"
                  className="text-app-accent-soft hover:underline flex items-center gap-1.5">
                  <OpenInNew sx={{ fontSize: 14 }} className="shrink-0" />View Posting
                </a>
              )} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Contact</p>
            <div className="space-y-2">
              <Row label="Email" value={referral.referrerEmail && (
                <a href={`mailto:${referral.referrerEmail}`}
                  className="text-app-accent-soft hover:underline flex items-center gap-1.5 truncate">
                  <Email sx={{ fontSize: 14 }} className="shrink-0" /><span className="truncate">{referral.referrerEmail}</span>
                </a>
              )} />
              <Row label="LinkedIn" value={referral.referrerLinkedIn && (
                <a href={referral.referrerLinkedIn} target="_blank" rel="noreferrer"
                  className="text-app-accent-soft hover:underline flex items-center gap-1.5">
                  <LinkedIn sx={{ fontSize: 14 }} className="shrink-0" />View Profile
                </a>
              )} />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Tracking</p>
            <div className="space-y-2">
              <Row label="Requested" value={referral.requestedDate ? fmtDate(referral.requestedDate) : null} />
              <Row label="Follow-Up" value={referral.followUpDate
                ? <span className={overdue ? 'text-app-danger font-semibold' : ''}>
                    {fmtDate(referral.followUpDate)}{overdue ? ' — overdue' : ''}
                  </span>
                : null} />
              <Row label="Added on" value={referral.createdAt ? fmtDate(referral.createdAt) : null} />
              <Row label="Last updated" value={referral.updatedAt ? fmt(referral.updatedAt) : null} />
            </div>
          </div>

          {referral.relationshipContext && (
            <div>
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">How You Know Them</p>
              <div className="bg-white/[0.03] rounded-xl px-3.5 py-2.5">
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{referral.relationshipContext}</p>
              </div>
            </div>
          )}

          {referral.messageToReferrer && (
            <div>
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Message to Referrer</p>
              <div className="bg-app-accent/[0.06] rounded-xl px-3.5 py-2.5">
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{referral.messageToReferrer}</p>
              </div>
            </div>
          )}

          {referral.notes && (
            <div>
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Notes</p>
              <div className="bg-white/[0.03] rounded-xl px-3.5 py-2.5">
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{referral.notes}</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3">Timeline</p>
            {history.length === 0 ? (
              <p className="text-xs text-white/35 italic mb-3">No activity recorded yet.</p>
            ) : (
              <div className="space-y-0 mb-3">
                {history.map((entry, i) => {
                  const isLast = i === history.length - 1
                  const isEditingThis = editingNote?.id === entry.id

                  if (entry.noteOnly) {
                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center shrink-0 pt-1">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-white/30" />
                          {!isLast && <div className="w-px flex-1 bg-white/[0.08] my-1" />}
                        </div>
                        <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-3'}`}>
                          {isEditingThis ? (
                            <div className="bg-app-accent/10 border border-app-accent/20 rounded-xl p-3 space-y-2">
                              <textarea
                                rows={2}
                                value={editingNote.text}
                                onChange={(e) => setEditingNote((n) => ({ ...n, text: e.target.value }))}
                                className="w-full px-3 py-2 border border-app-accent/30 rounded-lg text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-app-accent/40 bg-white/[0.04] resize-none"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={handleSaveEdit} disabled={editSaving || !editingNote.text.trim()}
                                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-app-accent text-white hover:brightness-110 disabled:opacity-50 transition">
                                  {editSaving ? '…' : 'Save'}
                                </button>
                                <button onClick={() => setEditingNote(null)}
                                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white/[0.06] text-white/50 hover:bg-white/[0.10] transition">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-1 group">
                              <p className="text-xs text-white/60 flex-1 italic">"{entry.note}"</p>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                <button onClick={() => setEditingNote({ id: entry.id, text: entry.note })}
                                  className="p-0.5 text-white/35 hover:text-app-accent-soft transition">
                                  <EditOutlined sx={{ fontSize: 12 }} />
                                </button>
                                <button onClick={() => handleDeleteNote(entry.id)}
                                  className="p-0.5 text-white/35 hover:text-app-danger transition">
                                  <DeleteOutlineRounded sx={{ fontSize: 12 }} />
                                </button>
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] text-white/35 mt-0.5">{fmt(entry.changedAt)}</p>
                        </div>
                      </div>
                    )
                  }

                  const toCfg = STATUS_CONFIG[entry.toStatus] || STATUS_CONFIG.DRAFT
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${toCfg.dot}`} />
                        {!isLast && <div className="w-px flex-1 bg-white/[0.08] my-1" />}
                      </div>
                      <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-3'}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.fromStatus && (
                            <span className="text-xs text-white/35 line-through">
                              {STATUS_CONFIG[entry.fromStatus]?.label || entry.fromStatus}
                            </span>
                          )}
                          {entry.fromStatus && <span className="text-white/25 text-xs">→</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${toCfg.badge}`}>
                            {toCfg.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/35 mt-0.5">{fmt(entry.changedAt)}</p>
                        {entry.note && <p className="text-xs text-white/50 italic mt-0.5">"{entry.note}"</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-app-accent/40 focus-within:ring-2 focus-within:ring-app-accent/20 transition">
              <textarea
                rows={2}
                placeholder="Add a note to the timeline…"
                value={noteText}
                onChange={(e) => { setNoteText(e.target.value); setNoteError('') }}
                className="w-full px-3.5 pt-3 pb-1 bg-transparent text-sm text-white/85 focus:outline-none resize-none placeholder:text-white/25"
              />
              <div className="flex items-center justify-end px-3 pb-2.5">
                <button onClick={handleAddNote} disabled={noteSubmitting || !noteText.trim()}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-app-accent text-white rounded-lg hover:brightness-110 disabled:opacity-40 transition">
                  {noteSubmitting ? <CircularProgress size={12} sx={{ color: 'white' }} /> : 'Add'}
                </button>
              </div>
            </div>
            {noteError && <p className="text-[11px] text-app-danger mt-1">{noteError}</p>}
          </div>
        </div>
      )}

      {referral && !loading && (
        <div className="flex gap-3 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02] shrink-0">
          <button
            onClick={() => { onClose(); onEdit(referral) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white/70 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.10] hover:text-white transition">
            <EditOutlined sx={{ fontSize: 16 }} />
            Edit
          </button>
          <button
            onClick={() => { onClose(); onDelete(referral) }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-app-danger bg-white/[0.03] border border-app-danger/20 rounded-xl hover:bg-app-danger hover:text-white hover:border-app-danger transition ml-auto">
            <DeleteOutlineRounded sx={{ fontSize: 16 }} />
            Delete
          </button>
        </div>
      )}
    </DrawerShell>
  )
}

function AddEditDrawer({ open, referral, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(referral ? {
        referrerName:        referral.referrerName        || '',
        referrerEmail:       referral.referrerEmail       || '',
        referrerLinkedIn:    referral.referrerLinkedIn    || '',
        referrerCompany:     referral.referrerCompany     || '',
        referrerJobTitle:    referral.referrerJobTitle    || '',
        targetRole:          referral.targetRole          || '',
        jobPostingUrl:       referral.jobPostingUrl       || '',
        relationshipContext: referral.relationshipContext || '',
        messageToReferrer:   referral.messageToReferrer   || '',
        status:              referral.status              || 'DRAFT',
        requestedDate:       referral.requestedDate       || '',
        followUpDate:        referral.followUpDate        || '',
        notes:               referral.notes               || '',
      } : EMPTY_FORM)
      setError('')
      setFieldErrors({})
    }
  }, [open, referral])

  if (!open) return null

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const payload = {
      referrerName:        form.referrerName.trim()        || undefined,
      referrerEmail:       form.referrerEmail.trim()       || undefined,
      referrerLinkedIn:    form.referrerLinkedIn.trim()    || undefined,
      referrerCompany:     form.referrerCompany.trim()     || undefined,
      referrerJobTitle:    form.referrerJobTitle.trim()    || undefined,
      targetRole:          form.targetRole.trim()          || undefined,
      jobPostingUrl:       form.jobPostingUrl.trim()       || undefined,
      relationshipContext: form.relationshipContext.trim() || undefined,
      messageToReferrer:   form.messageToReferrer.trim()   || undefined,
      status:              form.status                     || undefined,
      requestedDate:       form.requestedDate              || undefined,
      followUpDate:        form.followUpDate               || undefined,
      notes:               form.notes.trim()               || undefined,
    }
    try {
      referral ? await updateReferral(referral.id, payload) : await addReferral(payload)
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
      <DrawerHeader onClose={onClose} title={referral ? 'Edit Referral Request' : 'New Referral Request'} subtitle={referral ? 'Update referral details' : 'Track a referral you are requesting'} />
      <div className="px-6 py-5 overflow-y-auto flex-1 no-scrollbar">
        {error && <div className="mb-4 p-3 rounded-xl bg-app-danger/10 border border-app-danger/20 text-app-danger text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">

          <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Referrer Details</p>
          <div>
            <FieldLabel>
              Full Name <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.referrerName} onChange={set('referrerName')}
              placeholder="Jane Doe" maxLength={100} className={inputCls('referrerName')} required />
            <FieldError field="referrerName" />
          </div>
          <div>
            <FieldLabel>
              Company <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.referrerCompany} onChange={set('referrerCompany')}
              placeholder="Google" maxLength={150} className={inputCls('referrerCompany')} required />
            <FieldError field="referrerCompany" />
          </div>
          <div>
            <FieldLabel>Job Title</FieldLabel>
            <input type="text" value={form.referrerJobTitle} onChange={set('referrerJobTitle')}
              placeholder="Senior Engineer" maxLength={100} className={inputCls('referrerJobTitle')} />
            <FieldError field="referrerJobTitle" />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input type="email" value={form.referrerEmail} onChange={set('referrerEmail')}
              placeholder="jane@google.com" maxLength={150} className={inputCls('referrerEmail')} />
            <FieldError field="referrerEmail" />
          </div>
          <div>
            <FieldLabel>LinkedIn URL</FieldLabel>
            <input type="url" value={form.referrerLinkedIn} onChange={set('referrerLinkedIn')}
              placeholder="https://linkedin.com/in/..." maxLength={300} className={inputCls('referrerLinkedIn')} />
            <FieldError field="referrerLinkedIn" />
          </div>

          <p className="text-xs font-bold text-white/40 uppercase tracking-wider pt-1">Role Details</p>
          <div>
            <FieldLabel>
              Target Role <span className="text-app-danger">*</span>
            </FieldLabel>
            <input type="text" value={form.targetRole} onChange={set('targetRole')}
              placeholder="Software Engineer – Backend" maxLength={150} className={inputCls('targetRole')} required />
            <FieldError field="targetRole" />
          </div>
          <div>
            <FieldLabel>Job Posting URL</FieldLabel>
            <input type="url" value={form.jobPostingUrl} onChange={set('jobPostingUrl')}
              placeholder="https://careers.google.com/..." maxLength={500} className={inputCls('jobPostingUrl')} />
            <FieldError field="jobPostingUrl" />
          </div>

          <p className="text-xs font-bold text-white/40 uppercase tracking-wider pt-1">Context & Message</p>
          <div>
            <FieldLabel>How do you know them?</FieldLabel>
            <textarea value={form.relationshipContext} onChange={set('relationshipContext')} rows={2}
              maxLength={1000} placeholder="e.g. College classmate, previous coworker, LinkedIn connection..."
              className={`${inputCls('relationshipContext')} resize-none`} />
            <p className="text-xs text-white/35 mt-1 text-right">{form.relationshipContext.length}/1000</p>
          </div>
          <div>
            <FieldLabel>Message to Referrer</FieldLabel>
            <textarea value={form.messageToReferrer} onChange={set('messageToReferrer')} rows={4}
              maxLength={3000} placeholder="Hi Jane, I hope you're doing well! I noticed Google is hiring for..."
              className={`${inputCls('messageToReferrer')} resize-none`} />
            <p className="text-xs text-white/35 mt-1 text-right">{form.messageToReferrer.length}/3000</p>
          </div>

          <p className="text-xs font-bold text-white/40 uppercase tracking-wider pt-1">Tracking</p>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select value={form.status} onChange={set('status')} className={inputCls('status')}>
              {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                <option key={val} value={val} className="bg-app-surface text-white">{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Date Requested</FieldLabel>
              <input type="date" value={form.requestedDate} onChange={set('requestedDate')}
                className={inputCls('requestedDate')} />
            </div>
            <div>
              <FieldLabel>Follow-Up Date</FieldLabel>
              <input type="date" value={form.followUpDate} onChange={set('followUpDate')}
                className={inputCls('followUpDate')} />
            </div>
          </div>
          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              maxLength={2000} placeholder="Any extra context, reminders, or outcomes..."
              className={`${inputCls('notes')} resize-none`} />
            <p className="text-xs text-white/35 mt-1 text-right">{form.notes.length}/2000</p>
          </div>

          <FormFooterButtons saving={saving} onCancel={onClose} saveLabel={referral ? 'Save Changes' : 'Add Referral Request'} saveFirst heightCls="py-2.5" />
        </form>
      </div>
    </DrawerShell>
  )
}

export default function Referrals() {
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useTransientMessage()

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy]           = useState('createdAt')
  const [order, setOrder]             = useState('desc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchInputRef = useRef(null)

  const [viewMode, setViewMode]       = useState('list')

  const [modalOpen, setModalOpen]     = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget]   = useState(null)

  const fetchReferrals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReferrals({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        sortBy, order,
      })
      setReferrals(res.data)
    } catch {
      setError('Failed to load referral requests.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sortBy, order])

  useEffect(() => { fetchReferrals() }, [fetchReferrals])

  useSearchShortcut(searchInputRef)

  const openAdd  = () => { setViewTarget(null); setEditTarget(null); setModalOpen(true) }
  const openEdit = (r) => { setViewTarget(null); setEditTarget(r); setModalOpen(true) }
  const openView = (r) => { setModalOpen(false); setViewTarget(r.id) }

  useAddQueryParam(openAdd)

  const handleSaved = () => {
    setModalOpen(false)
    setSuccess(editTarget ? 'Referral request updated.' : 'Referral request added.')
    fetchReferrals()
  }

  const handleStatusChanged = (updated) => {
    setReferrals(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  const handleDeleted = () => {
    setDeleteTarget(null)
    setViewTarget(null)
    setSuccess('Referral request removed.')
    fetchReferrals()
  }

  const isFiltered = search.trim() || statusFilter
  const drawerOpen = modalOpen || viewTarget !== null

  const cardProps = {
    onView: openView,
    onEdit: openEdit,
    onDelete: setDeleteTarget,
    onStatusChanged: handleStatusChanged,
    drawerOpen,
  }

  return (
    <Layout
      headerAction={
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 hover:-translate-y-0.5 transition-all shadow-glow shadow-app-accent/40">
          <Add fontSize="small" />New Request
        </button>
      }
    >
      <div className={`overflow-x-hidden transition-[margin] duration-300 ease-out ${drawerOpen ? 'lg:mr-[26rem]' : ''}`}>
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert severity="error" message={error} onClose={() => setError('')} />

      {!loading && referrals.length > 0 && (
        <div className="mb-8">
          <StatTilesBar
            items={referrals}
            statusConfig={STATUS_CONFIG}
            activeFilter={statusFilter}
            onFilter={setStatusFilter}
            totalLabel="Total Requests"
            totalIcon={<Work sx={{ fontSize: 18 }} />}
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
              placeholder="Search by name, company, role or email..."
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
            {statusFilter && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-app-accent text-white text-[11px] font-bold leading-none">
                1
              </span>
            )}
            <KeyboardArrowDown fontSize="small" className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFiltered && (
            <button onClick={() => { setSearch(''); setStatusFilter('') }}
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

      {/* Content */}
      {loading ? (
        <PageSpinner />
      ) : referrals.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={isFiltered ? 'No referrals match your filters' : 'No referral requests yet'}
          description={isFiltered ? 'Try adjusting your search or filter.' : 'Start tracking who you are asking for referrals.'}
          action={!isFiltered && (
            <button onClick={openAdd}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40">
              Add your first request
            </button>
          )}
        />
      ) : viewMode === 'list' ? (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4">
            {referrals.length} {referrals.length === 1 ? 'Request' : 'Requests'}
          </h2>
          <div className="space-y-3">
            {referrals.map((r) => (
              <ReferralListRow key={r.id} referral={r} {...cardProps} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-[18px] font-semibold text-white mb-4">
            {referrals.length} {referrals.length === 1 ? 'Request' : 'Requests'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {referrals.map((r) => (
              <DirectoryCard key={r.id} referral={r} {...cardProps} />
            ))}
          </div>
        </div>
      )}
      </div>

      <AddEditDrawer open={modalOpen} referral={editTarget}
        onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteReferral(deleteTarget.id); handleDeleted() }}
        title="Delete Referral Request"
        message={deleteTarget && (
          <>Remove referral request from <span className="font-semibold text-white/80">{deleteTarget.referrerName}</span> for <span className="font-semibold text-white/80">{deleteTarget.targetRole}</span>?</>
        )}
      />

      <DetailDrawer
        open={viewTarget !== null}
        referralId={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(r) => { setEditTarget(r); setModalOpen(true) }}
        onDelete={(r) => setDeleteTarget(r)}
        onStatusChanged={handleStatusChanged}
      />
    </Layout>
  )
}
