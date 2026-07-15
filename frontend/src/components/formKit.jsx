import { CircularProgress } from '@mui/material'

export const fieldInputCls = (hasError) =>
  `w-full px-4 py-2.5 border rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 transition placeholder:text-white/25 ${
    hasError ? 'border-app-danger/40 bg-app-danger/[0.06]' : 'border-white/[0.08] hover:border-white/[0.14]'
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
    <button type="submit" disabled={saving} key="save"
      className={`flex-1 ${heightCls} text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-glow shadow-app-accent/40`}>
      {saving && <CircularProgress size={14} color="inherit" />}
      {saveLabel}
    </button>
  )
  return (
    <div className="flex gap-3 pt-2">
      {saveFirst ? [saveBtn, cancelBtn] : [cancelBtn, saveBtn]}
    </div>
  )
}
