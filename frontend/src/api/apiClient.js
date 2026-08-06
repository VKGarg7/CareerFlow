import axios from 'axios'

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api' })

const WORKSPACE_SCOPED_PREFIXES = ['/companies', '/applications', '/recruiters', '/referrals', '/follow-ups', '/interviews', '/chat/sessions']

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const workspaceId = localStorage.getItem('cf_active_workspace')
  if (workspaceId && WORKSPACE_SCOPED_PREFIXES.some((p) => config.url?.startsWith(p))) {
    config.params = { ...config.params, workspaceId }
  }
  return config
})

export default apiClient
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
