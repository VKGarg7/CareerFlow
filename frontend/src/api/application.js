import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getApplications = (params) => api.get('/applications', { params })
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
