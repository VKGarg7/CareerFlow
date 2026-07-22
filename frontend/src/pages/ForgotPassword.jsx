import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'
import { AuthCard, AuthField, AuthInputIcon, MailIcon, AuthErrorBanner, AuthSubmitButton, AuthFormSide, AuthDecoTile } from '../components/AuthFormKit'
import { authInputIconCls } from '../components/authStyles'

const REASSURANCE = [
  { icon: '🔒', title: 'Stays private', text: 'Your data stays private and secure' },
  { icon: '📧', title: 'Verified email only', text: "We'll only email the account you specify" },
  { icon: '⏱️', title: 'Time-limited links', text: 'Reset links expire for your safety' },
]

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword({ email })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#05060B]">
      <AuthPanel
        eyebrow="Account recovery"
        width="w-[380px]"
        title={<>Forgot your<br /><span className="text-[#A78BFA]">password?</span></>}
        subtitle="No worries — it happens. We'll help you get back into your account in no time."
        items={REASSURANCE}
        illustration
      />

      <AuthFormSide>
        <AuthBrand mobile />

        <div className="relative">
          <AuthDecoTile label="Reminder" value="Links expire in 30 min" sub="For your security" className="-right-12 -top-8 -rotate-2" />

          {submitted ? (
            <AuthCard compact>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/25">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mb-2 font-display text-xl font-bold text-white">Check your email</h2>
                <p className="mb-6 text-sm text-white/45">
                  If an account exists for <span className="font-medium text-white/70">{email}</span>, a
                  password reset link has been sent. Check your inbox.
                </p>
                <Link to="/login" className="text-sm font-semibold text-[#8184F5] hover:text-[#A78BFA]">
                  Back to sign in
                </Link>
              </div>
            </AuthCard>
          ) : (
            <AuthCard compact>
              <h1 className="mb-1 font-display text-xl font-bold text-white">Forgot password?</h1>
              <p className="mb-4 text-sm text-white/45">
                Enter your email and we'll send you a reset link.
              </p>

              <AuthErrorBanner>{error}</AuthErrorBanner>

              <form onSubmit={handleSubmit} className="space-y-3">
                <AuthField label="Email address">
                  <div className="relative">
                    <AuthInputIcon><MailIcon /></AuthInputIcon>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className={authInputIconCls(false)}
                    />
                  </div>
                </AuthField>

                <AuthSubmitButton loading={loading} loadingText="Sending…" arrow>Send reset link</AuthSubmitButton>
              </form>

              <p className="mt-4 text-center text-sm text-white/45">
                Remembered it?{' '}
                <Link to="/login" className="font-semibold text-[#8184F5] hover:text-[#A78BFA]">
                  Sign in
                </Link>
              </p>
            </AuthCard>
          )}
        </div>
      </AuthFormSide>
    </div>
  )
}
