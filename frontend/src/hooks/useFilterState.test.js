import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import useFilterState from './useFilterState'

describe('useFilterState', () => {
  it('reports no filters when search is blank and pairs are empty', () => {
    const { result } = renderHook(() =>
      useFilterState('', vi.fn(), [['', vi.fn()], ['', vi.fn()]]))

    expect(result.current.activeFilterCount).toBe(0)
    expect(result.current.isFiltered).toBe(false)
  })

  it('counts active filter pairs', () => {
    const { result } = renderHook(() =>
      useFilterState('', vi.fn(), [['ACTIVE', vi.fn()], ['', vi.fn()], ['NEW', vi.fn()]]))

    expect(result.current.activeFilterCount).toBe(2)
    expect(result.current.isFiltered).toBe(true)
  })

  it('treats non-blank search as filtered even with no pairs active', () => {
    const { result } = renderHook(() =>
      useFilterState('acme', vi.fn(), [['', vi.fn()]]))

    expect(result.current.activeFilterCount).toBe(0)
    expect(result.current.isFiltered).toBe(true)
  })

  it('ignores whitespace-only search', () => {
    const { result } = renderHook(() =>
      useFilterState('   ', vi.fn(), []))

    expect(result.current.isFiltered).toBe(false)
  })

  it('clearAllFilters resets search and every filter pair', () => {
    const setSearch = vi.fn()
    const setStatus = vi.fn()
    const setSource = vi.fn()
    const { result } = renderHook(() =>
      useFilterState('acme', setSearch, [['ACTIVE', setStatus], ['REFERRAL', setSource]]))

    result.current.clearAllFilters()

    expect(setSearch).toHaveBeenCalledWith('')
    expect(setStatus).toHaveBeenCalledWith('')
    expect(setSource).toHaveBeenCalledWith('')
  })
})
