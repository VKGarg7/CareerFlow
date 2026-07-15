import api, { unwrapPage } from './apiClient'

export const getReferrals  = (params)       => api.get('/referrals', { params }).then(unwrapPage)
export const getReferralStats = ()          => api.get('/referrals/stats')
export const getReferral   = (id)           => api.get(`/referrals/${id}`)
export const addReferral   = (data)         => api.post('/referrals', data)
export const updateReferral = (id, data)    => api.patch(`/referrals/${id}`, data)
export const deleteReferral = (id)          => api.delete(`/referrals/${id}`)
export const manageNote    = (id, data)     => api.patch(`/referrals/${id}/notes`, data)
