import { useState, useEffect, useCallback } from 'react'
import { CircularProgress } from '@mui/material'
import { AddRounded, EditOutlined, DeleteOutlineRounded, CheckRounded, CloseRounded } from '@mui/icons-material'
import { getResearchNotesForCompany, addResearchNote, updateResearchNote, deleteResearchNote } from '../api/researchNote'
import { fmtDate } from '../utils/followup'
import { SECTION_CONFIG } from '../constants/researchNoteSection'
import FilterSelect from './FilterSelect'
import { fieldInputCls } from './formKit'

function NoteForm({ initial, onSave, onCancel, saving }) {
  const [section, setSection] = useState(initial?.section || 'COMPANY_SUMMARY')
  const [title, setTitle] = useState(initial?.title || '')
  const [content, setContent] = useState(initial?.content || '')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!content.trim()) { setError('Note content cannot be empty.'); return }
    setError('')
    onSave({ section, title: title.trim(), content })
  }

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5">
      {error && <p className="text-xs text-app-danger">{error}</p>}
      <FilterSelect value={section} onChange={setSection} hideAll className="w-full"
        options={Object.entries(SECTION_CONFIG).map(([value, { label }]) => ({ value, label }))} />
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)" className={fieldInputCls(false)} />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
        placeholder="Write your research notes here..." className={`${fieldInputCls(false)} resize-y`} />
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white/60 bg-white/[0.06] rounded-lg hover:bg-white/[0.10] transition">
          <CloseRounded sx={{ fontSize: 14 }} /> Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-app-accent rounded-lg hover:brightness-110 transition disabled:opacity-60">
          {saving && <CircularProgress size={12} color="inherit" />}
          <CheckRounded sx={{ fontSize: 14 }} /> Save
        </button>
      </div>
    </div>
  )
}

function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-app-accent/10 text-app-accent-soft">
            {(SECTION_CONFIG[note.section] || SECTION_CONFIG.OTHER).label}
          </span>
          {note.title && <p className="text-sm font-semibold text-white/85 mt-1 truncate">{note.title}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1 rounded text-white/35 hover:text-white/80 hover:bg-white/[0.06] transition">
            <EditOutlined sx={{ fontSize: 14 }} />
          </button>
          <button onClick={onDelete} className="p-1 rounded text-white/35 hover:text-app-danger hover:bg-app-danger/10 transition">
            <DeleteOutlineRounded sx={{ fontSize: 14 }} />
          </button>
        </div>
      </div>
      <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{note.content}</p>
      <p className="text-[11px] text-white/25 mt-2">{fmtDate(note.updatedAt || note.createdAt)}</p>
    </div>
  )
}

export default function ResearchNotesSection({ companyId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchNotes = useCallback(() => {
    if (companyId == null) return
    setLoading(true)
    getResearchNotesForCompany(companyId)
      .then((res) => { setNotes(res.data || []); setError('') })
      .catch(() => setError('Failed to load research notes.'))
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/company change is the intended effect
    fetchNotes()
  }, [fetchNotes])

  const handleAdd = async (payload) => {
    setSaving(true)
    try {
      await addResearchNote({ ...payload, companyId })
      setAdding(false)
      fetchNotes()
    } catch {
      setError('Failed to save note.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id, payload) => {
    setSaving(true)
    try {
      await updateResearchNote(id, payload)
      setEditId(null)
      fetchNotes()
    } catch {
      setError('Failed to save note.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteResearchNote(id)
      fetchNotes()
    } catch {
      setError('Failed to delete note.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide">Research Notes</p>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-app-accent-soft hover:text-white transition">
            <AddRounded sx={{ fontSize: 14 }} /> Add Note
          </button>
        )}
      </div>

      {error && <p className="text-xs text-app-danger mb-2">{error}</p>}

      {adding && (
        <div className="mb-3">
          <NoteForm onSave={handleAdd} onCancel={() => setAdding(false)} saving={saving} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><CircularProgress size={18} sx={{ color: '#5B5FEF' }} /></div>
      ) : notes.length === 0 && !adding ? (
        <p className="text-sm text-white/35 text-center py-3">No research notes yet.</p>
      ) : (
        <div className="space-y-2.5">
          {notes.map((note) =>
            editId === note.id ? (
              <NoteForm key={note.id} initial={note} saving={saving}
                onSave={(payload) => handleUpdate(note.id, payload)}
                onCancel={() => setEditId(null)} />
            ) : (
              <NoteCard key={note.id} note={note}
                onEdit={() => setEditId(note.id)}
                onDelete={() => handleDelete(note.id)} />
            )
          )}
        </div>
      )}
    </div>
  )
}
