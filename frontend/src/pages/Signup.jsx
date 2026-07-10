import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, login } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'
import { AuthCard, AuthField, authInputCls, AuthErrorBanner, AuthSubmitButton, EyeIcon, AuthFormSide, AuthDecoTile } from '../components/AuthFormKit'

const STEPS = [
  { icon: '1️⃣', text: 'Create your free account' },
  { icon: '2️⃣', text: "Add companies you're targeting" },
  { icon: '3️⃣', text: 'Track applications & interviews' },
]

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(form)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else setErrors({ general: data?.message || 'Registration failed.' })
      setLoading(false)
      return
    }

    try {
      const res = await login({ email: form.email, password: form.password })
      localStorage.setItem('token', res.data.token)
      if (res.data.role) localStorage.setItem('role', res.data.role)
      navigate('/dashboard')
    } catch {
      navigate('/login', { state: { message: 'Account created! Please sign in.' } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#05060B]">
      <AuthPanel
        eyebrow="Get started"
        width="w-[380px]"
        title={<>Start your<br />job search journey</>}
        subtitle="Join CareerFlow and stay organized throughout your entire job search."
        items={STEPS}
      />

      <AuthFormSide>
        <AuthBrand mobile />

        <div className="relative">
          <AuthDecoTile label="Getting started" value="Free, no card needed" sub="Set up in ~2 minutes" className="-right-12 -top-8 -rotate-2" />
          <AuthDecoTile label="Then" value="Log your first company" sub="Applications follow instantly" className="-left-12 -bottom-8 rotate-2" style={{ animationDelay: '1.4s' }} />

          <AuthCard>
            <h1 className="mb-1 font-display text-xl font-bold text-white">Create account</h1>
            <p className="mb-6 text-sm text-white/45">Start building your career with CareerFlow</p>

            <AuthErrorBanner>{errors.general}</AuthErrorBanner>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <AuthField label="First name" error={errors.firstName}>
                    <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                      required placeholder="John" className={authInputCls(!!errors.firstName)} />
                  </AuthField>
                </div>
                <div className="flex-1">
                  <AuthField label="Last name">
                    <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                      placeholder="Doe" className={authInputCls(false)} />
                  </AuthField>
                </div>
              </div>

              <AuthField label="Email" error={errors.email}>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  required placeholder="you@example.com" className={authInputCls(!!errors.email)} />
              </AuthField>

              <AuthField label="Password" error={errors.password}>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange} required
                    placeholder="Min. 8 characters" className={authInputCls(!!errors.password) + ' pr-10'} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </AuthField>

              <AuthField label="Confirm password" error={errors.confirmPassword}>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                    value={form.confirmPassword} onChange={handleChange} required
                    placeholder="••••••••" className={authInputCls(!!errors.confirmPassword) + ' pr-10'} />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </AuthField>

              <AuthSubmitButton loading={loading} loadingText="Creating account…">Create account</AuthSubmitButton>
            </form>

            <p className="mt-6 text-center text-sm text-white/45">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#8184F5] hover:text-[#A78BFA]">
                Sign in
              </Link>
            </p>
          </AuthCard>
        </div>
      </AuthFormSide>
    </div>
  )
}
