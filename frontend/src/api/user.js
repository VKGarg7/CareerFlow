import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getProfile = () => api.get('/users/profile')
export const createProfile = (data) => api.post('/users/profile', data)
export const updateProfile = (data) => api.patch('/users/profile', data)

export const updateDocuments = (resume, coverLetter, deleteDocumentId) => {
  const fd = new FormData()
  if (resume) fd.append('resume', resume)
  if (coverLetter) fd.append('coverLetter', coverLetter)
  const params = deleteDocumentId ? { params: { deleteDocumentId } } : {}
  return api.patch('/users/profile/documents', fd, {
    ...params,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadDocument = (id) =>
  api.get(`/users/documents/${id}`, { responseType: 'blob' })
