import { useState, useEffect } from 'react'
import { CircularProgress } from '@mui/material'
import { CloseRounded, PlaceOutlined, EditOutlined, FolderOutlined, EventOutlined } from '@mui/icons-material'
import { DrawerShell } from './DrawerShell'
import { getWorkspace, updateWorkspace } from '../api/workspace'
import InlineStatusChanger from './InlineStatusChanger'
import { fmtDate } from '../utils/followup'

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    badge: 'bg-app-success/10 text-app-success' },
  PAUSED:    { label: 'Paused',    badge: 'bg-app-warning/10 text-app-warning' },
  COMPLETED: { label: 'Completed', badge: 'bg-app-accent/10 text-app-accent-soft' },
  ARCHIVED:  { label: 'Archived',  badge: 'bg-white/[0.06] text-white/50' },
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

export default function WorkspaceDetailModal({ open, workspaceId, onClose, onStatusChanged, onEdit, onDelete }) {
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

  if (!open) return null

  const compensation = workspace ? fmtCompensation(workspace.compensationMin, workspace.compensationMax) : null
  const goals = workspace ? [
    workspace.goalApplicationsTarget != null && { label: 'Applications', value: workspace.goalApplicationsTarget },
    workspace.goalInterviewsTarget != null && { label: 'Interviews', value: workspace.goalInterviewsTarget },
    workspace.goalOffersTarget != null && { label: 'Offers', value: workspace.goalOffersTarget },
  ].filter(Boolean) : []

  return (
    <DrawerShell>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
        <h2 className="text-base font-bold text-white">Workspace Details</h2>
        <button onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition">
          <CloseRounded sx={{ fontSize: 18 }} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 no-scrollbar">
        {loading && <div className="flex justify-center py-16"><CircularProgress size={24} sx={{ color: '#5B5FEF' }} /></div>}
        {error && <p className="text-sm text-app-danger text-center py-6 px-5">{error}</p>}

        {workspace && !loading && (
          <div className="px-6 py-6 space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-app-accent to-app-accent2 flex items-center justify-center text-white shrink-0 shadow-inner-highlight">
                  <FolderOutlined sx={{ fontSize: 20 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{workspace.name}</h3>
                </div>
              </div>
              <div className="mt-2.5">
                <InlineStatusChanger
                  item={workspace}
                  statusConfig={STATUS_CONFIG}
                  defaultStatus="ACTIVE"
                  updateFn={(id, payload) => updateWorkspace(id, payload)}
                  onStatusChanged={handleStatusChanged}
                />
              </div>
            </div>

            {workspace.description && (
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-sm text-white/60 leading-relaxed">{workspace.description}</p>
              </div>
            )}

            {(workspace.targetRoles?.length > 0 || workspace.preferredLocations?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workspace.targetRoles?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-1.5">Target Roles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {workspace.targetRoles.map((r) => (
                        <span key={r} className="text-xs px-2.5 py-1 bg-white/[0.05] text-white/70 rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {workspace.preferredLocations?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-1.5">Preferred Locations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {workspace.preferredLocations.map((l) => (
                        <span key={l} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white/[0.05] text-white/70 rounded-full">
                          <PlaceOutlined sx={{ fontSize: 12 }} className="text-app-danger" />
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {workspace.workMode && (
                <div className="flex items-center gap-2 text-white/60">
                  <span className="text-app-accent-soft font-medium">{WORK_MODE_LABEL[workspace.workMode] || workspace.workMode}</span>
                </div>
              )}
              {compensation && (
                <div className="flex items-center gap-2 text-white/60 col-span-2">
                  <span>{compensation}</span>
                </div>
              )}
              {workspace.searchStartDate && (
                <div className="flex items-center gap-2 text-white/60">
                  <EventOutlined sx={{ fontSize: 15 }} className="text-white/30 shrink-0" />
                  <span>Started {fmtDate(workspace.searchStartDate)}</span>
                </div>
              )}
            </div>

            {workspace.jobTypes?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-1.5">Job Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {workspace.jobTypes.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 bg-app-accent/10 text-app-accent-soft rounded-full">
                      {JOB_TYPE_LABEL[t] || t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {goals.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wide mb-2">Goal Metrics</p>
                <div className="grid grid-cols-3 gap-2">
                  {goals.map((g) => (
                    <div key={g.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                      <p className="text-lg font-bold text-white">{g.value}</p>
                      <p className="text-[11px] text-white/35">{g.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {workspace && !loading && (
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-white/[0.06] shrink-0">
          {onDelete && (
            <button onClick={() => onDelete(workspace)}
              className="flex-1 h-11 text-sm font-semibold text-app-danger bg-app-danger/10 rounded-xl hover:bg-app-danger/20 transition">
              Delete Workspace
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(workspace)}
              className="flex-1 h-11 text-sm font-semibold text-white bg-app-accent rounded-xl hover:brightness-110 transition shadow-glow shadow-app-accent/40 flex items-center justify-center gap-1.5">
              <EditOutlined sx={{ fontSize: 15 }} />
              Edit Workspace
            </button>
          )}
        </div>
      )}
    </DrawerShell>
  )
}
