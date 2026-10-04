// Owner: S3 · Triage & Agent Orchestration — Karunathilaka K.D.J.C (IT24100551)
// Ownership is binding — whole-project waiver applies; docs/OWNERSHIP.tsv
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import {
  apiClient,
  type ApprovedGuidanceDto,
  type EpisodeDto,
  type FamilyDto,
  type MemberDto,
  type PagedResult,
  type TriageCaseDto,
} from '../../services/apiClient'
import { FamilyCaseProgress } from './FamilyCaseProgress'

type TriageStatusDto = { id: string; status: string; priority: string; failureCode?: string | null }
type CaseView =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'ready'; status: TriageStatusDto; guidance: ApprovedGuidanceDto | null }

const POLL_MS = 3000
const approvedStatuses = ['Approved', 'ApprovedRevised']
const stoppedStatuses = [
  'Approved',
  'ApprovedRevised',
  'Rejected',
  'Escalated',
  'FailedSafe',
  'LowConfidence',
  'RequestInformation',
  'RequestedInformation',
]
const symptomOptions = ['Headache', 'Feeling tired', 'Cough', 'Sore throat']

function isApproved(status: string) {
  return approvedStatuses.includes(status)
}
function isStopped(status: string) {
  return stoppedStatuses.includes(status)
}
function isTerminal(status: string, priority: string) {
  return isStopped(status) || priority === 'Emergency'
}
function caseStatusLabel(status: string) {
  if (isApproved(status)) return 'Guidance available'
  if (status === 'PendingDoctorReview') return 'Waiting for doctor review'
  if (status === 'Claimed') return 'Doctor review in progress'
  if (status === 'LowConfidence' || status === 'RequestInformation' || status === 'RequestedInformation')
    return 'More information needed'
  if (status === 'Rejected') return 'Review closed'
  if (status === 'Escalated' || status === 'FailedSafe') return 'In-person care needed'
  return 'Being reviewed'
}
function caseStatusTone(status: string) {
  if (isApproved(status)) return 'success'
  if (status === 'Escalated' || status === 'FailedSafe') return 'danger'
  if (isStopped(status)) return 'warning'
  return 'primary'
}

export function TriagePage() {
  const [searchParams] = useSearchParams()
  const [members, setMembers] = useState<MemberDto[]>([])
  const [familyId, setFamilyId] = useState('')
  const [cases, setCases] = useState<TriageCaseDto[]>([])
  const [pageStatus, setPageStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selectedId, setSelectedId] = useState('')
  const selectedCaseRef = useRef('')
  const loadedCaseRef = useRef('')
  const [caseView, setCaseView] = useState<CaseView | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [severity, setSeverity] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1)
  const [review, setReview] = useState({ member: '', symptoms: '', days: '1', detail: '' })

  const loadCases = useCallback(async (id: string) => {
    const { data } = await apiClient.get<PagedResult<TriageCaseDto>>(`/families/${id}/triage-cases`, {
      params: { page: 1, pageSize: 20 },
    })
    return data.items
  }, [])
  const selectCase = useCallback((id: string) => {
    if (id === selectedCaseRef.current) return
    selectedCaseRef.current = id
    loadedCaseRef.current = ''
    setSelectedId(id)
    setCaseView({ state: 'loading' })
  }, [])
  const load = useCallback(async () => {
    setPageStatus('loading')
    try {
      const { data: family } = await apiClient.get<FamilyDto>('/families/me')
      const items = await loadCases(family.id)
      const guidanceCase =
        searchParams.get('view') === 'guidance' ? items.find((item) => isApproved(item.status)) : undefined
      setMembers(family.members)
      setFamilyId(family.id)
      setCases(items)
      setSelectedId((current) => current || guidanceCase?.id || items[0]?.id || '')
      setPageStatus('ready')
    } catch {
      setPageStatus('error')
    }
  }, [loadCases, searchParams])
  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedId) return
    selectedCaseRef.current = selectedId
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const commit = (next: CaseView) => {
      if (!cancelled && selectedCaseRef.current === selectedId) setCaseView(next)
    }
    const tick = async () => {
      if (loadedCaseRef.current !== selectedId) commit({ state: 'loading' })
      try {
        const { data: status } = await apiClient.get<TriageStatusDto>(`/triage-cases/${selectedId}/status`)
        if (cancelled || selectedCaseRef.current !== selectedId) return
        const guidance = isApproved(status.status)
          ? (await apiClient.get<ApprovedGuidanceDto>(`/triage-cases/${selectedId}/approved-guidance`)).data
          : null
        if (cancelled || selectedCaseRef.current !== selectedId) return
        loadedCaseRef.current = selectedId
        commit({ state: 'ready', status, guidance })
        if (!isTerminal(status.status, status.priority)) timer = setTimeout(() => void tick(), POLL_MS)
      } catch {
        commit({ state: 'error' })
      }
    }
    void tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [selectedId, refreshKey])

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom],
    )
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    if (submitting) return
    const form = new FormData(formElement)
    const typedSymptoms = String(form.get('symptoms') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const symptoms = [...selectedSymptoms, ...typedSymptoms]
    if (symptoms.length === 0) {
      setMessage('Choose a symptom or describe it in your own words.')
      setStep(1)
      return
    }
    if (step === 1) { setMessage(''); setStep(2); return }
    const durationInput = formElement.elements.namedItem('durationDays') as HTMLInputElement
    if (!durationInput.checkValidity()) { durationInput.reportValidity(); return }
    if (step === 2) {
      setReview({ member: members.find((member) => member.id === String(form.get('memberId')))?.displayName ?? 'You', symptoms: symptoms.join(', '), days: String(form.get('durationDays')), detail: String(form.get('notes') ?? '') })
      setMessage('')
      setStep(3)
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const { data: episode } = await apiClient.post<EpisodeDto>(
        `/members/${form.get('memberId')}/episodes`,
        {
          symptoms,
          durationDays: Number(form.get('durationDays')),
          severity,
          notes: String(form.get('notes') ?? '').trim() || null,
        },
      )
      const { data: triageCase } = await apiClient.post<TriageCaseDto>(`/episodes/${episode.id}/triage`)
      setCases((items) => [triageCase, ...items.filter((item) => item.id !== triageCase.id)])
      setSelectedSymptoms([])
      formElement.reset()
      setSeverity(3)
      setStep(1)
      setMessage('Your request was submitted for review. Guidance appears only after doctor approval.')
      selectCase(triageCase.id)
      try { setCases(await loadCases(familyId)) }
      catch { setMessage('Your request was submitted for review. The request list could not be refreshed; reopen this page to check it. Guidance appears only after doctor approval.') }
    } catch {
      setMessage('Could not confirm submission. Check your requests before retrying to avoid sending the same request twice.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCase = cases.find((item) => item.id === selectedId)
  const hasSameDayMemberRequest = (item: TriageCaseDto) =>
    cases.filter(
      (other) =>
        other.memberId === item.memberId && other.createdAt.slice(0, 10) === item.createdAt.slice(0, 10),
    ).length > 1
  const failedSafe =
    caseView?.state === 'ready' &&
    (caseView.status.status === 'FailedSafe' ||
      caseView.status.status === 'Escalated' ||
      caseView.status.priority === 'Emergency')
  return (
    <div className="page-stack care-workspace">
      <header className="care-header">
        <div>
          <p className="care-eyebrow">Symptoms & doctor review</p>
          <h1>Tell us how you’re feeling.</h1>
          <p>Share your symptoms, follow your request, and read guidance only after a doctor approves it.</p>
        </div>
        <span className="status-badge status-badge--primary">Doctor review before guidance</span>
      </header>
      {pageStatus === 'loading' ? (
        <LoadingState label="Loading symptoms and requests" />
      ) : pageStatus === 'error' ? (
        <ErrorState message="Symptoms and requests could not be loaded." onRetry={() => void load()} />
      ) : (
        <>
          <div className="care-split care-split--symptoms">
            <section className="panel care-panel">
              <div className="care-panel-heading">
                <h2>What has been bothering you?</h2>
                <span className="care-caption">New request</span>
              </div>
              <ol className="care-steps" aria-label="Symptom request steps">{['Symptoms', 'Details', 'Review'].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={step >= index + 1 ? 'is-complete' : ''}><span>{index + 1}</span>{label}</li>)}</ol>
              <p className="care-caption" role="status">Step {step} of 3</p>
          <form className="care-form" noValidate onSubmit={(event) => void submit(event)}>
            <div hidden={step !== 1} className="care-form-step">
                <p className="care-note">
                  This service helps a doctor review symptoms. It does not diagnose and is not an emergency
                  service.
                </p>
                <label>
                  For family member
                  <select name="memberId" required>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="field-label">Choose any symptoms that apply</span>
                  <p className="care-caption">You can add more detail below.</p>
                  <div className="care-chips" aria-label="Common symptoms">
                    {symptomOptions.map((symptom) => (
                      <button
                        key={symptom}
                        className="care-chip"
                        type="button"
                        aria-pressed={selectedSymptoms.includes(symptom)}
                        onClick={() => toggleSymptom(symptom)}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>
                <label>
                  Describe symptoms in your own words
                  <input
                    name="symptoms"
                    maxLength={500}
                    placeholder="Add another symptom, or separate symptoms with commas"
                  />
                </label>
              </div>
              <div hidden={step !== 2} className="care-form-step">
                <label>
                  Additional details (optional)
                  <textarea name="notes" maxLength={1000} placeholder="What changed, and when?" />
                </label>
                <div className="care-field-grid">
                  <label>
                    How many days?
                    <input name="durationDays" type="number" min={0} max={365} defaultValue={1} required />
                  </label>
                  <div>
                    <span className="field-label">How much does it affect your day?</span>
                    <div className="care-chips" aria-label="Severity">
                      {[
                        [3, 'A little'],
                        [6, 'Somewhat'],
                        [9, 'A lot'],
                      ].map(([value, label]) => (
                        <button
                          key={String(value)}
                          className="care-chip"
                          type="button"
                          aria-pressed={severity === value}
                          onClick={() => setSeverity(value as number)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {step === 3 && <section className="care-request-review" aria-label="Review symptom request">
                <h3>Review your request</h3>
                <dl>
                  <div><dt>Family member</dt><dd>{review?.member}</dd></div>
                  <div><dt>Symptoms</dt><dd>{review?.symptoms}</dd></div>
                  <div><dt>Duration</dt><dd>{review?.days} days</dd></div>
                  <div><dt>Effect on your day</dt><dd>{severity === 3 ? 'A little' : severity === 6 ? 'Somewhat' : 'A lot'}</dd></div>
                  {review?.detail && <div><dt>Additional details</dt><dd>{review.detail}</dd></div>}
                </dl>
                <p className="care-note">A doctor reviews this request before any guidance is shared with you.</p>
              </section>}
                <div className="care-actions">
                  <span className="care-caption">No guidance is shared until doctor approval.</span>
                  {step > 1 && <button className="button button--secondary" type="button" disabled={submitting} onClick={() => { setStep(step - 1); setMessage('') }}>Back</button>}
                  <button className="button button--primary" type="submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : step === 3 ? 'Submit for doctor review' : 'Continue'}
                  </button>
                </div>
              </form>
              {message && <p role="status">{message}</p>}
            </section>
            <aside>
              <section className="panel care-panel">
                <div className="care-panel-heading">
                  <h2>Your requests</h2>
                  <span className="care-caption">
                    {cases.length} request{cases.length === 1 ? '' : 's'}
                  </span>
                </div>
                {cases.length === 0 ? (
                  <div className="care-empty">
                    <EmptyState
                      title="No symptom requests yet"
                      message="Submit symptoms when you need a doctor to review them."
                    />
                  </div>
                ) : (
                  <div className="care-request-list">
                    {cases.map((item) => (
                      <button
                        className={`care-selection-card${item.id === selectedId ? ' is-selected' : ''}`}
                        key={item.id}
                        type="button"
                        aria-pressed={item.id === selectedId}
                        onClick={() => selectCase(item.id)}
                      >
                        <span className={`status-badge status-badge--${caseStatusTone(item.status)}`}>
                          {caseStatusLabel(item.status)}
                        </span>
                        <strong>{members.find((member) => member.id === item.memberId)?.displayName ?? 'Family member'} · Symptom request</strong>
                        <span className="care-caption">
                          Submitted {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        {hasSameDayMemberRequest(item) && (
                          <span className="care-caption">Reference {item.id.slice(0, 8)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </section>
              <section className="care-note" role="note">
                <strong>Need urgent help?</strong> If you think this is an emergency, do not wait for a
                response. Call <a href="tel:1990">1990</a> or go to the nearest emergency unit.
              </section>
            </aside>
          </div>
          {selectedId && (
            <section className="panel care-panel care-progress" aria-live="polite">
              <div className="care-panel-heading">
                <div>
                  <h2>Request progress</h2>
                  <p className="care-caption">
                    {selectedCase ? `Submitted ${new Date(selectedCase.createdAt).toLocaleString()}` : ''}
                  </p>
                </div>
              </div>
              {!caseView || caseView.state === 'loading' ? (
                <LoadingState label="Loading request progress" />
              ) : caseView.state === 'error' ? (
                <div>
                  <p>Request progress could not be loaded.</p>
                  <button
                    className="button"
                    type="button"
                    onClick={() => setRefreshKey((current) => current + 1)}
                  >
                    Retry progress
                  </button>
                </div>
              ) : (
                <>
                  <FamilyCaseProgress caseStatus={caseView.status.status} />
                  {failedSafe && (
                    <div className="referral-card" role="alert">
                      <h3>Please seek in-person care</h3>
                      <p>
                        This request needs an in-person clinician. No automated guidance will be shown. For an
                        emergency, call 1990 or go to the nearest emergency unit.
                      </p>
                    </div>
                  )}
                  {caseView.guidance && !failedSafe && (
                    <div className="care-guidance">
                      <h3>Doctor-approved guidance</h3>
                      <p>{caseView.guidance.finalAdvisory}</p>
                      <p className="care-caption">
                        Approved {new Date(caseView.guidance.approvedAt).toLocaleString()} ·{' '}
                        {caseView.guidance.disclaimer}
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
