import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useCrudModals from './useCrudModals'

describe('useCrudModals', () => {
  it('openAdd opens the modal with no edit target', () => {
    const { result } = renderHook(() => useCrudModals('Company', vi.fn(), []))

    act(() => result.current.openAdd())

    expect(result.current.modalOpen).toBe(true)
    expect(result.current.editTarget).toBeNull()
  })

  it('openEdit opens the modal with the given target', () => {
    const { result } = renderHook(() => useCrudModals('Company', vi.fn(), []))
    const company = { id: 1, name: 'Acme' }

    act(() => result.current.openEdit(company))

    expect(result.current.modalOpen).toBe(true)
    expect(result.current.editTarget).toBe(company)
  })

  it('handleSaved flashes "added" for a new entity and refetches', () => {
    const flash = vi.fn()
    const refetchA = vi.fn()
    const refetchB = vi.fn()
    const { result } = renderHook(() => useCrudModals('Company', flash, [refetchA, refetchB]))

    act(() => result.current.openAdd())
    act(() => result.current.handleSaved())

    expect(result.current.modalOpen).toBe(false)
    expect(flash).toHaveBeenCalledWith('Company added.')
    expect(refetchA).toHaveBeenCalled()
    expect(refetchB).toHaveBeenCalled()
  })

  it('handleSaved flashes "updated" when editing', () => {
    const flash = vi.fn()
    const { result } = renderHook(() => useCrudModals('Company', flash, []))

    act(() => result.current.openEdit({ id: 1 }))
    act(() => result.current.handleSaved())

    expect(flash).toHaveBeenCalledWith('Company updated.')
  })

  it('handleDeleted clears the target, flashes "removed", refetches, and runs onDeleted', () => {
    const flash = vi.fn()
    const refetch = vi.fn()
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useCrudModals('Company', flash, [refetch], { onDeleted }))

    act(() => result.current.setDeleteTarget({ id: 1 }))
    act(() => result.current.handleDeleted())

    expect(result.current.deleteTarget).toBeNull()
    expect(flash).toHaveBeenCalledWith('Company removed.')
    expect(refetch).toHaveBeenCalled()
    expect(onDeleted).toHaveBeenCalled()
  })
})
