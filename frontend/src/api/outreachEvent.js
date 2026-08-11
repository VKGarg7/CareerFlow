import api, { unwrapPage } from './apiClient'

export const getOutreachEvents = (params) => api.get('/outreach-events', { params }).then(unwrapPage)
export const addOutreachEvent = (data) => api.post('/outreach-events', data)
export const updateOutreachEvent = (id, data) => api.patch(`/outreach-events/${id}`, data)
export const deleteOutreachEvent = (id) => api.delete(`/outreach-events/${id}`)
