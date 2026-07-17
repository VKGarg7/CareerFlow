import api, { unwrapPage } from './apiClient'

export const getFollowUpsForApplication = (applicationId) =>
  api.get(`/applications/${applicationId}/follow-ups`)

export const createFollowUp = (applicationId, data) =>
  api.post(`/applications/${applicationId}/follow-ups`, data)

export const getAllFollowUps = (params) => api.get('/follow-ups', { params }).then(unwrapPage)

export const getFollowUpCounts = () => api.get('/follow-ups/counts')

export const updateFollowUp = (id, data) => api.patch(`/follow-ups/${id}`, data)

export const deleteFollowUp = (id) => api.delete(`/follow-ups/${id}`)
