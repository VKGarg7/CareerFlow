import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Proxy stubs for the big barrels (icons, recharts): any named import resolves to a
// stub component. `then` must return undefined or the module object becomes thenable
// and Vitest's module await deadlocks.
const stubModule = (Stub) =>
  new Proxy({}, {
    has: () => true,
    getOwnPropertyDescriptor: () => ({ configurable: true, enumerable: true, value: Stub }),
    get: (target, name) => {
      if (name === '__esModule') return true
      if (name === 'then' || name === 'default' || typeof name === 'symbol') return undefined
      return Stub
    },
  })

vi.mock('@mui/icons-material', () => stubModule(() => <span data-icon />))
vi.mock('@mui/material', () => ({
  CircularProgress: () => <div role="progressbar" />,
  Alert: ({ children }) => <div role="alert">{children}</div>,
}))
vi.mock('recharts', () => stubModule(({ children }) => <div>{children}</div>))
vi.mock('../api/company', () => ({ getCompany: vi.fn(), updateCompany: vi.fn() }))
vi.mock('../api/application', () => ({ getApplications: vi.fn() }))
vi.mock('../api/interview', () => ({ getInterviewsForApplication: vi.fn() }))
vi.mock('../api/followup', () => ({ getFollowUpsByCompany: vi.fn() }))

const { default: AnalyticsCard } = await import('./AnalyticsCard')
const { default: MonthlyTrendChart } = await import('./MonthlyTrendChart')
const { default: MostAppliedCard } = await import('./MostAppliedCard')
const { default: ApplicationSourcesCard } = await import('./ApplicationSourcesCard')
const { default: DashboardTopBar } = await import('./DashboardTopBar')
const { default: AuthPanel, AuthBrand } = await import('./AuthSplitPanel')
const { AuthErrorBanner, AuthSubmitButton, AuthField } = await import('./AuthFormKit')
const { default: CompanyDetailModal } = await import('./CompanyDetailModal')

describe('AnalyticsCard', () => {
  it('renders its children', () => {
    render(<AnalyticsCard><p>Chart body</p></AnalyticsCard>)
    expect(screen.getByText('Chart body')).toBeTruthy()
  })
})

describe('MonthlyTrendChart', () => {
  it('renders with monthly data without crashing', () => {
    const data = [{ year: 2026, month: 6, count: 3 }, { year: 2026, month: 7, count: 5 }]
    const { container } = render(<MonthlyTrendChart data={data} />)
    expect(container.innerHTML).not.toBe('')
  })
})

describe('MostAppliedCard', () => {
  it('ranks companies and shows their counts', () => {
    const companies = [
      { name: 'Acme', website: null, count: 5, statuses: ['OFFER_RECEIVED'] },
      { name: 'Globex', website: null, count: 2, statuses: ['APPLIED'] },
    ]
    render(<MostAppliedCard companies={companies} onViewAll={vi.fn()} />)

    expect(screen.getByText('Acme')).toBeTruthy()
    expect(screen.getByText('#1')).toBeTruthy()
    expect(screen.getByText('Offer')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })
})

describe('ApplicationSourcesCard', () => {
  it('renders source rows without crashing', () => {
    const sources = [{ source: 'LINKEDIN', total: 4, interviews: 2, offers: 1, offerRate: 25 }]
    const { container } = render(
      <ApplicationSourcesCard sources={sources} bestSource={sources[0]} onViewAll={vi.fn()} />)
    expect(container.innerHTML).not.toBe('')
  })
})

describe('DashboardTopBar', () => {
  it('renders with a profile inside a router', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardTopBar profile={{ firstName: 'Jane', email: 'jane@x.com' }} pendingFollowUpCount={2} />
      </MemoryRouter>)
    expect(container.innerHTML).not.toBe('')
  })
})

describe('AuthSplitPanel', () => {
  it('renders panel title, subtitle, and items', () => {
    render(
      <MemoryRouter>
        <AuthPanel title="Welcome" subtitle="Sub" items={[{ icon: '🏢', title: 'Track', text: 'Stay organized' }]} />
      </MemoryRouter>)

    expect(screen.getByText('Welcome')).toBeTruthy()
    expect(screen.getByText('Track')).toBeTruthy()
  })

  it('AuthBrand renders the brand link', () => {
    const { container } = render(<MemoryRouter><AuthBrand /></MemoryRouter>)
    expect(container.innerHTML).not.toBe('')
  })
})

describe('AuthFormKit', () => {
  it('AuthErrorBanner renders only when there is a message', () => {
    const { container, rerender } = render(<AuthErrorBanner>{''}</AuthErrorBanner>)
    expect(container.innerHTML).toBe('')
    rerender(<AuthErrorBanner>Bad credentials</AuthErrorBanner>)
    expect(screen.getByText('Bad credentials')).toBeTruthy()
  })

  it('AuthSubmitButton switches to loading text and disables', () => {
    render(<AuthSubmitButton loading loadingText="Signing in…">Sign in</AuthSubmitButton>)

    const btn = screen.getByRole('button')
    expect(btn.textContent).toContain('Signing in…')
    expect(btn.disabled).toBe(true)
  })

  it('AuthField shows label and error', () => {
    render(<AuthField label="Email" error="Required"><input /></AuthField>)

    expect(screen.getByText('Email')).toBeTruthy()
    expect(screen.getByText('Required')).toBeTruthy()
  })
})

describe('CompanyDetailModal', () => {
  it('renders nothing while closed and fetches nothing', async () => {
    const { getCompany } = await import('../api/company')
    const { container } = render(
      <MemoryRouter>
        <CompanyDetailModal open={false} companyId={1} onClose={vi.fn()} />
      </MemoryRouter>)

    expect(getCompany).not.toHaveBeenCalled()
    expect(container.querySelector('aside')).toBeNull()
  })
})
