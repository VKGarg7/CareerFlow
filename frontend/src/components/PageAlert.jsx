import { Alert } from '@mui/material'

export default function PageAlert({ severity, message, onClose, className }) {
  if (!message) return null
  return (
    <Alert severity={severity} onClose={onClose} sx={{ mb: 3, borderRadius: 2 }} className={className}>
      {message}
    </Alert>
  )
}
