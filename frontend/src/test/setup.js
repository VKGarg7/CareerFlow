import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// waitFor's own 1s default (independent of Vitest's testTimeout) flakes when the
// whole suite runs in parallel on a slower machine.
configure({ asyncUtilTimeout: 10000 })

// jsdom doesn't implement these browser observers/APIs; pages use them for
// scroll-reveal animations and responsive charts.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
globalThis.IntersectionObserver ??= ObserverStub
globalThis.ResizeObserver ??= ObserverStub

window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})

window.scrollTo ??= () => {}
Element.prototype.scrollIntoView ??= () => {}
URL.createObjectURL ??= () => 'blob:mock'
URL.revokeObjectURL ??= () => {}
