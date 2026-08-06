import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../api/application', () => ({
  getApplications: vi.fn(),
}))

const { getApplications } = await import('../api/application')
const { default: ChatApplicationPicker } = await import('./ChatApplicationPicker')

describe('ChatApplicationPicker', () => {
  it('renders the general chat option and the fetched applications', async () => {
    getApplications.mockResolvedValue({
      data: [
        { id: 1, role: 'Backend Engineer', companyName: 'Acme' },
        { id: 2, role: 'Frontend Engineer', companyName: 'Globex' },
      ],
    })

    render(<ChatApplicationPicker onSelect={vi.fn()} />)

    expect(screen.getByText('General prep chat')).toBeTruthy()
    expect(await screen.findByText('Backend Engineer')).toBeTruthy()
    expect(screen.getByText('Acme')).toBeTruthy()
    expect(screen.getByText('Frontend Engineer')).toBeTruthy()
  })

  it('calls onSelect with null for the general chat option', async () => {
    getApplications.mockResolvedValue({ data: [] })
    const onSelect = vi.fn()

    render(<ChatApplicationPicker onSelect={onSelect} />)
    fireEvent.click(screen.getByText('General prep chat'))

    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('calls onSelect with the chosen application id', async () => {
    getApplications.mockResolvedValue({
      data: [{ id: 7, role: 'Backend Engineer', companyName: 'Acme' }],
    })
    const onSelect = vi.fn()

    render(<ChatApplicationPicker onSelect={onSelect} />)
    fireEvent.click(await screen.findByText('Backend Engineer'))

    expect(onSelect).toHaveBeenCalledWith(7)
  })

  it('shows an error state when the fetch fails', async () => {
    getApplications.mockRejectedValue(new Error('network error'))

    render(<ChatApplicationPicker onSelect={vi.fn()} />)

    expect(await screen.findByText('Could not load your applications.')).toBeTruthy()
  })
})
