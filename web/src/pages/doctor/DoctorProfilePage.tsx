// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor "Profile & Availability" (docs/Three_Dashboards_UX_Plan.md §5, DECISIONS 2026-09-29h).
// Real data only: practice profile, weekly hours (clinic time, UTC+05:30) and blocked time.
import { type FormEvent, useCallback, useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import {
  doctorWorkspaceApi,
  type AvailabilityWindowDto,
  type DoctorPracticeProfileDto,
  type DoctorScheduleDto,
  type WeekDay,
} from '../../services/apiClient'
import { Badge, PageHero } from '../dashboard/dashboardParts'
import { extractErrorMessage, formatDateTime } from '../family/threePortalUtils'

const days: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const slotOptions = [15, 20, 30, 45, 60]
const hhmm = (value: string) => value.slice(0, 5)

export function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorPracticeProfileDto | null>(null)
  const [schedule, setSchedule] = useState<DoctorScheduleDto | null>(null)
  const [windows, setWindows] = useState<AvailabilityWindowDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [profileResponse, scheduleResponse] = await Promise.all([doctorWorkspaceApi.getProfile(), doctorWorkspaceApi.getSchedule()])
      setProfile(profileResponse.data)
      setSchedule(scheduleResponse.data)
      setWindows(scheduleResponse.data.windows.map((w) => ({ ...w, startTime: hhmm(w.startTime), endTime: hhmm(w.endTime) })))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = (key: string) => String(form.get(key) ?? '').trim() || null
    try {
      const { data } = await doctorWorkspaceApi.updateProfile({
        specialty: text('specialty'), clinic: text('clinic'), phoneNumber: text('phoneNumber'), district: text('district'),
        city: text('city'), languages: text('languages'), consultationModes: text('consultationModes'),
        acceptingNewFamilies: form.get('acceptingNewFamilies') === 'on', slotMinutes: Number(form.get('slotMinutes')),
      })
      setProfile(data)
      setMessage('Practice profile saved.')
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Profile could not be saved. Check the fields and try again.'))
    }
  }

  async function saveHours() {
    try {
      const { data } = await doctorWorkspaceApi.replaceAvailability(windows.map((w) => ({ ...w, startTime: `${w.startTime}:00`, endTime: `${w.endTime}:00` })))
      setSchedule(data)
      setMessage('Weekly hours saved. Families now see only free slots inside these hours.')
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Hours could not be saved. Each window must end after it starts and must not overlap another on the same day.'))
    }
  }

  async function blockTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const startsAt = new Date(String(form.get('from'))).toISOString()
    const endsAt = new Date(String(form.get('to'))).toISOString()
    try {
      await doctorWorkspaceApi.addBlockedTime({ startsAt, endsAt, reason: String(form.get('reason') ?? '').trim() || undefined })
      formElement.reset()
      setMessage('Time blocked. No new bookings can land in it.')
      setSchedule((await doctorWorkspaceApi.getSchedule()).data)
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Time could not be blocked. The end must be after the start.'))
    }
  }

  async function unblock(id: string) {
    try {
      await doctorWorkspaceApi.removeBlockedTime(id)
      setSchedule((await doctorWorkspaceApi.getSchedule()).data)
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Blocked time could not be removed.'))
    }
  }

  const updateWindow = (index: number, patch: Partial<AvailabilityWindowDto>) =>
    setWindows((current) => current.map((w, i) => (i === index ? { ...w, ...patch } : w)))

  return (
    <div className="fv-page">
      <PageHero
        eyebrow="Clinician profile"
        title="Profile & Availability"
        purpose="Practice details help families find you. Weekly hours decide which slots families can book. Your registration ID stays protected."
        action={profile ? <Badge tone="ok">SLMC ••••{profile.registrationNumberLastFour}</Badge> : undefined}
      />
      {message && <p role="status" className="status-banner">{message}</p>}
      {status === 'loading' ? <LoadingState label="Loading your profile" /> : status === 'error' || !profile || !schedule ? (
        <ErrorState message="Your profile could not be loaded." onRetry={() => void load()} />
      ) : (
        <>
          <div className="fv-gridhalf">
            <section className="fv-panel" aria-labelledby="practice-heading">
              <div className="fv-head"><div><p className="fv-eyebrow">Practice</p><h2 id="practice-heading">Practice Profile</h2><p>{profile.displayName} · {profile.email}</p></div><Badge tone={profile.verificationStatus === 'Verified' ? 'ok' : 'warn'}>{profile.verificationStatus}</Badge></div>
              <form className="form-grid" onSubmit={(event) => void saveProfile(event)}>
                <label>Specialty<input name="specialty" defaultValue={profile.specialty ?? ''} maxLength={120} /></label>
                <label>Clinic<input name="clinic" defaultValue={profile.clinic ?? ''} maxLength={120} /></label>
                <label>District<input name="district" defaultValue={profile.district ?? ''} maxLength={60} /></label>
                <label>City<input name="city" defaultValue={profile.city ?? ''} maxLength={60} /></label>
                <label>Languages<input name="languages" defaultValue={profile.languages ?? ''} maxLength={120} placeholder="Sinhala, English" /></label>
                <label>Consultation modes<input name="consultationModes" defaultValue={profile.consultationModes ?? ''} maxLength={60} placeholder="In-person" /></label>
                <label>Phone<input name="phoneNumber" defaultValue={profile.phoneNumber ?? ''} maxLength={32} /></label>
                <label>Slot length<select name="slotMinutes" defaultValue={profile.slotMinutes}>{slotOptions.map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></label>
                <label className="field"><span><input name="acceptingNewFamilies" type="checkbox" defaultChecked={profile.acceptingNewFamilies} /> Accepting new families</span></label>
                <button className="fv-btn fv-btn--primary" type="submit">Save Profile</button>
              </form>
            </section>
            <section className="fv-panel" aria-labelledby="availability-heading">
              <div className="fv-head"><div><p className="fv-eyebrow">Schedule</p><h2 id="availability-heading">Weekly Availability</h2><p>Clinic time (Sri Lanka). Until you add hours, families can request any time.</p></div></div>
              {windows.length === 0 && <p className="muted">No hours set yet.</p>}
              <div className="fv-stack">
                {windows.map((window, index) => (
                  <div className="fv-item fv-row" key={index}>
                    <select aria-label="Day" value={window.dayOfWeek} onChange={(event) => updateWindow(index, { dayOfWeek: event.target.value as WeekDay })}>
                      {days.map((day) => <option key={day}>{day}</option>)}
                    </select>
                    <input aria-label="From" type="time" value={window.startTime} onChange={(event) => updateWindow(index, { startTime: event.target.value })} />
                    <input aria-label="To" type="time" value={window.endTime} onChange={(event) => updateWindow(index, { endTime: event.target.value })} />
                    <button type="button" className="fv-btn" onClick={() => setWindows((current) => current.filter((_, i) => i !== index))}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="fv-actions">
                <button type="button" className="fv-btn" onClick={() => setWindows((current) => [...current, { dayOfWeek: 'Monday', startTime: '09:00', endTime: '16:00' }])}>+ Add hours</button>
                <button type="button" className="fv-btn fv-btn--primary" onClick={() => void saveHours()}>Save Hours</button>
              </div>
            </section>
          </div>
          <section className="fv-panel" aria-labelledby="blocked-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">Time off</p><h2 id="blocked-heading">Blocked Time</h2><p>Leave, rounds or anything else. Blocked time overrides weekly hours.</p></div></div>
            <form className="form-grid" onSubmit={(event) => void blockTime(event)}>
              <label>From<input name="from" type="datetime-local" required /></label>
              <label>To<input name="to" type="datetime-local" required /></label>
              <label>Reason (optional)<input name="reason" maxLength={120} /></label>
              <button className="fv-btn fv-btn--primary" type="submit">Block Time</button>
            </form>
            {schedule.blocked.length === 0 ? <p className="muted">No blocked time ahead.</p> : (
              <div className="fv-stack" style={{ marginTop: 12 }}>
                {schedule.blocked.map((block) => (
                  <div className="fv-item fv-row" key={block.id}>
                    <span><b>{formatDateTime(block.startsAt)} → {formatDateTime(block.endsAt)}</b>{block.reason ? ` · ${block.reason}` : ''}</span>
                    <button type="button" className="fv-btn" onClick={() => void unblock(block.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
