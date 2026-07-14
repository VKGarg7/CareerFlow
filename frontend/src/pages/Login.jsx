import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'
import { AuthCard, AuthField, authInputCls, AuthErrorBanner, AuthSubmitButton, EyeIcon, AuthFormSide, AuthDecoTile } from '../components/AuthFormKit'

const FEATURES = [
  { icon: '🏢', text: "Track every company you're targeting" },
  { icon: '📋', text: 'Manage all your job applications' },
  { icon: '🤝', text: 'Build your recruiter network' },
  { icon: '📊', text: 'Dashboard insights at a glance' },
]

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form)
      localStorage.setItem('token', res.data.token)
      if (res.data.role) localStorage.setItem('role', res.data.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#05060B]">
      <AuthPanel
        eyebrow="Welcome back"
        title={<>Your job search,<br />organized.</>}
        subtitle="Everything you need to land your next role — all in one place."
        items={FEATURES}
      />

      <AuthFormSide>
        <AuthBrand mobile />

        <div className="relative">
          <AuthDecoTile label="This week" value="3 interviews booked" sub="Across 2 companies" className="-right-12 -top-8 -rotate-2" />
          <AuthDecoTile label="Streak" value="12 days logged" sub="Keep the thread going" className="-left-12 -bottom-8 rotate-2" style={{ animationDelay: '1.2s' }} />

          <AuthCard>
            <h1 className="mb-1 font-display text-xl font-bold text-white">Welcome back</h1>
            <p className="mb-6 text-sm text-white/45">Sign in to your CareerFlow account</p>

            <AuthErrorBanner>{error}</AuthErrorBanner>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthField label="Email">
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="you@example.com"
                  className={authInputCls(false)}
                />
              </AuthField>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/40">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-[#8184F5] hover:text-[#A78BFA]">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange} required placeholder="••••••••"
                    className={authInputCls(false) + ' pr-10'}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <AuthSubmitButton loading={loading} loadingText="Signing in…">Sign in</AuthSubmitButton>
            </form>

            <p className="mt-6 text-center text-sm text-white/45">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-[#8184F5] hover:text-[#A78BFA]">
                Sign up
              </Link>
            </p>
          </AuthCard>
        </div>
      </AuthFormSide>
    </div>
  )
}
