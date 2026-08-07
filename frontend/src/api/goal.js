import api, { unwrapPage } from './apiClient'

export const getGoals = (params) => api.get('/goals', { params }).then(unwrapPage)
export const addGoal = (data) => api.post('/goals', data)
export const updateGoal = (id, data) => api.patch(`/goals/${id}`, data)
export const deleteGoal = (id) => api.delete(`/goals/${id}`)
