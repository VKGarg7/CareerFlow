import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import Layout from '../components/Layout'
import { getProfile } from '../api/user'

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`bg-white rounded-xl border ${c.border} p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <span className={`text-2xl ${c.icon}`}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function ActionCard({ icon, title, description, onClick, accent }) {
  const accents = {
    blue:   'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green:  'from-green-500 to-green-600',
    orange: 'from-orange-400 to-orange-500',
  }
  return (
    <button onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 w-full">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accents[accent] || accents.blue} flex items-center justify-center mb-3 text-white text-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </button>
  )
}

function ChecklistItem({ done, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
        ${done ? 'bg-green-500 text-white' : 'bg-gray-100 border border-gray-300 text-gray-400'}`}>
        {done ? '✓' : ''}
      </div>
      <p className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{text}</p>
    </div>
  )
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const name = profile?.firstName ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}` : 'there'

  const eduCount  = profile?.education?.length  || 0
  const expCount  = profile?.experience?.length || 0
  const projCount = profile?.projects?.length   || 0
  const docCount  = [profile?.resume, profile?.coverLetter].filter(Boolean).length

  const checklist = [
    { done: !!profile,               text: 'Create your profile' },
    { done: !!profile?.bio,          text: 'Add a bio' },
    { done: eduCount  > 0,           text: 'Add education details' },
    { done: expCount  > 0,           text: 'Add work experience' },
    { done: projCount > 0,           text: 'Showcase a project' },
    { done: !!profile?.resume,       text: 'Upload your resume' },
    { done: !!profile?.linkedinUrl,  text: 'Add LinkedIn URL' },
  ]
  const doneCount   = checklist.filter((c) => c.done).length
  const percentage  = Math.round((doneCount / checklist.length) * 100)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <CircularProgress />
      </div>
    </Layout>
  )

  return (
    <Layout>
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium mb-1">{greeting} 👋</p>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {name}!</h1>
          <p className="text-blue-100 text-sm max-w-md">
            Your profile is <span className="text-white font-semibold">{percentage}% complete</span>.
            {percentage < 100
              ? ' Keep it up — a complete profile gets noticed faster.'
              : ' Great job! Your profile is fully set up.'}
          </p>
          <button onClick={() => navigate('/profile')}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 transition">
            {percentage < 100 ? 'Complete Profile →' : 'View Profile →'}
          </button>
        </div>
        {/* decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white opacity-5" />
        <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-white opacity-5" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🎓" label="Education"  value={eduCount}  color="blue"   />
        <StatCard icon="💼" label="Experience" value={expCount}  color="green"  />
        <StatCard icon="🚀" label="Projects"   value={projCount} color="purple" />
        <StatCard icon="📄" label="Documents"  value={docCount}  color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="md:col-span-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <ActionCard icon="✏️" accent="blue"
              title="Edit Profile"
              description="Update your personal info, education, and experience."
              onClick={() => navigate('/profile')} />
            <ActionCard icon="📄" accent="orange"
              title="Upload Resume"
              description="Add or replace your resume and cover letter."
              onClick={() => navigate('/profile')} />
            <ActionCard icon="🚀" accent="purple"
              title="Add Project"
              description="Showcase your work with project details and links."
              onClick={() => navigate('/profile')} />
            <ActionCard icon="🔗" accent="green"
              title="Add Links"
              description="Add your LinkedIn, GitHub, or portfolio URL."
              onClick={() => navigate('/profile')} />
          </div>
        </div>

        {/* Profile Checklist */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Profile Checklist</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">{doneCount} of {checklist.length} complete</p>
              <p className="text-xs font-semibold text-blue-600">{percentage}%</p>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }} />
            </div>
            <div className="space-y-3">
              {checklist.map((item, i) => <ChecklistItem key={i} done={item.done} text={item.text} />)}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
