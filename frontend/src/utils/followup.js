export const todayStr = () => new Date().toISOString().slice(0, 10)

export function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function fmt(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

export function fmtDateTime(dtStr) {
  if (!dtStr) return '—'
  return new Date(dtStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function daysLabel(dateStr) {
  const today = new Date(todayStr())
  const d = new Date(dateStr)
  const diff = Math.round((d - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)} days ago`
  return `In ${diff} days`
}
