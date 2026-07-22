import { CircularProgress } from '@mui/material'

export default function PageSpinner({ py = 'py-16', size, sx }) {
  return (
    <div className={`flex justify-center ${py}`}>
      <CircularProgress size={size} sx={{ color: '#5B5FEF', ...sx }} />
    </div>
  )
}
