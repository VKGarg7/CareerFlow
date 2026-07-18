import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@mui/icons-material', () => ({
  Close: () => <span data-testid="icon-close" />,
  KeyboardArrowDown: () => <span data-testid="icon-down" />,
  Check: () => <span data-testid="icon-check" />,
}))
vi.mock('@mui/material', () => ({
  CircularProgress: () => <div role="progressbar" />,
}))

const { default: RescheduleInline } = await import('./RescheduleInline')
const { DrawerShell, DrawerHeader } = await import('./DrawerShell')
const { fieldInputCls, FieldErrorText, FormFooterButtons } = await import('./formKit')
const { default: FilterSelect } = await import('./FilterSelect')
const { ModalShell, ConfirmDeleteModal } = await import('./ModalShell')
const { APP_STATUS_CONFIG, appStatusLabel, appStatusHex } = await import('../constants/applicationStatus')

describe('RescheduleInline', () => {
  it('saves the new date', async () => {
    const onSave = vi.fn().mockResolvedValue()
    const { container } = render(
      <RescheduleInline currentDate="2026-07-01" onSave={onSave} onCancel={vi.fn()} />)

    fireEvent.change(container.querySelector('input[type=date]'), { target: { value: '2026-08-01' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('2026-08-01'))
  })

  it('cancels instead of saving when the date is unchanged', () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    render(<RescheduleInline currentDate="2026-07-01" onSave={onSave} onCancel={onCancel} />)

    fireEvent.click(screen.getByText('Save'))

    expect(onSave).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })
})

describe('DrawerShell', () => {
  it('renders header title, subtitle, and close', () => {
    const onClose = vi.fn()
    render(
      <DrawerShell>
        <DrawerHeader title="Company" subtitle="Details" onClose={onClose} />
      </DrawerShell>)

    expect(screen.getByText('Company')).toBeTruthy()
    expect(screen.getByText('Details')).toBeTruthy()
    fireEvent.click(screen.getByTestId('icon-close').closest('button'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('formKit', () => {
  it('fieldInputCls switches error styling', () => {
    expect(fieldInputCls(true)).toContain('border-app-danger')
    expect(fieldInputCls(false)).not.toContain('border-app-danger')
  })

  it('FieldErrorText renders only when there is an error', () => {
    const { container, rerender } = render(<FieldErrorText error="" />)
    expect(container.innerHTML).toBe('')
    rerender(<FieldErrorText error="Required" />)
    expect(screen.getByText('Required')).toBeTruthy()
  })

  it('FormFooterButtons fires cancel and disables save while saving', () => {
    const onCancel = vi.fn()
    render(<FormFooterButtons saving onCancel={onCancel} saveLabel="Save" />)

    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
    expect(screen.getByText('Save').closest('button').disabled).toBe(true)
  })
})

describe('FilterSelect', () => {
  const options = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'CLOSED', label: 'Closed' },
  ]

  it('shows the all-label when no value is selected', () => {
    render(<FilterSelect value="" onChange={vi.fn()} allLabel="All statuses" options={options} />)

    expect(screen.getByText('All statuses')).toBeTruthy()
  })

  it('opens the menu and reports the chosen option', () => {
    const onChange = vi.fn()
    render(<FilterSelect value="" onChange={onChange} allLabel="All" options={options} />)

    fireEvent.click(screen.getByRole('button', { expanded: false }))
    fireEvent.click(screen.getByRole('option', { name: 'Closed' }))

    expect(onChange).toHaveBeenCalledWith('CLOSED')
  })

  it('hides the all option when hideAll is set', () => {
    render(<FilterSelect value="ACTIVE" onChange={vi.fn()} allLabel="All" options={options} hideAll />)

    fireEvent.click(screen.getByRole('button', { expanded: false }))

    expect(screen.queryByRole('option', { name: 'All' })).toBeNull()
  })
})

describe('ModalShell', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ModalShell open={false} onClose={vi.fn()} title="Add"><p>Body</p></ModalShell>)
    expect(container.innerHTML).toBe('')
  })

  it('renders title and children when open, closes on backdrop click', () => {
    const onClose = vi.fn()
    const { container } = render(
      <ModalShell open onClose={onClose} title="Add company"><p>Body</p></ModalShell>)

    expect(screen.getByText('Add company')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
    fireEvent.click(container.firstChild)
    expect(onClose).toHaveBeenCalled()
  })
})

describe('ConfirmDeleteModal', () => {
  it('runs onConfirm when Delete is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue()
    render(<ConfirmDeleteModal open onClose={vi.fn()} onConfirm={onConfirm}
      title="Delete company?" message="This cannot be undone." />)

    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
  })

  it('shows the server error when deletion fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue({
      response: { data: { message: 'Company has existing applications' } },
    })
    render(<ConfirmDeleteModal open onClose={vi.fn()} onConfirm={onConfirm}
      title="Delete company?" message="Sure?" />)

    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() =>
      expect(screen.getByText('Company has existing applications')).toBeTruthy())
  })
})

describe('applicationStatus constants', () => {
  it('appStatusLabel returns the label or falls back to the raw status', () => {
    expect(appStatusLabel('OFFER_RECEIVED')).toBe('Offer Received')
    expect(appStatusLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW')
  })

  it('appStatusHex falls back to the APPLIED color for unknown statuses', () => {
    expect(appStatusHex('REJECTED')).toBe(APP_STATUS_CONFIG.REJECTED.hex)
    expect(appStatusHex('UNKNOWN')).toBe(APP_STATUS_CONFIG.APPLIED.hex)
  })
})
