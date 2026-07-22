import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ForgotPassword from './ForgotPassword'
import { forgotPassword } from '../api/auth'

vi.mock('../api/auth', () => ({
  forgotPassword: vi.fn(),
}))

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  )

const submitWith = (email) => {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
}

describe('ForgotPassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the check-your-email confirmation after a successful request', async () => {
    forgotPassword.mockResolvedValue({})
    renderPage()

    submitWith('jane@example.com')

    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy())
    expect(screen.getByText('jane@example.com')).toBeTruthy()
    expect(forgotPassword).toHaveBeenCalledWith({ email: 'jane@example.com' })
  })

  it('shows an error and stays on the form when the request fails', async () => {
    forgotPassword.mockRejectedValue(new Error('boom'))
    renderPage()

    submitWith('jane@example.com')

    await waitFor(() =>
      expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy())
    expect(screen.queryByText('Check your email')).toBeNull()
  })
})
