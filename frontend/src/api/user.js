import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

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
