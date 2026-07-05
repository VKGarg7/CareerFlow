export function fmtDateTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function actionOptions(logs) {
  return Array.from(new Set(logs.map((l) => l.action))).sort()
}
