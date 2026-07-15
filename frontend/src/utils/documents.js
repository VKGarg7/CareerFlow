export function fmtFileSize(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export const isAllowedDocExt = (file) =>
  ['pdf', 'doc', 'docx'].includes(file.name.split('.').pop().toLowerCase())

export async function openDocInNewTab(fetchFn, doc) {
  try {
    const res = await fetchFn(doc)
    const url = URL.createObjectURL(new Blob([res.data], { type: doc.contentType }))
    window.open(url, '_blank')
  } catch {}
}

export async function downloadDoc(fetchFn, doc) {
  try {
    const res = await fetchFn(doc)
    const url = URL.createObjectURL(new Blob([res.data], { type: doc.contentType }))
    const a = document.createElement('a')
    a.href = url; a.download = doc.originalName; a.click()
    URL.revokeObjectURL(url)
  } catch {}
}
