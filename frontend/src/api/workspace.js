import api from './apiClient'

export const getWorkspaces = (params) => api.get('/workspaces', { params })
export const getWorkspace = (id) => api.get('/workspaces', { params: { id } }).then(r => r.data[0])
export const addWorkspace = (data) => api.post('/workspaces', data)
export const updateWorkspace = (id, data) => api.patch(`/workspaces/${id}`, data)
export const deleteWorkspace = (id) => api.delete(`/workspaces/${id}`)
