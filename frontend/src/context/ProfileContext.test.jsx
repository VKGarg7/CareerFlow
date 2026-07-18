import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ProfileProvider, useProfile } from './ProfileContext'
import { getProfile } from '../api/user'

vi.mock('../api/user', () => ({
  getProfile: vi.fn(),
}))

const wrapper = ({ children }) => <ProfileProvider>{children}</ProfileProvider>

describe('ProfileContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the profile on mount and clears loading', async () => {
    getProfile.mockResolvedValue({ data: { firstName: 'Jane' } })

    const { result } = renderHook(() => useProfile(), { wrapper })

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toEqual({ firstName: 'Jane' })
  })

  it('sets profile to null when the fetch fails', async () => {
    getProfile.mockRejectedValue(new Error('401'))

    const { result } = renderHook(() => useProfile(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toBeNull()
  })

  it('refetch reloads the profile and resolves with the data', async () => {
    getProfile.mockResolvedValue({ data: { firstName: 'Jane' } })
    const { result } = renderHook(() => useProfile(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    getProfile.mockResolvedValue({ data: { firstName: 'Janet' } })
    let returned
    await act(async () => { returned = await result.current.refetch() })

    expect(returned).toEqual({ firstName: 'Janet' })
    expect(result.current.profile).toEqual({ firstName: 'Janet' })
  })

  it('useProfile throws when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useProfile())).toThrow('useProfile must be used within a ProfileProvider')
    spy.mockRestore()
  })
})
