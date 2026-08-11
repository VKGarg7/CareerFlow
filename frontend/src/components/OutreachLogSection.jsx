import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import {
  Email, LinkedIn, Phone, Groups, Handshake, HelpOutlineRounded,
  AddRounded, DeleteOutlineRounded,
} from '@mui/icons-material'
import { getOutreachEvents, addOutreachEvent, deleteOutreachEvent } from '../api/outreachEvent'
import FilterSelect from './FilterSelect'
import { fieldInputCls, FieldLabel } from './formKit'
import { fmt } from '../utils/followup'

const CHANNEL_CONFIG = {
  EMAIL:          { label: 'Email',          icon: Email,    badge: 'bg-app-accent/10 text-app-accent-soft' },
  LINKEDIN:       { label: 'LinkedIn',       icon: LinkedIn, badge: 'bg-app-accent2/10 text-app-accent-soft' },
  PHONE:          { label: 'Phone',          icon: Phone,    badge: 'bg-app-warning/10 text-app-warning' },
  IN_PERSON:      { label: 'In Person',      icon: Groups,   badge: 'bg-app-success/10 text-app-success' },
  REFERRAL_INTRO: { label: 'Referral Intro', icon: Handshake, badge: 'bg-app-accent/10 text-app-accent-soft' },
  OTHER:          { label: 'Other',          icon: HelpOutlineRounded, badge: 'bg-white/[0.06] text-white/60' },
}

const PURPOSE_LABELS = {
  INTRODUCTION: 'Introduction', REFERRAL_REQUEST: 'Referral Request', FOLLOW_UP: 'Follow-Up',
  INFORMATIONAL_INTERVIEW: 'Informational Interview', THANK_YOU: 'Thank You', OTHER: 'Other',
}

const RESPONSE_CONFIG = {
  NO_RESPONSE: { label: 'No Response', badge: 'bg-white/[0.06] text-white/50' },
  PENDING:     { label: 'Pending',     badge: 'bg-app-warning/10 text-app-warning' },
  POSITIVE:    { label: 'Positive',    badge: 'bg-app-success/10 text-app-success' },
  NEGATIVE:    { label: 'Negative',    badge: 'bg-app-danger/10 text-app-danger' },
}

const EMPTY_FORM = {
  eventDateTime: '', channel: 'EMAIL', purpose: '', messageSummary: '',
  responseStatus: 'NO_RESPONSE', nextAction: '', nextActionDate: '',
}

function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function OutreachLogSection({ contactId, opportunityId, applicationId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM, eventDateTime: nowLocal() })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchEvents = () =>
    getOutreachEvents({ contactId, opportunityId, applicationId, size: 100, sortBy: 'eventDateTime' })

  const reload = () => {
    setLoading(true)
    setError('')
    fetchEvents()
      .then((res) => setEvents(res.data))
      .catch(() => setError('Failed to load outreach history.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    fetchEvents()
      .then((res) => { if (!cancelled) setEvents(res.data) })
      .catch(() => { if (!cancelled) setError('Failed to load outreach history.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, opportunityId, applicationId])

  const sorted = [...events].sort((a, b) => new Date(b.eventDateTime) - new Date(a.eventDateTime))

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setVal = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.eventDateTime || !form.channel) { setSaveError('Date and channel are required.'); return }
    setSaving(true)
    setSaveError('')
    try {
      const payload = {
        contactId, opportunityId: opportunityId || undefined, applicationId: applicationId || undefined,
        eventDateTime: new Date(form.eventDateTime).toISOString(),
        channel: form.channel,
        purpose: form.purpose || undefined,
        messageSummary: form.messageSummary.trim() || undefined,
        responseStatus: form.responseStatus || undefined,
        nextAction: form.nextAction.trim() || undefined,
        nextActionDate: form.nextActionDate || undefined,
      }
      await addOutreachEvent(payload)
      setForm({ ...EMPTY_FORM, eventDateTime: nowLocal() })
      setFormOpen(false)
      reload()
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to log outreach.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteOutreachEvent(id)
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
    } catch {
      // best-effort
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Outreach Log</p>
        <button type="button" onClick={() => setFormOpen((o) => !o)}
          className="flex items-center gap-1 text-[11px] font-semibold text-app-accent-soft hover:text-white transition">
          <AddRounded sx={{ fontSize: 14 }} />Log Outreach
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-3"><CircularProgress size={18} /></div>
      ) : error ? (
        <p className="text-xs text-app-danger">{error}</p>
      ) : (
        <>
          {sorted.length === 0 && !formOpen && (
            <p className="text-xs text-white/35 italic mb-2">No outreach logged yet.</p>
          )}

          {sorted.length > 0 && (
            <div className="space-y-2 mb-3">
              {sorted.map((ev) => {
                const chCfg = CHANNEL_CONFIG[ev.channel] || CHANNEL_CONFIG.OTHER
                const rCfg = RESPONSE_CONFIG[ev.responseStatus] || RESPONSE_CONFIG.NO_RESPONSE
                const ChIcon = chCfg.icon
                return (
                  <div key={ev.id} className="group bg-white/[0.03] rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${chCfg.badge}`}>
                        <ChIcon sx={{ fontSize: 11 }} />{chCfg.label}
                      </span>
                      {ev.purpose && (
                        <span className="text-[11px] text-white/50">{PURPOSE_LABELS[ev.purpose] || ev.purpose}</span>
                      )}
                      <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${rCfg.badge}`}>
                        {rCfg.label}
                      </span>
                      <button onClick={() => handleDelete(ev.id)} disabled={deletingId === ev.id}
                        className="opacity-0 group-hover:opacity-100 transition p-0.5 text-white/35 hover:text-app-danger">
                        {deletingId === ev.id ? <CircularProgress size={11} /> : <DeleteOutlineRounded sx={{ fontSize: 13 }} />}
                      </button>
                    </div>
                    {ev.messageSummary && (
                      <p className="text-sm text-white/75 mt-1.5 whitespace-pre-wrap break-words leading-relaxed">{ev.messageSummary}</p>
                    )}
                    {ev.nextAction && (
                      <p className="text-xs text-app-warning mt-1">
                        Next: {ev.nextAction}{ev.nextActionDate && ` (${fmt(ev.nextActionDate)})`}
                      </p>
                    )}
                    <p className="text-[11px] text-white/35 mt-1">{fmt(ev.eventDateTime)}</p>
                  </div>
                )
              })}
            </div>
          )}

          {formOpen && (
            <form onSubmit={handleAdd} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-2.5">
              {saveError && <p className="text-xs text-app-danger">{saveError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Date &amp; Time</FieldLabel>
                  <input type="datetime-local" value={form.eventDateTime} onChange={set('eventDateTime')}
                    className={fieldInputCls(false)} />
                </div>
                <div>
                  <FieldLabel>Channel</FieldLabel>
                  <FilterSelect value={form.channel} onChange={setVal('channel')} hideAll className="w-full"
                    options={Object.entries(CHANNEL_CONFIG).map(([value, { label }]) => ({ value, label }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Purpose</FieldLabel>
                  <FilterSelect value={form.purpose} onChange={setVal('purpose')} allLabel="— Select —" className="w-full"
                    options={Object.entries(PURPOSE_LABELS).map(([value, label]) => ({ value, label }))} />
                </div>
                <div>
                  <FieldLabel>Response</FieldLabel>
                  <FilterSelect value={form.responseStatus} onChange={setVal('responseStatus')} hideAll className="w-full"
                    options={Object.entries(RESPONSE_CONFIG).map(([value, { label }]) => ({ value, label }))} />
                </div>
              </div>
              <div>
                <FieldLabel>Message Summary</FieldLabel>
                <textarea value={form.messageSummary} onChange={set('messageSummary')} rows={2}
                  placeholder="What was discussed..." className={`${fieldInputCls(false)} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Next Action</FieldLabel>
                  <input type="text" value={form.nextAction} onChange={set('nextAction')}
                    placeholder="e.g. Follow up" className={fieldInputCls(false)} />
                </div>
                <div>
                  <FieldLabel>Next Action Date</FieldLabel>
                  <input type="date" value={form.nextActionDate} onChange={set('nextActionDate')}
                    className={fieldInputCls(false)} />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setFormOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-white/60 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-app-accent rounded-lg hover:brightness-110 transition disabled:opacity-50">
                  {saving && <CircularProgress size={11} color="inherit" />}
                  Log Outreach
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )
}
