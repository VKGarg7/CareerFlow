import api from './apiClient'

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')

export const oauthLoginUrl = (provider) => `${API_ROOT}/oauth2/authorization/${provider}`

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const forgotPassword = (data) => api.post('/auth/forgot-password', data)
export const resetPassword = (data) => api.post('/auth/reset-password', data)
export const changePassword = (data) => api.post('/auth/change-password', data)
export const logout = () => api.post('/auth/logout')
