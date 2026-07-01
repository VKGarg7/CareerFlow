import api from './apiClient'

export const getProfile    = ()     => api.get('/users/profile')
export const createProfile = (data) => api.post('/users/profile', data)
export const updateProfile = (data) => api.patch('/users/profile', data)

// Single endpoint for all document operations on the profile
export const updateProfileDocuments = ({ resume, coverLetter, deleteDocumentId } = {}) => {
  const fd = new FormData()
  if (resume) fd.append('resume', resume)
  if (coverLetter) fd.append('coverLetter', coverLetter)
  return api.patch('/users/profile/documents', fd, {
    params: deleteDocumentId != null ? { deleteDocumentId } : undefined,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadProfileDocument = (id, inline = false) =>
  api.get(`/users/documents/${id}`, {
    params: inline ? { inline: true } : undefined,
    responseType: 'blob',
  })
