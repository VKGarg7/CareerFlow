export const APP_STATUS_CONFIG = {
  SAVED:               { label: 'Saved',               badge: 'bg-white/[0.06] text-white/60',           border: 'border-l-white/10',      dot: 'bg-white/40',     hex: '#8B8FA3' },
  APPLIED:             { label: 'Applied',             badge: 'bg-app-accent/10 text-app-accent-soft',   border: 'border-l-app-accent',    dot: 'bg-app-accent',   hex: '#5B5FEF' },
  OA_SCHEDULED:        { label: 'OA Scheduled',        badge: 'bg-app-warning/10 text-app-warning',      border: 'border-l-app-warning',   dot: 'bg-app-warning',  hex: '#F59E0B' },
  OA_CLEARED:          { label: 'OA Cleared',          badge: 'bg-app-accent/10 text-app-accent-soft',   border: 'border-l-app-accent',    dot: 'bg-app-accent',   hex: '#5B5FEF' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', badge: 'bg-app-accent2/10 text-app-accent-soft',  border: 'border-l-app-accent2',   dot: 'bg-app-accent2',  hex: '#8B5CF6' },
  INTERVIEW_CLEARED:   { label: 'Interview Cleared',   badge: 'bg-app-accent2/10 text-app-accent-soft',  border: 'border-l-app-accent2',   dot: 'bg-app-accent2',  hex: '#8B5CF6' },
  OFFER_RECEIVED:      { label: 'Offer Received',      badge: 'bg-app-success/10 text-app-success',      border: 'border-l-app-success',   dot: 'bg-app-success',  hex: '#22C55E' },
  REJECTED:            { label: 'Rejected',            badge: 'bg-app-danger/10 text-app-danger',        border: 'border-l-app-danger',    dot: 'bg-app-danger',   hex: '#F43F5E' },
  JOINED:              { label: 'Joined',              badge: 'bg-app-success/10 text-app-success',      border: 'border-l-app-success',   dot: 'bg-app-success',  hex: '#22C55E' },
}

export const appStatusLabel = (status) => APP_STATUS_CONFIG[status]?.label || status
export const appStatusHex = (status) => (APP_STATUS_CONFIG[status] || APP_STATUS_CONFIG.APPLIED).hex
