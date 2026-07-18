import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Stub MUI barrels: loading them for real opens thousands of module files (EMFILE on Windows).
vi.mock('@mui/icons-material', () => ({
  Add: () => <span data-testid="icon-add" />,
  ViewList: () => <span data-testid="icon-list" />,
  GridView: () => <span data-testid="icon-grid" />,
}))
vi.mock('@mui/material', () => ({
  Alert: ({ children, severity, onClose }) => (
    <div role="alert" data-severity={severity}>
      {children}
      {onClose && <button onClick={onClose}>close</button>}
    </div>
  ),
  CircularProgress: () => <div role="progressbar" />,
}))

const { default: EmptyState } = await import('./EmptyState')
const { default: PageAlert } = await import('./PageAlert')
const { default: PageSpinner } = await import('./PageSpinner')
const { default: StatusBadge } = await import('./StatusBadge')
const { default: HeaderAddButton } = await import('./HeaderAddButton')
const { default: ViewToggle } = await import('./ViewToggle')
const { default: CompanyLogo } = await import('./CompanyLogo')
const { CloseGlyphIcon } = await import('./CloseGlyphIcon')

describe('EmptyState', () => {
  it('renders icon, title, description, and action', () => {
    render(<EmptyState icon="📭" title="Nothing here" description="Add your first item"
      action={<button>Add one</button>} />)

    expect(screen.getByText('📭')).toBeTruthy()
    expect(screen.getByText('Nothing here')).toBeTruthy()
    expect(screen.getByText('Add your first item')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add one' })).toBeTruthy()
  })
})

describe('PageAlert', () => {
  it('renders nothing when there is no message', () => {
    const { container } = render(<PageAlert severity="error" message="" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the message with severity and close support', () => {
    const onClose = vi.fn()
    render(<PageAlert severity="error" message="Something broke" onClose={onClose} />)

    expect(screen.getByRole('alert').dataset.severity).toBe('error')
    expect(screen.getByText('Something broke')).toBeTruthy()
    fireEvent.click(screen.getByText('close'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('PageSpinner', () => {
  it('renders a progress indicator', () => {
    render(<PageSpinner />)
    expect(screen.getByRole('progressbar')).toBeTruthy()
  })
})

describe('StatusBadge', () => {
  it('renders the label with the given badge classes', () => {
    render(<StatusBadge badge="bg-green" dot="dot-green" label="Active" />)

    const badge = screen.getByText('Active')
    expect(badge.className).toContain('bg-green')
  })
})

describe('HeaderAddButton', () => {
  it('shows the label and fires onClick', () => {
    const onClick = vi.fn()
    render(<HeaderAddButton label="Add Company" onClick={onClick} />)

    fireEvent.click(screen.getByTitle('Add Company'))
    expect(onClick).toHaveBeenCalled()
    expect(screen.getByText('Add Company')).toBeTruthy()
  })

  it('hides the label text when the drawer is open', () => {
    render(<HeaderAddButton label="Add Company" onClick={vi.fn()} drawerOpen />)

    expect(screen.queryByText('Add Company')).toBeNull()
    expect(screen.getByTitle('Add Company')).toBeTruthy()
  })
})

describe('ViewToggle', () => {
  it('reports the chosen view', () => {
    const onChange = vi.fn()
    render(<ViewToggle value="list" onChange={onChange} />)

    fireEvent.click(screen.getByTitle('Directory view'))
    expect(onChange).toHaveBeenCalledWith('directory')
    fireEvent.click(screen.getByTitle('List view'))
    expect(onChange).toHaveBeenCalledWith('list')
  })
})

describe('CompanyLogo', () => {
  it('shows initials when there is no website', () => {
    render(<CompanyLogo name="Acme Corp" website={null} dotColor="#123" />)

    expect(screen.getByText('AC')).toBeTruthy()
  })

  it('shows a favicon image for a valid website domain', () => {
    const { container } = render(<CompanyLogo name="Acme" website="https://acme.com" />)

    const img = container.querySelector('img')
    expect(img.src).toContain('domain=acme.com')
  })

  it('falls back to initials when the favicon fails to load', () => {
    const { container } = render(<CompanyLogo name="Acme" website="https://acme.com" />)

    fireEvent.error(container.querySelector('img'))

    expect(screen.getByText('A')).toBeTruthy()
  })
})

describe('CloseGlyphIcon', () => {
  it('renders an svg with the given class', () => {
    const { container } = render(<CloseGlyphIcon className="w-6 h-6" />)

    expect(container.querySelector('svg').getAttribute('class')).toBe('w-6 h-6')
  })
})
