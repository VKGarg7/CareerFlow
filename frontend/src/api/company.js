import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getCompanies = (params) => api.get('/companies', { params })
export const getCompany = (id) => api.get('/companies', { params: { id } }).then(r => r.data[0])
export const addCompany = (data) => api.post('/companies', data)
export const updateCompany = (id, data) => api.patch(`/companies/${id}`, data)
export const deleteCompany = (id, force = false) =>
  api.delete(`/companies/${id}`, { params: { force } })
