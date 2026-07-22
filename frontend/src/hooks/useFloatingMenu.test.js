import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import useFloatingMenu from './useFloatingMenu'

// jsdom viewport defaults: innerWidth 1024, innerHeight 768.
// The ref must be a stable object (it sits in the hook's dep array), so create it
// once per test and pass the same instance to every render.
const triggerAt = (rect) => ({
  current: { getBoundingClientRect: () => ({ width: 100, height: 40, ...rect }) },
})

const renderMenu = (open, ref, options) =>
  renderHook(({ o }) => useFloatingMenu(o, ref, options), { initialProps: { o: open } })

describe('useFloatingMenu', () => {
  it('returns null while closed', () => {
    const ref = triggerAt({ top: 100, bottom: 140, left: 50, right: 150 })
    const { result } = renderMenu(false, ref)

    expect(result.current).toBeNull()
  })

  it('opens below the trigger when there is room', () => {
    const ref = triggerAt({ top: 100, bottom: 140, left: 50, right: 150 })
    const { result } = renderMenu(true, ref)

    expect(result.current.top).toBe(146) // bottom + default gap 6
    expect(result.current.bottom).toBeUndefined()
    expect(result.current.left).toBe(50)
    expect(result.current.width).toBe(100) // defaults to trigger width
  })

  it('flips upward when space below is under the threshold', () => {
    const ref = triggerAt({ top: 700, bottom: 740, left: 50, right: 150 })
    const { result } = renderMenu(true, ref)

    expect(result.current.bottom).toBe(768 - 700 + 6)
    expect(result.current.top).toBeUndefined()
  })

  it('clamps left so the menu stays inside the viewport', () => {
    const ref = triggerAt({ top: 100, bottom: 140, left: 1000, right: 1100 })
    const { result } = renderMenu(true, ref, { width: 200 })

    expect(result.current.left).toBe(1024 - 200 - 8) // viewport - width - padding
  })

  it('caps maxHeight when maxHeightCap is provided', () => {
    const ref = triggerAt({ top: 100, bottom: 140, left: 50, right: 150 })
    const { result } = renderMenu(true, ref, { maxHeightCap: 300 })

    expect(result.current.maxHeight).toBe(300)
  })

  it('omits maxHeight when no cap is given', () => {
    const ref = triggerAt({ top: 100, bottom: 140, left: 50, right: 150 })
    const { result } = renderMenu(true, ref)

    expect(result.current.maxHeight).toBeUndefined()
  })

  it('resolves width from a function of the trigger rect', () => {
    const ref = triggerAt({ top: 100, bottom: 140, left: 50, right: 150 })
    const width = (rect) => rect.width * 2
    const { result } = renderMenu(true, ref, { width })

    expect(result.current.width).toBe(200)
  })
})
