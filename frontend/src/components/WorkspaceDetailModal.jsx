import { useState, useEffect } from 'react'
import { CircularProgress } from '@mui/material'
import { ModalShell } from './ModalShell'
import { getWorkspace, updateWorkspace } from '../api/workspace'
import InlineStatusChanger from './InlineStatusChanger'
import { initials, fmtDate } from '../utils/followup'

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    badge: 'bg-green-100 text-green-700' },
  PAUSED:    { label: 'Paused',    badge: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completed', badge: 'bg-blue-100 text-blue-700'   },
  ARCHIVED:  { label: 'Archived',  badge: 'bg-gray-100 text-gray-600'   },
}

const WORK_MODE_LABEL = { ONSITE: 'Onsite', REMOTE: 'Remote', HYBRID: 'Hybrid' }
const JOB_TYPE_LABEL = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time', INTERNSHIP: 'Internship',
  CONTRACT: 'Contract', FREELANCE: 'Freelance',
}

function fmtCompensation(min, max) {
  if (min == null && max == null) return null
  const fmt = (n) => n.toLocaleString('en-IN')
  if (min != null && max != null) return `₹${fmt(min)} – ₹${fmt(max)}`
  if (min != null) return `From ₹${fmt(min)}`
  return `Up to ₹${fmt(max)}`
}

export default function WorkspaceDetailModal({ open, workspaceId, onClose, onStatusChanged }) {
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (workspaceId == null) {
      setError('Workspace ID not available. Please restart the backend server.')
      return
    }
    setLoading(true)
    setError('')
    setWorkspace(null)
    getWorkspace(workspaceId)
      .then(setWorkspace)
      .catch(() => setError('Failed to load workspace details.'))
      .finally(() => setLoading(false))
  }, [open, workspaceId])

  const handleStatusChanged = (updated) => {
    setWorkspace(updated)
    onStatusChanged?.(updated)
  }

  const compensation = workspace ? fmtCompensation(workspace.compensationMin, workspace.compensationMax) : null
  const goals = workspace ? [
    workspace.goalApplicationsTarget != null && { label: 'Applications', value: workspace.goalApplicationsTarget },
    workspace.goalInterviewsTarget != null && { label: 'Interviews', value: workspace.goalInterviewsTarget },
    workspace.goalOffersTarget != null && { label: 'Offers', value: workspace.goalOffersTarget },
  ].filter(Boolean) : []

  return (
    <ModalShell open={open} onClose={onClose} title="Workspace Details" maxWidth="max-w-lg">
      <div className="px-6 py-5">
        {loading && <div className="flex justify-center py-10"><CircularProgress /></div>}
        {error && <p className="text-sm text-red-500 text-center py-6">{error}</p>}

        {workspace && !loading && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                {initials(workspace.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-800 truncate">{workspace.name}</h2>
                <InlineStatusChanger
                  item={workspace}
                  statusConfig={STATUS_CONFIG}
                  defaultStatus="ACTIVE"
                  updateFn={(id, payload) => updateWorkspace(id, payload)}
                  onStatusChanged={handleStatusChanged}
                  wrapperClass="mt-2"
                />
              </div>
            </div>

            {workspace.description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{workspace.description}</p>
              </div>
            )}

            {/* Target roles / locations */}
            {(workspace.targetRoles?.length > 0 || workspace.preferredLocations?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workspace.targetRoles?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Target Roles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {workspace.targetRoles.map((r) => (
                        <span key={r} className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {workspace.preferredLocations?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Preferred Locations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {workspace.preferredLocations.map((l) => (
                        <span key={l} className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full">📍 {l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Work mode / job types / compensation / start date */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {workspace.workMode && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>🏢</span><span>{WORK_MODE_LABEL[workspace.workMode] || workspace.workMode}</span>
                </div>
              )}
              {compensation && (
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <span>💰</span><span>{compensation}</span>
                </div>
              )}
              {workspace.searchStartDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📅</span><span>Started {fmtDate(workspace.searchStartDate)}</span>
                </div>
              )}
            </div>

            {workspace.jobTypes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Job Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {workspace.jobTypes.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                      {JOB_TYPE_LABEL[t] || t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Goal metrics */}
            {goals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Goal Metrics</p>
                <div className="grid grid-cols-3 gap-2">
                  {goals.map((g) => (
                    <div key={g.label} className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-center">
                      <p className="text-lg font-bold text-gray-800">{g.value}</p>
                      <p className="text-[11px] text-gray-400">{g.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  )
}
