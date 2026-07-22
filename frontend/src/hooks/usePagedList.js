import { useCallback, useEffect, useState } from 'react'

// Centralizes the fetch/loading/error/page-reset boilerplate shared by every
// server-paginated list page (Companies, Applications, Recruiters, Referrals).
//
// Pass a `fetchFn(page, size)` memoized with useCallback over your filter/sort state
// (NOT including `page`/`size` themselves) — its identity changing signals "filters
// changed, go back to page 0". `fetchFn` must resolve to an axios response whose
// `.data` is the array produced by apiClient's `unwrapPage` (carries page/size/totalElements/totalPages).
export default function usePagedList(fetchFn, errorMessage, defaultSize = 10) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(defaultSize)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => { setPage(0) }, [fetchFn])

  useEffect(() => {
    let cancelled = false
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
  }, [fetchFn, page, size, errorMessage, refetchToken])

  const changeSize = useCallback((newSize) => {
    setSize(newSize)
    setPage(0)
  }, [])

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), [])

  return { items, setItems, loading, error, setError, page, setPage, size, setSize: changeSize, refetch }
}
