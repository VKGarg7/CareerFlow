import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import Layout from '../components/Layout'
import { getProfile } from '../api/user'
import { getCompanies } from '../api/company'
import { getApplications } from '../api/application'
import { getRecruiters } from '../api/recruiter'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  APPLIED:       { label: 'Applied',       badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'    },
  INTERVIEW:     { label: 'Interview',     badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500'  },
  OFFER:         { label: 'Offer',         badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500'   },
  REJECTED:      { label: 'Rejected',      badge: 'bg-red-100 text-red-700',      dot: 'bg-red-400'     },
  WITHDRAWN:     { label: 'Withdrawn',     badge: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400'    },
  UNDER_REVIEW:  { label: 'Under Review',  badge: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500'  },
  ACCEPTED:      { label: 'Accepted',      badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

function fmt(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Circular SVG ring showing profile % ─────────────────────────────────────
function ProgressRing({ pct, size = 100 }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="white" strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white leading-none">{pct}%</span>
        <span className="text-[10px] text-blue-200 font-medium mt-0.5">done</span>
      </div>
    </div>
  )
}

// ─── Colored gradient stat card ───────────────────────────────────────────────
function StatCard({ icon, label, value, gradient, glow, onClick }) {
  return (
    <button onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} text-white shadow-lg ${glow} text-left w-full group hover:scale-[1.02] transition-transform`}>
      <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute -right-1 -top-6 w-24 h-24 rounded-full bg-white/5" />
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-xs font-semibold opacity-75 uppercase tracking-wide">{label}</p>
      <span className="absolute top-4 right-4 text-xl opacity-60">{icon}</span>
    </button>
  )
}

// ─── Checklist item ───────────────────────────────────────────────────────────
function ChecklistItem({ done, text, index }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5 text-white">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" />
          </svg>
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-gray-400">{index + 1}</span>
        </div>
      )}
      <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{text}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [profile,      setProfile]      = useState(null)
  const [companies,    setCompanies]    = useState([])
  const [applications, setApplications] = useState([])
  const [recruiters,   setRecruiters]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.allSettled([
      getProfile(),
      getCompanies(),
      getApplications(),
      getRecruiters(),
    ]).then(([p, c, a, r]) => {
      if (p.status === 'fulfilled') setProfile(p.value.data)
      if (c.status === 'fulfilled') setCompanies(c.value.data  || [])
      if (a.status === 'fulfilled') setApplications(a.value.data || [])
      if (r.status === 'fulfilled') setRecruiters(r.value.data  || [])
      setLoading(false)
    })
  }, [])

  const name     = profile?.firstName ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}` : 'there'

  const checklist = [
    { done: !!profile,                             text: 'Create your profile' },
    { done: !!profile?.bio,                        text: 'Add a bio' },
    { done: (profile?.education?.length  || 0) > 0, text: 'Add education details' },
    { done: (profile?.experience?.length || 0) > 0, text: 'Add work experience' },
    { done: (profile?.projects?.length   || 0) > 0, text: 'Showcase a project' },
    { done: !!profile?.resume,                     text: 'Upload your resume' },
    { done: !!profile?.linkedinUrl,                text: 'Add LinkedIn URL' },
  ]
  const doneCount  = checklist.filter((c) => c.done).length
  const percentage = Math.round((doneCount / checklist.length) * 100)

  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'

  // Recent applications sorted newest-first (up to 5)
  const recent = [...applications]
    .sort((a, b) => new Date(b.appliedDate || b.createdAt || 0) - new Date(a.appliedDate || a.createdAt || 0))
    .slice(0, 5)

  // Applications by status for mini breakdown
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20"><CircularProgress /></div>
    </Layout>
  )

  return (
    <Layout>
      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl shadow-blue-200">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 75% 30%, white 0%, transparent 55%)' }} />
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-6 -bottom-10 w-36 h-36 rounded-full bg-indigo-500/30" />

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-sm font-medium mb-2 flex items-center gap-1.5">
              {greetEmoji} {greeting}
            </p>
            <h1 className="text-3xl font-black mb-2 tracking-tight">
              Welcome back, {name}!
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed max-w-md mb-6">
              {applications.length === 0
                ? 'Start tracking your job search — add a company and log your first application.'
                : <>You have <span className="text-white font-bold">{applications.length} application{applications.length !== 1 ? 's' : ''}</span> tracked across <span className="text-white font-bold">{companies.length} {companies.length !== 1 ? 'companies' : 'company'}</span>.</>}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/applications')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-50 transition shadow-sm">
                View Applications
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
              <button onClick={() => navigate('/companies')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition border border-white/20">
                Add Company
              </button>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
            <ProgressRing pct={percentage} size={108} />
            <p className="text-blue-200 text-[11px] font-medium">Profile strength</p>
          </div>
        </div>
      </div>

      {/* ── Stats — now real job-search metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🏢" label="Companies"    value={companies.length}
          gradient="from-blue-500 to-blue-600"     glow="shadow-blue-200/60 shadow-lg"
          onClick={() => navigate('/companies')} />
        <StatCard icon="📨" label="Applications" value={applications.length}
          gradient="from-violet-500 to-purple-600" glow="shadow-purple-200/60 shadow-lg"
          onClick={() => navigate('/applications')} />
        <StatCard icon="🤝" label="Recruiters"   value={recruiters.length}
          gradient="from-emerald-500 to-green-600" glow="shadow-green-200/60 shadow-lg"
          onClick={() => navigate('/recruiters')} />
        <StatCard icon="✅" label="Offers"       value={statusCounts['OFFER'] || 0}
          gradient="from-amber-400 to-orange-500"  glow="shadow-orange-200/60 shadow-lg"
          onClick={() => navigate('/applications')} />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Applications</h2>
            <button onClick={() => navigate('/applications')}
              className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              View all →
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4 text-2xl">
                📨
              </div>
              <p className="text-sm font-bold text-gray-700 mb-1">No applications yet</p>
              <p className="text-xs text-gray-400 mb-5">Start by adding companies, then log your applications.</p>
              <button onClick={() => navigate('/applications')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition">
                Log first application
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm overflow-hidden">
              {recent.map((app) => {
                const cfg = STATUS_CFG[app.status] || { label: app.status, badge: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }
                return (
                  <div key={app.id}
                    onClick={() => navigate('/applications')}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    {/* Company initial */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-black">
                        {(app.companyName || app.company?.name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {app.role || app.position || 'Application'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {app.companyName || app.company?.name || '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <span className="text-[11px] text-gray-400">{fmt(app.appliedDate || app.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
              {applications.length > 5 && (
                <div className="px-5 py-3 text-center">
                  <button onClick={() => navigate('/applications')}
                    className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                    +{applications.length - 5} more applications →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status breakdown — only show if there are applications */}
          {applications.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { key: 'INTERVIEW', label: 'Interviews', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { key: 'OFFER',     label: 'Offers',     color: 'text-green-600',  bg: 'bg-green-50'  },
                { key: 'REJECTED',  label: 'Rejected',   color: 'text-red-500',    bg: 'bg-red-50'    },
              ].map(({ key, label, color, bg }) => (
                <div key={key} className={`${bg} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-black ${color}`}>{statusCounts[key] || 0}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Checklist */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Profile Checklist</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{doneCount} of {checklist.length} complete</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
              }`}>{percentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                percentage === 100
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`} style={{ width: `${percentage}%` }} />
            </div>
            <div className="space-y-3">
              {checklist.map((item, i) => (
                <ChecklistItem key={i} done={item.done} text={item.text} index={i} />
              ))}
            </div>
            {percentage < 100 && (
              <button onClick={() => navigate('/profile')}
                className="mt-5 w-full py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition">
                Complete your profile →
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
