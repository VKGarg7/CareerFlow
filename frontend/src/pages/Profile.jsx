import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircularProgress, IconButton, Tooltip } from '@mui/material'
import { Delete, Download, Visibility, Upload } from '@mui/icons-material'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import PageSpinner from '../components/PageSpinner'
import PageAlert from '../components/PageAlert'
import { createProfile, updateProfile, updateProfileDocuments, downloadProfileDocument } from '../api/user'
import { useProfile } from '../context/ProfileContext'
import { profileInitial } from '../utils/followup'
import { fmtFileSize, isAllowedDocExt, openDocInNewTab, downloadDoc } from '../utils/documents'
import { FieldLabel } from '../components/formKit'

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
    <div className="min-w-0">
      <p className="text-xs text-white/35 mb-0.5">{label}</p>
      <p className="text-sm text-white/80 truncate" title={value || undefined}>{value || <span className="text-white/30 italic">—</span>}</p>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '', textarea = false, required = false }) {
  const cls = "w-full px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-white/85 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-app-accent/40 hover:border-white/[0.14] transition placeholder:text-white/25"
  return (
    <div>
      <FieldLabel>
        {label}{required && <span className="text-app-danger ml-0.5">*</span>}
      </FieldLabel>
      {textarea
        ? <textarea rows={3} className={cls} value={value} onChange={onChange} placeholder={placeholder} required={required} />
        : <input type={type} className={cls} value={value} onChange={onChange} placeholder={placeholder} required={required} />
      }
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { profile, setProfile, refetch: refreshProfile, loading: profileLoading } = useProfile()
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState(emptyForm)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

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

  useEffect(() => {
    if (profile) setForm(toForm(profile))
  }, [profile])

  const set         = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setListItem = (list, idx, key) => (e) =>
    setForm((f) => ({ ...f, [list]: f[list].map((item, i) =>
      i === idx ? { ...item, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } : item
    )}))
  const addItem    = (list, empty) => () => setForm((f) => ({ ...f, [list]: [...f[list], empty()] }))
  const removeItem = (list, idx)   => () => setForm((f) => ({ ...f, [list]: f[list].filter((_, i) => i !== idx) }))

  const handleView     = (doc) => openDocInNewTab((d) => downloadProfileDocument(d.documentId ?? d.id, true), doc)
  const handleDownload = (doc) => downloadDoc((d) => downloadProfileDocument(d.documentId ?? d.id, false), doc)

  const handleUploadResume = async (file) => {
    if (!file) return
    if (!isAllowedDocExt(file)) { setDocError('Only PDF, DOC, DOCX supported.'); return }
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
    if (!isAllowedDocExt(file)) { setDocError('Only PDF, DOC, DOCX supported.'); return }
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

  if (profileLoading) return (
    <Layout>
      <PageSpinner py="py-20" />
    </Layout>
  )

  return (
    <Layout
      headerAction={
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/change-password')}
            className="px-4 py-2.5 text-sm font-semibold text-white/70 bg-white/[0.05] rounded-xl hover:bg-white/[0.08] active:scale-95 transition">
            Change Password
          </button>
          <button onClick={() => navigate('/activity')}
            className="px-4 py-2.5 text-sm font-semibold text-white/70 bg-white/[0.05] rounded-xl hover:bg-white/[0.08] active:scale-95 transition">
            My Activity
          </button>
          {!editing && (
            <button onClick={() => { setEditing(true); setError(''); setSuccess('') }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all shadow-glow shadow-app-accent/40">
              {profile ? 'Edit Profile' : 'Create Profile'}
            </button>
          )}
        </div>
      }
    >
      <div className="overflow-x-hidden">
      <PageAlert severity="success" message={success} onClose={() => setSuccess('')} className="animate-fade-slide-up" />
      <PageAlert severity="error" message={error} onClose={() => setError('')} className="animate-fade-slide-up" />
      <PageAlert severity="error" message={docError} onClose={() => setDocError('')} className="animate-fade-slide-up" />

      <div className="animate-fade-slide-up">
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
      </div>

      {!editing ? (
        <div key="view" className="animate-fade-in">
          <ViewMode profile={profile} />
        </div>
      ) : (
        <form key="edit" onSubmit={handleSubmit} className="space-y-8 mt-6 animate-fade-slide-up">

          <Section title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="John" required />
              <Input label="Last Name"  value={form.lastName}  onChange={set('lastName')}  placeholder="Doe" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
              <Input label="Phone Number" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+91 9876543210" />
            </div>
            <Input label="LinkedIn URL"  value={form.linkedinUrl}  onChange={set('linkedinUrl')}  placeholder="https://linkedin.com/in/username" />
            <Input label="GitHub URL"    value={form.githubUrl}    onChange={set('githubUrl')}    placeholder="https://github.com/username" />
            <Input label="Portfolio URL" value={form.portfolioUrl} onChange={set('portfolioUrl')} placeholder="https://yourportfolio.com" />
            <Input label="Bio" value={form.bio} onChange={set('bio')} textarea placeholder="Tell us about yourself..." />
          </Section>

          <Section title="Education" onAdd={addItem('education', emptyEducation)}>
            {form.education.map((edu, i) => (
              <div key={i} className="border border-white/[0.06] rounded-2xl p-4 space-y-3 relative bg-white/[0.02] animate-scale-in">
                <Tooltip title="Remove">
                  <IconButton size="small" color="error" onClick={removeItem('education', i)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Institution"    value={edu.institution}  onChange={setListItem('education', i, 'institution')}  placeholder="MIT" />
                  <Input label="Degree"         value={edu.degree}       onChange={setListItem('education', i, 'degree')}       placeholder="B.Tech" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="Field of Study" value={edu.fieldOfStudy} onChange={setListItem('education', i, 'fieldOfStudy')} placeholder="Computer Science" />
                  <Input label="Start Year"     value={edu.startYear}    onChange={setListItem('education', i, 'startYear')}    placeholder="2020" />
                  <Input label="End Year"       value={edu.endYear}      onChange={setListItem('education', i, 'endYear')}      placeholder="2024" />
                </div>
                <Input label="CGPA / Grade" value={edu.cgpa} onChange={setListItem('education', i, 'cgpa')} placeholder="8.5" />
              </div>
            ))}
            {form.education.length === 0 && <p className="text-sm text-white/35 italic">No education added yet.</p>}
          </Section>

          <Section title="Experience" onAdd={addItem('experience', emptyExperience)}>
            {form.experience.map((exp, i) => (
              <div key={i} className="border border-white/[0.06] rounded-2xl p-4 space-y-3 relative bg-white/[0.02] animate-scale-in">
                <Tooltip title="Remove">
                  <IconButton size="small" color="error" onClick={removeItem('experience', i)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Company" value={exp.company} onChange={setListItem('experience', i, 'company')} placeholder="Google" />
                  <Input label="Role"    value={exp.role}    onChange={setListItem('experience', i, 'role')}    placeholder="Software Engineer" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Start Date (MM/YYYY)" value={exp.startDate} onChange={setListItem('experience', i, 'startDate')} placeholder="06/2022" />
                  {!exp.currentlyWorking && (
                    <Input label="End Date (MM/YYYY)" value={exp.endDate} onChange={setListItem('experience', i, 'endDate')} placeholder="06/2024" />
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="checkbox" checked={exp.currentlyWorking}
                    onChange={setListItem('experience', i, 'currentlyWorking')}
                    className="w-4 h-4 rounded accent-app-accent" />
                  Currently working here
                </label>
                <Input label="Description" value={exp.description} onChange={setListItem('experience', i, 'description')} textarea placeholder="Describe your responsibilities..." />
              </div>
            ))}
            {form.experience.length === 0 && <p className="text-sm text-white/35 italic">No experience added yet.</p>}
          </Section>

          <Section title="Projects" onAdd={addItem('projects', emptyProject)}>
            {form.projects.map((proj, i) => (
              <div key={i} className="border border-white/[0.06] rounded-2xl p-4 space-y-3 relative bg-white/[0.02] animate-scale-in">
                <Tooltip title="Remove">
                  <IconButton size="small" color="error" onClick={removeItem('projects', i)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Input label="Project Name" value={proj.name}        onChange={setListItem('projects', i, 'name')}        placeholder="My Awesome Project" />
                <Input label="Description"  value={proj.description} onChange={setListItem('projects', i, 'description')} textarea placeholder="What does this project do?" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Website URL" value={proj.websiteUrl} onChange={setListItem('projects', i, 'websiteUrl')} placeholder="https://myproject.com" />
                  <Input label="GitHub URL"  value={proj.githubUrl}  onChange={setListItem('projects', i, 'githubUrl')}  placeholder="https://github.com/you/repo" />
                </div>
                <Input label="Tech Stack" value={proj.techStack} onChange={setListItem('projects', i, 'techStack')} placeholder="React, Node.js, PostgreSQL" />
              </div>
            ))}
            {form.projects.length === 0 && <p className="text-sm text-white/35 italic">No projects added yet.</p>}
          </Section>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-app-accent text-white text-sm font-semibold rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition shadow-glow shadow-app-accent/40">
              {saving && <CircularProgress size={14} color="inherit" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button"
              onClick={() => { setEditing(false); setError('') }}
              className="px-6 py-2.5 bg-white/[0.05] text-white/70 text-sm font-semibold rounded-xl hover:bg-white/[0.08] active:scale-95 transition">
              Cancel
            </button>
          </div>
        </form>
      )}
      </div>
    </Layout>
  )
}

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
    <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card p-6 mb-6 transition-all duration-300 hover:-translate-y-[1px] hover:border-white/[0.07] hover:shadow-card-hover">
      <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-white/[0.06]">
        <span className="w-7 h-7 rounded-lg bg-app-accent/10 flex items-center justify-center text-sm shrink-0">📄</span>
        <h3 className="text-base font-semibold text-white/85">Documents</h3>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white/65">
              Resumes
              <span className="ml-1.5 text-xs text-white/35 font-normal">(PDF, DOC, DOCX · multiple versions)</span>
            </p>
            <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition
              ${uploadingResume
                ? 'border-white/[0.08] text-white/30 bg-white/[0.02] cursor-not-allowed'
                : 'border-app-accent/30 text-app-accent-soft hover:bg-app-accent/10'}`}>
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
            <p className="text-sm text-white/35 italic">No resumes uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {resumes.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-app-accent-soft shrink-0">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-[10rem]">
                    <p className="text-sm font-medium text-white/80 truncate">{r.originalName}</p>
                    <p className="text-xs text-white/35">{fmtFileSize(r.fileSize)}</p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => onView(r)} sx={{ color: 'rgba(255,255,255,0.5)' }}><Visibility fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={() => onDownload(r)} sx={{ color: 'rgba(255,255,255,0.5)' }}><Download fontSize="small" /></IconButton>
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
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white/65">
              Cover Letter
              <span className="ml-1.5 text-xs text-white/35 font-normal">(PDF, DOC, DOCX)</span>
            </p>
            {!coverLetter && (
              <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition
                ${uploadingCL
                  ? 'border-white/[0.08] text-white/30 bg-white/[0.02] cursor-not-allowed'
                  : 'border-app-accent2/30 text-app-accent-soft hover:bg-app-accent2/10'}`}>
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
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-app-accent-soft shrink-0">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-[10rem]">
                <p className="text-sm font-medium text-white/80 truncate">{coverLetter.originalName}</p>
                <p className="text-xs text-white/35">{fmtFileSize(coverLetter.fileSize)}</p>
              </div>
              <div className="flex items-center shrink-0">
                <Tooltip title="View">
                  <IconButton size="small" onClick={() => onView(coverLetter)} sx={{ color: 'rgba(255,255,255,0.5)' }}><Visibility fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={() => onDownload(coverLetter)} sx={{ color: 'rgba(255,255,255,0.5)' }}><Download fontSize="small" /></IconButton>
                </Tooltip>
                <label className="cursor-pointer">
                  <Tooltip title="Replace">
                    <span className="inline-flex">
                      <IconButton size="small" component="span" disabled={uploadingCL} sx={{ color: 'rgba(255,255,255,0.5)' }}>
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
            </div>
          ) : (
            !uploadingCL && <p className="text-sm text-white/35 italic">No cover letter uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileHero({ profile }) {
  const toHref = (url) => url && !/^https?:\/\//i.test(url) ? `https://${url}` : url
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Unnamed'
  const initial = profileInitial(profile)
  const latestRole = profile.experience?.find((e) => e.currentlyWorking) || profile.experience?.[0]
  const resumeCount = profile.resumes?.length ?? 0

  const stats = [
    { label: 'Education',   value: profile.education?.length ?? 0 },
    { label: 'Experience',  value: profile.experience?.length ?? 0 },
    { label: 'Projects',    value: profile.projects?.length ?? 0 },
    { label: 'Resumes',     value: resumeCount },
  ]

  return (
    <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card mb-6 animate-fade-slide-up">
      <div className="h-24 sm:h-28 bg-gradient-to-br from-app-accent/25 via-app-accent2/15 to-transparent" />

      <div className="px-6 pb-6 -mt-12 sm:-mt-14">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-app-accent to-app-accent2 flex items-center justify-center text-white text-3xl font-bold shrink-0 ring-4 ring-app-surface shadow-glow shadow-app-accent/40">
            {initial}
          </div>

          <div className="flex-1 min-w-0 sm:pb-1">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white truncate">{name}</h2>
            {latestRole && (
              <p className="text-sm text-white/60 mt-0.5 truncate">
                {latestRole.role}{latestRole.company && ` @ ${latestRole.company}`}
              </p>
            )}
            {!latestRole && profile.email && (
              <p className="text-sm text-white/40 mt-0.5 truncate">{profile.email}</p>
            )}
          </div>

          {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
            <div className="flex flex-wrap gap-2 sm:pb-1">
              {profile.linkedinUrl  && <LinkBadge label="LinkedIn"  href={toHref(profile.linkedinUrl)}  color="blue"   />}
              {profile.githubUrl    && <LinkBadge label="GitHub"    href={toHref(profile.githubUrl)}    color="gray"   />}
              {profile.portfolioUrl && <LinkBadge label="Portfolio" href={toHref(profile.portfolioUrl)} color="purple" />}
            </div>
          )}
        </div>

        {profile.bio && (
          <p className="text-sm text-white/70 leading-relaxed mt-4 max-w-3xl">{profile.bio}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <p className="font-display text-xl font-bold text-white leading-none">{s.value}</p>
              <p className="text-xs text-white/40 mt-1.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ViewMode({ profile }) {
  if (!profile) return (
    <EmptyState
      icon="👤"
      title="No profile found"
      description='Click "Create Profile" above to get started.'
    />
  )

  const toHref = (url) => url && !/^https?:\/\//i.test(url) ? `https://${url}` : url

  return (
    <div className="space-y-8">
      <ProfileHero profile={profile} />

      <Card title="Personal Information" icon="👤" delay={0}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" value={profile.firstName} />
          <Field label="Last Name"  value={profile.lastName}  />
          <Field label="Email"      value={profile.email}      />
          <Field label="Phone"      value={profile.phoneNumber}/>
        </div>
      </Card>

      {profile.education?.length > 0 && (
        <Card title="Education" icon="🎓" delay={1}>
          <div className="space-y-4">
            {profile.education.map((edu, i) => (
              <div key={i} className="border-l-4 border-app-accent/30 pl-4">
                <p className="font-medium text-white/85 text-sm">{edu.institution}</p>
                <p className="text-sm text-white/60">{edu.degree}{edu.fieldOfStudy && ` — ${edu.fieldOfStudy}`}</p>
                <p className="text-xs text-white/35 mt-1">
                  {edu.startYear} – {edu.endYear || 'Present'}{edu.cgpa && ` · CGPA: ${edu.cgpa}`}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {profile.experience?.length > 0 && (
        <Card title="Experience" icon="💼" delay={2}>
          <div className="space-y-4">
            {profile.experience.map((exp, i) => (
              <div key={i} className="border-l-4 border-app-success/30 pl-4">
                <p className="font-medium text-white/85 text-sm">{exp.role}</p>
                <p className="text-sm text-white/60">{exp.company}</p>
                <p className="text-xs text-white/35 mt-1">{exp.startDate} – {exp.currentlyWorking ? 'Present' : exp.endDate}</p>
                {exp.description && <p className="text-sm text-white/60 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {profile.projects?.length > 0 && (
        <Card title="Projects" icon="🚀" delay={3}>
          <div className="space-y-4">
            {profile.projects.map((proj, i) => (
              <div key={i} className="border-l-4 border-app-accent2/30 pl-4">
                <p className="font-medium text-white/85 text-sm">{proj.name}</p>
                {proj.description && <p className="text-sm text-white/60 mt-0.5">{proj.description}</p>}
                {proj.techStack && <p className="text-xs text-white/35 mt-1">Stack: {proj.techStack}</p>}
                <div className="flex gap-3 mt-1">
                  {proj.websiteUrl && <a href={toHref(proj.websiteUrl)} target="_blank" rel="noreferrer" className="text-xs text-app-accent-soft hover:underline">Website</a>}
                  {proj.githubUrl  && <a href={toHref(proj.githubUrl)}  target="_blank" rel="noreferrer" className="text-xs text-app-accent-soft hover:underline">GitHub</a>}
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
        <h3 className="text-xs font-bold text-white/35 uppercase tracking-widest border-b border-white/[0.06] pb-2 w-full">{title}</h3>
        {onAdd && (
          <button type="button" onClick={onAdd}
            className="ml-4 whitespace-nowrap text-xs font-bold text-app-accent-soft hover:text-white active:scale-95 transition-transform">
            + Add
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Card({ title, icon, delay = 0, children }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-white/[0.04] bg-app-surface shadow-card p-6 transition-all duration-300 hover:-translate-y-[1px] hover:border-white/[0.07] hover:shadow-card-hover animate-fade-slide-up"
      style={{ animationDelay: `${delay * 60}ms`, animationFillMode: 'backwards' }}>
      <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-white/[0.06]">
        {icon && (
          <span className="w-7 h-7 rounded-lg bg-app-accent/10 flex items-center justify-center text-sm shrink-0">{icon}</span>
        )}
        <h3 className="text-base font-semibold text-white/85">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function LinkBadge({ label, href, color }) {
  const colors = {
    blue:   'text-app-accent-soft bg-app-accent/10 hover:bg-app-accent/20 border-app-accent/20',
    gray:   'text-white/70 bg-white/[0.06] hover:bg-white/[0.10] border-white/[0.10]',
    purple: 'text-app-accent-soft bg-app-accent2/10 hover:bg-app-accent2/20 border-app-accent2/20',
  }
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${colors[color]}`}>
      {label} →
    </a>
  )
}
