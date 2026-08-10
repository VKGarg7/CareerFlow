import api, { unwrapPage } from './apiClient'

export const getCoverLetters = (params) => api.get('/cover-letters', { params }).then(unwrapPage)
export const getCoverLetter = (id) => api.get('/cover-letters', { params: { id } }).then(r => unwrapPage(r).data[0])

export const addCoverLetter = ({ file, title, targetRoleCategory, notes, status }) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('metadata', new Blob([JSON.stringify({ title, targetRoleCategory, notes, status })], { type: 'application/json' }))
  return api.post('/cover-letters', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const updateCoverLetter = (id, data) => api.patch(`/cover-letters/${id}`, data)
export const deleteCoverLetter = (id, force = false) =>
  api.delete(`/cover-letters/${id}`, { params: { force } })

export const downloadCoverLetterDocument = (documentId) =>
  api.get(`/cover-letters/documents/${documentId}`, { responseType: 'blob' })

export const viewCoverLetterDocument = (documentId) =>
  api.get(`/cover-letters/documents/${documentId}`, { params: { inline: true }, responseType: 'blob' })
