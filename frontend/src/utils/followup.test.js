import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  todayStr, fmtDate, initials, domainOf, profileInitial,
  countByStatus, daysDiff, daysLabel,
} from './followup'

afterEach(() => {
  vi.useRealTimers()
})

describe('todayStr', () => {
  it('returns date in YYYY-MM-DD format', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('fmtDate', () => {
  it('returns empty string for falsy input', () => {
    expect(fmtDate(null)).toBe('')
    expect(fmtDate('')).toBe('')
  })

  it('formats a date string', () => {
    expect(fmtDate('2026-01-15')).toContain('2026')
    expect(fmtDate('2026-01-15')).toContain('Jan')
  })
})

describe('initials', () => {
  it('returns first letters of first two words, uppercased', () => {
    expect(initials('jane doe')).toBe('JD')
  })

  it('caps at two initials for longer names', () => {
    expect(initials('jane van der berg')).toBe('JV')
  })

  it('handles single-word names', () => {
    expect(initials('jane')).toBe('J')
  })

  it('returns ? for empty or missing name', () => {
    expect(initials('')).toBe('?')
    expect(initials()).toBe('?')
    expect(initials('   ')).toBe('?')
  })
})

describe('domainOf', () => {
  it('extracts hostname from full URL', () => {
    expect(domainOf('https://www.acme.com/careers')).toBe('acme.com')
  })

  it('adds https prefix for bare domains', () => {
    expect(domainOf('acme.com')).toBe('acme.com')
  })

  it('strips www prefix', () => {
    expect(domainOf('http://www.acme.com')).toBe('acme.com')
  })

  it('returns null for falsy input', () => {
    expect(domainOf(null)).toBeNull()
    expect(domainOf('')).toBeNull()
  })

  it('returns null for unparseable input', () => {
    expect(domainOf('ht tp://not a url')).toBeNull()
  })
})

describe('profileInitial', () => {
  it('prefers first letter of firstName', () => {
    expect(profileInitial({ firstName: 'jane', email: 'x@y.com' })).toBe('J')
  })

  it('falls back to email first letter', () => {
    expect(profileInitial({ email: 'zoe@y.com' })).toBe('Z')
  })

  it('returns ? when profile is empty or missing', () => {
    expect(profileInitial({})).toBe('?')
    expect(profileInitial(null)).toBe('?')
  })
})

describe('countByStatus', () => {
  const config = { ACTIVE: {}, DONE: {} }

  it('counts items grouped by status key', () => {
    const items = [
      { status: 'ACTIVE' }, { status: 'ACTIVE' }, { status: 'DONE' },
    ]
    expect(countByStatus(items, 'status', config)).toEqual({ ACTIVE: 2, DONE: 1 })
  })

  it('returns zeros for statuses with no items', () => {
    expect(countByStatus([], 'status', config)).toEqual({ ACTIVE: 0, DONE: 0 })
  })

  it('ignores items whose status is not in the config', () => {
    const items = [{ status: 'UNKNOWN' }]
    expect(countByStatus(items, 'status', config)).toEqual({ ACTIVE: 0, DONE: 0 })
  })
})

describe('daysDiff', () => {
  it('returns positive for future dates', () => {
    expect(daysDiff('2026-01-01', '2026-01-11')).toBe(10)
  })

  it('returns negative for past dates', () => {
    expect(daysDiff('2026-01-11', '2026-01-01')).toBe(-10)
  })

  it('returns zero for the same day', () => {
    expect(daysDiff('2026-01-01', '2026-01-01')).toBe(0)
  })
})

describe('daysLabel', () => {
  it('labels today, tomorrow, and yesterday', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))

    expect(daysLabel('2026-06-15')).toBe('Today')
    expect(daysLabel('2026-06-16')).toBe('Tomorrow')
    expect(daysLabel('2026-06-14')).toBe('Yesterday')
  })

  it('labels dates further away with day counts', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))

    expect(daysLabel('2026-06-20')).toBe('In 5 days')
    expect(daysLabel('2026-06-10')).toBe('5 days ago')
  })
})
