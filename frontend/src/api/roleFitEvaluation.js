import api from './apiClient'

export const getRoleFitEvaluationForOpportunity = (opportunityId) =>
  api.get('/role-fit-evaluations', { params: { opportunityId } })
export const addRoleFitEvaluation = (data) => api.post('/role-fit-evaluations', data)
export const updateRoleFitEvaluation = (id, data) => api.patch(`/role-fit-evaluations/${id}`, data)
export const overrideRoleFitEvaluation = (id, data) => api.patch(`/role-fit-evaluations/${id}/override`, data)
export const deleteRoleFitEvaluation = (id) => api.delete(`/role-fit-evaluations/${id}`)
