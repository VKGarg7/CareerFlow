import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import useFetchOnce from './useFetchOnce'

describe('useFetchOnce', () => {
  it('fetches on mount and exposes the response data', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: { total: 5 } })
    const { result } = renderHook(() => useFetchOnce(fetchFn))

    await waitFor(() => expect(result.current.data).toEqual({ total: 5 }))
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('starts with the provided initial value', () => {
    const fetchFn = vi.fn().mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useFetchOnce(fetchFn, []))

    expect(result.current.data).toEqual([])
  })

  it('keeps the previous value when the fetch fails', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useFetchOnce(fetchFn, 'fallback'))

    await waitFor(() => expect(fetchFn).toHaveBeenCalled())
    expect(result.current.data).toBe('fallback')
  })

  it('refetch fetches again', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: 1 })
    const { result } = renderHook(() => useFetchOnce(fetchFn))

    await waitFor(() => expect(result.current.data).toBe(1))
    await act(() => result.current.refetch())

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('refetches when fetchFn identity changes', async () => {
    const fetchA = vi.fn().mockResolvedValue({ data: 'a' })
    const fetchB = vi.fn().mockResolvedValue({ data: 'b' })
    const { result, rerender } = renderHook(({ fn }) => useFetchOnce(fn),
      { initialProps: { fn: fetchA } })

    await waitFor(() => expect(result.current.data).toBe('a'))
    rerender({ fn: fetchB })

    await waitFor(() => expect(result.current.data).toBe('b'))
  })
})
