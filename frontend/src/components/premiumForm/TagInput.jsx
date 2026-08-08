import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloseRounded } from '@mui/icons-material'

export default function TagInput({ label, icon, values = [], onChange, required = false, error, placeholder, className = '' }) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)

  const commit = () => {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  const remove = (v) => onChange(values.filter((x) => x !== v))
  const floated = focused || values.length > 0 || draft.length > 0

  return (
    <div className={className}>
      <div className={`field-glass ${focused ? 'is-focused' : ''} ${error ? 'has-error' : ''}`}>
        <div className="relative flex min-h-[3rem] flex-wrap items-center gap-1.5 px-3.5 py-2.5">
          {icon && <span className="shrink-0 text-white/30">{icon}</span>}
          <label className={`field-label-float ${icon ? '' : 'no-icon'} ${floated ? 'floated' : ''}`}>
            {label}{required && <span className="text-app-danger"> *</span>}
          </label>
          {floated && <span className="w-0" />}
          <AnimatePresence initial={false}>
            {values.map((v) => (
              <motion.span
                key={v}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="tag-chip-enter inline-flex items-center gap-1 rounded-lg bg-app-accent/15 px-2.5 py-1 text-xs font-medium text-app-accent-soft"
              >
                {v}
                <button type="button" onClick={() => remove(v)} className="rounded-full p-0.5 hover:bg-white/10">
                  <CloseRounded sx={{ fontSize: 12 }} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); commit() }}
            placeholder={floated ? (placeholder || 'Add and press Enter...') : ''}
            className="min-w-[6rem] flex-1 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/25"
          />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-app-danger">{error}</p>}
    </div>
  )
}
