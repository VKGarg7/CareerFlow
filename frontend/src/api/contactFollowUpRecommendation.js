import api, { unwrapPage } from './apiClient'

export const getRecommendations = (params) => api.get('/contact-follow-up-recommendations', { params }).then(unwrapPage)
export const dismissRecommendation = (id) => api.post(`/contact-follow-up-recommendations/${id}/dismiss`)
export const convertRecommendation = (id) => api.post(`/contact-follow-up-recommendations/${id}/convert`)
