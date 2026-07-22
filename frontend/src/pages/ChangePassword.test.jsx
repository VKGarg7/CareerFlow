import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChangePassword from './ChangePassword'
import { changePassword } from '../api/auth'

vi.mock('../api/auth', () => ({
  changePassword: vi.fn(),
}))

const renderPage = () =>
  render(
    <MemoryRouter>
      <ChangePassword />
    </MemoryRouter>
  )

const fillAndSubmit = () => {
  const masked = screen.getAllByPlaceholderText('••••••••')
  fireEvent.change(masked[0], { target: { value: 'oldpass123' } })
  fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'newpass123' } })
  fireEvent.change(masked[1], { target: { value: 'newpass123' } })
  fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
}

describe('ChangePassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('changes the password, shows success, and clears the form', async () => {
    changePassword.mockResolvedValue({})
    renderPage()

    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Password changed successfully.')).toBeTruthy())
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldpass123', newPassword: 'newpass123', confirmPassword: 'newpass123',
    })
    expect(screen.getAllByPlaceholderText('••••••••')[0].value).toBe('')
  })

  it('shows the server message when the current password is wrong', async () => {
    changePassword.mockRejectedValue({
      response: { data: { message: 'Current password is incorrect' } },
    })
    renderPage()

    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Current password is incorrect')).toBeTruthy())
    expect(screen.queryByText('Password changed successfully.')).toBeNull()
  })

  it('shows per-field errors from the server', async () => {
    changePassword.mockRejectedValue({
      response: { data: { errors: { newPassword: 'Password must be at least 8 characters' } } },
    })
    renderPage()

    fillAndSubmit()

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy())
  })

  it('shows a generic message when the request fails without a body', async () => {
    changePassword.mockRejectedValue(new Error('network down'))
    renderPage()

    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Failed to change password.')).toBeTruthy())
  })
})
