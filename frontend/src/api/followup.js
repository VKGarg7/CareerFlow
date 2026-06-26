import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getFollowUpsForApplication = (applicationId) =>
  api.get(`/applications/${applicationId}/follow-ups`)

export const createFollowUp = (applicationId, data) =>
  api.post(`/applications/${applicationId}/follow-ups`, data)

export const getAllFollowUps = (params) => api.get('/follow-ups', { params })

export const updateFollowUp = (id, data) => api.patch(`/follow-ups/${id}`, data)

export const deleteFollowUp = (id) => api.delete(`/follow-ups/${id}`)
