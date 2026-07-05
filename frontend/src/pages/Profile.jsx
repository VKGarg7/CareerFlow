import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, CircularProgress, IconButton, Tooltip } from '@mui/material'
import { Delete, Download, Visibility, Upload } from '@mui/icons-material'
import Layout from '../components/Layout'
import { getProfile, createProfile, updateProfile, updateProfileDocuments, downloadProfileDocument } from '../api/user'

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

function formatSize(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile,  setProfile]  = useState(null)
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState(emptyForm)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  // Document operation states
  const [uploadingResume,   setUploadingResume]   = useState(false)
  const [deletingResumeId,  setDeletingResumeId]  = useState(null)
  const [uploadingCL,       setUploadingCL]       = useState(false)
  const [deletingCL,        setDeletingCL]        = useState(false)
  const [docError,          setDocError]          = useState('')

  const toForm = (p) => ({
    firstName: p.firstName || '', lastName: p.lastName || '',
    email: p.email || '', phoneNumber: p.phoneNumber || '',
    linkedinUrl: p.linkedinUrl || '', githubUrl: p.githubUrl || '',
    portfolioUrl: p.portfolioUrl || '', bio: p.bio || '',
    education: p.education || [], experience: p.experience || [], projects: p.projects || [],
  })

  const refreshProfile = () =>
    getProfile()
      .then((res) => { setProfile(res.data); setForm(toForm(res.data)) })
      .catch(() => setProfile(null))

  useEffect(() => { refreshProfile().finally(() => setLoading(false)) }, [])

  const set         = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setListItem = (list, idx, key) => (e) =>
    setForm((f) => ({ ...f, [list]: f[list].map((item, i) =>
      i === idx ? { ...item, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } : item
    )}))
  const addItem    = (list, empty) => () => setForm((f) => ({ ...f, [list]: [...f[list], empty()] }))
  const removeItem = (list, idx)   => () => setForm((f) => ({ ...f, [list]: f[list].filter((_, i) => i !== idx) }))

  // ─── Document helpers ──────────────────────────────────────────────────────
  const getDocBlob = async (doc) => {
    const res = await downloadProfileDocument(doc.documentId ?? doc.id, true)
    return URL.createObjectURL(new Blob([res.data], { type: doc.contentType }))
  }
  const handleView     = async (doc) => { try { window.open(await getDocBlob(doc), '_blank') } catch {} }
  const handleDownload = async (doc) => {
    try {
      const res = await downloadProfileDocument(doc.documentId ?? doc.id, false)
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.contentType }))
      const a = document.createElement('a'); a.href = url; a.download = doc.originalName; a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const handleUploadResume = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'doc', 'docx'].includes(ext)) { setDocError('Only PDF, DOC, DOCX supported.'); return }
    setDocError(''); setUploadingResume(true)
    try {
      const res = await updateProfileDocuments({ resume: file })
      setProfile(res.data)
    } catch { setDocError('Failed to upload resume.') }
    finally { setUploadingResume(false) }
  }

  const handleDeleteResume = async (r) => {
    setDeletingResumeId(r.id)
    try {
      const res = await updateProfileDocuments({ deleteDocumentId: r.documentId })
      setProfile(res.data)
    } catch { setDocError('Failed to delete resume.') }
    finally { setDeletingResumeId(null) }
  }

  const handleUploadCoverLetter = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'doc', 'docx'].includes(ext)) { setDocError('Only PDF, DOC, DOCX supported.'); return }
    setDocError(''); setUploadingCL(true)
    try {
      const res = await updateProfileDocuments({ coverLetter: file })
      setProfile(res.data)
    } catch { setDocError('Failed to upload cover letter.') }
    finally { setUploadingCL(false) }
  }

  const handleDeleteCoverLetter = async () => {
    if (!profile?.coverLetter) return
    setDeletingCL(true)
    try {
      const res = await updateProfileDocuments({ deleteDocumentId: profile.coverLetter.id })
      setProfile(res.data)
    } catch { setDocError('Failed to delete cover letter.') }
    finally { setDeletingCL(false) }
  }

  // ─── Profile save ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName.trim()) { setError('First name is required.'); return }
    if (!form.email.trim())     { setError('Email is required.');      return }
    setSaving(true); setError(''); setSuccess('')
    try {
      await createProfile(form)
      setSuccess('Profile saved successfully.')
      await refreshProfile()
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.')
    } finally { setSaving(false) }
  }

  if (loading) return <Layout><p className="text-gray-400 text-sm">Loading profile...</p></Layout>

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/activity')}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            My Activity
          </button>
          {!editing && (
            <button onClick={() => { setEditing(true); setError(''); setSuccess('') }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              {profile ? 'Edit Profile' : 'Create Profile'}
            </button>
          )}
        </div>
      </div>

      {success  && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      {error    && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {docError && <Alert severity="error"   onClose={() => setDocError('')} sx={{ mb: 2, borderRadius: 2 }}>{docError}</Alert>}

      {/* Documents section — always visible, always immediate */}
      <DocumentsSection
        profile={profile}
        uploadingResume={uploadingResume} deletingResumeId={deletingResumeId}
        uploadingCL={uploadingCL} deletingCL={deletingCL}
        onUploadResume={handleUploadResume}
        onDeleteResume={handleDeleteResume}
        onUploadCoverLetter={handleUploadCoverLetter}
        onDeleteCoverLetter={handleDeleteCoverLetter}
        onView={handleView} onDownload={handleDownload}
      />

      {!editing ? (
        <ViewMode profile={profile} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 mt-6">

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

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {saving && <CircularProgress size={14} color="inherit" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button"
              onClick={() => { setEditing(false); setError('') }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Layout>
  )
}

// ─── Documents Section (always visible, immediate operations) ─────────────────
function DocumentsSection({
  profile,
  uploadingResume, deletingResumeId,
  uploadingCL, deletingCL,
  onUploadResume, onDeleteResume,
  onUploadCoverLetter, onDeleteCoverLetter,
  onView, onDownload,
}) {
  const resumes = profile?.resumes ?? []
  const coverLetter = profile?.coverLetter

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Documents</h3>

      <div className="space-y-6">
        {/* Resumes — multiple */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">
              Resumes
              <span className="ml-1.5 text-xs text-gray-400 font-normal">(PDF, DOC, DOCX · multiple versions)</span>
            </p>
            <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition
              ${uploadingResume
                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'}`}>
              {uploadingResume
                ? <CircularProgress size={11} color="inherit" />
                : <Upload fontSize="small" />}
              {uploadingResume ? 'Uploading…' : 'Add Resume'}
              <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                disabled={uploadingResume}
                onChange={(e) => { onUploadResume(e.target.files[0]); e.target.value = '' }} />
            </label>
          </div>

          {resumes.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No resumes uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {resumes.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-500 shrink-0">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{r.originalName}</p>
                    <p className="text-xs text-gray-400">{formatSize(r.fileSize)}</p>
                  </div>
                  <Tooltip title="View">
                    <IconButton size="small" onClick={() => onView(r)}><Visibility fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton size="small" onClick={() => onDownload(r)}><Download fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" disabled={deletingResumeId === r.id}
                      onClick={() => onDeleteResume(r)}>
                      {deletingResumeId === r.id
                        ? <CircularProgress size={14} color="inherit" />
                        : <Delete fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cover Letter — single */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">
              Cover Letter
              <span className="ml-1.5 text-xs text-gray-400 font-normal">(PDF, DOC, DOCX)</span>
            </p>
            {!coverLetter && (
              <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition
                ${uploadingCL
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'border-violet-300 text-violet-600 hover:bg-violet-50'}`}>
                {uploadingCL
                  ? <CircularProgress size={11} color="inherit" />
                  : <Upload fontSize="small" />}
                {uploadingCL ? 'Uploading…' : 'Upload'}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                  disabled={uploadingCL}
                  onChange={(e) => { onUploadCoverLetter(e.target.files[0]); e.target.value = '' }} />
              </label>
            )}
          </div>

          {coverLetter ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-violet-500 shrink-0">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{coverLetter.originalName}</p>
                <p className="text-xs text-gray-400">{formatSize(coverLetter.fileSize)}</p>
              </div>
              <Tooltip title="View">
                <IconButton size="small" onClick={() => onView(coverLetter)}><Visibility fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton size="small" onClick={() => onDownload(coverLetter)}><Download fontSize="small" /></IconButton>
              </Tooltip>
              <label className="cursor-pointer">
                <Tooltip title="Replace">
                  <span className="inline-flex">
                    <IconButton size="small" component="span" disabled={uploadingCL}>
                      {uploadingCL ? <CircularProgress size={14} color="inherit" /> : <Upload fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                  disabled={uploadingCL}
                  onChange={(e) => { onUploadCoverLetter(e.target.files[0]); e.target.value = '' }} />
              </label>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" disabled={deletingCL} onClick={onDeleteCoverLetter}>
                  {deletingCL ? <CircularProgress size={14} color="inherit" /> : <Delete fontSize="small" />}
                </IconButton>
              </Tooltip>
            </div>
          ) : (
            !uploadingCL && <p className="text-sm text-gray-400 italic">No cover letter uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── View Mode ────────────────────────────────────────────────────────────────
function ViewMode({ profile }) {
  if (!profile) return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
      <p className="text-gray-500 text-sm mb-1">No profile found.</p>
      <p className="text-gray-400 text-xs">Click "Create Profile" above to get started.</p>
    </div>
  )

  const toHref = (url) => url && !/^https?:\/\//i.test(url) ? `https://${url}` : url

  return (
    <div className="space-y-8">
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
    </div>
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
