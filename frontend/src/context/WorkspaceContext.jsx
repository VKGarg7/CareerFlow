import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getWorkspaces } from '../api/workspace'

const ACTIVE_WORKSPACE_KEY = 'cf_active_workspace'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(
    () => localStorage.getItem(ACTIVE_WORKSPACE_KEY) || null
  )
  const [loading, setLoading] = useState(true)

  const setActiveWorkspaceId = useCallback((id) => {
    setActiveWorkspaceIdState(id)
    if (id == null) localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
    else localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
  }, [])

  const refetch = useCallback(() => {
    if (!localStorage.getItem('token')) {
      setWorkspaces([])
      setLoading(false)
      return Promise.resolve([])
    }
    return getWorkspaces({ sortBy: 'createdAt', order: 'asc', size: 1000 })
      .then((res) => {
        const list = res.data || []
        setWorkspaces(list)
        setActiveWorkspaceIdState((current) => {
          const stillExists = current && list.some((w) => String(w.id) === String(current))
          if (stillExists) return current
          const fallback = list.find((w) => w.isDefault) || list[0]
          const nextId = fallback ? String(fallback.id) : null
          if (nextId) localStorage.setItem(ACTIVE_WORKSPACE_KEY, nextId)
          else localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
          return nextId
        })
        return list
      })
      .catch(() => { setWorkspaces([]); return [] })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const activeWorkspace = workspaces.find((w) => String(w.id) === String(activeWorkspaceId)) || null

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, loading, refetch }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return ctx
}
