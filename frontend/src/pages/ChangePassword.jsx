import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../api/auth'
import AuthPanel, { AuthBrand } from '../components/AuthSplitPanel'
import { AuthCard, AuthField, AuthInputIcon, LockIcon, AuthErrorBanner, AuthFormSide, AuthDecoTile, EyeIcon } from '../components/AuthFormKit'
import { authInputIconCls } from '../components/authStyles'

const TIPS = [
  { icon: '🛡️', title: 'Stay fresh', text: 'Keep your account secure with a fresh password' },
  { icon: '🔑', title: 'Length matters', text: 'Use at least 8 characters' },
  { icon: '🔀', title: 'Mix it up', text: 'Mix letters, numbers, and symbols' },
]

export default function ChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState({ current: false, next: false, confirm: false })

  const toggle = (key) => setShow((s) => ({ ...s, [key]: !s[key] }))
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSuccess('')
    setLoading(true)
    try {
      await changePassword(form)
      setSuccess('Password changed successfully.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else setErrors({ general: data?.message || 'Failed to change password.' })
    } finally {
      setLoading(false)
    }
  }

  const passwordField = (label, name, showKey, placeholder) => (
    <AuthField label={label} error={errors[name]}>
      <div className="relative">
        <AuthInputIcon><LockIcon /></AuthInputIcon>
        <input
          type={show[showKey] ? 'text' : 'password'}
          name={name}
          value={form[name]}
          onChange={handleChange}
          required
          placeholder={placeholder}
          className={authInputIconCls(!!errors[name]) + ' pr-10'}
        />
        <button type="button" tabIndex={-1} onClick={() => toggle(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
          <EyeIcon open={show[showKey]} />
        </button>
      </div>
    </AuthField>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#05060B]">
      <AuthPanel
        eyebrow="Account security"
        width="w-[380px]"
        title={<>Keep your<br /><span className="text-[#A78BFA]">account secure</span></>}
        subtitle="Update your password regularly to keep your job search data safe and sound."
        items={TIPS}
        illustration
      />

      <AuthFormSide>
        <AuthBrand mobile />

        <div className="relative">
          <AuthDecoTile label="Security tip" value="Rotate regularly" sub="A fresh password keeps you safe" className="-right-12 -top-8 -rotate-2" />

          <AuthCard compact>
            <h1 className="mb-1 font-display text-xl font-bold text-white">Change password</h1>
            <p className="mb-4 text-sm text-white/45">Update your account password.</p>

            <AuthErrorBanner>{errors.general}</AuthErrorBanner>
            {success && (
              <div className="mb-4 rounded-xl border border-app-success/20 bg-app-success/10 px-4 py-3 text-sm text-app-success">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {passwordField('Current password', 'currentPassword', 'current', '••••••••')}
              {passwordField('New password', 'newPassword', 'next', 'Min. 8 characters')}
              {passwordField('Confirm new password', 'confirmPassword', 'confirm', '••••••••')}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-app-accent py-2.5 text-sm font-semibold text-white shadow-glow shadow-app-accent/40 transition hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </AuthCard>
        </div>
      </AuthFormSide>
    </div>
  )
}
