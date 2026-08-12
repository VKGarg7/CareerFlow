import api, { unwrapPage } from './apiClient'

export const getWorkspaceTimeline = (params) => api.get('/timeline', { params }).then(unwrapPage)
export const getEntityTimeline = (entityType, entityId, params) =>
  api.get('/timeline/for-entity', { params: { entityType, entityId, ...params } }).then(unwrapPage)
