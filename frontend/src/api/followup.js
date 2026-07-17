import api, { unwrapPage } from './apiClient'

export const getFollowUpsForApplication = (applicationId) =>
  api.get(`/applications/${applicationId}/follow-ups`)

export const createFollowUp = (applicationId, data) =>
  api.post(`/applications/${applicationId}/follow-ups`, data)

export const getAllFollowUps = (params) => api.get('/follow-ups', { params }).then(unwrapPage)

export const getFollowUpsByCompany = (companyId, params) =>
  api.get('/follow-ups', { params: { companyId, ...params } }).then(unwrapPage)

export const getFollowUpCounts = () => api.get('/follow-ups/counts')

export const getUpcomingFollowUps = (withinDays = 7) =>
  api.get('/follow-ups/upcoming', { params: { withinDays } })

export const updateFollowUp = (id, data) => api.patch(`/follow-ups/${id}`, data)

export const deleteFollowUp = (id) => api.delete(`/follow-ups/${id}`)
