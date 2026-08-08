export const APP_STATUS_CONFIG = {
  SAVED:               { label: 'Saved',               badge: 'bg-white/[0.06] text-white/60',           border: 'border-l-white/10',      dot: 'bg-white/40',     hex: '#7E8497' },
  APPLIED:             { label: 'Applied',             badge: 'bg-app-accent/10 text-app-accent-soft',   border: 'border-l-app-accent',    dot: 'bg-app-accent',   hex: '#5B5FEF' },
  OA_SCHEDULED:        { label: 'OA Scheduled',        badge: 'bg-app-warning/10 text-app-warning',      border: 'border-l-app-warning',   dot: 'bg-app-warning',  hex: '#F59E0B' },
  OA_CLEARED:          { label: 'OA Cleared',          badge: 'bg-app-cyan/10 text-app-cyan-soft',       border: 'border-l-app-cyan',      dot: 'bg-app-cyan',     hex: '#22D3EE' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', badge: 'bg-app-purple/10 text-app-purple-soft',   border: 'border-l-app-purple',    dot: 'bg-app-purple',   hex: '#A855F7' },
  INTERVIEW_CLEARED:   { label: 'Interview Cleared',   badge: 'bg-app-purple/10 text-app-purple-soft',   border: 'border-l-app-purple',    dot: 'bg-app-purple',   hex: '#A855F7' },
  OFFER_RECEIVED:      { label: 'Offer Received',      badge: 'bg-app-emerald/10 text-app-emerald-soft', border: 'border-l-app-emerald',   dot: 'bg-app-emerald',  hex: '#10B981' },
  REJECTED:            { label: 'Rejected',            badge: 'bg-app-danger/10 text-app-danger',        border: 'border-l-app-danger',    dot: 'bg-app-danger',   hex: '#F43F5E' },
  JOINED:              { label: 'Joined',              badge: 'bg-app-emerald/10 text-app-emerald-soft', border: 'border-l-app-emerald',   dot: 'bg-app-emerald',  hex: '#10B981' },
}

export const appStatusLabel = (status) => APP_STATUS_CONFIG[status]?.label || status
export const appStatusHex = (status) => (APP_STATUS_CONFIG[status] || APP_STATUS_CONFIG.APPLIED).hex
