import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'

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
    <div className="min-h-screen flex">
      <AuthPanel
        title={<>Choose a<br />strong password</>}
        subtitle="A little extra strength goes a long way in keeping your job search data safe."
        items={TIPS}
      />

      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <AuthBrand mobile />

          {!token ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-red-600 text-sm mb-4">Invalid or missing reset token.</p>
              <Link to="/forgot-password" className="text-blue-600 font-semibold hover:text-blue-700 text-sm">
                Request a new link
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Set new password</h1>
              <p className="text-sm text-gray-500 mb-6">Enter your new password below.</p>

              {errors.general && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{errors.general}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition"
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm hover:shadow-md"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
