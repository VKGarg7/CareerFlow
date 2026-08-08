import api from './apiClient'

export const getStrategyPlan = (opportunityId) =>
  api.get('/strategy-items', { params: { opportunityId } })
export const addStrategyItem = (data) => api.post('/strategy-items', data)
export const updateStrategyItem = (id, data) => api.patch(`/strategy-items/${id}`, data)
export const reorderStrategyItems = (opportunityId, orderedItemIds) =>
  api.put('/strategy-items/reorder', { orderedItemIds }, { params: { opportunityId } })
export const deleteStrategyItem = (id) => api.delete(`/strategy-items/${id}`)
