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
  const [selectedReport, setSelectedReport] = useState<LabReportDetailDto | null>(null)
  const [editingRecord, setEditingRecord] = useState<HealthRecordDto | null>(null)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(uploadRequested)
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
    const payload = {
      recordType: String(form.get('recordType') ?? ''),
      title: String(form.get('title') ?? ''),
      summary: String(form.get('summary') ?? ''),
      occurredOn: String(form.get('occurredOn') ?? ''),
    }
    try {
      if (editingRecord) await apiClient.put(`/records/${editingRecord.id}`, payload)
      else await apiClient.post(`/members/${memberId}/records`, payload)
      if (activeMemberId.current !== targetMemberId) return
      formElement.reset()
      setEditingRecord(null)
      setShowRecordForm(false)
      setMessage(editingRecord ? 'Health record updated.' : 'Health record added.')
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
      !['image/png', 'image/jpeg'].includes(file.type) ||
      file.size > 10_485_760
    ) {
      setMessage('Choose a PNG or JPEG image up to 10 MB.')
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
        setMessage('Report upload failed. Verify the PNG or JPEG image and 10 MB limit.')
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
                      <span>Report image (PNG or JPEG)</span>
                      <input name="file" type="file" accept="image/png,image/jpeg" required />
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
                    <p className="care-caption">PNG or JPEG only, up to 10 MB.</p>
                  </form>
                )}
                {reports.length === 0 ? (
                  <div className="care-empty">
                    <EmptyState
                      title="No lab reports"
                      message={
                        isSharedView
                          ? 'No reports have been shared with you.'
                          : 'Upload a PNG or JPEG lab report to start extraction.'
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
                        onReview={isSharedView ? undefined : (item) => void openReport(item.id)}
                        reviewLabel={reportStep(report, selectedReport)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <section className="care-panel care-detail" aria-live="polite">
                {!selectedReport ? (
                  <div className="care-selection-card">
                    <p className="care-eyebrow">
                      {isSharedView ? 'Shared report library' : 'Choose a report'}
                    </p>
                    <h2>{isSharedView ? 'Report summaries only' : 'Check extracted values'}</h2>
                    <p className="care-muted">
                      {isSharedView
                        ? 'Only the report summary shared with you is available here.'
                        : 'Select a report to compare extracted values with its original image.'}
                    </p>
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
function RecordsPanel(props: RecordsPanelProps) {
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
          <label className="field">
            <span>Type</span>
            <select name="recordType" defaultValue={props.editingRecord?.recordType ?? 'Note'}>
              {['Condition', 'Allergy', 'Medication', 'Surgery', 'Note'].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Title</span>
            <input
              name="title"
              defaultValue={props.editingRecord?.title ?? ''}
              required
              minLength={2}
              maxLength={160}
            />
          </label>
          <label className="field">
            <span>Date</span>
            <input
              name="occurredOn"
              type="date"
              defaultValue={props.editingRecord?.occurredOn ?? ''}
              required
            />
          </label>
          <label className="field">
            <span>Summary (optional)</span>
            <textarea
              name="summary"
              defaultValue={props.editingRecord?.summary ?? ''}
              maxLength={2000}
              rows={3}
            />
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
                <th>Date</th>
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
                  <td>{record.occurredOn}</td>
                  <td>{record.summary ?? 'No summary recorded'}</td>
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

function VitalsPanel({
  vitals,
  trends,
  onSubmit,
}: {
  vitals: VitalDto[]
  trends: VitalTrendDto[]
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  return (
    <section className="care-panel">
      <div className="care-panel-heading">
        <div>
          <p className="care-eyebrow">Manual readings</p>
          <h2>Vitals</h2>
        </div>
      </div>
      <form className="care-form" onSubmit={(event) => void onSubmit(event)}>
        <label className="field">
          <span>Type</span>
          <input name="vitalType" required maxLength={64} />
        </label>
        <label className="field">
          <span>Value</span>
          <input name="value" type="number" step="any" required />
        </label>
        <label className="field">
          <span>Unit</span>
          <input name="unit" required maxLength={32} />
        </label>
        <label className="field">
          <span>Measured at</span>
          <input name="measuredAt" type="datetime-local" required />
        </label>
        <button className="button button--primary" type="submit">
          Save vital
        </button>
      </form>
      {vitals.length === 0 ? (
        <div className="care-empty">
          <EmptyState title="No vitals recorded" message="Add a reading to keep a dated record." />
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Measured</th>
              </tr>
            </thead>
            <tbody>
              {vitals.map((vital) => (
                <tr key={vital.id}>
                  <td>
                    <strong>{vital.vitalType}</strong>
                  </td>
                  <td>
                    {vital.value} {vital.unit}
                  </td>
                  <td>{new Date(vital.measuredAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="care-note">Recorded trends show values only and are not a clinical interpretation.</p>
      {trends.map((trend) => (
        <article key={trend.vitalType} className="care-value-card">
          <h3>{trend.vitalType}</h3>
          <p>{trend.points.map((point) => `${point.value} ${point.unit}`).join(' → ')}</p>
        </article>
      ))}
    </section>
  )
}
