import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import usePagedList from './usePagedList'

const pageOf = (items) => ({ data: items })

describe('usePagedList', () => {
  it('loads items on mount and clears loading', async () => {
    const fetchFn = vi.fn().mockResolvedValue(pageOf([{ id: 1 }]))
    const { result } = renderHook(() => usePagedList(fetchFn, 'Failed to load'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toEqual([{ id: 1 }])
    expect(result.current.error).toBe('')
    expect(fetchFn).toHaveBeenCalledWith(0, 10)
  })

  it('sets the error message when the fetch fails', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => usePagedList(fetchFn, 'Failed to load'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to load')
  })

  it('refetches with the new page when page changes', async () => {
    const fetchFn = vi.fn().mockResolvedValue(pageOf([]))
    const { result } = renderHook(() => usePagedList(fetchFn, 'err'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setPage(2))

    await waitFor(() => expect(fetchFn).toHaveBeenCalledWith(2, 10))
  })

  it('resets to page 0 when size changes', async () => {
    const fetchFn = vi.fn().mockResolvedValue(pageOf([]))
    const { result } = renderHook(() => usePagedList(fetchFn, 'err'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setPage(3))
    await waitFor(() => expect(fetchFn).toHaveBeenCalledWith(3, 10))

    act(() => result.current.setSize(25))

    await waitFor(() => expect(fetchFn).toHaveBeenCalledWith(0, 25))
    expect(result.current.page).toBe(0)
  })

  it('resets to page 0 when fetchFn identity changes (filters changed)', async () => {
    const fetchA = vi.fn().mockResolvedValue(pageOf([]))
    const fetchB = vi.fn().mockResolvedValue(pageOf([]))
    const { result, rerender } = renderHook(({ fn }) => usePagedList(fn, 'err'),
      { initialProps: { fn: fetchA } })

    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setPage(4))
    await waitFor(() => expect(fetchA).toHaveBeenCalledWith(4, 10))

    rerender({ fn: fetchB })

    await waitFor(() => expect(fetchB).toHaveBeenCalledWith(0, 10))
    expect(result.current.page).toBe(0)
  })

  it('refetch triggers another fetch with the same page and size', async () => {
    const fetchFn = vi.fn().mockResolvedValue(pageOf([]))
    const { result } = renderHook(() => usePagedList(fetchFn, 'err'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    const callsBefore = fetchFn.mock.calls.length

    act(() => result.current.refetch())

    await waitFor(() => expect(fetchFn.mock.calls.length).toBe(callsBefore + 1))
  })

  it('uses the provided default size', async () => {
    const fetchFn = vi.fn().mockResolvedValue(pageOf([]))
    renderHook(() => usePagedList(fetchFn, 'err', 50))

    await waitFor(() => expect(fetchFn).toHaveBeenCalledWith(0, 50))
  })
})
