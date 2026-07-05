import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'

const REASSURANCE = [
  { icon: '🔒', text: 'Your data stays private and secure' },
  { icon: '📧', text: "We'll only email the account you specify" },
  { icon: '⏱️', text: 'Reset links expire for your safety' },
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
    <div className="min-h-screen flex">
      <AuthPanel
        title={<>Forgot your<br />password?</>}
        subtitle="No worries — it happens. We'll help you get back into your account in no time."
        items={REASSURANCE}
      />

      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <AuthBrand mobile />

          {submitted ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for <span className="font-medium text-gray-700">{email}</span>, a
                password reset link has been sent. Check your inbox.
              </p>
              <Link to="/login" className="text-sm text-blue-600 font-semibold hover:text-blue-700">
                Back to sign in
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot password?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm hover:shadow-md"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Remembered it?{' '}
                <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
