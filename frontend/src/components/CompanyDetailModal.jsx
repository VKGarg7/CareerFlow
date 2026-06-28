import { useState, useEffect } from 'react'
import { CircularProgress } from '@mui/material'
import { ModalShell } from './ModalShell'
import { getCompany } from '../api/company'
import { getApplications } from '../api/application'

const STATUS_BADGE = {
  TARGETING:    'bg-blue-100 text-blue-700',
  APPLIED:      'bg-amber-100 text-amber-700',
  INTERVIEWING: 'bg-purple-100 text-purple-700',
  OFFER:        'bg-green-100 text-green-700',
  REJECTED:     'bg-red-100 text-red-700',
}

const APP_STATUS_BADGE = {
  SAVED:               'bg-gray-100 text-gray-600',
  APPLIED:             'bg-blue-100 text-blue-700',
  OA_SCHEDULED:        'bg-amber-100 text-amber-700',
  OA_CLEARED:          'bg-cyan-100 text-cyan-700',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-700',
  INTERVIEW_CLEARED:   'bg-violet-100 text-violet-700',
  OFFER_RECEIVED:      'bg-green-100 text-green-700',
  REJECTED:            'bg-red-100 text-red-700',
  JOINED:              'bg-emerald-100 text-emerald-700',
}

const APP_STATUS_LABEL = {
  SAVED: 'Saved', APPLIED: 'Applied', OA_SCHEDULED: 'OA Scheduled',
  OA_CLEARED: 'OA Cleared', INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEW_CLEARED: 'Interview Cleared', OFFER_RECEIVED: 'Offer Received',
  REJECTED: 'Rejected', JOINED: 'Joined',
}

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

export default function CompanyDetailModal({ open, companyId, onClose }) {
  const [company, setCompany] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (companyId == null) {
      setError('Company ID not available. Please restart the backend server.')
      return
    }
    setLoading(true)
    setError('')
    setCompany(null)
    setApplications([])
    Promise.all([
      getCompany(companyId),
      getApplications({ companyId }),
    ])
      .then(([co, appsRes]) => {
        setCompany(co)
        setApplications(appsRes.data)
      })
      .catch(() => setError('Failed to load company details.'))
      .finally(() => setLoading(false))
  }, [open, companyId])

  const statusBadge = company ? (STATUS_BADGE[company.status] || STATUS_BADGE.TARGETING) : ''

  return (
    <ModalShell open={open} onClose={onClose} title="Company Profile" maxWidth="max-w-lg">
      <div className="px-6 py-5">
        {loading && <div className="flex justify-center py-10"><CircularProgress /></div>}
        {error && <p className="text-sm text-red-500 text-center py-6">{error}</p>}

        {company && !loading && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                {initials(company.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-800 truncate">{company.name}</h2>
                <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${statusBadge}`}>
                  {company.status}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {company.industry && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>🏭</span><span className="truncate">{company.industry}</span>
                </div>
              )}
              {company.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📍</span><span className="truncate">{company.location}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2 col-span-2">
                  <span>🌐</span>
                  <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline truncate text-sm">
                    {company.website}
                  </a>
                </div>
              )}
            </div>

            {company.description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">About</p>
                <p className="text-sm text-gray-600 leading-relaxed">{company.description}</p>
              </div>
            )}

            {company.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-500 italic">"{company.notes}"</p>
              </div>
            )}

            {/* Applications */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Applications ({applications.length})
              </p>
              {applications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">No applications yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {applications.map((app) => (
                    <div key={app.id} className="flex flex-col gap-1.5 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700 truncate">💼 {app.role}</p>
                      <div className="flex items-center justify-between gap-2">
                        {app.applicationDate && (
                          <p className="text-xs text-gray-400">
                            {new Date(app.applicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${APP_STATUS_BADGE[app.status] || 'bg-gray-100 text-gray-600'}`}>
                          {APP_STATUS_LABEL[app.status] || app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  )
}
