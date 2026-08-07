import { useCallback, useEffect, useState } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'

export default function useFetchOnce(fetchFn, initialValue = null) {
  const [data, setData] = useState(initialValue)
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace()

  const fetch = useCallback(async () => {
    try {
      const res = await fetchFn()
      setData(res.data)
    } catch {
      // best-effort: leave previous value in place
    }
  }, [fetchFn])

  useEffect(() => {
    if (workspaceLoading || !activeWorkspaceId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dep change is the intended effect
    fetch()
  }, [fetch, activeWorkspaceId, workspaceLoading])

  return { data, setData, refetch: fetch }
}
