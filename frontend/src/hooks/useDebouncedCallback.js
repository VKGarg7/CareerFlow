import { useCallback, useEffect, useRef } from 'react'

export default function useDebouncedCallback(callback, delay) {
  const callbackRef = useRef(callback)
  const timerRef = useRef(null)

  useEffect(() => { callbackRef.current = callback }, [callback])
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return useCallback((...args) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => callbackRef.current(...args), delay)
  }, [delay])
}
