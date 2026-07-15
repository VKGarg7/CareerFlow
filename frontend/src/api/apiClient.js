import axios from 'axios'

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api' })

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default apiClient

// Unwraps a paginated PageResponse ({ content, page, size, totalElements, totalPages, last })
// into a plain array carrying the pagination metadata as extra properties, so existing
// `res.data.map(...)` / `res.data.length` call sites keep working unchanged while
// `res.data.totalElements` etc. remain available for pages that add pagination controls.
export const unwrapPage = (res) => {
  const body = res.data
  const content = Array.isArray(body?.content) ? body.content : []
  return {
    ...res,
    data: Object.assign(content, {
      page: body?.page ?? 0,
      size: body?.size ?? content.length,
      totalElements: body?.totalElements ?? content.length,
      totalPages: body?.totalPages ?? 1,
      last: body?.last ?? true,
    }),
  }
}
