import api from './apiClient'

export const getInterviewsForApplication = (applicationId) =>
  api.get(`/applications/${applicationId}/interviews`)

export const createInterview = (applicationId, data) =>
  api.post(`/applications/${applicationId}/interviews`, data)

export const updateInterview = (id, data) =>
  api.patch(`/interviews/${id}`, data)

export const deleteInterview = (id) =>
  api.delete(`/interviews/${id}`)
