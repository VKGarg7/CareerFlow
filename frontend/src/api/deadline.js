import api, { unwrapPage } from './apiClient'

export const getDeadlines          = (params)       => api.get('/deadlines', { params }).then(unwrapPage)
export const getUpcomingDeadlines  = (withinDays = 14) => api.get('/deadlines/upcoming', { params: { withinDays } })
export const getDeadlinesForEntity = (entityType, entityId) => api.get('/deadlines/for-entity', { params: { entityType, entityId } })
export const addDeadline           = (data)         => api.post('/deadlines', data)
export const updateDeadline        = (id, data)     => api.patch(`/deadlines/${id}`, data)
export const completeDeadline      = (id)           => api.patch(`/deadlines/${id}/complete`)
export const cancelDeadline        = (id)           => api.patch(`/deadlines/${id}/cancel`)
export const deleteDeadline        = (id)           => api.delete(`/deadlines/${id}`)
