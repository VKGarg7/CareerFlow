import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Smoke tests: every remaining page must mount and settle without crashing, with
// all API modules stubbed. A flexible response body (an array carrying object
// fields) satisfies both list-shaped (`res.data.map`) and stats-shaped
// (`res.data.byStatus`) consumers.
const flexibleBody = () =>
  Object.assign([], {
    total: 0, byStatus: {}, content: [],
    totalElements: 0, totalPages: 0, page: 0, size: 10, last: true,
    databaseUp: true, availableProcessors: 1, usedMemoryMb: 0, maxMemoryMb: 1, uptimeMillis: 0, databaseResponseTimeMs: 1,
    createdThisMonth: 0, createdLastMonth: 0,
  })

const apiStub = () =>
  new Proxy({}, {
    has: () => true,
    get: (target, name) => {
      if (name === '__esModule') return true
      if (name === 'then' || name === 'default' || typeof name === 'symbol') return undefined
      return vi.fn(() => Promise.resolve({ data: flexibleBody() }))
    },
  })

vi.mock('../api/company', () => apiStub())
vi.mock('../api/application', () => apiStub())
vi.mock('../api/recruiter', () => apiStub())
vi.mock('../api/referral', () => apiStub())
vi.mock('../api/followup', () => apiStub())
vi.mock('../api/interview', () => apiStub())
vi.mock('../api/user', () => apiStub())
vi.mock('../api/admin', () => apiStub())
vi.mock('../api/auditLog', () => apiStub())
vi.mock('../api/auth', () => apiStub())

const componentStub = (Stub) =>
  new Proxy({}, {
    has: () => true,
    getOwnPropertyDescriptor: () => ({ configurable: true, enumerable: true, value: Stub }),
    get: (target, name) => {
      if (name === '__esModule') return true
      if (name === 'then' || name === 'default' || typeof name === 'symbol') return undefined
      return Stub
    },
  })

vi.mock('@mui/icons-material', () => componentStub(() => <span data-icon />))
vi.mock('@mui/material', () => ({
  CircularProgress: () => <div role="progressbar" />,
  Alert: ({ children }) => <div role="alert">{children}</div>,
}))
vi.mock('recharts', () => componentStub(({ children }) => <div>{children}</div>))

vi.mock('../context/ProfileContext', () => {
  // Must be one stable object: a fresh object per call retriggers profile-keyed
  // effects on every render and loops until the worker dies.
  const stableProfileCtx = {
    profile: { firstName: 'Jane', email: 'jane@x.com', resumes: [], education: [], experience: [], projects: [] },
    setProfile: vi.fn(),
    loading: false,
    refetch: vi.fn().mockResolvedValue(null),
  }
  return {
    useProfile: () => stableProfileCtx,
    ProfileProvider: ({ children }) => <>{children}</>,
  }
})

// Import paths must be literal so Vite can resolve them; a variable dynamic
// import hangs vite-node.
const smoke = async (pageModule) => {
  const { default: Page } = await pageModule
  const { container } = render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="*" element={<Page />} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(container.innerHTML).not.toBe(""))
  return container
}

describe('page smoke tests (batch B)', () => {
  it('Recruiters renders', async () => { await smoke(import('./Recruiters')) })
  it('Referrals renders', async () => { await smoke(import('./Referrals')) })
  it('FollowUps renders', async () => { await smoke(import('./FollowUps')) })
})
