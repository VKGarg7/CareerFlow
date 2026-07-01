import api from './apiClient'

export const getCompanies = (params) => api.get('/companies', { params })
export const getCompany = (id) => api.get('/companies', { params: { id } }).then(r => r.data[0])
export const addCompany = (data) => api.post('/companies', data)
export const updateCompany = (id, data) => api.patch(`/companies/${id}`, data)
export const deleteCompany = (id, force = false) =>
  api.delete(`/companies/${id}`, { params: { force } })
