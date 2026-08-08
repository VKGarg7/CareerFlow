import { useCallback, useRef } from 'react'

let sharedCtx = null
function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!sharedCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    sharedCtx = new Ctx()
  }
  return sharedCtx
}

function playBlip(freq = 880, duration = 0.05, volume = 0.035) {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

export default function useHoverSound(enabled = true, freq = 880) {
  const lastPlayed = useRef(0)
  return useCallback(() => {
    if (!enabled) return
    const now = performance.now()
    if (now - lastPlayed.current < 120) return
    lastPlayed.current = now
    playBlip(freq)
  }, [enabled, freq])
}

export { playBlip }
