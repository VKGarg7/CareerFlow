import { useEffect, useRef } from 'react'
import { CircularProgress } from '@mui/material'

export default function InfiniteScrollSentinel({ hasMore, loading, onLoadMore }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!hasMore) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore() },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  if (!hasMore) return null

  return (
    <div ref={ref} className="flex items-center justify-center py-8">
      {loading && <CircularProgress size={22} sx={{ color: '#8184F5' }} />}
    </div>
  )
}
