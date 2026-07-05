import api from './apiClient'

export const getMyActivity = (params) => api.get('/audit-logs/me', { params })
