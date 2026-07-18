import { describe, it, expect, vi, beforeEach } from 'vitest'

// One suite covering every thin API wrapper: verifies each function hits the
// right endpoint with the right verb and params, with apiClient itself mocked.
vi.mock('./apiClient', () => {
  const resolved = { data: { content: [] } }
  return {
    default: {
      get: vi.fn().mockResolvedValue(resolved),
      post: vi.fn().mockResolvedValue(resolved),
      patch: vi.fn().mockResolvedValue(resolved),
      delete: vi.fn().mockResolvedValue(resolved),
    },
    unwrapPage: vi.fn((res) => res),
  }
})

import api from './apiClient'
import * as auth from './auth'
import * as company from './company'
import * as application from './application'
import * as followup from './followup'
import * as interview from './interview'
import * as recruiter from './recruiter'
import * as referral from './referral'
import * as user from './user'
import * as admin from './admin'
import * as auditLog from './auditLog'

beforeEach(() => vi.clearAllMocks())

describe('auth api', () => {
  it('login posts credentials', async () => {
    await auth.login({ email: 'a@b.c', password: 'x' })
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.c', password: 'x' })
  })

  it('register, forgot, reset, change, logout hit their endpoints', async () => {
    await auth.register({ a: 1 })
    await auth.forgotPassword({ email: 'a@b.c' })
    await auth.resetPassword({ token: 't' })
    await auth.changePassword({ b: 2 })
    await auth.logout()
    expect(api.post).toHaveBeenCalledWith('/auth/register', { a: 1 })
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@b.c' })
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 't' })
    expect(api.post).toHaveBeenCalledWith('/auth/change-password', { b: 2 })
    expect(api.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('oauthLoginUrl strips /api and appends the provider path', () => {
    expect(auth.oauthLoginUrl('google')).toMatch(/\/oauth2\/authorization\/google$/)
    expect(auth.oauthLoginUrl('google')).not.toContain('/api/oauth2')
  })
})

describe('company api', () => {
  it('list/add/update/delete use the right verbs and paths', async () => {
    await company.getCompanies({ page: 0 })
    await company.addCompany({ name: 'Acme' })
    await company.updateCompany(5, { name: 'New' })
    await company.deleteCompany(5, true)
    expect(api.get).toHaveBeenCalledWith('/companies', { params: { page: 0 } })
    expect(api.post).toHaveBeenCalledWith('/companies', { name: 'Acme' })
    expect(api.patch).toHaveBeenCalledWith('/companies/5', { name: 'New' })
    expect(api.delete).toHaveBeenCalledWith('/companies/5', { params: { force: true } })
  })

  it('deleteCompany defaults force to false', async () => {
    await company.deleteCompany(5)
    expect(api.delete).toHaveBeenCalledWith('/companies/5', { params: { force: false } })
  })

  it('stats endpoints hit their routes', async () => {
    await company.getCompanyStats()
    await company.getApplicationCountsByCompany()
    await company.getCompanyActivitySummary()
    expect(api.get).toHaveBeenCalledWith('/companies/stats')
    expect(api.get).toHaveBeenCalledWith('/companies/application-counts')
    expect(api.get).toHaveBeenCalledWith('/companies/activity-summary')
  })
})

describe('application api', () => {
  it('CRUD endpoints', async () => {
    await application.getApplications({ page: 1 })
    await application.addApplication({ role: 'Dev' })
    await application.updateApplication(7, { role: 'SDE' })
    expect(api.get).toHaveBeenCalledWith('/applications', { params: { page: 1 } })
    expect(api.post).toHaveBeenCalledWith('/applications', { role: 'Dev' })
    expect(api.patch).toHaveBeenCalledWith('/applications/7', { role: 'SDE' })
  })

  it('deleteApplication passes documentId only when given', async () => {
    await application.deleteApplication(7)
    expect(api.delete).toHaveBeenCalledWith('/applications/7', undefined)
    await application.deleteApplication(7, 9)
    expect(api.delete).toHaveBeenCalledWith('/applications/7', { params: { documentId: 9 } })
  })

  it('uploadApplicationDocuments sends multipart form data', async () => {
    const resume = new File(['x'], 'resume.pdf')
    await application.uploadApplicationDocuments(7, { resume })
    const [url, fd, config] = api.patch.mock.calls[0]
    expect(url).toBe('/applications/7/documents')
    expect(fd.get('resume')).toBe(resume)
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
  })

  it('document download endpoints use blob responses', async () => {
    await application.downloadApplicationDocument(9)
    expect(api.get).toHaveBeenCalledWith('/applications/documents/9', { responseType: 'blob' })
    await application.viewApplicationDocument(9)
    expect(api.get).toHaveBeenCalledWith('/applications/documents/9', { params: { inline: true }, responseType: 'blob' })
  })

  it('trend endpoints pass their window params', async () => {
    await application.getWeeklyTrend(30)
    await application.getUpcomingDeadlines(14)
    expect(api.get).toHaveBeenCalledWith('/applications/weekly-trend', { params: { days: 30 } })
    expect(api.get).toHaveBeenCalledWith('/applications/deadlines', { params: { withinDays: 14 } })
  })
})

describe('followup api', () => {
  it('nested and flat routes', async () => {
    await followup.createFollowUp(7, { note: 'hi' })
    await followup.getAllFollowUps({ page: 0 })
    await followup.updateFollowUp(3, { status: 'DONE' })
    await followup.deleteFollowUp(3)
    expect(api.post).toHaveBeenCalledWith('/applications/7/follow-ups', { note: 'hi' })
    expect(api.get).toHaveBeenCalledWith('/follow-ups', { params: { page: 0 } })
    expect(api.patch).toHaveBeenCalledWith('/follow-ups/3', { status: 'DONE' })
    expect(api.delete).toHaveBeenCalledWith('/follow-ups/3')
  })

  it('getFollowUpsByCompany merges companyId into params', async () => {
    await followup.getFollowUpsByCompany(5, { page: 2 })
    expect(api.get).toHaveBeenCalledWith('/follow-ups', { params: { companyId: 5, page: 2 } })
  })
})

describe('interview api', () => {
  it('nested create and flat update/delete', async () => {
    await interview.createInterview(7, { round: 'Tech' })
    await interview.updateInterview(3, { round: 'HR' })
    await interview.deleteInterview(3)
    expect(api.post).toHaveBeenCalledWith('/applications/7/interviews', { round: 'Tech' })
    expect(api.patch).toHaveBeenCalledWith('/interviews/3', { round: 'HR' })
    expect(api.delete).toHaveBeenCalledWith('/interviews/3')
  })
})

describe('recruiter api', () => {
  it('CRUD and stats routes', async () => {
    await recruiter.getRecruiters({ page: 0 })
    await recruiter.addRecruiter({ name: 'Jane' })
    await recruiter.updateRecruiter(4, { name: 'Janet' })
    await recruiter.deleteRecruiter(4)
    await recruiter.getRecruiterStats()
    expect(api.get).toHaveBeenCalledWith('/recruiters', { params: { page: 0 } })
    expect(api.post).toHaveBeenCalledWith('/recruiters', { name: 'Jane' })
    expect(api.patch).toHaveBeenCalledWith('/recruiters/4', { name: 'Janet' })
    expect(api.delete).toHaveBeenCalledWith('/recruiters/4')
    expect(api.get).toHaveBeenCalledWith('/recruiters/stats')
  })
})

describe('referral api', () => {
  it('CRUD and note management routes', async () => {
    await referral.getReferrals({ page: 0 })
    await referral.getReferral(2)
    await referral.addReferral({ targetRole: 'SDE' })
    await referral.updateReferral(2, { status: 'REQUESTED' })
    await referral.deleteReferral(2)
    await referral.manageNote(2, { action: 'ADD', note: 'hi' })
    expect(api.get).toHaveBeenCalledWith('/referrals', { params: { page: 0 } })
    expect(api.get).toHaveBeenCalledWith('/referrals/2')
    expect(api.post).toHaveBeenCalledWith('/referrals', { targetRole: 'SDE' })
    expect(api.patch).toHaveBeenCalledWith('/referrals/2', { status: 'REQUESTED' })
    expect(api.delete).toHaveBeenCalledWith('/referrals/2')
    expect(api.patch).toHaveBeenCalledWith('/referrals/2/notes', { action: 'ADD', note: 'hi' })
  })
})

describe('user api', () => {
  it('profile routes', async () => {
    await user.getProfile()
    await user.createProfile({ firstName: 'Jane' })
    await user.updateProfile({ bio: 'hi' })
    expect(api.get).toHaveBeenCalledWith('/users/profile')
    expect(api.post).toHaveBeenCalledWith('/users/profile', { firstName: 'Jane' })
    expect(api.patch).toHaveBeenCalledWith('/users/profile', { bio: 'hi' })
  })

  it('updateProfileDocuments sends multipart with optional deleteDocumentId', async () => {
    await user.updateProfileDocuments({ deleteDocumentId: 9 })
    const [url, , config] = api.patch.mock.calls[0]
    expect(url).toBe('/users/profile/documents')
    expect(config.params).toEqual({ deleteDocumentId: 9 })
  })

  it('downloadProfileDocument toggles inline param', async () => {
    await user.downloadProfileDocument(9)
    expect(api.get).toHaveBeenCalledWith('/users/documents/9', { params: undefined, responseType: 'blob' })
    await user.downloadProfileDocument(9, true)
    expect(api.get).toHaveBeenCalledWith('/users/documents/9', { params: { inline: true }, responseType: 'blob' })
  })
})

describe('admin api', () => {
  it('admin routes', async () => {
    await admin.getPlatformStats()
    await admin.getAllUsers({ page: 0 })
    await admin.setUserActive(2, false)
    await admin.setUserRole(2, 'ADMIN')
    await admin.getSystemHealth()
    expect(api.get).toHaveBeenCalledWith('/admin/stats')
    expect(api.get).toHaveBeenCalledWith('/admin/users', { params: { page: 0 } })
    expect(api.patch).toHaveBeenCalledWith('/admin/users/2/status', { active: false })
    expect(api.patch).toHaveBeenCalledWith('/admin/users/2/role', { role: 'ADMIN' })
    expect(api.get).toHaveBeenCalledWith('/admin/health')
  })
})

describe('auditLog api', () => {
  it('personal activity route', async () => {
    await auditLog.getMyActivity({ page: 0 })
    expect(api.get).toHaveBeenCalledWith('/audit-logs/me', { params: { page: 0 } })
  })
})
