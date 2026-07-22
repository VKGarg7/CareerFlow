import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ResetPassword from './ResetPassword'
import { resetPassword } from '../api/auth'

vi.mock('../api/auth', () => ({
  resetPassword: vi.fn(),
}))

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  )

const fillAndSubmit = () => {
  fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'newpass123' } })
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'newpass123' } })
  fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
}

describe('ResetPassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows an invalid-token message when the token param is missing', () => {
    renderAt('/reset-password')

    expect(screen.getByText('Invalid or missing reset token.')).toBeTruthy()
    expect(screen.queryByText('Set new password')).toBeNull()
  })

  it('submits the token with the new password and redirects to login', async () => {
    resetPassword.mockResolvedValue({})
    renderAt('/reset-password?token=reset-abc')

    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Login page')).toBeTruthy())
    expect(resetPassword).toHaveBeenCalledWith({
      token: 'reset-abc', newPassword: 'newpass123', confirmPassword: 'newpass123',
    })
  })

  it('shows the server message when the reset fails', async () => {
    resetPassword.mockRejectedValue({
      response: { data: { message: 'Invalid or expired reset token' } },
    })
    renderAt('/reset-password?token=stale-token')

    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Invalid or expired reset token')).toBeTruthy())
  })

  it('shows per-field errors from the server', async () => {
    resetPassword.mockRejectedValue({
      response: { data: { errors: { newPassword: 'Password must be at least 8 characters' } } },
    })
    renderAt('/reset-password?token=reset-abc')

    fillAndSubmit()

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy())
  })
})
