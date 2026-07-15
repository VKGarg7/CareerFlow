import { useCallback, useEffect, useState } from 'react'

// Centralizes the fetch/loading/error/page-reset boilerplate shared by every
// server-paginated list page (Companies, Applications, Recruiters, Referrals).
//
// Pass a `fetchFn(page)` memoized with useCallback over your filter/sort state
// (NOT including `page` itself) — its identity changing signals "filters changed,
// go back to page 0". `fetchFn` must resolve to an axios response whose `.data`
// is the array produced by apiClient's `unwrapPage` (carries page/size/totalElements/totalPages).
export default function usePagedList(fetchFn, errorMessage) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => { setPage(0) }, [fetchFn])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchFn(page)
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
  }, [fetchFn, page, errorMessage, refetchToken])

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), [])

  return { items, setItems, loading, error, setError, page, setPage, refetch }
}
