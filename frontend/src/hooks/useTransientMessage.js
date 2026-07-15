import { useEffect, useState } from 'react'

export default function useTransientMessage(ms = 3000) {
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(''), ms)
    return () => clearTimeout(t)
  }, [msg, ms])
  return [msg, setMsg]
}
