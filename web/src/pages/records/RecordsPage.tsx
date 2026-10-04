// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { OriginalReportPreview } from '../../components/records/OriginalReportPreview'
import { ReportLibraryCard } from '../../components/records/ReportLibraryCard'
import { RecordedRangeVisual } from '../../components/records/RecordedRangeVisual'
import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { StatusBadge } from '../../components/shared/StatusBadge'
import {
  apiClient,
  type DoctorSummaryDto,
  type FamilyDto,
  type HealthRecordDto,
  type LabReportDetailDto,
  type LabReportDto,
  type LabValueDto,
  type MemberDto,
  type PagedResult,
  type VitalDto,
  type VitalTrendDto,
} from '../../services/apiClient'
import { RecordSummaryText } from './RecordSummaryText'
import {
  RECORD_SEVERITIES,
  RECORD_STATUSES,
  formatRecordSummary,
  parseRecordSummary,
  todayLocalDate,
} from './recordSummaryMeta'

type RecordsTab = 'records' | 'vitals' | 'labs'
type LoadStatus = 'loading' | 'ready' | 'error'

function recordedRangeMarker(value: LabValueDto) {
  const below = value.rangeStatus
    ? value.rangeStatus === 'BelowRange'
    : value.referenceLow != null && value.value < value.referenceLow
  const above = value.rangeStatus
    ? value.rangeStatus === 'AboveRange'
    : value.referenceHigh != null && value.value > value.referenceHigh
  if (value.rangeStatus === 'RangeUnavailable')
    return <span className="status-badge">Reference range unavailable</span>
  if (!below && !above) return null
  return (
    <span className="status-badge status-badge--warning" title="Outside recorded reference range">
      {below ? '▼' : '▲'} Outside recorded range
    </span>
  )
}

function reportStep(report: LabReportDto, selected?: LabReportDetailDto | null) {
  const confirmed =
    selected?.id === report.id &&
    selected.values.length > 0 &&
    selected.values.every((value) => value.wasManuallyConfirmed)
  if (confirmed) return 'View confirmed values'
  return report.ocrStatus === 'Completed' ? 'Check values' : 'View status'
}

export function RecordsPage() {
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const uploadRequested = searchParams.get('upload') === '1'
  const initialTab: RecordsTab =
    requestedTab === 'records' || requestedTab === 'vitals' || requestedTab === 'labs' ? requestedTab : 'labs'
  const [tab, setTab] = useState<RecordsTab>(initialTab)
  const [members, setMembers] = useState<MemberDto[]>([])
  const [memberId, setMemberId] = useState('')
  const [myMemberId, setMyMemberId] = useState('')
  const [isHead, setIsHead] = useState(false)
  const [records, setRecords] = useState<HealthRecordDto[]>([])
  const [reports, setReports] = useState<LabReportDto[]>([])
  const [vitals, setVitals] = useState<VitalDto[]>([])
  const [trends, setTrends] = useState<VitalTrendDto[]>([])
  const [originalReport, setOriginalReport] = useState<LabReportDto | null>(null)
  const [selectedReport, setSelectedReport] = useState<LabReportDetailDto | null>(null)
  const [editingRecord, setEditingRecord] = useState<HealthRecordDto | null>(null)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(uploadRequested)
  const [assignedDoctor, setAssignedDoctor] = useState<DoctorSummaryDto | null>(null)
  const [availableDoctors, setAvailableDoctors] = useState<DoctorSummaryDto[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [hasLoaded, setHasLoaded] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [sort, setSort] = useState<'date-desc' | 'date-asc'>('date-desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const activeMemberId = useRef('')
  const activeReportId = useRef('')
  const loadSequence = useRef(0)
  const bootstrapSequence = useRef(0)

  const loadWorkspace = useCallback(async () => {
    const request = ++bootstrapSequence.current
    setStatus('loading')
    try {
      const [family, mine] = await Promise.all([
        apiClient.get<FamilyDto>('/families/me'),
        apiClient.get<MemberDto>('/members/me'),
      ])
      if (bootstrapSequence.current !== request) return
      const head = mine.data.role === 'Head'
      activeMemberId.current = mine.data.id
      setMembers(
        family.data.members.filter((item) => item.id === mine.data.id || item.role === 'MinorMember' || head),
      )
      setMemberId(mine.data.id)
      setMyMemberId(mine.data.id)
      setIsHead(head)

      try {
        const [docRes, dirRes] = await Promise.all([
          apiClient.get<DoctorSummaryDto | null>(`/families/${family.data.id}/doctor`).catch(() => ({ data: null })),
          apiClient.get<DoctorSummaryDto[]>('/doctors/directory').catch(() => ({ data: [] })),
        ])
        if (bootstrapSequence.current === request) {
          setAssignedDoctor(docRes?.data ?? null)
          setAvailableDoctors(Array.isArray(dirRes?.data) ? dirRes.data : [])
        }
      } catch {
        // Doctor directory loading is non-blocking
      }
    } catch {
      if (bootstrapSequence.current === request) setStatus('error')
    }
  }, [])

  useEffect(() => {
    void loadWorkspace()
    return () => {
      bootstrapSequence.current += 1
    }
  }, [loadWorkspace])

  useEffect(() => {
    const nextTab = requestedTab
    if (nextTab === 'records' || nextTab === 'vitals' || nextTab === 'labs') setTab(nextTab)
    if (uploadRequested) {
      setTab('labs')
      setShowUploadForm(true)
    }
  }, [requestedTab, uploadRequested])

  const selectedMember = members.find((member) => member.id === memberId)
  const isOwnProfile = memberId !== '' && memberId === myMemberId
  const isSharedView = !!selectedMember && !isOwnProfile && selectedMember.role !== 'MinorMember'
  const activeTab = isSharedView && tab === 'vitals' ? 'records' : tab

  const loadRecords = useCallback(async () => {
    if (!memberId) return
    const request = ++loadSequence.current
    const targetMemberId = memberId
    setStatus('loading')
    try {
      const params = {
        page,
        pageSize: 20,
        search: search || undefined,
        type: filter === 'ALL' ? undefined : filter,
        sort: sort === 'date-desc' ? 'newest' : 'oldest',
      }
      const [recordResponse, reportResponse] = await Promise.all([
        apiClient.get<PagedResult<HealthRecordDto>>(`/members/${targetMemberId}/records`, { params }),
        apiClient.get<LabReportDto[]>(`/members/${targetMemberId}/lab-reports`),
      ])
      const [vitalResponse, trendResponse] = isSharedView
        ? [{ data: [] as VitalDto[] }, { data: [] as VitalTrendDto[] }]
        : await Promise.all([
            apiClient.get<VitalDto[]>(`/members/${targetMemberId}/vitals`),
            apiClient.get<VitalTrendDto[]>(`/members/${targetMemberId}/vitals/trends`),
          ])
      if (loadSequence.current !== request || activeMemberId.current !== targetMemberId) return
      setRecords(recordResponse.data.items)
      setReports(reportResponse.data)
      setVitals(vitalResponse.data)
      setTrends(trendResponse.data)
      setTotalPages(Math.max(1, recordResponse.data.totalPages))
      setHasLoaded(true)
      setStatus('ready')
    } catch {
      if (loadSequence.current === request && activeMemberId.current === targetMemberId) setStatus('error')
    }
  }, [filter, isSharedView, memberId, page, search, sort])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  function selectProfile(nextMemberId: string) {
    activeMemberId.current = nextMemberId
    loadSequence.current += 1
    setMemberId(nextMemberId)
    setHasLoaded(false)
    setRecords([])
    setReports([])
    setVitals([])
    setTrends([])
    setOriginalReport(null)
    setSelectedReport(null)
    activeReportId.current = ''
    setEditingRecord(null)
    setShowRecordForm(false)
    setShowUploadForm(false)
    setPage(1)
    setMessage('')
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetMemberId = memberId
    const formElement = event.currentTarget
    const form = new FormData(formElement)

    const recordType = String(form.get('recordType') ?? 'Condition')
    const title = String(form.get('title') ?? '')
    const occurredOn = String(form.get('occurredOn') ?? '')
    const status = String(form.get('status') ?? '').trim()
    const severity = String(form.get('severity') ?? '').trim()
    const doctor = String(form.get('doctor') ?? '').trim()
    const rawSummary = String(form.get('summary') ?? '').trim()
    const attachment = (formElement.elements.namedItem('attachment') as HTMLInputElement | null)?.files?.[0]

    const summary = formatRecordSummary({ status, severity, doctor, cleanSummary: rawSummary })

    const payload = {
      recordType,
      title,
      summary,
      occurredOn,
    }
    try {
      if (editingRecord) await apiClient.put(`/records/${editingRecord.id}`, payload)
      else await apiClient.post(`/members/${memberId}/records`, payload)

      // The record is already saved here, so a failed upload is reported, never hidden.
      let attachmentFailed = false
      if (attachment instanceof File && attachment.size > 0) {
        const uploadForm = new FormData()
        uploadForm.append('file', attachment)
        uploadForm.append('collectedAt', new Date(occurredOn || Date.now()).toISOString())
        try {
          await apiClient.post(`/members/${targetMemberId}/lab-reports`, uploadForm, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch {
          attachmentFailed = true
        }
      }

      if (activeMemberId.current !== targetMemberId) return
      formElement.reset()
      setEditingRecord(null)
      setShowRecordForm(false)
      const saved = editingRecord ? 'Health record updated.' : 'Health record added.'
      setMessage(
        attachmentFailed
          ? `${saved} The attached report could not be uploaded — add it from the Lab reports tab (PNG, JPEG or PDF, up to 10 MB).`
          : saved,
      )
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId)
        setMessage('Health record could not be saved. Check the fields and retry.')
    }
  }

  async function deleteRecord(recordId: string) {
    if (!window.confirm('Delete this health record?')) return
    const targetMemberId = memberId
    try {
      await apiClient.delete(`/records/${recordId}`)
      if (activeMemberId.current !== targetMemberId) return
      if (editingRecord?.id === recordId) {
        setEditingRecord(null)
        setShowRecordForm(false)
      }
      setMessage('Health record deleted.')
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId) setMessage('Health record could not be deleted. Retry.')
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetMemberId = memberId
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const file = form.get('file')
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      !['image/png', 'image/jpeg', 'application/pdf'].includes(file.type) ||
      file.size > 10_485_760
    ) {
      setMessage('Choose a PNG, JPEG or PDF report up to 10 MB.')
      return
    }
    try {
      const { data } = await apiClient.post<LabReportDto>(`/members/${memberId}/lab-reports`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await apiClient.post(`/lab-reports/${data.id}/extract`).catch(() => undefined)
      if (activeMemberId.current !== targetMemberId) return
      formElement.reset()
      setShowUploadForm(false)
      setMessage('Report uploaded. Extraction is in progress; check the values when they are ready.')
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId)
        setMessage('Report upload failed. Verify the PNG, JPEG or PDF file and 10 MB limit.')
    }
  }

  async function toggleRecordSharing(record: HealthRecordDto) {
    const targetMemberId = memberId
    try {
      await apiClient.patch(`/records/${record.id}/sharing`, {
        sharedWithFamilyHead: !record.sharedWithFamilyHead,
      })
      if (activeMemberId.current !== targetMemberId) return
      setMessage(
        record.sharedWithFamilyHead
          ? 'Record is now private from the Family Head.'
          : 'Record is now shared with the Family Head.',
      )
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId) setMessage('Sharing could not be changed. Retry.')
    }
  }

  async function toggleReportSharing(report: LabReportDto) {
    const targetMemberId = memberId
    try {
      await apiClient.patch(`/lab-reports/${report.id}/sharing`, {
        sharedWithFamilyHead: !report.sharedWithFamilyHead,
      })
      if (activeMemberId.current !== targetMemberId) return
      setMessage(
        report.sharedWithFamilyHead
          ? 'Report is now private from the Family Head.'
          : 'Report is now shared with the Family Head.',
      )
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId) setMessage('Sharing could not be changed. Retry.')
    }
  }

  async function openReport(reportId: string) {
    const targetMemberId = memberId
    activeReportId.current = reportId
    try {
      const { data } = await apiClient.get<LabReportDetailDto>(`/lab-reports/${reportId}`)
      if (activeMemberId.current !== targetMemberId || activeReportId.current !== reportId) return
      setSelectedReport(data)
      setMessage('Compare extracted values with the original report before confirming them.')
    } catch {
      if (activeMemberId.current === targetMemberId && activeReportId.current === reportId)
        setMessage('Extracted report details could not be loaded.')
    }
  }

  async function confirmReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedReport) return
    const targetMemberId = memberId
    const targetReportId = selectedReport.id
    const form = new FormData(event.currentTarget)
    const values = selectedReport.values.map((value) => ({
      id: value.id,
      analyte: String(form.get(`analyte-${value.id}`) ?? ''),
      value: Number(form.get(`value-${value.id}`)),
      unit: String(form.get(`unit-${value.id}`) ?? ''),
      referenceLow: form.get(`low-${value.id}`) === '' ? null : Number(form.get(`low-${value.id}`)),
      referenceHigh: form.get(`high-${value.id}`) === '' ? null : Number(form.get(`high-${value.id}`)),
    }))
    const confirmedFlagIds = selectedReport.flags
      .filter((flag) => form.get(`flag-${flag.id}`) === 'on')
      .map((flag) => flag.id)
    try {
      const { data } = await apiClient.put<LabReportDetailDto>(`/lab-reports/${selectedReport.id}/review`, {
        values,
        confirmedFlagIds,
      })
      if (
        activeMemberId.current !== targetMemberId ||
        activeReportId.current !== targetReportId ||
        data.memberId !== targetMemberId
      )
        return
      setSelectedReport(data)
      setMessage('Confirmed values saved. Range status uses only the printed reference range.')
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId && activeReportId.current === targetReportId)
        setMessage('Confirmed values could not be saved. Retry.')
    }
  }

  async function addVital(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetMemberId = memberId
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await apiClient.post(`/members/${memberId}/vitals`, {
        vitalType: String(form.get('vitalType') ?? ''),
        value: Number(form.get('value')),
        unit: String(form.get('unit') ?? ''),
        measuredAt: new Date(String(form.get('measuredAt'))).toISOString(),
      })
      if (activeMemberId.current !== targetMemberId) return
      formElement.reset()
      setMessage('Vital recorded.')
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId)
        setMessage('Vital could not be saved. Check the fields and retry.')
    }
  }

  const rangeValueCount = reports.reduce((total, report) => {
    const summary = report.rangeSummary
    return total + (summary ? summary.belowRange + summary.withinRange + summary.aboveRange : 0)
  }, 0)

  return (
    <div className="page-stack care-workspace">
      <header className="care-header">
        <div>
          <p className="care-eyebrow">{isHead ? 'Family health records' : 'Your health records'}</p>
          <h1>Health Records</h1>
          <p className="care-muted">
            Upload a report, check its values, and keep your health history together.
          </p>
          <p className="care-caption">
            <Link to="/family-risk">Family history screening</Link>
          </p>
        </div>
        {!isSharedView && (
          <div className="care-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setTab('records')
                setShowRecordForm(true)
              }}
            >
              Add record
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                setTab('labs')
                setShowUploadForm(true)
              }}
            >
              Upload report
            </button>
          </div>
        )}
      </header>

      <section className="care-panel">
        <label className="field">
          <span>Active profile</span>
          <select value={memberId} onChange={(event) => selectProfile(event.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
                {member.role === 'Head' ? ' (Head)' : member.role === 'MinorMember' ? ' (Minor)' : ''}
              </option>
            ))}
          </select>
        </label>
        {isSharedView && (
          <p className="care-note" role="note">
            Showing only items {selectedMember?.displayName} chose to share. Vitals and unshared items remain
            private.
          </p>
        )}
      </section>
      {message && (
        <div className="banner banner--info" role="status">
          <span>{message}</span>
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => setMessage('')}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="care-metrics" aria-label="Records summary">
        <article className="care-metric">
          <span>Lab reports</span>
          <strong>{reports.length}</strong>
          <small>Authorized reports</small>
        </article>
        <article className="care-metric">
          <span>Recorded values</span>
          <strong>{rangeValueCount}</strong>
          <small>With a printed range</small>
        </article>
        <article className="care-metric">
          <span>Manual records</span>
          <strong>{records.length}</strong>
          <small>Current profile</small>
        </article>
        <article className="care-metric">
          <span>Clinical Status</span>
          <strong>Active</strong>
          <small>{isHead ? 'Multi-generational consent active' : 'Individual patient scope active'}</small>
        </article>
      </div>
      <div className="care-actions" role="tablist" aria-label="Health record views">
        {(
          [
            ['labs', 'Labs'],
            ['records', 'Records'],
            ['vitals', 'Vitals'],
          ] as const
        )
          .filter(([id]) => !(isSharedView && id === 'vitals'))
          .map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={activeTab === id ? 'button button--primary' : 'button button--secondary'}
              onClick={() => {
                setTab(id)
                setEditingRecord(null)
                setShowRecordForm(false)
              }}
            >
              {label}
            </button>
          ))}
      </div>

      {status === 'loading' && !hasLoaded ? (
        <LoadingState label="Loading health records" />
      ) : status === 'error' && !hasLoaded ? (
        <ErrorState
          message="Records could not be loaded for this profile."
          onRetry={() => void (memberId ? loadRecords() : loadWorkspace())}
        />
      ) : (
        <>
          {status === 'error' && (
            <div className="care-note" role="alert">
              Records could not be refreshed.{' '}
              <button
                type="button"
                className="button button--secondary button--sm"
                onClick={() => void loadRecords()}
              >
                Try again
              </button>
            </div>
          )}
          {activeTab === 'labs' && (
            <section className="care-split">
              <div className="care-panel care-report-list">
                <div className="care-panel-heading">
                  <div>
                    <p className="care-eyebrow">Reports</p>
                    <h2>Lab reports</h2>
                  </div>
                  {!isSharedView && (
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => setShowUploadForm((open) => !open)}
                    >
                      {showUploadForm ? 'Close upload' : 'Upload report'}
                    </button>
                  )}
                </div>
                {showUploadForm && (
                  <form className="care-form" onSubmit={(event) => void upload(event)}>
                    <label className="field">
                      <span>Report file (PNG, JPEG or PDF)</span>
                      <input name="file" type="file" accept="image/png,image/jpeg,application/pdf" required />
                    </label>
                    <label className="field">
                      <span>Collected at (optional)</span>
                      <input name="collectedAt" type="datetime-local" />
                    </label>
                    <div className="care-actions">
                      <button type="submit" className="button button--primary">
                        Upload report
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setShowUploadForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="care-caption">PNG, JPEG or PDF only, up to 10 MB.</p>
                  </form>
                )}
                {reports.length === 0 ? (
                  <div className="care-empty">
                    <EmptyState
                      title="No lab reports"
                      message={
                        isSharedView
                          ? 'No reports have been shared with you.'
                          : 'Upload a PNG, JPEG or PDF lab report to start extraction.'
                      }
                    />
                  </div>
                ) : (
                  <div className="report-grid">
                    {reports.map((report) => (
                      <ReportLibraryCard
                        key={report.id}
                        report={report}
                        ownerName={
                          members.find((member) => member.id === report.memberId)?.displayName ?? 'Member'
                        }
                        canChangeSharing={isOwnProfile}
                        onToggleSharing={(item) => void toggleReportSharing(item)}
                        onViewOriginal={(item) => setOriginalReport(item)}
                        onReview={isSharedView ? undefined : (item) => void openReport(item.id)}
                        reviewLabel={reportStep(report, selectedReport)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <section className="care-panel care-detail" aria-live="polite">
                {originalReport?.memberId === memberId && (
                  <div className="care-panel">
                    <OriginalReportPreview key={originalReport.id} reportId={originalReport.id} originalFileName={originalReport.originalFileName} hasOriginalFile={originalReport.hasOriginalFile === true} />
                    <button type="button" className="button button--secondary" onClick={() => setOriginalReport(null)}>Close original image</button>
                  </div>
                )}
                {selectedReport?.memberId !== memberId ? (
                  <div className="care-selection-card care-selection-card--placeholder">
                    <div className="care-placeholder-hero">
                      <div className="care-placeholder-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="care-placeholder-icon">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span>{isSharedView ? 'SHARED CLINICAL VAULT' : 'LAB EXTRACTION STUDIO'}</span>
                      </div>
                      <p className="care-eyebrow">
                        {isSharedView ? 'Shared report library' : 'Choose a report'}
                      </p>
                      <h2>{isSharedView ? 'Shared reports' : 'Check extracted values'}</h2>
                      <p className="care-muted">
                        {isSharedView
                          ? 'View the original image of reports shared with you.'
                          : 'Select a report to compare extracted values with its original image.'}
                      </p>
                    </div>

                    <div className="care-workflow-steps">
                      <div className="care-workflow-step">
                        <span className="step-num">1</span>
                        <div>
                          <strong>Select or Upload</strong>
                          <p>Choose an authorized report or upload a new PNG, JPEG, or PDF lab document.</p>
                        </div>
                      </div>
                      <div className="care-workflow-step">
                        <span className="step-num">2</span>
                        <div>
                          <strong>Verify Extracted Analytes</strong>
                          <p>Side-by-side verification of test values against reference ranges from the original lab slip.</p>
                        </div>
                      </div>
                      <div className="care-workflow-step">
                        <span className="step-num">3</span>
                        <div>
                          <strong>Confirm & Track</strong>
                          <p>Confirmed records populate your unified family health timeline with tamper-evident audit protection.</p>
                        </div>
                      </div>
                    </div>

                    <div className="care-placeholder-footer">
                      <div className="care-safety-tip">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span>Safety Notice: Extracted lab values reflect recorded laboratory parameters and are for patient-doctor review, not automated diagnosis.</span>
                      </div>
                      {!isSharedView && (
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => setShowUploadForm(true)}
                        >
                          Upload New Report
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <ReportDetail
                    key={selectedReport.id}
                    report={selectedReport}
                    hasOriginalFile={reports.find((report) => report.id === selectedReport.id)?.hasOriginalFile === true}
                    onSubmit={confirmReport}
                  />
                )}
              </section>
            </section>
          )}
          {activeTab === 'records' && (
            <RecordsPanel
              records={records}
              totalPages={totalPages}
              page={page}
              isSharedView={isSharedView}
              isOwnProfile={isOwnProfile}
              showForm={showRecordForm}
              editingRecord={editingRecord}
              assignedDoctor={assignedDoctor}
              availableDoctors={availableDoctors}
              search={search}
              filter={filter}
              sort={sort}
              onShowForm={() => {
                setEditingRecord(null)
                setShowRecordForm(true)
              }}
              onCloseForm={() => {
                setEditingRecord(null)
                setShowRecordForm(false)
              }}
              onEdit={(record) => {
                setEditingRecord(record)
                setShowRecordForm(true)
              }}
              onSave={saveRecord}
              onDelete={deleteRecord}
              onToggleSharing={toggleRecordSharing}
              onSearch={(value) => {
                setSearch(value)
                setPage(1)
              }}
              onFilter={(value) => {
                setFilter(value)
                setPage(1)
              }}
              onSort={setSort}
              onPage={setPage}
            />
          )}
          {activeTab === 'vitals' && !isSharedView && (
            <VitalsPanel vitals={vitals} trends={trends} onSubmit={addVital} />
          )}
        </>
      )}
    </div>
  )
}

function ReportDetail({
  report,
  hasOriginalFile,
  onSubmit,
}: {
  report: LabReportDetailDto
  hasOriginalFile: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const confirmed = report.values.filter((value) => value.wasManuallyConfirmed).length
  return (
    <>
      <div className="care-panel-heading">
        <div>
          <p className="care-eyebrow">Report detail</p>
          <h2>{report.originalFileName}</h2>
          <p className="care-caption">
            {report.collectedAt
              ? new Date(report.collectedAt).toLocaleDateString()
              : 'Collected date not recorded'}
          </p>
        </div>
        <StatusBadge status={report.ocrStatus} />
      </div>
      <OriginalReportPreview reportId={report.id} originalFileName={report.originalFileName} hasOriginalFile={hasOriginalFile} />
      <ol className="care-steps">
        <li className="care-step--complete">Uploaded</li>
        <li className={report.ocrStatus === 'Completed' ? 'care-step--complete' : ''}>Extracted</li>
        <li
          className={
            confirmed === report.values.length && report.values.length > 0 ? 'care-step--complete' : ''
          }
        >
          Values confirmed
        </li>
      </ol>
      <p className="care-note">
        Extraction reads reported values. Compare each item with the original image before confirming it.
        Range status uses the printed reference range only.
      </p>
      <form className="care-form" onSubmit={(event) => void onSubmit(event)}>
        {report.values.some((value) => value.wasManuallyConfirmed) && (
          <section className="care-range-overview" aria-label="Confirmed report values">
            <div className="care-range-grid">
              {report.values.map((value) => (
                <RecordedRangeVisual key={value.id} value={value} />
              ))}
            </div>
            <p className="care-caption">
              Reference intervals alone do not determine your health. These are recorded values, not a
              diagnosis.
            </p>
          </section>
        )}
        {report.values.length === 0 ? (
          <div className="care-empty">
            <p>No values are available to check yet.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Analyte</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Low</th>
                  <th>High</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {report.values.map((value) => (
                  <tr key={value.id}>
                    <td>
                      <input
                        name={`analyte-${value.id}`}
                        defaultValue={value.analyte}
                        required
                        maxLength={120}
                      />
                    </td>
                    <td>
                      <input
                        name={`value-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.value}
                        required
                      />
                      {recordedRangeMarker(value)}
                    </td>
                    <td>
                      <input name={`unit-${value.id}`} defaultValue={value.unit} required maxLength={32} />
                    </td>
                    <td>
                      <input
                        name={`low-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.referenceLow ?? ''}
                      />
                    </td>
                    <td>
                      <input
                        name={`high-${value.id}`}
                        type="number"
                        step="any"
                        defaultValue={value.referenceHigh ?? ''}
                      />
                    </td>
                    <td>
                      <StatusBadge status={value.wasManuallyConfirmed ? 'CONFIRMED' : 'REVIEW_REQUIRED'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h3>Potential hereditary screening flags</h3>
        {report.flags.length === 0 ? (
          <p className="care-muted">No flags were extracted.</p>
        ) : (
          report.flags.map((flag) => (
            <label key={flag.id} className="field">
              <span>
                <input name={`flag-${flag.id}`} type="checkbox" defaultChecked={flag.manuallyConfirmed} />{' '}
                Confirm {flag.conditionCode}: {flag.finding}
              </span>
              <span className={`status-badge status-badge--${flag.confidence < 0.6 ? 'warning' : 'muted'}`}>
                Extraction confidence {Math.round(flag.confidence * 100)}%
              </span>
            </label>
          ))
        )}
        {report.values.length > 0 && (
          <button className="button button--primary" type="submit">
            Confirm values
          </button>
        )}
      </form>
    </>
  )
}

type RecordsPanelProps = {
  records: HealthRecordDto[]
  totalPages: number
  page: number
  isSharedView: boolean
  isOwnProfile: boolean
  showForm: boolean
  editingRecord: HealthRecordDto | null
  assignedDoctor?: DoctorSummaryDto | null
  availableDoctors?: DoctorSummaryDto[]
  search: string
  filter: string
  sort: 'date-desc' | 'date-asc'
  onShowForm: () => void
  onCloseForm: () => void
  onEdit: (record: HealthRecordDto) => void
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggleSharing: (record: HealthRecordDto) => Promise<void>
  onSearch: (value: string) => void
  onFilter: (value: string) => void
  onSort: (value: 'date-desc' | 'date-asc') => void
  onPage: (page: number) => void
}
/** Keeps a value saved by an older form version selectable instead of silently dropping it on edit. */
function withSavedValue(options: readonly string[], saved: string): string[] {
  return saved && !options.includes(saved) ? [...options, saved] : [...options]
}

function RecordsPanel(props: RecordsPanelProps) {
  const [attachmentName, setAttachmentName] = useState('')
  const parsedMeta = parseRecordSummary(props.editingRecord?.summary)
  const otherDoctors = (props.availableDoctors ?? []).filter(
    (doc) => doc.id !== props.assignedDoctor?.id,
  )
  const knownDoctorNames = new Set<string>()
  if (props.assignedDoctor?.displayName) knownDoctorNames.add(props.assignedDoctor.displayName)
  for (const doc of otherDoctors) {
    if (doc.displayName) knownDoctorNames.add(doc.displayName)
  }

  return (
    <section className="care-panel">
      <div className="care-panel-heading">
        <div>
          <p className="care-eyebrow">Manual records</p>
          <h2>Health records</h2>
        </div>
        {!props.isSharedView && (
          <button type="button" className="button button--primary" onClick={props.onShowForm}>
            Add record
          </button>
        )}
      </div>
      {props.showForm && !props.isSharedView && (
        <form
          className="care-form"
          key={props.editingRecord?.id ?? 'new-record'}
          onSubmit={(event) => void props.onSave(event)}
        >
          <h3>{props.editingRecord ? `Edit ${props.editingRecord.title}` : 'Add health record'}</h3>

          <div className="care-field-grid">
            <label className="field">
              <span className="field-label-required">Type</span>
              <select name="recordType" defaultValue={props.editingRecord?.recordType ?? 'Condition'}>
                {['Condition', 'Allergy', 'Medication', 'Surgery', 'Note'].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label-required">Title</span>
              <input
                name="title"
                defaultValue={props.editingRecord?.title ?? ''}
                placeholder="Asthma"
                required
                minLength={2}
                maxLength={160}
              />
            </label>
          </div>

          <div className="care-field-grid">
            <label className="field">
              <span className="field-label-required">Date</span>
              <input
                name="occurredOn"
                type="date"
                defaultValue={props.editingRecord?.occurredOn ?? todayLocalDate()}
                required
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select name="status" defaultValue={parsedMeta.status}>
                <option value="">Not specified</option>
                {withSavedValue(RECORD_STATUSES, parsedMeta.status).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="care-field-grid">
            <label className="field">
              <span>Severity</span>
              <select name="severity" defaultValue={parsedMeta.severity}>
                <option value="">Not specified</option>
                {withSavedValue(RECORD_SEVERITIES, parsedMeta.severity).map((sev) => (
                  <option key={sev}>{sev}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Doctor / Healthcare Provider</span>
              <select
                name="doctor"
                aria-label="Doctor / Healthcare Provider"
                defaultValue={parsedMeta.doctor}
              >
                <option value="">None / Not specified</option>
                {props.assignedDoctor && (
                  <optgroup label="Assigned Doctor">
                    <option value={props.assignedDoctor.displayName}>
                      {props.assignedDoctor.displayName}
                      {props.assignedDoctor.specialty ? ` (${props.assignedDoctor.specialty})` : ''}
                    </option>
                  </optgroup>
                )}
                {otherDoctors.length > 0 && (
                  <optgroup label={props.assignedDoctor ? 'Other Available Doctors' : 'Available Doctors'}>
                    {otherDoctors.map((doc) => (
                      <option key={doc.id} value={doc.displayName}>
                        {doc.displayName}
                        {doc.specialty ? ` (${doc.specialty})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {parsedMeta.doctor && !knownDoctorNames.has(parsedMeta.doctor) && (
                  <optgroup label="Preserved Provider">
                    <option value={parsedMeta.doctor}>{parsedMeta.doctor}</option>
                  </optgroup>
                )}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Summary</span>
            <textarea
              name="summary"
              defaultValue={parsedMeta.cleanSummary}
              placeholder="Patient has a history of asthma..."
              maxLength={2000}
              rows={3}
            />
          </label>

          <label className="field">
            <span>Attachment</span>
            <div className="care-attachment-box" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="file"
                name="attachment"
                id="record-attachment"
                accept=".pdf,image/png,image/jpeg"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setAttachmentName(f ? f.name : '')
                }}
              />
              <label
                htmlFor="record-attachment"
                className="button button--secondary"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>📎</span>
                <span>{attachmentName ? 'Change report' : 'Upload medical report'}</span>
              </label>
              {attachmentName && (
                <span className="care-caption" style={{ fontWeight: 500 }}>
                  {attachmentName}
                </span>
              )}
            </div>
          </label>

          <div className="care-actions">
            <button type="submit" className="button button--primary">
              {props.editingRecord ? 'Update record' : 'Save record'}
            </button>
            <button type="button" className="button button--secondary" onClick={props.onCloseForm}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="care-actions">
        <label className="field">
          <span>Search records</span>
          <input
            type="search"
            value={props.search}
            onChange={(event) => props.onSearch(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Record type</span>
          <select value={props.filter} onChange={(event) => props.onFilter(event.target.value)}>
            <option value="ALL">All</option>
            {['Condition', 'Allergy', 'Medication', 'Surgery', 'Note'].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Sort by</span>
          <select
            value={props.sort}
            onChange={(event) => props.onSort(event.target.value as 'date-desc' | 'date-asc')}
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
          </select>
        </label>
      </div>
      {props.records.length === 0 ? (
        <div className="care-empty">
          <EmptyState title="No matching records" message="Add a record or change the search and filters." />
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                <th>Summary</th>
                {!props.isSharedView && <th>Actions</th>}
                {props.isOwnProfile && <th>Family Head</th>}
              </tr>
            </thead>
            <tbody>
              {props.records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.title}</strong>
                  </td>
                  <td>
                    <span className="status-badge">{record.recordType}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{record.occurredOn}</td>
                  <td>
                    <RecordSummaryText summary={record.summary} emptyLabel="No summary recorded" />
                  </td>
                  {!props.isSharedView && (
                    <td className="care-actions">
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        onClick={() => props.onEdit(record)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button--danger button--sm"
                        onClick={() => void props.onDelete(record.id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                  {props.isOwnProfile && (
                    <td>
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        aria-pressed={record.sharedWithFamilyHead === true}
                        onClick={() => void props.onToggleSharing(record)}
                      >
                        {record.sharedWithFamilyHead ? 'Shared · make private' : 'Private · share'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {props.totalPages > 1 && (
        <div className="care-actions">
          <button
            type="button"
            className="button button--secondary"
            disabled={props.page === 1}
            onClick={() => props.onPage(props.page - 1)}
          >
            Previous
          </button>
          <span className="care-caption">
            Page {props.page} of {props.totalPages}
          </span>
          <button
            type="button"
            className="button button--secondary"
            disabled={props.page === props.totalPages}
            onClick={() => props.onPage(props.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  )
}

const PRESET_VITALS = [
  { type: 'Heart Rate', unit: 'bpm', icon: '❤️' },
  { type: 'Blood Pressure', unit: 'mmHg', icon: '🩺' },
  { type: 'Blood Glucose', unit: 'mg/dL', icon: '🩸' },
  { type: 'Body Temperature', unit: '°C', icon: '🌡️' },
  { type: 'Oxygen (SpO2)', unit: '%', icon: '🫁' },
  { type: 'Body Weight', unit: 'kg', icon: '⚖️' },
] as const

function VitalsPanel({
  vitals,
  trends,
  onSubmit,
}: {
  vitals: VitalDto[]
  trends: VitalTrendDto[]
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const [selectedType, setSelectedType] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')

  const applyPreset = (preset: (typeof PRESET_VITALS)[number]) => {
    setSelectedType(preset.type)
    setSelectedUnit(preset.unit)
  }

  return (
    <div className="care-split vitals-split">
      {/* Left Column: Log Measurement Form */}
      <section className="care-panel vitals-form-panel">
        <div className="care-panel-heading">
          <div>
            <p className="care-eyebrow">Manual readings</p>
            <h2>Log New Vital</h2>
            <p className="care-muted">Record blood pressure, heart rate, blood glucose or other body metrics.</p>
          </div>
          <div className="vitals-header-icon" title="Vital Signs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="vital-presets">
          <span className="vital-presets__label">Quick Presets:</span>
          <div className="vital-presets__list">
            {PRESET_VITALS.map((preset) => (
              <button
                key={preset.type}
                type="button"
                className={`vital-preset-chip ${selectedType === preset.type ? 'is-active' : ''}`}
                onClick={() => applyPreset(preset)}
              >
                <span>{preset.icon}</span>
                <span>{preset.type}</span>
              </button>
            ))}
          </div>
        </div>

        <form className="care-form" onSubmit={(event) => void onSubmit(event)}>
          <div className="care-field-grid">
            <label className="field">
              <span>Type</span>
              <input
                name="vitalType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                placeholder="e.g. Heart Rate"
                required
                maxLength={64}
              />
            </label>
            <label className="field">
              <span>Unit</span>
              <input
                name="unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                placeholder="e.g. bpm, mmHg, mg/dL"
                required
                maxLength={32}
              />
            </label>
          </div>

          <div className="care-field-grid">
            <label className="field">
              <span>Value</span>
              <input
                name="value"
                type="number"
                step="any"
                placeholder="e.g. 72"
                required
              />
            </label>
            <label className="field">
              <span>Measured at</span>
              <input
                name="measuredAt"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
                required
              />
            </label>
          </div>

          <div className="care-actions" style={{ marginTop: '8px' }}>
            <button className="button button--primary" type="submit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Save vital
            </button>
          </div>
        </form>
      </section>

      {/* Right Column: Vitals History & Trends */}
      <section className="care-panel vitals-history-panel">
        <div className="care-panel-heading">
          <div>
            <p className="care-eyebrow">Health Timeline</p>
            <h2>Recorded Vitals</h2>
          </div>
          <span className="vitals-count-badge">{vitals.length} recorded</span>
        </div>

        {vitals.length === 0 ? (
          <div className="care-empty vitals-empty-placeholder">
            <div className="vitals-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <EmptyState title="No vitals recorded" message="Add a reading to keep a dated record." />
          </div>
        ) : (
          <>
            <div className="table-scroll vitals-table-scroll">
              <table className="vitals-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Measurement</th>
                    <th>Measured Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((vital) => (
                    <tr key={vital.id}>
                      <td>
                        <div className="vital-type-cell">
                          <span className="vital-dot"></span>
                          <strong>{vital.vitalType}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="vital-value-pill">
                          {vital.value} <small>{vital.unit}</small>
                        </span>
                      </td>
                      <td className="vital-date-cell">
                        {new Date(vital.measuredAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {trends.length > 0 && (
              <div className="vitals-trends-section">
                <h3 className="trends-heading">Trend Progress</h3>
                <div className="vitals-trends-grid">
                  {trends.map((trend) => (
                    <article key={trend.vitalType} className="care-value-card vital-trend-card">
                      <div className="trend-header">
                        <h4>{trend.vitalType}</h4>
                        <span className="trend-points-count">{trend.points.length} readings</span>
                      </div>
                      <div className="trend-timeline">
                        {trend.points.map((point, i) => (
                          <span key={i} className="trend-step">
                            <strong>{point.value}</strong>
                            <small>{point.unit}</small>
                            {i < trend.points.length - 1 && <span className="trend-arrow">→</span>}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <p className="care-note vitals-safety-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>Recorded trends show values only and are not a clinical interpretation.</span>
        </p>
      </section>
    </div>
  )
}
