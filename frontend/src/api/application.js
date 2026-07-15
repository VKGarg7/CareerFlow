import api, { unwrapPage } from './apiClient'

export const getApplications = (params) => api.get('/applications', { params }).then(unwrapPage)
export const getApplicationStats = () => api.get('/applications/stats')
export const addApplication = (data) => api.post('/applications', data)
export const updateApplication = (id, data) => api.patch(`/applications/${id}`, data)
export const deleteApplication = (id, documentId) =>
  api.delete(`/applications/${id}`, documentId != null ? { params: { documentId } } : undefined)

export const uploadApplicationDocuments = (id, { resume, coverLetter, profileResumeDocumentId } = {}) => {
  const fd = new FormData()
  if (resume) fd.append('resume', resume)
  if (coverLetter) fd.append('coverLetter', coverLetter)
  return api.patch(`/applications/${id}/documents`, fd, {
    params: profileResumeDocumentId != null ? { profileResumeDocumentId } : undefined,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadApplicationDocument = (documentId) =>
  api.get(`/applications/documents/${documentId}`, { responseType: 'blob' })

export const viewApplicationDocument = (documentId) =>
  api.get(`/applications/documents/${documentId}`, { params: { inline: true }, responseType: 'blob' })
