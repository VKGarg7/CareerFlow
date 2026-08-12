import api, { unwrapPage } from './apiClient'

export const getFollowUpRules  = (params)   => api.get('/follow-up-rules', { params }).then(unwrapPage)
export const addFollowUpRule   = (data)     => api.post('/follow-up-rules', data)
export const updateFollowUpRule = (id, data) => api.patch(`/follow-up-rules/${id}`, data)
export const deleteFollowUpRule = (id)      => api.delete(`/follow-up-rules/${id}`)
