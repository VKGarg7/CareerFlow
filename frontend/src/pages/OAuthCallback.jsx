import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    const role = params.get('role')
    if (token) {
      localStorage.setItem('token', token)
      if (role) localStorage.setItem('role', role)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login', { replace: true, state: { message: 'Social sign-in failed. Please try again.' } })
    }
  }, [params, navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-[#05060B] text-white/60 text-sm">
      Signing you in…
    </div>
  )
}
