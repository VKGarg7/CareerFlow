import api from './apiClient'

export const getRecruiters = (params) => api.get('/recruiters', { params })
export const getRecruiter  = (id)     => api.get('/recruiters', { params: { id } })
export const addRecruiter  = (data)   => api.post('/recruiters', data)
export const updateRecruiter = (id, data) => api.patch(`/recruiters/${id}`, data)
export const deleteRecruiter = (id)   => api.delete(`/recruiters/${id}`)
