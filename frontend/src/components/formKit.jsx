import { CircularProgress } from '@mui/material'
import { motion } from 'framer-motion'

export { default as FloatingField } from './premiumForm/FloatingField'
export { default as CommandSelect } from './premiumForm/CommandSelect'
export { default as TagInput } from './premiumForm/TagInput'
export { default as DatePickerField } from './premiumForm/DatePickerField'
export { default as StepProgress } from './premiumForm/StepProgress'

export const fieldInputCls = (hasError) =>
  `field-glass w-full px-4 py-2.5 text-sm text-white/85 bg-transparent focus:outline-none transition placeholder:text-white/25 ${
    hasError ? 'has-error' : ''
  }`

export const FieldErrorText = ({ error }) =>
  error ? <p className="text-xs text-app-danger mt-1">{error}</p> : null

export const FieldLabel = ({ children }) =>
  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wide mb-1.5">{children}</label>

export function FormFooterButtons({ saving, onCancel, saveLabel, saveFirst = false, heightCls = 'h-11' }) {
  const cancelBtn = (
    <button type="button" onClick={onCancel} key="cancel"
      className={`flex-1 ${heightCls} text-sm font-semibold text-white/70 bg-white/[0.06] rounded-xl hover:bg-white/[0.10] transition`}>
      Cancel
    </button>
  )
  const saveBtn = (
    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} type="submit" disabled={saving} key="save"
      className={`flex-1 ${heightCls} text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-ring-accent`}>
      {saving && <CircularProgress size={14} color="inherit" />}
      {saveLabel}
    </motion.button>
  )
  return (
    <div className="flex gap-3 pt-2">
      {saveFirst ? [saveBtn, cancelBtn] : [cancelBtn, saveBtn]}
    </div>
  )
}
