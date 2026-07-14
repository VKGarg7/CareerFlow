import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'
import { AuthCard, AuthField, authInputCls, AuthErrorBanner, AuthSubmitButton, AuthFormSide, AuthDecoTile, EyeIcon } from '../components/AuthFormKit'

const TIPS = [
  { icon: '🔑', text: 'Use at least 8 characters' },
  { icon: '🔀', text: 'Mix letters, numbers, and symbols' },
  { icon: '🚫', text: "Avoid reusing passwords from other sites" },
]

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
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
      await resetPassword({ token, ...form })
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } })
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else setErrors({ general: data?.message || 'Reset failed. The link may have expired.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#05060B]">
      <AuthPanel
        eyebrow="New password"
        title={<>Choose a<br />strong password</>}
        subtitle="A little extra strength goes a long way in keeping your job search data safe."
        items={TIPS}
      />

      <AuthFormSide>
        <AuthBrand mobile />

        <div className="relative">
          <AuthDecoTile label="Strength tip" value="Mix letters & symbols" sub="Avoid reused passwords" className="-right-12 -top-8 -rotate-2" />

          {!token ? (
            <AuthCard>
              <div className="text-center">
                <p className="mb-4 text-sm text-red-400">Invalid or missing reset token.</p>
                <Link to="/forgot-password" className="text-sm font-semibold text-[#8184F5] hover:text-[#A78BFA]">
                  Request a new link
                </Link>
              </div>
            </AuthCard>
          ) : (
            <AuthCard>
              <h1 className="mb-1 font-display text-xl font-bold text-white">Set new password</h1>
              <p className="mb-6 text-sm text-white/45">Enter your new password below.</p>

              <AuthErrorBanner>{errors.general}</AuthErrorBanner>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthField label="New password" error={errors.newPassword}>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      required
                      placeholder="Min. 8 characters"
                      className={authInputCls(!!errors.newPassword) + ' pr-10'}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </AuthField>

                <AuthField label="Confirm password" error={errors.confirmPassword}>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className={authInputCls(!!errors.confirmPassword) + ' pr-10'}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>
                </AuthField>

                <AuthSubmitButton loading={loading} loadingText="Resetting…">Reset password</AuthSubmitButton>
              </form>
            </AuthCard>
          )}
        </div>
      </AuthFormSide>
    </div>
  )
}
