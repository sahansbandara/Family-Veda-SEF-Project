// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Presentational pieces for the family My Doctor page (styles/my-doctor.css).
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import type { DoctorSummaryDto } from '../../services/apiClient'
import { doctorInitials, doctorPlace } from './threePortalUtils'

const iconPaths = {
  heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /><path d="M6.2 12h3l1.5-2.5 2.5 5 1.5-2.5h3.1" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  shield: <><path d="m12 22 8-4V6l-8-4-8 4v12l8 4Z" /><path d="m8.7 12 2.4 2.4 4.4-4.8" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c-5 4-5 14 0 18M12 3c5 4 5 14 0 18" /></>,
  brief: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>,
  search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  lock: <><rect x="4" y="11" width="16" height="11" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 11v6m0-10h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
}

export function Icon({ name }: { name: keyof typeof iconPaths }) {
  return <svg className="my-doctor-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{iconPaths[name]}</svg>
}

export function DoctorProfileDetails({ doctor }: { doctor: DoctorSummaryDto }) {
  return <div className="my-doctor-dialog__details">
    <strong>{[doctor.specialty, doctor.clinic].filter(Boolean).join(' · ') || 'Practice details not provided'}</strong>
    <small>{doctorPlace(doctor) || 'Location not provided'}</small>
    <small>Languages: {doctor.languages || 'Not provided'}</small>
  </div>
}

type ConfirmDialogProps = {
  title: string
  text: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm?: () => void
  onClose: () => void
}

/** Native dialog keeps background controls inert and returns focus to the invoker. */
export function ConfirmDialog({ title, text, children, confirmLabel, cancelLabel = 'Cancel', busy = false, onConfirm, onClose }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const firstButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const element = dialog.current
    if (!element) return
    if (typeof element.showModal === 'function') element.showModal()
    else element.setAttribute('open', '')
    firstButton.current?.focus()
    return () => {
      if (element.open && typeof element.close === 'function') element.close()
      invoker?.focus()
    }
  }, [])
  return <dialog ref={dialog} className="my-doctor-dialog" aria-labelledby="my-doctor-dialog-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
    onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div className="my-doctor-dialog__body">
      <h2 id="my-doctor-dialog-title">{title}</h2>
      <p>{text}</p>
      {children}
      <div className="my-doctor-dialog__actions">
        <button ref={firstButton} type="button" className="button button--secondary" disabled={busy} onClick={onClose}>{onConfirm ? cancelLabel : 'Close'}</button>
        {onConfirm && <button type="button" className="button button--primary" disabled={busy} onClick={onConfirm}>{busy ? 'Please wait…' : confirmLabel}</button>}
      </div>
    </div>
  </dialog>
}

type DoctorDirectoryProps = {
  doctors: DoctorSummaryDto[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  mode: 'assigned' | 'none'
  currentDoctorId?: string
  requestDisabled: boolean
  onRetry: () => void
  onView: (doctor: DoctorSummaryDto) => void
  onRequest: (doctor: DoctorSummaryDto) => void
}

export function DoctorDirectory({ doctors, status, mode, currentDoctorId, requestDisabled, onRetry, onView, onRequest }: DoctorDirectoryProps) {
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [specialty, setSpecialty] = useState('')
  const districts = useMemo(() => [...new Set(doctors.map((doctor) => doctor.district).filter((value): value is string => Boolean(value)))].sort(), [doctors])
  const specialties = useMemo(() => [...new Set(doctors.map((doctor) => doctor.specialty).filter((value): value is string => Boolean(value)))].sort(), [doctors])
  const query = search.trim().toLowerCase()
  const results = doctors.filter((doctor) =>
    (!query || [doctor.displayName, doctor.clinic, doctor.city, doctor.specialty, doctor.languages].some((value) => value?.toLowerCase().includes(query)))
    && (!district || doctor.district === district)
    && (!specialty || doctor.specialty === specialty))
  if (status === 'idle' || status === 'loading') return <p className="my-doctor-inline" role="status">Loading verified doctors…</p>
  if (status === 'error') return <div className="my-doctor-inline" role="alert"><p>Could not load the doctor directory.</p><button type="button" className="button button--secondary" onClick={onRetry}>Retry directory</button></div>
  return <>
    <div className="my-doctor-tools">
      <label className="field"><span>Search doctor or clinic</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, specialty or clinic…" autoComplete="off" /></label>
      <label className="field"><span>District</span><select value={district} onChange={(event) => setDistrict(event.target.value)}><option value="">All districts</option>{districts.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="field"><span>Specialty</span><select value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">All specialties</option>{specialties.map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    {results.length === 0
      ? <p className="my-doctor-inline">{doctors.length === 0 ? 'No verified doctors are accepting families right now.' : 'No matching doctors. Try clearing the filters.'}</p>
      : <div className="my-doctor-results">{results.map((doctor) => {
        const isCurrent = doctor.id === currentDoctorId
        return <article key={doctor.id} className="my-doctor-card">
          <div className="my-doctor-mini"><span className="my-doctor-mini__avatar" aria-hidden="true">{doctorInitials(doctor.displayName)}</span><div><h4>{doctor.displayName}</h4><small>{doctor.specialty || 'Specialty not provided'}</small></div></div>
          <div className="my-doctor-card__meta">
            {doctorPlace(doctor) && <span><Icon name="location" /> {doctorPlace(doctor)}</span>}
            {doctor.languages && <span><Icon name="globe" /> {doctor.languages}</span>}
          </div>
          {doctor.clinic && <small className="my-doctor-card__clinic">{doctor.clinic}</small>}
          <span className="my-doctor-tag my-doctor-tag--green"><Icon name="shield" /> Verified · Accepting families</span>
          <div className="my-doctor-card__actions">
            <button type="button" className="button button--secondary" onClick={() => onView(doctor)} aria-label={`View profile of ${doctor.displayName}`}>View profile</button>
            <button type="button" className="button button--primary" disabled={requestDisabled || isCurrent} onClick={() => onRequest(doctor)} aria-label={isCurrent ? `${doctor.displayName} is your current doctor` : `${mode === 'assigned' ? 'Request change to' : 'Request'} ${doctor.displayName}`}>{isCurrent ? 'Current doctor' : mode === 'assigned' ? 'Request change' : 'Request doctor'}</button>
          </div>
        </article>
      })}</div>}
  </>
}
