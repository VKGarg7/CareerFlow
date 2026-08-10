import api, { unwrapPage } from './apiClient'

export const getOpportunities = (params) => api.get('/opportunities', { params }).then(unwrapPage)
export const addOpportunity = (data) => api.post('/opportunities', data)
export const updateOpportunity = (id, data) => api.patch(`/opportunities/${id}`, data)
export const deleteOpportunity = (id) => api.delete(`/opportunities/${id}`)
export const convertOpportunity = (id, data) => api.post(`/opportunities/${id}/convert`, data)
export const checkOpportunityDuplicates = (data) => api.post('/opportunities/check-duplicates', data)
export const getOpportunityResumeHistory = (id) => api.get(`/opportunities/${id}/resume-history`)
