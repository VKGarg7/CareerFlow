import api from './apiClient'

export const getTodayView = () => api.get('/today')
