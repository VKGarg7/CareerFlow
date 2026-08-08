import { useEffect, useRef } from 'react'

let lastPointer = { x: '50%', y: '50%' }

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => {
    lastPointer = {
      x: `${(e.clientX / window.innerWidth) * 100}%`,
      y: `${(e.clientY / window.innerHeight) * 100}%`,
    }
  }, { capture: true })
}

export default function useLastPointerPosition() {
  const ref = useRef(lastPointer)
  useEffect(() => { ref.current = lastPointer }, [])
  return ref
}

export function getLastPointerPosition() {
  return lastPointer
}
