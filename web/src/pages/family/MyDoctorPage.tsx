// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Approved care-workspace redesign; whole-project ownership waiver applies.
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { useAppSelector } from '../../store/hooks'
import { apiClient, threePortalApi, doctorWorkspaceApi, type DoctorSlotsDto, type DoctorSummaryDto, type FamilyDto } from '../../services/apiClient'
import { extractErrorMessage } from './threePortalUtils'

function clinicToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
function clinicTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}
function DoctorFacts({ doctor }: { doctor: DoctorSummaryDto }) {
  return <dl className="care-doctor-facts">
    <div><dt>Specialty</dt><dd>{doctor.specialty || 'Not provided'}</dd></div>
    <div><dt>Clinic</dt><dd>{doctor.clinic || 'Not provided'}</dd></div>
    <div><dt>Location</dt><dd>{[doctor.city, doctor.district].filter(Boolean).join(', ') || 'Not provided'}</dd></div>
    <div><dt>Languages</dt><dd>{doctor.languages || 'Not provided'}</dd></div>
  </dl>
}
export function MyDoctorPage() {
  const user = useAppSelector((state) => state.auth.user)
  const isHead = user?.role === 'FAMILY_HEAD'
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [current, setCurrent] = useState<DoctorSummaryDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [directory, setDirectory] = useState<DoctorSummaryDto[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [date, setDate] = useState(clinicToday)
  const [slots, setSlots] = useState<DoctorSlotsDto | null>(null)
  const [slotStatus, setSlotStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retry, setRetry] = useState(0)
  const loadSequence = useRef(0)
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current
    setStatus('loading')
    try {
      const { data: family } = await apiClient.get<FamilyDto>('/families/me')
      const { data: doctor } = await threePortalApi.getFamilyDoctor(family.id)
      if (sequence !== loadSequence.current) return
      setFamilyId(family.id)
      setCurrent(doctor)
      setStatus('ready')
    } catch { if (sequence === loadSequence.current) setStatus('error') }
  }, [])
  useEffect(() => { const lifecycle = loadSequence; void load(); return () => { lifecycle.current++ } }, [load])
  useEffect(() => {
    if (!familyId || !current || !date) return
    let active = true
    setSlots(null)
    setSlotStatus('loading')
    void doctorWorkspaceApi.getFamilyDoctorSlots(familyId, date).then(({ data }) => {
      if (active) { setSlots(data); setSlotStatus('ready') }
    }).catch(() => { if (active) setSlotStatus('error') })
    return () => { active = false }
  }, [familyId, current, date, retry])
  async function runSearch(event: FormEvent) {
    event.preventDefault()
    if (searching) return
    setSearching(true)
    try {
      const { data } = await threePortalApi.getDoctorDirectory({ search, district })
      setDirectory(data)
      setHasSearched(true)
    } catch (error) { setMessage(extractErrorMessage(error, 'Could not load doctor directory.')) }
    finally { setSearching(false) }
  }
  async function requestDoctor(doctor: DoctorSummaryDto) {
    if (!familyId || requesting) return
    setRequesting(doctor.id)
    try {
      await threePortalApi.requestFamilyDoctor(familyId, { doctorId: doctor.id })
      setMessage(`Request sent to ${doctor.displayName}. Your doctor will appear here after they accept.`)
    } catch (error) { setMessage(extractErrorMessage(error, 'Could not send request.')) }
    finally { setRequesting(null) }
  }
  if (status === 'loading') return <LoadingState label="Loading your doctor…" />
  if (status === 'error') return <ErrorState message="Could not load your doctor." onRetry={() => void load()} />
  return <div className="page-stack care-workspace care-doctor-workspace">
    <header className="care-header"><div><p className="care-eyebrow">A familiar doctor, continuous care</p><h1>My doctor</h1><p className="care-description">Know your care team, find a time, and keep your next visit simple.</p></div><Link className="button button--secondary" to="/appointments">My appointments</Link></header>
    {message && <p className="care-notice" role="status">{message}</p>}
    {current ? <div className="care-doctor-layout">
      <section className="care-panel care-doctor-profile" aria-label="Your family doctor">
        <div className="care-doctor-profile__accent" aria-hidden="true" />
        <div className="care-doctor-profile__identity"><span className="care-doctor-avatar" aria-hidden="true">{current.displayName.split(' ').filter(Boolean).slice(-2).map((name) => name[0]).join('')}</span><div><p className="care-eyebrow">Your family doctor</p><h2>{current.displayName}</h2><p className="care-caption">{current.specialty || 'Specialty not provided'}</p></div></div>
        <DoctorFacts doctor={current} />
        <div className="care-info"><strong>Your information stays protected</strong><p>Your doctor can read health records only with consent and an active access grant. Appointment requests need doctor confirmation.</p><Link to="/privacy">Manage privacy & access →</Link></div>
      </section>
      <section className="care-panel care-doctor-availability" aria-labelledby="available-times-title">
        <div className="care-panel-heading"><div><p className="care-eyebrow">Plan your next visit</p><h2 id="available-times-title">Available appointment times</h2><p className="care-caption">Sri Lanka time · Availability can change before you book.</p></div></div>
        <label className="field"><span>Appointment date</span><input type="date" min={clinicToday()} value={date} onChange={(event) => { setDate(event.target.value); setSlots(null); setSlotStatus('loading') }} /></label>
        {!date ? <p className="care-caption">Choose a date to see available times.</p> : slotStatus === 'loading' ? <p role="status" className="care-slot-notice">Checking available times…</p> : slotStatus === 'error' ? <div className="care-slot-notice" role="alert"><p>Could not load available times.</p><button type="button" className="button button--secondary" onClick={() => setRetry((value) => value + 1)}>Retry availability</button></div> : !slots?.availabilityConfigured ? <div className="care-slot-notice"><h3>Availability is not configured yet</h3><p>The doctor has not set availability. You can request an appointment from the appointments page.</p><Link className="button button--secondary" to="/appointments">Request an appointment</Link></div> : slots.slots.length === 0 ? <div className="care-slot-notice"><h3>No available times on this date</h3><p>Try another date. This does not mean the doctor is unavailable on other days.</p></div> : <><p className="care-caption">{slots.slotMinutes}-minute appointments · Choose a time to continue booking</p><div className="care-slot-grid">{slots.slots.map((slot) => <Link key={slot} className="care-slot" to={`/appointments?date=${encodeURIComponent(date)}&slot=${encodeURIComponent(slot)}`}>{clinicTime(slot)}<span aria-hidden="true">↗</span></Link>)}</div></>}
      </section>
    </div> : <section className="care-panel"><EmptyState title="No family doctor yet" message={isHead ? 'Find a doctor below and send a request. The assignment starts after the doctor accepts.' : 'Your family head can choose and request a doctor for the family.'} /></section>}
    {isHead && <section className="care-panel"><div className="care-panel-heading"><div><p className="care-eyebrow">Explore the directory</p><h2>Find a family doctor</h2><p className="care-caption">Search by name, specialty or district.</p></div></div><form className="care-doctor-search" onSubmit={(event) => void runSearch(event)}><label className="field"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or specialty" /></label><label className="field"><span>District</span><input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="e.g. Colombo" /></label><button className="button button--primary" type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search doctors'}</button></form>
      {!directory.length ? <EmptyState title={hasSearched ? 'No doctors match this search' : 'Find the right doctor for your family'} message={hasSearched ? 'Try another name, specialty or district.' : 'Search the verified doctor directory above.'} /> : <div className="care-directory">{directory.map((doctor) => <article key={doctor.id} className="care-directory-card"><h3>{doctor.displayName}</h3><DoctorFacts doctor={doctor} /><button className="button button--secondary" type="button" disabled={requesting !== null || doctor.id === current?.id} onClick={() => void requestDoctor(doctor)}>{doctor.id === current?.id ? 'Current family doctor' : requesting === doctor.id ? 'Sending request…' : 'Request as family doctor'}</button></article>)}</div>}
    </section>}
  </div>
}
