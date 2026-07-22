import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import useCloseOnOutsideEvent from './useCloseOnOutsideEvent'

describe('useCloseOnOutsideEvent', () => {
  let inside
  let outside

  beforeEach(() => {
    document.body.innerHTML = ''
    inside = document.createElement('div')
    outside = document.createElement('div')
    document.body.append(inside, outside)
  })

  const refsFor = (el) => [{ current: el }]

  it('calls onClose when clicking outside the given refs', () => {
    const onClose = vi.fn()
    renderHook(() => useCloseOnOutsideEvent(true, onClose, refsFor(inside)))

    fireEvent.mouseDown(outside)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside a ref', () => {
    const onClose = vi.fn()
    renderHook(() => useCloseOnOutsideEvent(true, onClose, refsFor(inside)))

    fireEvent.mouseDown(inside)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    renderHook(() => useCloseOnOutsideEvent(true, onClose, refsFor(inside)))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores other keys', () => {
    const onClose = vi.fn()
    renderHook(() => useCloseOnOutsideEvent(true, onClose, refsFor(inside)))

    fireEvent.keyDown(document, { key: 'Enter' })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('does nothing when closed', () => {
    const onClose = vi.fn()
    renderHook(() => useCloseOnOutsideEvent(false, onClose, refsFor(inside)))

    fireEvent.mouseDown(outside)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', () => {
    const onClose = vi.fn()
    const { unmount } = renderHook(() => useCloseOnOutsideEvent(true, onClose, refsFor(inside)))

    unmount()
    fireEvent.mouseDown(outside)

    expect(onClose).not.toHaveBeenCalled()
  })
})
