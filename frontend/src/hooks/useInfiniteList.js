import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'

export default function useInfiniteList(fetchFn, errorMessage, pageSize = 20) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [meta, setMeta] = useState({ totalPages: 0, totalElements: 0 })
  const [refetchToken, setRefetchToken] = useState(0)
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace()
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting on filter change is intended
    setPage(0)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems([])
  }, [fetchFn])

  useEffect(() => {
    if (workspaceLoading || !activeWorkspaceId) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dep change is the intended effect
    if (page === 0) setLoading(true)
    else setLoadingMore(true)

    fetchFnRef.current(page, pageSize)
      .then((res) => {
        if (cancelled) return
        const data = res.data
        setItems((prev) => (page === 0 ? data : [...prev, ...data]))
        setMeta({ totalPages: data.totalPages ?? 0, totalElements: data.totalElements ?? data.length })
        setError('')
      })
      .catch(() => {
        if (!cancelled) setError(errorMessage)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
        setLoadingMore(false)
      })
    return () => { cancelled = true }
  }, [page, pageSize, errorMessage, refetchToken, activeWorkspaceId, workspaceLoading])

  const hasMore = page + 1 < meta.totalPages
  const loadMore = useCallback(() => {
    setPage((p) => (p + 1 < meta.totalPages ? p + 1 : p))
  }, [meta.totalPages])

  const refetch = useCallback(() => {
    setPage(0)
    setRefetchToken((t) => t + 1)
  }, [])

  return {
    items, setItems, loading, loadingMore, error, setError,
    hasMore, loadMore, refetch, totalElements: meta.totalElements,
  }
}
