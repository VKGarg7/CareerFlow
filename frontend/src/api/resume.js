import api, { unwrapPage } from './apiClient'

export const getResumes = (params) => api.get('/resumes', { params }).then(unwrapPage)
export const getResume = (id) => api.get('/resumes', { params: { id } }).then(r => unwrapPage(r).data[0])

export const addResume = ({ file, title, versionTag, targetRoleCategory, notes, status }) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('metadata', new Blob([JSON.stringify({ title, versionTag, targetRoleCategory, notes, status })], { type: 'application/json' }))
  return api.post('/resumes', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const updateResume = (id, data) => api.patch(`/resumes/${id}`, data)
export const deleteResume = (id, force = false) =>
  api.delete(`/resumes/${id}`, { params: { force } })

export const downloadResumeDocument = (documentId) =>
  api.get(`/resumes/documents/${documentId}`, { responseType: 'blob' })

export const viewResumeDocument = (documentId) =>
  api.get(`/resumes/documents/${documentId}`, { params: { inline: true }, responseType: 'blob' })
