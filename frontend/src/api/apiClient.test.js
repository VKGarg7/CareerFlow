import { describe, it, expect } from 'vitest'
import { unwrapPage } from './apiClient'

describe('unwrapPage', () => {
  it('unwraps content array and carries pagination metadata as properties', () => {
    const res = {
      data: {
        content: [{ id: 1 }, { id: 2 }],
        page: 1, size: 10, totalElements: 42, totalPages: 5, last: false,
      },
    }

    const result = unwrapPage(res)

    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({ id: 1 })
    expect(result.data.page).toBe(1)
    expect(result.data.totalElements).toBe(42)
    expect(result.data.totalPages).toBe(5)
    expect(result.data.last).toBe(false)
  })

  it('keeps array call sites working (map, length)', () => {
    const res = { data: { content: [{ id: 1 }], page: 0 } }

    const result = unwrapPage(res)

    expect(result.data.map((x) => x.id)).toEqual([1])
    expect(result.data.length).toBe(1)
  })

  it('defaults metadata when body has no pagination fields', () => {
    const res = { data: { content: [{ id: 1 }] } }

    const result = unwrapPage(res)

    expect(result.data.page).toBe(0)
    expect(result.data.totalElements).toBe(1)
    expect(result.data.totalPages).toBe(1)
    expect(result.data.last).toBe(true)
  })

  it('returns empty array when content is missing or not an array', () => {
    expect(unwrapPage({ data: {} }).data).toHaveLength(0)
    expect(unwrapPage({ data: { content: 'oops' } }).data).toHaveLength(0)
    expect(unwrapPage({ data: null }).data).toHaveLength(0)
  })
})
