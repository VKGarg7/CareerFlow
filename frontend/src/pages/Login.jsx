import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login, oauthLoginUrl } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'
import {
  AuthCard, AuthField, authInputIconCls, AuthInputIcon, AuthErrorBanner, AuthSubmitButton,
  EyeIcon, AuthFormSide, AuthDecoTile, MailIcon, LockIcon, AuthCheckbox, AuthDivider,
  AuthSocialRow, AuthTrustFooter,
} from '../components/AuthFormKit'

const FEATURES = [
  { icon: '🏢', title: 'Track every company', text: 'Stay organized with your target companies' },
  { icon: '💼', title: 'Manage applications', text: 'Track every application and its progress' },
  { icon: '🤝', title: 'Build your network', text: 'Keep all your recruiters in one place' },
  { icon: '📊', title: 'Get insights', text: 'Powerful analytics to improve your search' },
]

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(searchParams.get('error') || '')
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
    <div className="flex h-screen overflow-hidden bg-[#05060B]">
      <AuthPanel
        eyebrow="Welcome back"
        width="w-[380px]"
        title={<>Your job search,<br /><span className="text-[#A78BFA]">organized.</span></>}
        subtitle="Everything you need to land your next role — all in one place."
        items={FEATURES}
        illustration
      />

      <AuthFormSide>
        <AuthBrand mobile />

        <div className="relative">
          <AuthDecoTile label="This week" value="3 interviews booked" sub="Across 2 companies" className="-right-12 -top-8 -rotate-2" />

          <AuthCard compact>
            <h1 className="mb-1 font-display text-xl font-bold text-white">Welcome back</h1>
            <p className="mb-4 text-sm text-white/45">Sign in to your CareerFlow account</p>

            <AuthErrorBanner>{error}</AuthErrorBanner>

            <form onSubmit={handleSubmit} className="space-y-3">
              <AuthField label="Email address">
                <div className="relative">
                  <AuthInputIcon><MailIcon /></AuthInputIcon>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder="you@example.com"
                    className={authInputIconCls(false)}
                  />
                </div>
              </AuthField>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/40">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-[#8184F5] hover:text-[#A78BFA]">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <AuthInputIcon><LockIcon /></AuthInputIcon>
                  <input
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange} required placeholder="••••••••"
                    className={authInputIconCls(false) + ' pr-10'}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <AuthCheckbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
                Remember me
              </AuthCheckbox>

              <AuthSubmitButton loading={loading} loadingText="Signing in…" arrow>Sign in</AuthSubmitButton>
            </form>

            <AuthDivider>Or continue with</AuthDivider>
            <AuthSocialRow
              providers={['google', 'linkedin', 'github']}
              onSelect={(provider) => { window.location.href = oauthLoginUrl(provider) }}
            />

            <p className="mt-4 text-center text-sm text-white/45">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-[#8184F5] hover:text-[#A78BFA]">
                Sign up
              </Link>
            </p>
          </AuthCard>
          <AuthTrustFooter />
        </div>
      </AuthFormSide>
    </div>
  )
}
