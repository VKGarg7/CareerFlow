import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Signup from './Signup'
import { register, login } from '../api/auth'

vi.mock('../api/auth', () => ({
  register: vi.fn(),
  login: vi.fn(),
  oauthLoginUrl: vi.fn((provider) => `http://oauth/${provider}`),
}))

const renderSignup = () =>
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  )

const fillForm = () => {
  fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Jane' } })
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'secret123' } })
  fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'secret123' } })
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: /create account/i }))

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('registers, auto-logs-in, and lands on the dashboard', async () => {
    register.mockResolvedValue({})
    login.mockResolvedValue({ data: { token: 'jwt-abc', role: 'USER' } })
    renderSignup()

    fillForm()
    submit()

    await waitFor(() => expect(screen.getByText('Dashboard page')).toBeTruthy())
    expect(register).toHaveBeenCalledWith(expect.objectContaining({
      firstName: 'Jane', email: 'jane@example.com', password: 'secret123', confirmPassword: 'secret123',
    }))
    expect(localStorage.getItem('token')).toBe('jwt-abc')
  })

  it('blocks submission when terms are not agreed', async () => {
    renderSignup()

    fillForm()
    fireEvent.click(screen.getByRole('checkbox'))
    submit()

    await waitFor(() =>
      expect(screen.getByText(/You must agree to the Terms of Service/)).toBeTruthy())
    expect(register).not.toHaveBeenCalled()
  })

  it('shows per-field validation errors from the server', async () => {
    register.mockRejectedValue({
      response: { data: { errors: { email: 'Invalid email format', password: 'Password must be at least 8 characters' } } },
    })
    renderSignup()

    fillForm()
    submit()

    await waitFor(() => expect(screen.getByText('Invalid email format')).toBeTruthy())
    expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy()
    expect(login).not.toHaveBeenCalled()
  })

  it('shows the general server message when registration fails without field errors', async () => {
    register.mockRejectedValue({
      response: { data: { message: 'An account with this email already exists' } },
    })
    renderSignup()

    fillForm()
    submit()

    await waitFor(() =>
      expect(screen.getByText('An account with this email already exists')).toBeTruthy())
  })

  it('falls back to the login page when registration succeeds but auto-login fails', async () => {
    register.mockResolvedValue({})
    login.mockRejectedValue(new Error('login failed'))
    renderSignup()

    fillForm()
    submit()

    await waitFor(() => expect(screen.getByText('Login page')).toBeTruthy())
    expect(localStorage.getItem('token')).toBeNull()
  })
})
