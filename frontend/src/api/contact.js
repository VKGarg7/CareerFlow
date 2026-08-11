import api, { unwrapPage } from './apiClient'

export const getContacts  = (params) => api.get('/contacts', { params }).then(unwrapPage)
export const getContact   = (id)     => api.get('/contacts', { params: { id } }).then(unwrapPage)
export const getContactStats = ()    => api.get('/contacts/stats')
export const getRelationshipTypeStats = () => api.get('/contacts/stats/relationship-type')
export const getSources = ()          => api.get('/contacts/sources')
export const getRelationshipTypes = () => api.get('/contacts/relationship-types')
export const addContact   = (data)   => api.post('/contacts', data)
export const updateContact = (id, data) => api.patch(`/contacts/${id}`, data)
export const deleteContact = (id, force = false) => api.delete(`/contacts/${id}`, { params: { force } })
