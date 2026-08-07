import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CircularProgress } from '@mui/material'
import { ArticleOutlined } from '@mui/icons-material'
import useDropdownMenu from '../hooks/useDropdownMenu'
import useDebouncedCallback from '../hooks/useDebouncedCallback'
import { searchResearchNotes } from '../api/researchNote'
import { SECTION_CONFIG } from '../constants/researchNoteSection'

export default function ResearchNoteSearch({ onSelectCompany }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const { open, setOpen, triggerRef, menuRef, pos } = useDropdownMenu({ width: 360, flipThreshold: 240 })

  const runSearch = useCallback((q) => {
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    searchResearchNotes({ search: q.trim(), size: 20 })
      .then((res) => setResults(res.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  const debouncedSearch = useDebouncedCallback(runSearch, 300)

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleSelect = (note) => {
    setOpen(false)
    onSelectCompany(note.companyId)
  }

  return (
    <div className="relative">
      <button ref={triggerRef} onClick={() => setOpen((o) => !o)} title="Search research notes"
        className={`h-11 w-11 flex items-center justify-center border rounded-xl transition ${
          open ? 'border-app-accent/40 bg-app-accent/10 text-app-accent-soft' : 'border-white/[0.06] bg-white/[0.03] text-app-text-soft hover:bg-white/[0.05] hover:border-white/[0.12]'
        }`}>
        <ArticleOutlined fontSize="small" />
      </button>

      {open && pos && createPortal(
        <div ref={menuRef}
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width }}
          className={`rounded-xl border border-white/[0.08] bg-app-raised shadow-card-hover z-[100] animate-scale-in overflow-hidden ${pos.bottom !== undefined ? 'origin-bottom' : 'origin-top'}`}>
          <div className="p-2.5 border-b border-white/[0.06]">
            <input autoFocus type="text" value={query} onChange={handleChange}
              placeholder="Search research notes..."
              className="w-full h-9 px-3 border border-white/[0.06] rounded-lg text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 placeholder:text-white/25" />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-6"><CircularProgress size={16} sx={{ color: '#5B5FEF' }} /></div>
            ) : !query.trim() ? (
              <p className="text-xs text-white/30 text-center py-6 px-4">Search across company summaries, tech stack, interview insights, and more.</p>
            ) : results.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-6 px-4">No matching research notes.</p>
            ) : (
              <ul>
                {results.map((note) => (
                  <li key={note.id}>
                    <button onClick={() => handleSelect(note)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.06] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white/85 truncate">{note.companyName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-app-accent/10 text-app-accent-soft shrink-0">
                          {(SECTION_CONFIG[note.section] || SECTION_CONFIG.OTHER).label}
                        </span>
                      </div>
                      {note.title && <p className="text-xs text-white/50 mt-0.5 truncate">{note.title}</p>}
                      <p className="text-xs text-white/35 mt-0.5 line-clamp-2">{note.content}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
