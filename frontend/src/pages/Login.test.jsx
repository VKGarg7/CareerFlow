import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Login from './Login'
import { login } from '../api/auth'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  oauthLoginUrl: vi.fn((provider) => `http://oauth/${provider}`),
}))

const renderLogin = (url = '/login') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )

const fillAndSubmit = () => {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'jane@example.com' },
  })
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: 'secret123' },
  })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('logs in, stores the token and role, and navigates to the dashboard', async () => {
    login.mockResolvedValue({ data: { token: 'jwt-abc', role: 'USER' } })
    renderLogin()

    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Dashboard page')).toBeTruthy())
    expect(login).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'secret123' })
    expect(localStorage.getItem('token')).toBe('jwt-abc')
    expect(localStorage.getItem('role')).toBe('USER')
  })

  it('shows the server error message when login fails', async () => {
    login.mockRejectedValue({ response: { data: { message: 'Invalid email or password' } } })
    renderLogin()

    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeTruthy())
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('falls back to a generic error message when the server gives none', async () => {
    login.mockRejectedValue(new Error('network down'))
    renderLogin()

    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Login failed. Please try again.')).toBeTruthy())
  })

  it('shows an error passed via the ?error query param (OAuth failure redirect)', () => {
    renderLogin('/login?error=Social sign-in failed. Please try again.')

    expect(screen.getByText('Social sign-in failed. Please try again.')).toBeTruthy()
  })

  it('toggles password visibility', () => {
    renderLogin()
    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput.type).toBe('password')

    fireEvent.click(passwordInput.parentElement.querySelector('button[type="button"]'))

    expect(passwordInput.type).toBe('text')
  })
})
