import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getRecruiters = (params) => api.get('/recruiters', { params })
export const addRecruiter = (data) => api.post('/recruiters', data)
export const updateRecruiter = (id, data) => api.patch(`/recruiters/${id}`, data)
export const deleteRecruiter = (id) => api.delete(`/recruiters/${id}`)
