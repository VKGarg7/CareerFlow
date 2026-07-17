import api, { unwrapPage } from './apiClient'

export const getRecruiters = (params) => api.get('/recruiters', { params }).then(unwrapPage)
export const getRecruiter  = (id)     => api.get('/recruiters', { params: { id } }).then(unwrapPage)
export const getRecruiterStats = ()   => api.get('/recruiters/stats')
export const getRecruiterSources = () => api.get('/recruiters/sources')
export const addRecruiter  = (data)   => api.post('/recruiters', data)
export const updateRecruiter = (id, data) => api.patch(`/recruiters/${id}`, data)
export const deleteRecruiter = (id)   => api.delete(`/recruiters/${id}`)
