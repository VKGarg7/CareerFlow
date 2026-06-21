import { useEffect, useState } from 'react'
import { Alert, CircularProgress, IconButton, Tooltip } from '@mui/material'
import { Delete, Download, Visibility, Upload } from '@mui/icons-material'
import Layout from '../components/Layout'
import { getProfile, createProfile, updateDocuments, downloadDocument } from '../api/user'

const emptyEducation  = () => ({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', cgpa: '' })
const emptyExperience = () => ({ company: '', role: '', startDate: '', endDate: '', currentlyWorking: false, description: '' })
const emptyProject    = () => ({ name: '', description: '', websiteUrl: '', githubUrl: '', techStack: '' })

const emptyForm = {
  firstName: '', lastName: '', email: '', phoneNumber: '',
  linkedinUrl: '', githubUrl: '', portfolioUrl: '', bio: '',
  education: [], experience: [], projects: [],
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value || <span className="text-gray-400 italic">—</span>}</p>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '', textarea = false, required = false }) {
  const cls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {textarea
        ? <textarea rows={3} className={cls} value={value} onChange={onChange} placeholder={placeholder} required={required} />
        : <input type={type} className={cls} value={value} onChange={onChange} placeholder={placeholder} required={required} />
      }
    </div>
  )
}

export default function Profile() {
  const [profile,  setProfile]  = useState(null)
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState(emptyForm)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [docFiles, setDocFiles] = useState({ resume: null, coverLetter: null })

  const toForm = (p) => ({
    firstName: p.firstName || '', lastName: p.lastName || '',
    email: p.email || '', phoneNumber: p.phoneNumber || '',
    linkedinUrl: p.linkedinUrl || '', githubUrl: p.githubUrl || '',
    portfolioUrl: p.portfolioUrl || '', bio: p.bio || '',
    education: p.education || [], experience: p.experience || [], projects: p.projects || [],
  })

  const refreshProfile = () =>
    getProfile().then((res) => { setProfile(res.data); setForm(toForm(res.data)) }).catch(() => setProfile(null))

  const refreshProfileOnly = () =>
    getProfile().then((res) => setProfile(res.data)).catch(() => {})

  useEffect(() => { refreshProfile().finally(() => setLoading(false)) }, [])

  const set         = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setListItem = (list, idx, key) => (e) =>
    setForm((f) => ({ ...f, [list]: f[list].map((item, i) =>
      i === idx ? { ...item, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } : item
    )}))
  const addItem    = (list, empty) => () => setForm((f) => ({ ...f, [list]: [...f[list], empty()] }))
  const removeItem = (list, idx)   => () => setForm((f) => ({ ...f, [list]: f[list].filter((_, i) => i !== idx) }))

  const getDocBlob = async (doc) => {
    const res = await downloadDocument(doc.id)
    return URL.createObjectURL(new Blob([res.data], { type: doc.contentType }))
  }
  const handleViewDoc = async (doc) => { try { window.open(await getDocBlob(doc), '_blank') } catch {} }
  const handleDownloadDoc = async (doc) => {
    try {
      const url = await getDocBlob(doc)
      const a = document.createElement('a'); a.href = url; a.download = doc.originalName; a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }
  const formatSize = (b) => !b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`

  const handleDeleteDoc = async (docId) => {
    try { await updateDocuments(null, null, docId); await refreshProfileOnly() } catch {}
  }
  const handleUploadDoc = async (key, file) => {
    if (!file) return
    try {
      await updateDocuments(key === 'resume' ? file : null, key === 'coverLetter' ? file : null)
      await refreshProfileOnly()
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName.trim()) { setError('First name is required.'); return }
    if (!form.email.trim())     { setError('Email is required.');      return }
    setSaving(true); setError(''); setSuccess('')
    try {
      await createProfile(form)
      if (docFiles.resume || docFiles.coverLetter) {
        await updateDocuments(docFiles.resume, docFiles.coverLetter)
        setDocFiles({ resume: null, coverLetter: null })
      }
      setSuccess('Profile saved successfully.')
      await refreshProfile()
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <Layout>
      <p className="text-gray-400 text-sm">Loading profile...</p>
    </Layout>
  )

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        {!editing && (
          <button onClick={() => { setEditing(true); setError(''); setSuccess('') }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            {profile ? 'Edit Profile' : 'Create Profile'}
          </button>
        )}
      </div>

      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {!editing ? (
        <ViewMode profile={profile}
          onDeleteDoc={handleDeleteDoc} onUploadDoc={handleUploadDoc}
          onViewDoc={handleViewDoc} onDownloadDoc={handleDownloadDoc} formatSize={formatSize} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Personal Info */}
          <Section title="Personal Information">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="John" required />
              <Input label="Last Name"  value={form.lastName}  onChange={set('lastName')}  placeholder="Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
              <Input label="Phone Number" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+91 9876543210" />
            </div>
            <Input label="LinkedIn URL"  value={form.linkedinUrl}  onChange={set('linkedinUrl')}  placeholder="https://linkedin.com/in/username" />
            <Input label="GitHub URL"    value={form.githubUrl}    onChange={set('githubUrl')}    placeholder="https://github.com/username" />
            <Input label="Portfolio URL" value={form.portfolioUrl} onChange={set('portfolioUrl')} placeholder="https://yourportfolio.com" />
            <Input label="Bio" value={form.bio} onChange={set('bio')} textarea placeholder="Tell us about yourself..." />
          </Section>

          {/* Education */}
          <Section title="Education" onAdd={addItem('education', emptyEducation)}>
            {form.education.map((edu, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                <Tooltip title="Remove">
                  <IconButton size="small" color="error" onClick={removeItem('education', i)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Institution"    value={edu.institution}  onChange={setListItem('education', i, 'institution')}  placeholder="MIT" />
                  <Input label="Degree"         value={edu.degree}       onChange={setListItem('education', i, 'degree')}       placeholder="B.Tech" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Field of Study" value={edu.fieldOfStudy} onChange={setListItem('education', i, 'fieldOfStudy')} placeholder="Computer Science" />
                  <Input label="Start Year"     value={edu.startYear}    onChange={setListItem('education', i, 'startYear')}    placeholder="2020" />
                  <Input label="End Year"       value={edu.endYear}      onChange={setListItem('education', i, 'endYear')}      placeholder="2024" />
                </div>
                <Input label="CGPA / Grade" value={edu.cgpa} onChange={setListItem('education', i, 'cgpa')} placeholder="8.5" />
              </div>
            ))}
            {form.education.length === 0 && <p className="text-sm text-gray-400 italic">No education added yet.</p>}
          </Section>

          {/* Experience */}
          <Section title="Experience" onAdd={addItem('experience', emptyExperience)}>
            {form.experience.map((exp, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                <Tooltip title="Remove">
                  <IconButton size="small" color="error" onClick={removeItem('experience', i)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Company" value={exp.company} onChange={setListItem('experience', i, 'company')} placeholder="Google" />
                  <Input label="Role"    value={exp.role}    onChange={setListItem('experience', i, 'role')}    placeholder="Software Engineer" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Date (MM/YYYY)" value={exp.startDate} onChange={setListItem('experience', i, 'startDate')} placeholder="06/2022" />
                  {!exp.currentlyWorking && (
                    <Input label="End Date (MM/YYYY)" value={exp.endDate} onChange={setListItem('experience', i, 'endDate')} placeholder="06/2024" />
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={exp.currentlyWorking}
                    onChange={setListItem('experience', i, 'currentlyWorking')}
                    className="w-4 h-4 rounded text-blue-600" />
                  Currently working here
                </label>
                <Input label="Description" value={exp.description} onChange={setListItem('experience', i, 'description')} textarea placeholder="Describe your responsibilities..." />
              </div>
            ))}
            {form.experience.length === 0 && <p className="text-sm text-gray-400 italic">No experience added yet.</p>}
          </Section>

          {/* Projects */}
          <Section title="Projects" onAdd={addItem('projects', emptyProject)}>
            {form.projects.map((proj, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                <Tooltip title="Remove">
                  <IconButton size="small" color="error" onClick={removeItem('projects', i)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Input label="Project Name" value={proj.name}        onChange={setListItem('projects', i, 'name')}        placeholder="My Awesome Project" />
                <Input label="Description"  value={proj.description} onChange={setListItem('projects', i, 'description')} textarea placeholder="What does this project do?" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Website URL" value={proj.websiteUrl} onChange={setListItem('projects', i, 'websiteUrl')} placeholder="https://myproject.com" />
                  <Input label="GitHub URL"  value={proj.githubUrl}  onChange={setListItem('projects', i, 'githubUrl')}  placeholder="https://github.com/you/repo" />
                </div>
                <Input label="Tech Stack" value={proj.techStack} onChange={setListItem('projects', i, 'techStack')} placeholder="React, Node.js, PostgreSQL" />
              </div>
            ))}
            {form.projects.length === 0 && <p className="text-sm text-gray-400 italic">No projects added yet.</p>}
          </Section>

          {/* Documents */}
          <Section title="Documents">
            <div className="grid grid-cols-2 gap-4">
              {[{ key: 'resume', label: 'Resume', existing: profile?.resume },
                { key: 'coverLetter', label: 'Cover Letter', existing: profile?.coverLetter }
              ].map(({ key, label, existing }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  {existing && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <p className="text-xs text-gray-700 truncate flex-1">{existing.originalName}</p>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => handleViewDoc(existing)}><Visibility fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => handleDownloadDoc(existing)}><Download fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeleteDoc(existing.id)}><Delete fontSize="small" /></IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <Upload fontSize="small" />
                    {existing ? 'Replace' : 'Upload'}
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                      onChange={(e) => setDocFiles((f) => ({ ...f, [key]: e.target.files[0] || null }))} />
                  </label>
                  {docFiles[key] && <p className="text-xs text-green-600">Selected: {docFiles[key].name}</p>}
                </div>
              ))}
            </div>
          </Section>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {saving && <CircularProgress size={14} color="inherit" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button"
              onClick={() => { setEditing(false); setError(''); setDocFiles({ resume: null, coverLetter: null }) }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Layout>
  )
}

function Section({ title, onAdd, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 w-full">{title}</h3>
        {onAdd && (
          <button type="button" onClick={onAdd}
            className="ml-4 whitespace-nowrap text-sm text-blue-600 hover:underline font-medium">
            + Add
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function ViewMode({ profile, onDeleteDoc, onUploadDoc, onViewDoc, onDownloadDoc, formatSize }) {
  if (!profile) return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
      <p className="text-gray-500 text-sm mb-1">No profile found.</p>
      <p className="text-gray-400 text-xs">Click "Create Profile" above to get started.</p>
    </div>
  )

  const toHref = (url) => url && !/^https?:\/\//i.test(url) ? `https://${url}` : url

  return (
    <div className="space-y-8">

      {/* Personal Info */}
      <Card title="Personal Information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" value={profile.firstName} />
          <Field label="Last Name"  value={profile.lastName}  />
          <Field label="Email"      value={profile.email}      />
          <Field label="Phone"      value={profile.phoneNumber}/>
        </div>
        {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.linkedinUrl  && <LinkBadge label="LinkedIn"  href={toHref(profile.linkedinUrl)}  color="blue"   />}
            {profile.githubUrl    && <LinkBadge label="GitHub"    href={toHref(profile.githubUrl)}    color="gray"   />}
            {profile.portfolioUrl && <LinkBadge label="Portfolio" href={toHref(profile.portfolioUrl)} color="purple" />}
          </div>
        )}
        {profile.bio && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-0.5">Bio</p>
            <p className="text-sm text-gray-800 leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </Card>

      {/* Education */}
      {profile.education?.length > 0 && (
        <Card title="Education">
          <div className="space-y-4">
            {profile.education.map((edu, i) => (
              <div key={i} className="border-l-4 border-blue-200 pl-4">
                <p className="font-medium text-gray-800 text-sm">{edu.institution}</p>
                <p className="text-sm text-gray-600">{edu.degree}{edu.fieldOfStudy && ` — ${edu.fieldOfStudy}`}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {edu.startYear} – {edu.endYear || 'Present'}{edu.cgpa && ` · CGPA: ${edu.cgpa}`}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Experience */}
      {profile.experience?.length > 0 && (
        <Card title="Experience">
          <div className="space-y-4">
            {profile.experience.map((exp, i) => (
              <div key={i} className="border-l-4 border-green-200 pl-4">
                <p className="font-medium text-gray-800 text-sm">{exp.role}</p>
                <p className="text-sm text-gray-600">{exp.company}</p>
                <p className="text-xs text-gray-400 mt-1">{exp.startDate} – {exp.currentlyWorking ? 'Present' : exp.endDate}</p>
                {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Projects */}
      {profile.projects?.length > 0 && (
        <Card title="Projects">
          <div className="space-y-4">
            {profile.projects.map((proj, i) => (
              <div key={i} className="border-l-4 border-purple-200 pl-4">
                <p className="font-medium text-gray-800 text-sm">{proj.name}</p>
                {proj.description && <p className="text-sm text-gray-600 mt-0.5">{proj.description}</p>}
                {proj.techStack && <p className="text-xs text-gray-400 mt-1">Stack: {proj.techStack}</p>}
                <div className="flex gap-3 mt-1">
                  {proj.websiteUrl && <a href={toHref(proj.websiteUrl)} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Website</a>}
                  {proj.githubUrl  && <a href={toHref(proj.githubUrl)}  target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">GitHub</a>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documents */}
      <Card title="Documents">
        <div className="grid grid-cols-2 gap-4">
          {[{ doc: profile.resume, label: 'Resume', key: 'resume' },
            { doc: profile.coverLetter, label: 'Cover Letter', key: 'coverLetter' }
          ].map(({ doc, label, key }) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
              {doc ? (
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.originalName}</p>
                    <p className="text-xs text-gray-400">{formatSize(doc.fileSize)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => onViewDoc(doc)}><Visibility fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={() => onDownloadDoc(doc)}><Download fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => onDeleteDoc(doc.id)}><Delete fontSize="small" /></IconButton>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Upload fontSize="small" className="text-gray-300 group-hover:text-blue-400 transition" />
                  <span className="text-xs text-gray-400 group-hover:text-blue-500 transition">Upload {label.toLowerCase()}</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={(e) => onUploadDoc(key, e.target.files[0])} />
                </label>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  )
}

function LinkBadge({ label, href, color }) {
  const colors = {
    blue:   'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200',
    gray:   'text-gray-800 bg-gray-100 hover:bg-gray-200 border-gray-300',
    purple: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200',
  }
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${colors[color]}`}>
      {label} →
    </a>
  )
}
