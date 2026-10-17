// Owner: S4 · SLMC claim disputes — doctor-side evidence request banner.
// Shown for any signed-in doctor with an open evidence request; the backend decides what is open.
import { useCallback, useEffect, useState } from 'react'

import { apiClient, type EvidenceKind, type EvidenceRequestDto } from '../../services/apiClient'
import { EVIDENCE_KIND_LABEL, formatRemaining } from '../../pages/admin/claimDisputes'
import './EvidenceRequestBanner.css'

const CHALLENGE_TEXT = 'Someone has claimed your SLMC number. Upload evidence within 3 days or your account will be suspended.'
const REQUEST_TEXT = 'An administrator needs evidence that you hold this SLMC number.'

function RequestItem({ request, onUpdated }: { request: EvidenceRequestDto; onUpdated: (next: EvidenceRequestDto) => void }) {
  const [now, setNow] = useState(() => Date.now())
  const [picked, setPicked] = useState<Partial<Record<EvidenceKind, File>>>({})
  const [busyKind, setBusyKind] = useState<EvidenceKind | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const upload = async (kind: EvidenceKind) => {
    const file = picked[kind]
    if (!file) return setError(`Choose a file for ${EVIDENCE_KIND_LABEL[kind]} first.`)
    setBusyKind(kind)
    setError('')
    try {
      const body = new FormData()
      body.append('kind', kind)
      body.append('file', file)
      const { data } = await apiClient.post<EvidenceRequestDto>(`/doctors/me/evidence-requests/${request.id}/files`, body)
      setPicked((current) => ({ ...current, [kind]: undefined }))
      onUpdated(data)
    } catch {
      setError('The file could not be uploaded. Use a PDF, PNG or JPEG under 5 MB.')
    } finally {
      setBusyKind(null)
    }
  }

  return (
    <section className={`evidence-banner${request.isChallenge ? ' evidence-banner--challenge' : ''}`} role="alert" aria-label="Evidence request">
      <p className="evidence-banner__text"><strong>{request.isChallenge ? CHALLENGE_TEXT : REQUEST_TEXT}</strong></p>
      {request.note && <p className="evidence-banner__note">Note from administrator: {request.note}</p>}
      <p className="evidence-banner__countdown">Time remaining: <span aria-live="off">{formatRemaining(request.dueAt, now)}</span></p>
      <ul className="evidence-banner__items">
        {request.requestedItems.map((kind) => {
          const uploaded = request.files.find((file) => file.kind === kind)
          const inputId = `evidence-${request.id}-${kind}`
          return (
            <li key={kind} className="evidence-banner__item">
              <span className="evidence-banner__kind">
                {uploaded ? <span aria-label="Uploaded">&#10003; </span> : null}
                {EVIDENCE_KIND_LABEL[kind]}
                {uploaded && <span className="muted"> ({uploaded.fileName})</span>}
              </span>
              <label htmlFor={inputId} className="visually-hidden">{`File for ${EVIDENCE_KIND_LABEL[kind]}`}</label>
              <input id={inputId} type="file" accept="application/pdf,image/png,image/jpeg"
                onChange={(event) => { const file = event.target.files?.[0]; setPicked((current) => ({ ...current, [kind]: file })) }} />
              <button type="button" className="fv-btn" disabled={busyKind !== null} onClick={() => void upload(kind)}>
                {busyKind === kind ? 'Uploading…' : uploaded ? `Replace ${EVIDENCE_KIND_LABEL[kind]}` : `Upload ${EVIDENCE_KIND_LABEL[kind]}`}
              </button>
            </li>
          )
        })}
      </ul>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  )
}

export function EvidenceRequestBanner() {
  const [requests, setRequests] = useState<EvidenceRequestDto[]>([])

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get<EvidenceRequestDto[]>('/doctors/me/evidence-requests')
      setRequests(Array.isArray(data) ? data : [])
    } catch {
      setRequests([]) // fail silently: no banner
    }
  }, [])
  useEffect(() => { void load() }, [load])

  const update = (next: EvidenceRequestDto) =>
    setRequests((current) => current.map((request) => (request.id === next.id ? next : request)))

  const open = requests.filter((request) => request.status === 'Open')
  if (open.length === 0) return null
  return <div className="evidence-banners">{open.map((request) => <RequestItem key={request.id} request={request} onUpdated={update} />)}</div>
}
