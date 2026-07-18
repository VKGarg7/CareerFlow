import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import OAuthCallback from './OAuthCallback'

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('OAuthCallback', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores token and role, then redirects to the dashboard', async () => {
    renderAt('/oauth-callback?token=jwt-abc&role=ADMIN')

    await waitFor(() => expect(screen.getByText('Dashboard page')).toBeTruthy())
    expect(localStorage.getItem('token')).toBe('jwt-abc')
    expect(localStorage.getItem('role')).toBe('ADMIN')
  })

  it('stores only the token when no role param is present', async () => {
    renderAt('/oauth-callback?token=jwt-abc')

    await waitFor(() => expect(screen.getByText('Dashboard page')).toBeTruthy())
    expect(localStorage.getItem('token')).toBe('jwt-abc')
    expect(localStorage.getItem('role')).toBeNull()
  })

  it('redirects to login without storing anything when the token is missing', async () => {
    renderAt('/oauth-callback')

    await waitFor(() => expect(screen.getByText('Login page')).toBeTruthy())
    expect(localStorage.getItem('token')).toBeNull()
  })
})
