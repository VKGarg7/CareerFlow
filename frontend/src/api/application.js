import api, { unwrapPage } from './apiClient'

export const getApplications = (params) => api.get('/applications', { params }).then(unwrapPage)
export const getApplicationStats = () => api.get('/applications/stats')
export const getApplicationRoles = () => api.get('/applications/roles')
export const getMonthlyTrend = () => api.get('/applications/monthly-trend')
export const getSourceAnalysis = () => api.get('/applications/source-analysis')
export const getResumeAnalysis = (roleCategory) => api.get('/applications/resume-analysis', { params: roleCategory ? { roleCategory } : undefined })
export const getWeeklyTrend = (days = 14) => api.get('/applications/weekly-trend', { params: { days } })
export const getUpcomingDeadlines = (withinDays = 7) => api.get('/applications/deadlines', { params: { withinDays } })
export const getStaleApplications = () => api.get('/applications/stale')
export const dismissStaleApplication = (id) => api.patch(`/applications/${id}/stale/dismiss`)
export const markStaleNoResponse = (id) => api.patch(`/applications/${id}/stale/no-response`)
export const addApplication = (data) => api.post('/applications', data)
export const updateApplication = (id, data) => api.patch(`/applications/${id}`, data)
export const deleteApplication = (id, documentId) =>
  api.delete(`/applications/${id}`, documentId != null ? { params: { documentId } } : undefined)

export const uploadApplicationDocuments = (id, { resume, coverLetter, profileResumeDocumentId, resumeLibraryId, coverLetterLibraryId } = {}) => {
  const fd = new FormData()
  if (resume) fd.append('resume', resume)
  if (coverLetter) fd.append('coverLetter', coverLetter)
  const params = {}
  if (profileResumeDocumentId != null) params.profileResumeDocumentId = profileResumeDocumentId
  if (resumeLibraryId != null) params.resumeLibraryId = resumeLibraryId
  if (coverLetterLibraryId != null) params.coverLetterLibraryId = coverLetterLibraryId
  return api.patch(`/applications/${id}/documents`, fd, {
    params: Object.keys(params).length ? params : undefined,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadApplicationDocument = (documentId) =>
  api.get(`/applications/documents/${documentId}`, { responseType: 'blob' })

export const viewApplicationDocument = (documentId) =>
  api.get(`/applications/documents/${documentId}`, { params: { inline: true }, responseType: 'blob' })

export const getApplicationResumeHistory = (id) => api.get(`/applications/${id}/resume-history`)
