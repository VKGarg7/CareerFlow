import api, { unwrapPage } from './apiClient'

export const getActionItems      = (params)       => api.get('/action-items', { params }).then(unwrapPage)
export const getActionItem       = (id)           =>
  api.get('/action-items', { params: { id } }).then((res) => ({ ...res, data: res.data.content[0] }))
export const getActionItemsForEntity = (entityType, entityId) => api.get('/action-items/for-entity', { params: { entityType, entityId } })
export const addActionItem       = (data)         => api.post('/action-items', data)
export const updateActionItem    = (id, data)     => api.patch(`/action-items/${id}`, data)
export const completeActionItem  = (id)           => api.patch(`/action-items/${id}/complete`)
export const snoozeActionItem    = (id, until)     => api.patch(`/action-items/${id}/snooze`, null, { params: { until } })
export const cancelActionItem    = (id)           => api.patch(`/action-items/${id}/cancel`)
export const deleteActionItem    = (id)           => api.delete(`/action-items/${id}`)
