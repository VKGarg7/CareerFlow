import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import useSearchShortcut from './useSearchShortcut'

describe('useSearchShortcut', () => {
  it('focuses the search input on Ctrl+K', () => {
    const focus = vi.fn()
    renderHook(() => useSearchShortcut({ current: { focus } }))

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('focuses on Cmd+K (metaKey)', () => {
    const focus = vi.fn()
    renderHook(() => useSearchShortcut({ current: { focus } }))

    fireEvent.keyDown(window, { key: 'K', metaKey: true })

    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('ignores K without a modifier', () => {
    const focus = vi.fn()
    renderHook(() => useSearchShortcut({ current: { focus } }))

    fireEvent.keyDown(window, { key: 'k' })

    expect(focus).not.toHaveBeenCalled()
  })

  it('does not crash when the ref is empty', () => {
    renderHook(() => useSearchShortcut({ current: null }))

    expect(() => fireEvent.keyDown(window, { key: 'k', ctrlKey: true })).not.toThrow()
  })

  it('stops listening after unmount', () => {
    const focus = vi.fn()
    const { unmount } = renderHook(() => useSearchShortcut({ current: { focus } }))

    unmount()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

    expect(focus).not.toHaveBeenCalled()
  })
})
