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
  type UpdatePracticeProfileRequest,
  type WeekDay,
} from '../../services/apiClient'
import { extractErrorMessage } from '../family/threePortalUtils'
import { Pill, PracticeSummary, TimeOff, WeeklyHours } from './doctorProfileParts'
import { PracticeProfileForm } from './PracticeProfileForm'
import { activeDayCount, hhmm, initials, nextWindow, sortWindows, validateWindows } from './doctorSchedule'
import '../../styles/doctor-profile.css'

const editable = (schedule: DoctorScheduleDto) =>
  schedule.windows.map((w) => ({ ...w, startTime: hhmm(w.startTime), endTime: hhmm(w.endTime) }))

export function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorPracticeProfileDto | null>(null)
  const [schedule, setSchedule] = useState<DoctorScheduleDto | null>(null)
  const [windows, setWindows] = useState<AvailabilityWindowDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [profileResponse, scheduleResponse] = await Promise.all([doctorWorkspaceApi.getProfile(), doctorWorkspaceApi.getSchedule()])
      setProfile(profileResponse.data)
      setSchedule(scheduleResponse.data)
      setWindows(editable(scheduleResponse.data))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  async function saveProfile(update: UpdatePracticeProfileRequest) {
    try {
      const { data } = await doctorWorkspaceApi.updateProfile(update)
      setProfile(data)
      setMessage('Practice profile saved.')
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Profile could not be saved. Check the fields and try again.'))
    }
  }

  async function saveHours() {
    const problem = validateWindows(windows)
    if (problem) return setMessage(problem)
    setBusy(true)
    try {
      const { data } = await doctorWorkspaceApi.replaceAvailability(
        sortWindows(windows).map((w) => ({ ...w, startTime: `${w.startTime}:00`, endTime: `${w.endTime}:00` })),
      )
      setSchedule(data)
      setWindows(editable(data))
      setMessage('Weekly hours saved. Families now see only free slots inside these hours.')
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Hours could not be saved. Each window must end after it starts and must not overlap another on the same day.'))
    } finally {
      setBusy(false)
    }
  }

  async function blockTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const from = new Date(String(form.get('from')))
    const to = new Date(String(form.get('to')))
    if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from >= to) {
      return setMessage('Choose an end date and time later than the start.')
    }
    setBusy(true)
    try {
      await doctorWorkspaceApi.addBlockedTime({ startsAt: from.toISOString(), endsAt: to.toISOString(), reason: String(form.get('reason') ?? '').trim() || undefined })
      formElement.reset()
      setMessage('Time blocked. No new bookings can land in it.')
      setSchedule((await doctorWorkspaceApi.getSchedule()).data)
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Time could not be blocked. The end must be after the start.'))
    } finally {
      setBusy(false)
    }
  }

  async function unblock(id: string) {
    try {
      await doctorWorkspaceApi.removeBlockedTime(id)
      setSchedule((await doctorWorkspaceApi.getSchedule()).data)
      setMessage('Blocked period removed.')
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Blocked time could not be removed.'))
    }
  }

  const toggleDay = (day: WeekDay, enabled: boolean) =>
    setWindows((current) => (enabled ? [...current, nextWindow(day, [])] : current.filter((w) => w.dayOfWeek !== day)))
  const addWindow = (day: WeekDay) =>
    setWindows((current) => [...current, nextWindow(day, current.filter((w) => w.dayOfWeek === day))])
  const updateWindow = (index: number, patch: Partial<AvailabilityWindowDto>) =>
    setWindows((current) => current.map((w, i) => (i === index ? { ...w, ...patch } : w)))

  const verified = profile?.verificationStatus === 'Verified'

  return (
    <div className="dprof">
      <header className="dprof-head">
        <div>
          <p className="dprof-eyebrow">Practice settings</p>
          <h1>Profile &amp; Availability</h1>
          <p>Manage how families find you and when they can request an appointment.</p>
        </div>
        {profile && <Pill tone={verified ? 'ok' : 'warn'}>{verified ? 'Verified practitioner' : `Verification: ${profile.verificationStatus}`}</Pill>}
      </header>
      {message && <p role="status" className="dprof-toast">{message}<button type="button" aria-label="Dismiss message" onClick={() => setMessage('')}>×</button></p>}
      {status === 'loading' ? <LoadingState label="Loading your profile" /> : status === 'error' || !profile || !schedule ? (
        <ErrorState message="Your profile could not be loaded." onRetry={() => void load()} />
      ) : (
        <>
          <PracticeSummary accepting={profile.acceptingNewFamilies} slotMinutes={profile.slotMinutes} activeDays={activeDayCount(windows)} blockedCount={schedule.blocked.length} />
          <div className="dprof-content">
            <section className="dprof-card" aria-labelledby="practice-heading">
              <div className="dprof-card__head">
                <div><p className="dprof-eyebrow">01 · Your practice</p><h2 id="practice-heading">Practice Profile</h2><p>Details families see when discovering a doctor.</p></div>
                <Pill tone={verified ? 'ok' : 'warn'}>{profile.verificationStatus}</Pill>
              </div>
              <div className="dprof-card__body">
                <div className="dprof-identity">
                  <span className="dprof-initial" aria-hidden="true">{initials(profile.displayName)}</span>
                  <div><strong>{profile.displayName}</strong><small>{profile.email}</small></div>
                  <span className="dprof-reg">SLMC ••••{profile.registrationNumberLastFour}</span>
                </div>
                <PracticeProfileForm profile={profile} onSave={saveProfile} />
              </div>
            </section>
            <section className="dprof-card" aria-labelledby="availability-heading">
              <div className="dprof-card__head">
                <div><p className="dprof-eyebrow">02 · Bookable hours</p><h2 id="availability-heading">Weekly Availability</h2><p>Choose working days and add one or more time ranges.</p></div>
              </div>
              <div className="dprof-card__body">
                <div className="dprof-schedule-summary"><span>Set recurring hours for each day.</span><span>Clinic timezone · Sri Lanka (UTC+05:30)</span></div>
                <WeeklyHours windows={windows} onToggleDay={toggleDay} onAdd={addWindow} onChange={updateWindow}
                  onRemove={(index) => setWindows((current) => current.filter((_, i) => i !== index))} />
                <div className="dprof-schedule-foot">
                  <small>Overlapping periods and end times earlier than start times must be corrected before saving.</small>
                  <button type="button" className="dprof-btn dprof-btn--primary" disabled={busy} onClick={() => void saveHours()}>Save weekly hours</button>
                </div>
                <p className="dprof-notice">
                  {windows.length === 0 ? 'No hours set yet. Until you add hours, families can request any time. ' : ''}
                  Bookable slots are created only inside these hours, after other appointments and blocked periods are excluded. Existing appointments are not silently changed.
                </p>
              </div>
            </section>
          </div>
          <section className="dprof-card" aria-labelledby="blocked-heading">
            <div className="dprof-card__head">
              <div><p className="dprof-eyebrow">03 · Exceptions</p><h2 id="blocked-heading">Time Off &amp; Blocked Periods</h2><p>Block holidays, leave and unavailable periods without editing your recurring hours.</p></div>
              <Pill tone="warn">Overrides weekly schedule</Pill>
            </div>
            <TimeOff blocked={schedule.blocked} busy={busy} onBlock={(event) => void blockTime(event)} onUnblock={(id) => void unblock(id)} />
          </section>
        </>
      )}
    </div>
  )
}
