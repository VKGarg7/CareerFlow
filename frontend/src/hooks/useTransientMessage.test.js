import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useTransientMessage from './useTransientMessage'

describe('useTransientMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with an empty message', () => {
    const { result } = renderHook(() => useTransientMessage())

    expect(result.current[0]).toBe('')
  })

  it('shows a message, then clears it after the timeout', () => {
    const { result } = renderHook(() => useTransientMessage(3000))

    act(() => result.current[1]('Saved!'))
    expect(result.current[0]).toBe('Saved!')

    act(() => vi.advanceTimersByTime(3000))
    expect(result.current[0]).toBe('')
  })

  it('keeps the message before the timeout elapses', () => {
    const { result } = renderHook(() => useTransientMessage(3000))

    act(() => result.current[1]('Saved!'))
    act(() => vi.advanceTimersByTime(2999))

    expect(result.current[0]).toBe('Saved!')
  })

  it('respects a custom duration', () => {
    const { result } = renderHook(() => useTransientMessage(500))

    act(() => result.current[1]('Quick'))
    act(() => vi.advanceTimersByTime(500))

    expect(result.current[0]).toBe('')
  })
})
