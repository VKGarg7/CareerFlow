import { describe, it, expect } from 'vitest'
import { fmtFileSize, isAllowedDocExt } from './documents'

describe('fmtFileSize', () => {
  it('returns empty string for falsy sizes', () => {
    expect(fmtFileSize(0)).toBe('')
    expect(fmtFileSize(null)).toBe('')
  })

  it('formats bytes below 1 KB', () => {
    expect(fmtFileSize(512)).toBe('512 B')
  })

  it('formats kilobytes with one decimal', () => {
    expect(fmtFileSize(2048)).toBe('2.0 KB')
  })

  it('formats megabytes with one decimal', () => {
    expect(fmtFileSize(3 * 1048576)).toBe('3.0 MB')
  })
})

describe('isAllowedDocExt', () => {
  it('accepts pdf, doc, and docx (case-insensitive)', () => {
    expect(isAllowedDocExt({ name: 'resume.pdf' })).toBe(true)
    expect(isAllowedDocExt({ name: 'resume.DOC' })).toBe(true)
    expect(isAllowedDocExt({ name: 'resume.DocX' })).toBe(true)
  })

  it('rejects other extensions', () => {
    expect(isAllowedDocExt({ name: 'resume.exe' })).toBe(false)
    expect(isAllowedDocExt({ name: 'resume.txt' })).toBe(false)
  })

  it('rejects files with no matching extension segment', () => {
    expect(isAllowedDocExt({ name: 'resume' })).toBe(false)
  })
})
