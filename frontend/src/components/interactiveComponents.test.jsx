import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@mui/icons-material', () => ({
  KeyboardArrowDown: () => <span />,
  Check: () => <span />,
  ChevronLeftRounded: () => <span />,
  ChevronRightRounded: () => <span />,
  Email: () => <span data-testid="icon-email" />,
  LinkedIn: () => <span data-testid="icon-linkedin" />,
}))
vi.mock('@mui/material', () => ({
  CircularProgress: () => <div role="progressbar" />,
}))
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="sparkline">{children}</div>,
  Line: () => null,
}))

const { default: InlineStatusChanger } = await import('./InlineStatusChanger')
const { default: ActionFilterSelect } = await import('./ActionFilterSelect')
const { default: StatTilesBar } = await import('./StatTilesBar')
const { default: StatusSummaryBar } = await import('./StatusSummaryBar')
const { EntityCard, EntityDirectoryCard, CardMenu } = await import('./EntityCard')
const { default: EntityListRow } = await import('./EntityListRow')

const STATUS_CONFIG = {
  NEW: { label: 'New', badge: 'badge-new', dot: 'dot-new', hex: '#111111' },
  ACTIVE: { label: 'Active', badge: 'badge-active', dot: 'dot-active', hex: '#222222' },
}

describe('InlineStatusChanger', () => {
  it('shows the current status label and updates on selection', async () => {
    const updateFn = vi.fn().mockResolvedValue({ data: { id: 1, status: 'ACTIVE' } })
    const onStatusChanged = vi.fn()
    render(<InlineStatusChanger item={{ id: 1, status: 'NEW' }} statusConfig={STATUS_CONFIG}
      defaultStatus="NEW" updateFn={updateFn} onStatusChanged={onStatusChanged} />)

    expect(screen.getByText('New')).toBeTruthy()
    fireEvent.click(screen.getByTitle('Change status'))
    fireEvent.click(screen.getByRole('option', { name: 'Active' }))

    await waitFor(() => expect(updateFn).toHaveBeenCalledWith(1, { status: 'ACTIVE' }))
    expect(onStatusChanged).toHaveBeenCalledWith({ id: 1, status: 'ACTIVE' })
  })

  it('does not call updateFn when selecting the current status', async () => {
    const updateFn = vi.fn()
    render(<InlineStatusChanger item={{ id: 1, status: 'NEW' }} statusConfig={STATUS_CONFIG}
      defaultStatus="NEW" updateFn={updateFn} onStatusChanged={vi.fn()} />)

    fireEvent.click(screen.getByTitle('Change status'))
    fireEvent.click(screen.getByRole('option', { name: 'New' }))

    expect(updateFn).not.toHaveBeenCalled()
  })

  it('shows an error message when the update fails', async () => {
    const updateFn = vi.fn().mockRejectedValue({ response: { data: { message: 'Update failed' } } })
    render(<InlineStatusChanger item={{ id: 1, status: 'NEW' }} statusConfig={STATUS_CONFIG}
      defaultStatus="NEW" updateFn={updateFn} onStatusChanged={vi.fn()} />)

    fireEvent.click(screen.getByTitle('Change status'))
    fireEvent.click(screen.getByRole('option', { name: 'Active' }))

    await waitFor(() => expect(screen.getByText('Update failed')).toBeTruthy())
  })
})

describe('ActionFilterSelect', () => {
  it('derives deduped, underscore-free options from the logs', () => {
    const logs = [{ action: 'USER_LOGIN' }, { action: 'USER_LOGIN' }, { action: 'COMPANY_CREATED' }]
    render(<ActionFilterSelect logs={logs} value="" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { expanded: false }))

    expect(screen.getByRole('option', { name: 'USER LOGIN' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'COMPANY CREATED' })).toBeTruthy()
    expect(screen.getAllByRole('option')).toHaveLength(3) // includes "All actions"
  })
})

describe('StatTilesBar', () => {
  const items = [{ status: 'NEW' }, { status: 'NEW' }, { status: 'ACTIVE' }]

  it('shows the total and one tile per non-empty status with percentages', () => {
    render(<StatTilesBar items={items} statusConfig={STATUS_CONFIG} onFilter={vi.fn()} />)

    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('New')).toBeTruthy()
    expect(screen.getByText('67%')).toBeTruthy()
    expect(screen.getByText('33%')).toBeTruthy()
  })

  it('clicking a tile filters by that status; clicking again clears', () => {
    const onFilter = vi.fn()
    const { rerender } = render(
      <StatTilesBar items={items} statusConfig={STATUS_CONFIG} onFilter={onFilter} activeFilter="" />)

    fireEvent.click(screen.getByText('New'))
    expect(onFilter).toHaveBeenCalledWith('NEW')

    rerender(<StatTilesBar items={items} statusConfig={STATUS_CONFIG} onFilter={onFilter} activeFilter="NEW" />)
    fireEvent.click(screen.getByText('New'))
    expect(onFilter).toHaveBeenLastCalledWith('')
  })

  it('renders a sparkline when trend data is provided', () => {
    render(<StatTilesBar items={items} statusConfig={STATUS_CONFIG} onFilter={vi.fn()}
      trendByStatus={{ NEW: [1, 2, 3] }} />)

    expect(screen.getByTestId('sparkline')).toBeTruthy()
  })
})

describe('StatusSummaryBar', () => {
  it('renders All chip with total and per-status chips', () => {
    const items = [{ status: 'NEW' }, { status: 'ACTIVE' }, { status: 'ACTIVE' }]
    const onFilter = vi.fn()
    render(<StatusSummaryBar items={items} statusConfig={STATUS_CONFIG} onFilter={onFilter} />)

    expect(screen.getByText('All')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    fireEvent.click(screen.getByText('Active'))
    expect(onFilter).toHaveBeenCalledWith('ACTIVE')
  })
})

describe('EntityCard', () => {
  it('renders avatar, title, note, and fires actions without triggering onClick', () => {
    const onClick = vi.fn()
    const onEdit = vi.fn()
    render(<EntityCard onClick={onClick} accentColor="border-l-red" avatarColor="bg-red"
      avatarText="AC" titleSlot={<h3>Acme</h3>} note=" hello "
      actions={[{ key: 'edit', label: 'Edit', icon: 'edit', onClick: onEdit }]} />)

    expect(screen.getByText('Acme')).toBeTruthy()
    expect(screen.getByText('"hello"')).toBeTruthy()
    fireEvent.click(screen.getByText('Edit'))
    expect(onEdit).toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('EntityDirectoryCard', () => {
  it('renders title and directory actions', () => {
    const onDelete = vi.fn()
    render(<EntityDirectoryCard titleSlot={<h3>Acme</h3>} avatarText="AC" avatarColor="bg-x"
      actions={[{ key: 'del', label: 'Delete', tone: 'danger', onClick: onDelete }]} />)

    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalled()
  })
})

describe('CardMenu', () => {
  it('renders nothing with no items', () => {
    const { container } = render(<CardMenu items={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('opens the menu and fires the chosen item', () => {
    const onEdit = vi.fn()
    render(<CardMenu items={[{ key: 'edit', label: 'Edit', onClick: onEdit }]} />)

    fireEvent.click(screen.getByLabelText('More actions'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalled()
  })
})

describe('EntityListRow', () => {
  it('renders name, subtitle, contact links, and fires row onClick', () => {
    const onClick = vi.fn()
    render(<EntityListRow onClick={onClick} accentBorder="border-l-x" avatarColor="bg-x"
      name="Jane Doe" subtitle="Acme" email="jane@acme.com" linkedIn="https://linkedin.com/in/jane"
      statusSlot={<span>status</span>} menuItems={[]} />)

    expect(screen.getByText('Jane Doe')).toBeTruthy()
    expect(screen.getByText('JD')).toBeTruthy()
    expect(screen.getByTitle('jane@acme.com').href).toBe('mailto:jane@acme.com')
    expect(screen.getByTitle('LinkedIn').href).toBe('https://linkedin.com/in/jane')
    fireEvent.click(screen.getByText('Jane Doe'))
    expect(onClick).toHaveBeenCalled()
  })
})
