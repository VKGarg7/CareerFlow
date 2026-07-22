import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import useAddQueryParam from './useAddQueryParam'

const wrapperWith = (initialEntry) => ({ children }) => (
  <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
)

describe('useAddQueryParam', () => {
  it('calls openAdd when ?add=1 is present', async () => {
    const openAdd = vi.fn()

    renderHook(() => useAddQueryParam(openAdd), { wrapper: wrapperWith('/companies?add=1') })

    await waitFor(() => expect(openAdd).toHaveBeenCalledTimes(1))
  })

  it('does not call openAdd without the param', () => {
    const openAdd = vi.fn()

    renderHook(() => useAddQueryParam(openAdd), { wrapper: wrapperWith('/companies') })

    expect(openAdd).not.toHaveBeenCalled()
  })

  it('does not call openAdd for other values of add', () => {
    const openAdd = vi.fn()

    renderHook(() => useAddQueryParam(openAdd), { wrapper: wrapperWith('/companies?add=0') })

    expect(openAdd).not.toHaveBeenCalled()
  })
})
