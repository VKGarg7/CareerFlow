import { useCallback, useEffect, useState } from 'react'

// Centralizes the "fetch on mount/when deps change, expose a refetch, swallow
// errors" pattern used for stats endpoints and bulk "give me everything" list
// fetches. Pass a stable (memoized) `fetchFn` — its identity change re-fetches.
export default function useFetchOnce(fetchFn, initialValue = null) {
  const [data, setData] = useState(initialValue)

  const fetch = useCallback(async () => {
    try {
      const res = await fetchFn()
      setData(res.data)
    } catch {
      // best-effort: leave previous value in place
    }
  }, [fetchFn])

  useEffect(() => { fetch() }, [fetch])

  return { data, setData, refetch: fetch }
}
