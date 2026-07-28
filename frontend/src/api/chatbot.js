import api from './apiClient'

export const listChatSessions = () => api.get('/chat/sessions')
export const createChatSession = (jobApplicationId) =>
  api.post('/chat/sessions', jobApplicationId != null ? { jobApplicationId } : {})
export const getChatMessages = (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`)
export const sendChatMessage = (sessionId, content) =>
  api.post(`/chat/sessions/${sessionId}/messages`, { content })
export const deleteChatSession = (sessionId) => api.delete(`/chat/sessions/${sessionId}`)
