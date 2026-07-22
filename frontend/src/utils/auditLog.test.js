import { describe, it, expect } from 'vitest'
import { fmtDateTime, actionOptions } from './auditLog'

describe('fmtDateTime', () => {
  it('returns empty string for falsy input', () => {
    expect(fmtDateTime(null)).toBe('')
    expect(fmtDateTime('')).toBe('')
  })

  it('formats a datetime string with month and time', () => {
    const result = fmtDateTime('2026-03-05T14:30:00')
    expect(result).toContain('Mar')
    expect(result).toContain('5')
  })
})

describe('actionOptions', () => {
  it('returns unique sorted actions', () => {
    const logs = [
      { action: 'USER_LOGIN' },
      { action: 'COMPANY_CREATED' },
      { action: 'USER_LOGIN' },
    ]
    expect(actionOptions(logs)).toEqual(['COMPANY_CREATED', 'USER_LOGIN'])
  })

  it('returns empty array for no logs', () => {
    expect(actionOptions([])).toEqual([])
  })
})
