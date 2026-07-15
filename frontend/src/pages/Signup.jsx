import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, login } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'
import {
  AuthCard, AuthField, authInputCls, authInputIconCls, AuthInputIcon, AuthErrorBanner,
  AuthSubmitButton, EyeIcon, AuthFormSide, AuthDecoTile, UserIcon, MailIcon, LockIcon,
  AuthCheckbox, AuthDivider, AuthSocialRow,
} from '../components/AuthFormKit'

const PROVIDER_NAMES = { google: 'Google', linkedin: 'LinkedIn', github: 'GitHub' }

const STEPS = [
  { icon: '📈', title: 'Track everything', text: 'Keep all your applications, interviews and follow-ups in one place.' },
  { icon: '👥', title: 'Build your network', text: 'Manage recruiters and build meaningful connections.' },
  { icon: '📊', title: 'Get insights', text: 'Powerful analytics to help you make smarter career decisions.' },
]

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [agreed, setAgreed] = useState(true)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (!agreed) {
      setErrors({ terms: 'You must agree to the Terms of Service and Privacy Policy to continue.' })
      return
    }

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
    <div className="flex h-screen overflow-hidden bg-[#05060B]">
      <AuthPanel
        eyebrow="Get started"
        width="w-[380px]"
        title={<>Start your<br />job search <span className="text-[#A78BFA]">journey</span></>}
        subtitle="Create your free account and take control of your career journey."
        items={STEPS}
        illustration
      />

      <AuthFormSide>
        <AuthBrand mobile />

        <div className="relative">
          <AuthDecoTile label="Getting started" value="Free, no card needed" sub="Set up in ~2 minutes" className="-right-12 -top-8 -rotate-2" />
          <AuthDecoTile label="Then" value="Log your first company" sub="Applications follow instantly" className="-left-12 -bottom-8 rotate-2" style={{ animationDelay: '1.4s' }} />

          <AuthCard compact>
            <h1 className="mb-1 font-display text-xl font-bold text-white">Create your account</h1>
            <p className="mb-3 text-sm text-white/45">Start building your career with CareerFlow</p>

            <AuthErrorBanner>{errors.general}</AuthErrorBanner>

            <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
              <div className="flex gap-3">
                <div className="flex-1">
                  <AuthField label="First name" error={errors.firstName}>
                    <div className="relative">
                      <AuthInputIcon><UserIcon /></AuthInputIcon>
                      <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                        required placeholder="John" className={authInputIconCls(!!errors.firstName)} />
                    </div>
                  </AuthField>
                </div>
                <div className="flex-1">
                  <AuthField label="Last name">
                    <div className="relative">
                      <AuthInputIcon><UserIcon /></AuthInputIcon>
                      <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                        placeholder="Doe" className={authInputIconCls(false)} />
                    </div>
                  </AuthField>
                </div>
              </div>

              <AuthField label="Email address" error={errors.email}>
                <div className="relative">
                  <AuthInputIcon><MailIcon /></AuthInputIcon>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    required placeholder="you@example.com" className={authInputIconCls(!!errors.email)} />
                </div>
              </AuthField>

              <AuthField label="Password" error={errors.password}>
                <div className="relative">
                  <AuthInputIcon><LockIcon /></AuthInputIcon>
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange} required minLength={8}
                    placeholder="Min. 8 characters" className={authInputIconCls(!!errors.password) + ' pr-10'} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </AuthField>

              <AuthField label="Confirm password" error={errors.confirmPassword}>
                <div className="relative">
                  <AuthInputIcon><LockIcon /></AuthInputIcon>
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                    value={form.confirmPassword} onChange={handleChange} required
                    placeholder="Confirm your password" className={authInputIconCls(!!errors.confirmPassword) + ' pr-10'} />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </AuthField>

              <AuthCheckbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} error={errors.terms}>
                I agree to the{' '}
                <Link to="/terms" className="font-semibold text-[#8184F5] hover:text-[#A78BFA]">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-semibold text-[#8184F5] hover:text-[#A78BFA]">Privacy Policy</Link>
              </AuthCheckbox>

              <AuthSubmitButton loading={loading} loadingText="Creating account…">Create account</AuthSubmitButton>
            </form>

            <AuthDivider>Or continue with</AuthDivider>
            <AuthSocialRow
              providers={['google', 'linkedin', 'github']}
              onSelect={(provider) => setErrors({ general: `${PROVIDER_NAMES[provider]} sign-up is not available yet.` })}
            />

            <p className="mt-3 text-center text-sm text-white/45">
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
