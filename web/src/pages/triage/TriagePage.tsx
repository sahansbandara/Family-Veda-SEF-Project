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
import '../../styles/triage-redesign.css'

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

function needsInformation(status: string) {
  return status === 'LowConfidence' || status === 'RequestInformation' || status === 'RequestedInformation'
}
function needsInPersonCare(status: string, priority: string) {
  return status === 'Escalated' || status === 'FailedSafe' || priority === 'Emergency'
}
function caseStatusTone(status: string, priority: string) {
  if (isApproved(status)) return 'green'
  if (needsInPersonCare(status, priority)) return 'red'
  if (needsInformation(status)) return 'amber'
  if (status === 'Rejected') return 'grey'
  return ''
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? 'F') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
function caseReference(item: TriageCaseDto) {
  return item.caseNumber != null ? String(item.caseNumber).padStart(4, '0') : item.id.slice(0, 8)
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const heartIcon = 'M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z'
const activityIcon = 'M2 12h5l3-7 4 14 3-7h5'
const symptomOptions = [
  { name: 'Headache', icon: heartIcon },
  { name: 'Fever', icon: activityIcon },
  { name: 'Cough', icon: activityIcon },
  { name: 'Sore throat', icon: heartIcon },
  { name: 'Stomach ache', icon: activityIcon },
  { name: 'Feeling tired', icon: 'M12 6v6l4 2 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18' },
  { name: 'Body pain', icon: activityIcon },
  { name: 'Nausea', icon: heartIcon },
  { name: 'Breathing difficulty', icon: activityIcon },
  { name: 'Chest pain', icon: heartIcon },
  { name: 'Dizziness', icon: activityIcon },
  { name: 'Other symptom', icon: 'M12 11v5M12 7.5h.01 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18' },
]
const severityLabels: Record<number, string> = { 3: 'Mild', 6: 'Moderate', 9: 'Severe' }
type RequestFilter = 'all' | 'review' | 'ready'
const requestFilters: { id: RequestFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'In review' },
  { id: 'ready', label: 'Guidance ready' },
]

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
  const [filter, setFilter] = useState<RequestFilter>('all')
  const [descriptionLength, setDescriptionLength] = useState(0)
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
      setDescriptionLength(0)
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
  const memberName = (memberId?: string) =>
    members.find((member) => member.id === memberId)?.displayName ?? 'Family member'
  const visibleCases = cases.filter((item) =>
    filter === 'ready'
      ? isApproved(item.status)
      : filter === 'review'
        ? !isApproved(item.status) && item.status !== 'Rejected' && !needsInPersonCare(item.status, item.priority)
        : true,
  )
  const submitted = message.includes('submitted')
  return (
    <div className="triage-redesign">
      <div className="shell">
        <div className="head">
          <div>
            <span className="eyebrow">SYMPTOMS &amp; DOCTOR REVIEW</span>
            <h1>Tell us how you're feeling.</h1>
            <p>Share your symptoms, follow your request, and read guidance only after a doctor approves it.</p>
          </div>
          <div className="safe-mini">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>
            <div>
              <strong>Doctor review before guidance</strong>
              <small>Information prepared here is a request for clinical review, not an automatic diagnosis.</small>
            </div>
          </div>
        </div>

        {pageStatus === 'loading' ? (
          <LoadingState label="Loading symptoms and requests" />
        ) : pageStatus === 'error' ? (
          <ErrorState message="Symptoms and requests could not be loaded." onRetry={() => void load()} />
        ) : (
          <div className="columns">
            <section className="panel wizard" aria-label="New symptom request">
              <h2>New symptom request</h2>
              <p className="sub">Three clear steps, with your draft kept while you move between them.</p>

              <div className="stepper" role="group" aria-label="Request steps">
                {['Symptoms', 'Details', 'Review'].map((label, index) => {
                  const number = index + 1
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`step ${step === number ? 'active' : step > number ? 'done' : ''}`}
                      aria-current={step === number ? 'step' : undefined}
                      disabled={submitting || step <= number}
                      onClick={() => { setStep(number); setMessage('') }}
                    >
                      <span className="num" aria-hidden="true">{step > number ? '✓' : number}</span>
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="notice">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>
                <div>This service helps a doctor review symptoms. It does not diagnose or replace emergency care. <strong>No guidance is released without an authorized doctor's approval.</strong></div>
              </div>

              {message && <div className={submitted ? 'success' : 'error'} role={submitted ? 'status' : 'alert'}>{message}</div>}

              <form noValidate onSubmit={(event) => void submit(event)}>
                <div className="step-content" hidden={step !== 1}>
                  <div className="field">
                    <label htmlFor="memberId">Who is this request for?</label>
                    <select id="memberId" name="memberId" required>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName}{member.isSelf ? ' (Self)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="hint">Only members you are authorized to submit for appear here. Adult members submit their own private requests.</p>
                  </div>

                  <div className="field">
                    <span className="lbl" id="symptom-chips-label">What symptoms are you experiencing? <span className="optional">Select any that apply.</span></span>
                    <div className="chips" role="group" aria-labelledby="symptom-chips-label">
                      {symptomOptions.map((symptom) => (
                        <button
                          key={symptom.name}
                          type="button"
                          aria-pressed={selectedSymptoms.includes(symptom.name)}
                          className={`chip ${selectedSymptoms.includes(symptom.name) ? 'selected' : ''}`}
                          onClick={() => toggleSymptom(symptom.name)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={symptom.icon}/></svg>
                          <span>{symptom.name}</span>
                          <span className="check" aria-hidden="true">✓</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="symptoms">Describe the symptoms in your own words <span className="optional">(optional)</span></label>
                    <textarea
                      id="symptoms"
                      name="symptoms"
                      maxLength={500}
                      placeholder="Tell the doctor what you have noticed, when it started, and anything else relevant."
                      onChange={(event) => setDescriptionLength(event.target.value.length)}
                    />
                    <p className="hint counter">{descriptionLength}/500</p>
                  </div>
                </div>

                <div className="step-content" hidden={step !== 2}>
                  <div className="section-heading">More about these symptoms</div>
                  <div className="twocol">
                    <div className="field">
                      <label htmlFor="durationDays">How many days have you had them?</label>
                      <input id="durationDays" name="durationDays" type="number" min={0} max={365} defaultValue={1} required />
                    </div>
                    <div className="field">
                      <label htmlFor="severity">How severe do they feel?</label>
                      <select id="severity" value={severity} onChange={(event) => setSeverity(Number(event.target.value))}>
                        {Object.entries(severityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="notes">Anything else the doctor should know? <span className="optional">(optional)</span></label>
                    <textarea id="notes" name="notes" maxLength={1000} placeholder="Add relevant context in your own words. Do not enter someone else's private health details." />
                  </div>
                  <div className="notice notice--flush">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>
                    <div>Emergency decisions are not made by this form. If you need urgent help, use emergency services instead of waiting for this request.</div>
                  </div>
                </div>

                {step === 3 && (
                  <section className="step-content" aria-label="Review symptom request">
                    <div className="section-heading">Check your request before submitting</div>
                    <div className="review-box">
                      <strong>Family member</strong>
                      <p>{review.member}</p>
                    </div>
                    <div className="review-box">
                      <strong>Symptoms and description</strong>
                      <div>{review.symptoms.split(', ').filter(Boolean).map((symptom) => <span key={symptom} className="tag">{symptom}</span>)}</div>
                    </div>
                    <div className="review-box">
                      <strong>Further details</strong>
                      <p>Duration: {review.days} days · Severity: {severityLabels[severity]}</p>
                      {review.detail && <p>Additional context: {review.detail}</p>}
                    </div>
                    <div className="notice notice--flush">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                      <div>A doctor reviews this request before any guidance is shared with you.</div>
                    </div>
                  </section>
                )}

                <div className="form-foot">
                  <span className="footnote">
                    {step === 1 ? 'Step 1 of 3 · Select at least one symptom.' : step === 2 ? 'Step 2 of 3 · Add duration and details.' : 'Step 3 of 3 · Confirm the summary.'}
                  </span>
                  <div className="form-actions">
                    {step > 1 && <button type="button" className="btn" disabled={submitting} onClick={() => { setStep(step - 1); setMessage('') }}>Back</button>}
                    <button type="submit" className="btn primary" disabled={submitting}>
                      {submitting ? 'Submitting…' : step === 3 ? 'Submit for doctor review' : <>Continue <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></>}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <div className="reqcol">
              <section className="panel panel-pad">
                <div className="req-head">
                  <div>
                    <h2>Your requests</h2>
                    <p className="sub">Track case progress and open approved guidance.</p>
                  </div>
                  <span className="count">{cases.length} request{cases.length === 1 ? '' : 's'}</span>
                </div>

                {cases.length === 0 ? (
                  <EmptyState title="No symptom requests yet" message="Submit symptoms when you need a doctor to review them." />
                ) : (
                  <>
                    <div className="filters" role="group" aria-label="Request filters">
                      {requestFilters.map((item) => (
                        <button key={item.id} type="button" className={`filter ${filter === item.id ? 'on' : ''}`} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="request-list">
                      {visibleCases.length === 0 && <p className="sub">No requests match this filter.</p>}
                      {visibleCases.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`request ${item.id === selectedId ? 'on' : ''}`}
                          aria-pressed={item.id === selectedId}
                          onClick={() => selectCase(item.id)}
                        >
                          <span className="bubble" aria-hidden="true">{initials(memberName(item.memberId))}</span>
                          <span className="request-main">
                            <strong>{memberName(item.memberId)}</strong>
                            <small>Case {caseReference(item)} · {formatDate(item.createdAt)}</small>
                            <span className={`status reqstatus ${caseStatusTone(item.status, item.priority)}`}>
                              {needsInPersonCare(item.status, item.priority) ? 'In-person care needed' : caseStatusLabel(item.status)}
                            </span>
                          </span>
                          <svg className="mini-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <aside className="urgent">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H4a2 2 0 0 0-2 2 17 17 0 0 0 17 17 2 2 0 0 0 2-2v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5z"/></svg>
                <div>
                  <h3>Need urgent help?</h3>
                  <p>Do not wait for an AI or doctor response. Contact emergency services or visit the nearest emergency unit.</p>
                </div>
                <a className="btn danger" href="tel:1990" aria-label="Call Sri Lanka ambulance emergency number 1990">Call 1990 ↗</a>
              </aside>
            </div>
          </div>
        )}

        {pageStatus === 'ready' && selectedId && (
          <section className="panel progress-panel" aria-live="polite">
            <div className="req-head">
              <div>
                <h2>Request progress</h2>
                <p className="sub">Selected request · See where it is in the review process.</p>
              </div>
              {selectedCase && <span className="count">Case {caseReference(selectedCase)}</span>}
            </div>

            {!caseView || caseView.state === 'loading' ? (
              <LoadingState label="Loading request progress" />
            ) : caseView.state === 'error' ? (
              <div className="current-call">
                <p>Request progress could not be loaded.</p>
                <button className="btn tiny" type="button" onClick={() => setRefreshKey((current) => current + 1)}>
                  Retry progress
                </button>
              </div>
            ) : (
              <>
                <div className="personline">
                  <span className="bubble" aria-hidden="true">{initials(memberName(selectedCase?.memberId))}</span>
                  <div>
                    <strong>{memberName(selectedCase?.memberId)}</strong>
                    {selectedCase && <small>Submitted {formatDate(selectedCase.createdAt)}</small>}
                  </div>
                  <span className={`status ${caseStatusTone(caseView.status.status, caseView.status.priority)}`}>
                    {needsInPersonCare(caseView.status.status, caseView.status.priority) ? 'In-person care needed' : caseStatusLabel(caseView.status.status)}
                  </span>
                </div>

                {needsInPersonCare(caseView.status.status, caseView.status.priority) ? (
                  <div className="current-call current-call--danger" role="alert">
                    <strong>Please seek in-person care</strong>
                    <p>This request needs an in-person clinician. No automated guidance will be shown. For an emergency, call <a href="tel:1990">1990</a>.</p>
                  </div>
                ) : (
                  <>
                    <FamilyCaseProgress caseStatus={caseView.status.status} />
                    {caseView.guidance ? (
                      <div className="current-call current-call--ok">
                        <strong>Doctor-approved guidance</strong>
                        <p>{caseView.guidance.finalAdvisory}</p>
                        <small>Approved {new Date(caseView.guidance.approvedAt).toLocaleString()} · {caseView.guidance.disclaimer}</small>
                      </div>
                    ) : !isStopped(caseView.status.status) && (
                      <div className="current-call">
                        <strong>{caseStatusLabel(caseView.status.status)}:</strong> A clinician will review the submitted information. Guidance appears here only after a doctor approves it.
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
