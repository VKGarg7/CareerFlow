import api, { unwrapPage } from './apiClient'

export const searchResearchNotes = (params) => api.get('/research-notes', { params }).then(unwrapPage)
export const getResearchNotesForCompany = (companyId) =>
  api.get(`/research-notes/by-company/${companyId}`)
export const addResearchNote = (data) => api.post('/research-notes', data)
export const updateResearchNote = (id, data) => api.patch(`/research-notes/${id}`, data)
export const deleteResearchNote = (id) => api.delete(`/research-notes/${id}`)
