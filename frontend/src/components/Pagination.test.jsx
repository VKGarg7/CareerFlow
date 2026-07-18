import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Stub the MUI icon barrel: importing it for real makes Vite open thousands of
// icon files, which exceeds Windows' open-file limit (EMFILE) under vitest.
vi.mock('@mui/icons-material', () => ({
  KeyboardArrowLeft: () => null,
  KeyboardArrowRight: () => null,
  KeyboardArrowDown: () => null,
  Check: () => null,
}))

const { default: Pagination } = await import('./Pagination')

const renderPagination = (props) =>
  render(
    <Pagination
      page={0} totalPages={5} totalElements={42} size={10}
      onPageChange={vi.fn()}
      {...props}
    />
  )

describe('Pagination', () => {
  it('renders nothing when there is a single page', () => {
    const { container } = renderPagination({ totalPages: 1 })

    expect(container.innerHTML).toBe('')
  })

  it('shows the current range and total', () => {
    renderPagination({ page: 1, size: 10, totalElements: 42 })

    expect(screen.getByText('Showing 11–20 of 42')).toBeTruthy()
  })

  it('caps the range end at totalElements on the last page', () => {
    renderPagination({ page: 4, size: 10, totalElements: 42 })

    expect(screen.getByText('Showing 41–42 of 42')).toBeTruthy()
  })

  it('disables Previous on the first page and Next on the last', () => {
    renderPagination({ page: 0, totalPages: 5 })
    expect(screen.getByLabelText('Previous page').disabled).toBe(true)
    expect(screen.getByLabelText('Next page').disabled).toBe(false)
  })

  it('disables Next on the last page', () => {
    renderPagination({ page: 4, totalPages: 5 })

    expect(screen.getByLabelText('Next page').disabled).toBe(true)
    expect(screen.getByLabelText('Previous page').disabled).toBe(false)
  })

  it('calls onPageChange with the zero-indexed page when a number is clicked', () => {
    const onPageChange = vi.fn()
    renderPagination({ page: 0, totalPages: 5, onPageChange })

    fireEvent.click(screen.getByText('2'))

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('shows an ellipsis when pages are skipped', () => {
    renderPagination({ page: 0, totalPages: 20 })

    expect(screen.getByText('…')).toBeTruthy()
    expect(screen.getByText('20')).toBeTruthy()
  })

  it('omits the size selector when onSizeChange is not provided', () => {
    renderPagination({})

    expect(screen.queryByText('10 / page')).toBeNull()
  })

  it('opens the size menu and reports a new size', () => {
    const onSizeChange = vi.fn()
    renderPagination({ onSizeChange })

    fireEvent.click(screen.getByText('10 / page'))
    fireEvent.click(screen.getByRole('option', { name: /25 \/ page/ }))

    expect(onSizeChange).toHaveBeenCalledWith(25)
  })
})
