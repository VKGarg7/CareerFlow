import api, { unwrapPage } from './apiClient'

export const getPlatformStats = ()               => api.get('/admin/stats')
export const getAllUsers      = (params)         => api.get('/admin/users', { params }).then(unwrapPage)
export const setUserActive    = (id, active)     => api.patch(`/admin/users/${id}/status`, { active })
export const setUserRole      = (id, role)       => api.patch(`/admin/users/${id}/role`, { role })
export const getAuditLogs     = (params)         => api.get('/admin/audit-logs', { params }).then(unwrapPage)
export const getSystemHealth  = ()               => api.get('/admin/health')
