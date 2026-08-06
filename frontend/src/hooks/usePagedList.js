import { useCallback, useEffect, useState } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'

export default function usePagedList(fetchFn, errorMessage, defaultSize = 10) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(defaultSize)
  const [refetchToken, setRefetchToken] = useState(0)
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to page 0 when filters (fetchFn identity) change is the intended effect
    setPage(0)
  }, [fetchFn])

  useEffect(() => {
    if (workspaceLoading || !activeWorkspaceId) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dep change is the intended effect
    setLoading(true)
    fetchFn(page, size)
      .then((res) => {
        if (cancelled) return
        setItems(res.data)
        setError('')
      })
      .catch(() => {
        if (!cancelled) setError(errorMessage)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [fetchFn, page, size, errorMessage, refetchToken, activeWorkspaceId, workspaceLoading])

  const changeSize = useCallback((newSize) => {
    setSize(newSize)
    setPage(0)
  }, [])

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), [])

  return { items, setItems, loading, error, setError, page, setPage, size, setSize: changeSize, refetch }
}
