import api, { unwrapPage } from './apiClient'

export const getMyActivity = (params) => api.get('/audit-logs/me', { params }).then(unwrapPage)
