// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Approved care-workspace redesign; whole-project ownership waiver applies.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { useAppSelector } from '../../store/hooks'
import { apiClient, threePortalApi, doctorWorkspaceApi, type DoctorRequestDto, type DoctorSlotsDto, type DoctorSummaryDto, type FamilyDto } from '../../services/apiClient'
import { doctorInitials, doctorPlace, extractErrorMessage } from './threePortalUtils'
import { ConfirmDialog, DoctorDirectory, DoctorProfileDetails, Icon } from './myDoctorParts'
import '../../styles/my-doctor.css'

const QUICK_DATE_COUNT = 5

function clinicToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
function clinicTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}
function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}
/** Calendar-date labels; the ISO date is already a Sri Lanka calendar day, so it is formatted as UTC. */
function dateParts(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(date)
  return { weekday: format({ weekday: 'short' }), day: format({ day: '2-digit' }), month: format({ month: 'short' }), label: format({ weekday: 'short', month: 'short', day: 'numeric' }) }
}

type DialogState =
  | { kind: 'profile'; doctor: DoctorSummaryDto }
  | { kind: 'request'; doctor: DoctorSummaryDto }
  | { kind: 'cancel'; request: DoctorRequestDto }

export function MyDoctorPage() {
  const user = useAppSelector((state) => state.auth.user)
  const isHead = user?.role === 'FAMILY_HEAD'
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [current, setCurrent] = useState<DoctorSummaryDto | null>(null)
  const [pending, setPending] = useState<DoctorRequestDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' } | null>(null)
  const [directory, setDirectory] = useState<DoctorSummaryDto[]>([])
  const [directoryStatus, setDirectoryStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [busy, setBusy] = useState(false)
  const [date, setDate] = useState(clinicToday)
  const [slots, setSlots] = useState<DoctorSlotsDto | null>(null)
  const [slotStatus, setSlotStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [consultMinutes, setConsultMinutes] = useState<number | null>(null)
  const [retry, setRetry] = useState(0)
  const loadSequence = useRef(0)
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current
    setStatus('loading')
    try {
      const { data: family } = await apiClient.get<FamilyDto>('/families/me')
      const [{ data: doctor }, { data: request }] = await Promise.all([
        threePortalApi.getFamilyDoctor(family.id),
        threePortalApi.getPendingFamilyDoctorRequest(family.id),
      ])
      if (sequence !== loadSequence.current) return
      setFamilyId(family.id)
      // 204 No Content arrives as an empty body.
      setCurrent(doctor || null)
      setPending(request || null)
      setStatus('ready')
    } catch { if (sequence === loadSequence.current) setStatus('error') }
  }, [])
  useEffect(() => { const lifecycle = loadSequence; void load(); return () => { lifecycle.current++ } }, [load])
  useEffect(() => {
    if (!familyId || !current || !date) return
    let active = true
    setSlots(null)
    setSelectedSlot(null)
    setSlotStatus('loading')
    void doctorWorkspaceApi.getFamilyDoctorSlots(familyId, date).then(({ data }) => {
      if (!active) return
      setSlots(data)
      setSlotStatus('ready')
      if (data.availabilityConfigured) setConsultMinutes(data.slotMinutes)
    }).catch(() => { if (active) setSlotStatus('error') })
    return () => { active = false }
  }, [familyId, current, date, retry])
  const directoryWanted = isHead && status === 'ready' && (current ? directoryOpen : !pending)
  useEffect(() => {
    if (!directoryWanted || directoryStatus !== 'idle') return
    setDirectoryStatus('loading')
    threePortalApi.getDoctorDirectory().then(({ data }) => { setDirectory(data); setDirectoryStatus('ready') }).catch(() => setDirectoryStatus('error'))
  }, [directoryWanted, directoryStatus])
  function chooseDate(value: string) {
    setDate(value)
    setSlots(null)
    setSelectedSlot(null)
    setSlotStatus('loading')
  }
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function sendRequest(doctor: DoctorSummaryDto) {
    if (!familyId || busy) return
    setBusy(true)
    try {
      const { data } = await threePortalApi.requestFamilyDoctor(familyId, { doctorId: doctor.id })
      setPending(data)
      setDirectoryOpen(false)
      setToast({ text: current ? 'Change request sent. Your existing doctor stays assigned.' : 'Family doctor request sent.', tone: 'success' })
    } catch (error) { setToast({ text: extractErrorMessage(error, 'Could not send the request.'), tone: 'error' }) }
    finally { setBusy(false); setDialog(null) }
  }
  async function cancelRequest(request: DoctorRequestDto) {
    if (!familyId || busy) return
    setBusy(true)
    try {
      await threePortalApi.cancelFamilyDoctorRequest(familyId, request.id)
      setPending(null)
      setToast({ text: current ? 'Change request withdrawn.' : 'Request cancelled.', tone: 'success' })
    } catch (error) {
      setToast({ text: extractErrorMessage(error, 'Could not cancel the request.'), tone: 'error' })
      // The doctor may have answered in the meantime; show what is true now.
      void load()
    }
    finally { setBusy(false); setDialog(null) }
  }

  if (status === 'loading') return <LoadingState label="Loading your doctor…" />
  if (status === 'error') return <ErrorState message="Could not load your doctor." onRetry={() => void load()} />

  const today = clinicToday()
  const quickDates = Array.from({ length: QUICK_DATE_COUNT }, (_, index) => addDays(today, index))
  const directoryProps = {
    doctors: directory,
    status: directoryStatus,
    currentDoctorId: current?.id,
    requestDisabled: busy || pending !== null,
    onRetry: () => setDirectoryStatus('idle'),
    onView: (doctor: DoctorSummaryDto) => setDialog({ kind: 'profile', doctor }),
    onRequest: (doctor: DoctorSummaryDto) => setDialog({ kind: 'request', doctor }),
  }
  const privacyNote = (title: string, text: string) => <div className="my-doctor-note"><Icon name="shield" /><div><strong>{title}</strong><p>{text}</p></div></div>

  return <div className="page-stack care-workspace my-doctor">
    <header className="care-header"><div><p className="care-eyebrow">Your long-term care relationship</p><h1>My Doctor</h1><p className="care-description">One trusted family doctor, with appointments and care in one place.</p></div><Link className="button button--secondary my-doctor-header-link" to="/appointments"><Icon name="calendar" /> My appointments</Link></header>

    {current ? <>
      <div className="my-doctor-grid">
        <section className="care-panel my-doctor-profile" aria-label="Your family doctor">
          <div className="my-doctor-section-head"><div><p className="care-eyebrow">Primary family doctor</p><h2>Your doctor</h2></div><span className="my-doctor-tag my-doctor-tag--green"><i className="my-doctor-dot" aria-hidden="true" /> Connected</span></div>
          <div className="my-doctor-identity">
            <span className="my-doctor-portrait" aria-hidden="true">{doctorInitials(current.displayName)}<i className="my-doctor-portrait__online" /></span>
            <div><h3>{current.displayName}</h3><p>{[current.specialty, current.clinic].filter(Boolean).join(' · ') || 'Practice details not provided'}</p><span className="my-doctor-tag"><Icon name="shield" /> Verified practitioner</span></div>
          </div>
          <dl className="my-doctor-facts">
            <div><Icon name="brief" /><div><dt>Specialty</dt><dd>{current.specialty || 'Not provided'}</dd></div></div>
            <div><Icon name="location" /><div><dt>Clinic location</dt><dd>{doctorPlace(current) || 'Not provided'}</dd></div></div>
            <div><Icon name="globe" /><div><dt>Languages</dt><dd>{current.languages || 'Not provided'}</dd></div></div>
            <div><Icon name="clock" /><div><dt>Consultation length</dt><dd>{consultMinutes ? `${consultMinutes} minutes` : 'Not set yet'}</dd></div></div>
          </dl>
          {privacyNote('Personal information stays protected', 'A long-term doctor relationship does not automatically grant access to your medical records. Sharing requires consent and a valid clinical access grant.')}
          <div className="my-doctor-strip"><div><small>Your care relationship</small><strong>Primary family doctor</strong></div><button type="button" className="button button--secondary" onClick={() => setDialog({ kind: 'profile', doctor: current })}>View profile <Icon name="chevron" /></button></div>
        </section>

        <section className="care-panel my-doctor-booking" aria-labelledby="available-times-title">
          <div className="my-doctor-section-head"><div><p className="care-eyebrow">Plan your next visit</p><h2 id="available-times-title">Book an appointment</h2><p className="care-caption">Select a date and an available time. Your doctor will confirm the request.</p></div><span className="my-doctor-tag"><Icon name="clock" /> Sri Lanka time</span></div>
          <div className="my-doctor-row-head"><strong>Choose a date</strong><label className="field my-doctor-date-field"><span>Appointment date</span><input type="date" min={today} value={date} onChange={(event) => chooseDate(event.target.value)} /></label></div>
          <div className="my-doctor-dates" role="group" aria-label="Upcoming days">{quickDates.map((value) => {
            const parts = dateParts(value)
            return <button key={value} type="button" className="my-doctor-date" aria-pressed={date === value} aria-label={parts.label} onClick={() => chooseDate(value)}><span>{parts.weekday}</span><strong>{parts.day}</strong><span>{parts.month}</span></button>
          })}</div>
          <div className="my-doctor-row-head"><strong>Available time slots</strong>{date && slotStatus === 'ready' && slots?.availabilityConfigured && <span className="care-caption">{dateParts(date).label} · {slots.slotMinutes} min appointments</span>}</div>
          {!date ? <p className="my-doctor-inline">Choose a date to see available times.</p>
            : slotStatus === 'loading' ? <p role="status" className="my-doctor-inline">Checking available times…</p>
            : slotStatus === 'error' ? <div className="my-doctor-inline" role="alert"><p>Could not load available times.</p><button type="button" className="button button--secondary" onClick={() => setRetry((value) => value + 1)}>Retry availability</button></div>
            : !slots?.availabilityConfigured ? <div className="my-doctor-inline"><h3>Availability is not configured yet</h3><p>The doctor has not set availability. You can request an appointment from the appointments page.</p><Link className="button button--secondary" to="/appointments">Request an appointment</Link></div>
            : slots.slots.length === 0 ? <div className="my-doctor-inline"><h3>No available times on this date</h3><p>Try another date. This does not mean the doctor is unavailable on other days.</p></div>
            : <div className="my-doctor-slots">{slots.slots.map((slot) => <button key={slot} type="button" className="my-doctor-slot" aria-pressed={selectedSlot === slot} onClick={() => setSelectedSlot(selectedSlot === slot ? null : slot)}>{clinicTime(slot)}</button>)}</div>}
          <div className="my-doctor-booking__footer">
            <div><small>Selected appointment</small><strong aria-live="polite">{selectedSlot ? `${dateParts(date).label} at ${clinicTime(selectedSlot)}` : 'Choose a date & time'}</strong><small>Requests are not confirmed automatically. Availability can change before you book.</small></div>
            {selectedSlot
              ? <Link className="button button--primary" to={`/appointments?date=${encodeURIComponent(date)}&slot=${encodeURIComponent(selectedSlot)}`}><Icon name="calendar" /> Request appointment</Link>
              : <button type="button" className="button button--primary" disabled><Icon name="calendar" /> Request appointment</button>}
          </div>
        </section>
      </div>

      <section className="care-panel my-doctor-privacy"><Icon name="lock" /><div><h3>Your health data, your choice</h3><p>You control who can access your records. Adult members manage their own privacy; Family Head permissions do not override their choices.</p><Link to="/privacy">Understand access permissions →</Link></div></section>

      {pending && <div className="my-doctor-note my-doctor-note--pending" role="status"><Icon name="clock" /><div><strong>Change request pending: {pending.doctor.displayName}</strong><p>Your current doctor remains connected until the new doctor accepts the request.</p>{isHead && <button type="button" className="button button--secondary" onClick={() => setDialog({ kind: 'cancel', request: pending })}>Withdraw request</button>}</div></div>}

      {isHead && <section className="my-doctor-discovery" aria-label="Find another family doctor">
        <div className="my-doctor-discovery__top"><div className="my-doctor-discovery__title"><Icon name="search" /><div><h3>Find another family doctor</h3><p>Optional — this directory stays collapsed when you already have a doctor.</p></div></div><button type="button" className="button button--secondary" aria-expanded={directoryOpen} aria-controls="my-doctor-directory" disabled={pending !== null} onClick={() => setDirectoryOpen((open) => !open)}>{directoryOpen ? 'Hide directory' : 'Explore directory'} <Icon name="chevronDown" /></button></div>
        {directoryOpen && !pending && <div id="my-doctor-directory" className="my-doctor-discovery__content">
          <div className="my-doctor-note"><Icon name="info" /><div><strong>Your current doctor remains assigned</strong><p>Sending a change request will not remove {current.displayName}. The new doctor must accept the request before the relationship changes.</p></div></div>
          <DoctorDirectory mode="assigned" {...directoryProps} />
        </div>}
      </section>}
    </> : pending ? <section className="care-panel my-doctor-state">
      <div className="my-doctor-hero"><span className="my-doctor-hero__icon my-doctor-hero__icon--pending"><Icon name="clock" /></span><span className="my-doctor-tag my-doctor-tag--yellow">Awaiting doctor response</span><h2>Your request is on its way.</h2><p>Your family doctor request has been submitted. The practitioner can accept or decline it. No health information is shared before acceptance.</p></div>
      <div className="my-doctor-pending">
        <div className="my-doctor-mini"><span className="my-doctor-mini__avatar" aria-hidden="true">{doctorInitials(pending.doctor.displayName)}</span><div><h3>{pending.doctor.displayName}</h3><p>{[pending.doctor.specialty, doctorPlace(pending.doctor)].filter(Boolean).join(' · ') || 'Practice details not provided'}</p><span className="my-doctor-tag my-doctor-tag--yellow"><i className="my-doctor-dot" aria-hidden="true" /> Request pending</span></div></div>
        {isHead && <button type="button" className="button button--secondary my-doctor-warn" onClick={() => setDialog({ kind: 'cancel', request: pending })}>Cancel request</button>}
      </div>
      {privacyNote('Private until connection is accepted', 'Doctors see only the information needed to respond to a relationship request. Consent and member-specific grants are handled separately.')}
    </section> : <section className="care-panel my-doctor-state">
      <div className="my-doctor-hero"><span className="my-doctor-hero__icon"><Icon name="heart" /></span><span className="my-doctor-tag my-doctor-tag--gray">No doctor connected yet</span><h2>Find a doctor your family can rely on.</h2><p>{isHead ? 'Browse verified practitioners, compare practice details, and send a long-term family doctor request. Your family selects the doctor.' : 'Your family head can choose and request a doctor for the family. The doctor will appear here after they accept.'}</p></div>
      {isHead && <div className="my-doctor-state__directory">
        <div className="my-doctor-discovery__top"><div><h3>Explore verified family doctors</h3><p>Search by name, specialty, district or language.</p></div><span className="my-doctor-tag"><Icon name="shield" /> Verified profiles only</span></div>
        <DoctorDirectory mode="none" {...directoryProps} />
      </div>}
    </section>}

    {dialog?.kind === 'profile' && <ConfirmDialog title={dialog.doctor.displayName} text="Verified practice information from the doctor directory." onClose={() => setDialog(null)}><DoctorProfileDetails doctor={dialog.doctor} /></ConfirmDialog>}
    {dialog?.kind === 'request' && <ConfirmDialog busy={busy} title={current ? 'Request a change of family doctor?' : 'Send family doctor request?'} text={current ? 'Your current doctor stays linked while the new request is pending. No clinical access transfers automatically.' : 'This request does not share health records or grant clinical access.'} confirmLabel="Send request" onConfirm={() => void sendRequest(dialog.doctor)} onClose={() => setDialog(null)}><DoctorProfileDetails doctor={dialog.doctor} /></ConfirmDialog>}
    {dialog?.kind === 'cancel' && <ConfirmDialog busy={busy} title={current ? 'Withdraw doctor change?' : 'Cancel this request?'} text={current ? 'Your current family doctor remains unchanged.' : 'You can browse and request another verified family doctor afterward.'} confirmLabel={current ? 'Withdraw request' : 'Cancel request'} cancelLabel="Keep request" onConfirm={() => void cancelRequest(dialog.request)} onClose={() => setDialog(null)}><div className="my-doctor-dialog__details"><strong>Pending request: {dialog.request.doctor.displayName}</strong></div></ConfirmDialog>}
    {toast && <p className={`my-doctor-toast my-doctor-toast--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>{toast.text}</p>}
  </div>
}
