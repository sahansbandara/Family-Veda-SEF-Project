// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
import { extractionRefusalMessage } from './extractionRefusal'
import { waitForReading } from './pollReading'
import { type DragEvent, type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DeletedReports } from '../../components/records/DeletedReports'
import { RecordDialog } from './RecordDialog'
import { ReportLibrary } from '../../components/records/ReportLibrary'
import { ReportPreviewDialog } from '../../components/records/ReportPreviewDialog'
import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import {
  apiClient,
  type DoctorSummaryDto,
  type FamilyDto,
  type HealthRecordDto,
  type LabReportDetailDto,
  type LabReportDto,
  type MemberDto,
  type PagedResult,
  type RosterMemberDto,
  type VitalDto,
} from '../../services/apiClient'
import { ManualRecordsPanel, type QuickRecord } from './ManualRecordsPanel'
import { RecordIcon, type RecordIconName } from './recordIcons'
import { formatRecordSummary } from './recordSummaryMeta'
import { ReportReviewDialog } from '../../components/records/ReportReviewDialog'
import { type NewVital, VitalsPanel } from './VitalsPanel'


const RECORDS_PAGE_SIZE = 20

type RecordProfile = Pick<MemberDto, 'id' | 'role' | 'displayName'>

type RecordsTab = 'records' | 'vitals' | 'labs'
type LoadStatus = 'loading' | 'ready' | 'error'

function reportStep(report: LabReportDto, selected?: LabReportDetailDto | null) {
  const confirmed =
    selected?.id === report.id &&
    selected.values.length > 0 &&
    selected.values.every((value) => value.wasManuallyConfirmed)
  if (confirmed) return 'View confirmed values'
  if (report.ocrStatus === 'Completed') return 'Check values'
  if (report.ocrStatus === 'Failed') return 'See why'
  return report.ocrStatus === 'Pending' ? 'Read now' : 'View status'
}

export function RecordsPage() {
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const uploadRequested = searchParams.get('upload') === '1'
  const initialTab: RecordsTab =
    requestedTab === 'records' || requestedTab === 'vitals' || requestedTab === 'labs' ? requestedTab : 'labs'
  const [tab, setTab] = useState<RecordsTab>(initialTab)
  const [members, setMembers] = useState<RecordProfile[]>([])
  const [memberId, setMemberId] = useState('')
  const [myMemberId, setMyMemberId] = useState('')
  const [isHead, setIsHead] = useState(false)
  const [records, setRecords] = useState<HealthRecordDto[]>([])
  const [reports, setReports] = useState<LabReportDto[]>([])
  const [vitals, setVitals] = useState<VitalDto[]>([])
  const [originalReport, setOriginalReport] = useState<LabReportDto | null>(null)
  const [selectedReport, setSelectedReport] = useState<LabReportDetailDto | null>(null)
  const [reviewTarget, setReviewTarget] = useState<LabReportDto | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const reviewSequence = useRef(0)
  const [reportToDelete, setReportToDelete] = useState<LabReportDto | null>(null)
  const [deletingReport, setDeletingReport] = useState(false)
  const [trashVersion, setTrashVersion] = useState(0)
  const [editingRecord, setEditingRecord] = useState<HealthRecordDto | null>(null)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(uploadRequested)
  const [uploading, setUploading] = useState(false)
  const [uploadFileName, setUploadFileName] = useState('')
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
  const [totalCount, setTotalCount] = useState(0)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const activeMemberId = useRef('')
  const activeReportId = useRef('')
  const loadSequence = useRef(0)
  const loadRecordsRef = useRef<() => Promise<void>>(async () => {})
  const watchedReports = useRef(new Set<string>())
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
      // The clinical family DTO deliberately excludes other adults. Use the names-only roster
      // to offer their explicitly shared records without requesting DOB or private health data.
      let profiles: RecordProfile[] = family.data.members.filter((item) => item.id === mine.data.id || (head && item.role === 'MinorMember'))
      if (head) {
        try {
          const { data: roster } = await apiClient.get<RosterMemberDto[]>(`/families/${family.data.id}/roster`)
          profiles = roster.map((item) => ({ id: item.id, displayName: item.displayName, role: item.role }))
        } catch {
          // Existing authorised profiles remain usable when roster lookup is unavailable.
          profiles = family.data.members
        }
      }
      if (bootstrapSequence.current !== request) return
      setMembers(profiles)
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
        pageSize: RECORDS_PAGE_SIZE,
        search: search || undefined,
        type: filter === 'ALL' ? undefined : filter,
        sort: sort === 'date-desc' ? 'newest' : 'oldest',
      }
      const [recordResponse, reportResponse] = await Promise.all([
        apiClient.get<PagedResult<HealthRecordDto>>(`/members/${targetMemberId}/records`, { params }),
        apiClient.get<LabReportDto[]>(`/members/${targetMemberId}/lab-reports`),
      ])
      // Vitals are never shared across adults, so a shared view does not request them.
      const vitalResponse = isSharedView
        ? { data: [] as VitalDto[] }
        : await apiClient.get<VitalDto[]>(`/members/${targetMemberId}/vitals`)
      if (loadSequence.current !== request || activeMemberId.current !== targetMemberId) return
      setRecords(recordResponse.data.items)
      setReports(reportResponse.data)
      setVitals(vitalResponse.data)
      setTotalPages(Math.max(1, recordResponse.data.totalPages))
      setTotalCount(recordResponse.data.totalCount ?? recordResponse.data.items.length)
      setHasLoaded(true)
      setStatus('ready')
    } catch {
      if (loadSequence.current === request && activeMemberId.current === targetMemberId) setStatus('error')
    }
  }, [filter, isSharedView, memberId, page, search, sort])

  useEffect(() => {
    loadRecordsRef.current = loadRecords
    void loadRecords()
  }, [loadRecords])

  // The server reads reports in the background (POST /extract returns 202). Poll each queued report until it
  // leaves Processing, then refresh the library and, if it is open, the review. Never blocks the upload form.
  const watchReading = useCallback((reportId: string, targetMemberId: string) => {
    if (watchedReports.current.has(reportId)) return
    watchedReports.current.add(reportId)
    void waitForReading(
      async () => (await apiClient.get<LabReportDetailDto>(`/lab-reports/${reportId}`)).data,
      { isActive: () => activeMemberId.current === targetMemberId },
    ).then(async (done) => {
      watchedReports.current.delete(reportId)
      if (!done || activeMemberId.current !== targetMemberId || done.id !== reportId || done.memberId !== targetMemberId) return
      if (activeReportId.current === reportId) setSelectedReport(done)
      await loadRecordsRef.current()
    })
  }, [])
  // Reports still being read (e.g. uploaded before leaving the page) keep being watched when the library loads.
  useEffect(() => {
    if (isSharedView || !memberId) return
    for (const report of reports) if (report.ocrStatus === 'Processing') watchReading(report.id, memberId)
  }, [isSharedView, memberId, reports, watchReading])

  function selectProfile(nextMemberId: string) {
    activeMemberId.current = nextMemberId
    loadSequence.current += 1
    setMemberId(nextMemberId)
    setHasLoaded(false)
    setRecords([])
    setReports([])
    setVitals([])
    setTotalCount(0)
    setPendingFile(null)
    setOriginalReport(null)
    closeReview()
    setSelectedReport(null)
    activeReportId.current = ''
    setEditingRecord(null)
    setShowRecordForm(false)
    setShowUploadForm(false)
    setUploadFileName('')
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
    if (uploading) return
    const shareAfterUpload = isOwnProfile && form.get('visibility') === 'shared'
    form.delete('visibility')
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
    setUploading(true)
    try {
      const { data } = await apiClient.post<LabReportDto>(`/members/${memberId}/lab-reports`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      let sharingFailed = false
      if (shareAfterUpload) {
        try { await apiClient.patch(`/lab-reports/${data.id}/sharing`, { sharedWithFamilyHead: true }) }
        catch { sharingFailed = true }
      }
      let extractionStarted = true
      let extractionRefusal: string | null = null
      try {
        await apiClient.post(`/lab-reports/${data.id}/extract`)
        watchReading(data.id, targetMemberId)
      }
      catch (error) {
        extractionStarted = false
        extractionRefusal = extractionRefusalMessage(error)
      }
      if (activeMemberId.current !== targetMemberId) return
      formElement.reset()
      setShowUploadForm(false)
      setUploadFileName('')
      setMessage(`Report uploaded.${sharingFailed ? ' Could not confirm sharing. Check the visibility shown in the library before retrying.' : shareAfterUpload ? ' Shared with Family Head.' : ' Kept private.'} ${extractionStarted ? 'Reading the report in the background. You can upload more or leave this page; values appear when ready.' : extractionRefusal ?? 'Reading report values could not be started. Open View status to retry.'}`)
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId)
        setMessage('Report upload failed. Verify the PNG, JPEG or PDF file and 10 MB limit.')
    } finally { setUploading(false) }
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

  async function deleteReport(report: LabReportDto) {
    if (deletingReport) return
    const targetMemberId = memberId
    setDeletingReport(true)
    try {
      await apiClient.delete(`/lab-reports/${report.id}`)
      if (activeMemberId.current !== targetMemberId) return
      if (selectedReport?.id === report.id) setSelectedReport(null)
      setMessage(`${report.originalFileName} moved to Recently deleted. You can restore it from there.`)
      setTrashVersion((value) => value + 1)
      await loadRecords()
    } catch {
      if (activeMemberId.current === targetMemberId) setMessage('The report could not be deleted. Retry.')
    } finally {
      setDeletingReport(false)
      setReportToDelete(null)
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
    const target = reports.find((item) => item.id === reportId)
    if (!target) return
    const request = ++reviewSequence.current
    const targetMemberId = memberId
    activeReportId.current = reportId
    setReviewTarget(target)
    setReviewLoading(true)
    setReviewError('')
    setSelectedReport(null)
    try {
      const { data } = await apiClient.get<LabReportDetailDto>(`/lab-reports/${reportId}`)
      if (request !== reviewSequence.current || activeMemberId.current !== targetMemberId || activeReportId.current !== reportId) return
      if (data.memberId !== targetMemberId || data.id !== reportId) throw new Error('Report context changed')
      setSelectedReport(data)
    } catch {
      if (request === reviewSequence.current && activeMemberId.current === targetMemberId && activeReportId.current === reportId)
        setReviewError('Extracted report details could not be loaded.')
    } finally {
      if (request === reviewSequence.current) setReviewLoading(false)
    }
  }

  function closeReview() {
    reviewSequence.current += 1
    activeReportId.current = ''
    setReviewTarget(null)
    setReviewLoading(false)
    setReviewError('')
  }

  async function retryExtraction(): Promise<boolean> {
    if (!reviewTarget) return false
    const targetReportId = reviewTarget.id
    const targetMemberId = memberId
    const request = reviewSequence.current
    try {
      await apiClient.post(`/lab-reports/${targetReportId}/extract`)
      if (request !== reviewSequence.current || activeReportId.current !== targetReportId || activeMemberId.current !== targetMemberId) return false
      const { data } = await apiClient.get<LabReportDetailDto>(`/lab-reports/${targetReportId}`)
      if (request !== reviewSequence.current || activeReportId.current !== targetReportId || activeMemberId.current !== targetMemberId || data.id !== targetReportId || data.memberId !== targetMemberId) return false
      // Shows the "Reading the report text…" card; the watcher swaps in the result when the read finishes.
      setSelectedReport(data)
      if (data.ocrStatus === 'Processing') watchReading(targetReportId, targetMemberId)
      await loadRecords()
      return data.ocrStatus !== 'Failed'
    } catch { return false }
  }

  async function confirmReport(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault()
    if (!selectedReport) return false
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
        return false
      setSelectedReport(data)
      setMessage('Confirmed values saved. Range status uses only the printed reference range.')
      await loadRecords()
      return true
    } catch {
      return false
    }
  }

  async function quickAddRecord(record: QuickRecord): Promise<boolean> {
    const targetMemberId = memberId
    try {
      await apiClient.post(`/members/${targetMemberId}/records`, {
        ...record,
        summary: formatRecordSummary({ status: '', severity: '', doctor: '', cleanSummary: '' }),
      })
      if (activeMemberId.current !== targetMemberId) return false
      setMessage('Health record added.')
      await loadRecords()
      return true
    } catch {
      if (activeMemberId.current === targetMemberId)
        setMessage('Health record could not be saved. Check the fields and retry.')
      return false
    }
  }

  async function addVital(entries: NewVital[], measuredAt: string): Promise<boolean> {
    const targetMemberId = memberId
    try {
      // Blood pressure is two readings; they share one timestamp so they stay paired.
      for (const entry of entries)
        await apiClient.post(`/members/${targetMemberId}/vitals`, { ...entry, measuredAt })
      if (activeMemberId.current !== targetMemberId) return false
      setMessage('Vital recorded.')
      await loadRecords()
      return true
    } catch {
      if (activeMemberId.current === targetMemberId) {
        setMessage('Vital could not be saved. Check the value and time, then retry.')
        await loadRecords()
      }
      return false
    }
  }

  // A dropped file is handed to the upload form's own input, so the normal validation and submit path is used.
  useEffect(() => {
    if (!showUploadForm || !pendingFile || !fileInput.current || typeof DataTransfer === 'undefined') return
    const transfer = new DataTransfer()
    transfer.items.add(pendingFile)
    fileInput.current.files = transfer.files
    setUploadFileName(pendingFile.name)
    setPendingFile(null)
  }, [pendingFile, showUploadForm])

  function dropReport(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    setPendingFile(file)
    setShowUploadForm(true)
  }

  function chooseReportFile() {
    setShowUploadForm(true)
    requestAnimationFrame(() => fileInput.current?.click())
  }

  const rangeValueCount = reports.reduce((total, report) => {
    const summary = report.rangeSummary
    return total + (summary ? summary.belowRange + summary.withinRange + summary.aboveRange : 0)
  }, 0)
  const metrics: Array<{ tone: string; icon: RecordIconName; label: string; value: string | number; caption: string }> = [
    { tone: 'lab', icon: 'flask', label: 'Lab reports', value: reports.length, caption: 'Authorized reports' },
    { tone: 'values', icon: 'chart', label: 'Recorded values', value: rangeValueCount, caption: 'With a printed range' },
    { tone: 'manual', icon: 'file', label: 'Manual records', value: totalCount, caption: 'Current profile' },
    {
      tone: 'status', icon: 'shield', label: 'Clinical Status', value: 'Active',
      caption: isHead ? 'Multi-generational consent active' : 'Individual patient scope active',
    },
  ]

  return (
    <div className="page-stack care-workspace health-records">
      {originalReport?.memberId === memberId && <ReportPreviewDialog report={originalReport} onClose={() => setOriginalReport(null)}
        onReview={() => { const id = originalReport.id; setOriginalReport(null); void openReport(id) }}
        onDelete={isSharedView ? undefined : () => { setReportToDelete(originalReport); setOriginalReport(null) }} />}
      {reviewTarget && reviewTarget.memberId === memberId && <ReportReviewDialog key={reviewTarget.id} title={reviewTarget.originalFileName}
        report={selectedReport?.id === reviewTarget.id && selectedReport.memberId === memberId ? selectedReport : null}
        hasOriginalFile={reviewTarget.hasOriginalFile === true} loading={reviewLoading} error={reviewError}
        onClose={closeReview} onRetry={() => void openReport(reviewTarget.id)} onSubmit={confirmReport} onExtract={retryExtraction} />}
      <header className="care-header">
        <div>
          <p className="care-eyebrow">{isHead ? 'Family health records' : 'Your health records'}</p>
          <h1>Health Records</h1>
          <p className="care-muted">
            Upload a report, check its values, and keep your health history together.
          </p>
        </div>
        {!isSharedView && (
          <div className="care-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setTab('records')
                setEditingRecord(null)
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

      <section className="care-panel hr-profile">
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
      <div className="hr-metrics" aria-label="Records summary">
        {metrics.map((metric) => (
          <article key={metric.tone} className={`hr-metric hr-metric--${metric.tone}`}>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.caption}</small>
            </div>
            <span className="hr-metric__icon"><RecordIcon name={metric.icon} /></span>
          </article>
        ))}
      </div>
      <div className="hr-tabs" role="tablist" aria-label="Health record views">
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
            <section className="care-report-workspace">
              <div className="care-panel hr-section care-report-list">
                <header className="hr-section__head">
                  <span className="hr-section__icon"><RecordIcon name="flask" /></span>
                  <div>
                    <h2>Lab reports</h2>
                    <p className="care-muted">Upload and manage lab reports, check their values, and open the originals.</p>
                  </div>
                  {!isSharedView && (
                    <div
                      className={`hr-dropzone hr-section__aside${dragging ? ' is-dragging' : ''}`}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setDragging(true)
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={dropReport}
                    >
                      <RecordIcon name="upload" />
                      <div>
                        <b>Upload lab report</b>
                        <small>Drag and drop a PDF, JPEG or PNG file</small>
                      </div>
                      <button type="button" className="button button--primary button--sm" onClick={chooseReportFile}>
                        Choose file
                      </button>
                    </div>
                  )}
                </header>
                {showUploadForm && !isSharedView && (
                  <form className="care-form care-upload" onSubmit={(event) => void upload(event)}>
                    <label className="field care-upload__drop">
                      <span className="care-upload__symbol" aria-hidden="true">↑</span>
                      <strong>{uploadFileName || 'Choose a report to upload'}</strong>
                      <span>Report file (PNG, JPEG or PDF)</span>
                      <input ref={fileInput} aria-label="Report file (PNG, JPEG or PDF)" name="file" type="file" accept="image/png,image/jpeg,application/pdf" disabled={uploading} onChange={(event) => setUploadFileName(event.target.files?.[0]?.name ?? '')} required />
                    </label>
                    <label className="field">
                      <span>Collected at (optional)</span>
                      <input name="collectedAt" type="datetime-local" />
                    </label>
                    {isOwnProfile && <fieldset className="care-sharing-choice"><legend>Who can see this report?</legend>
                      <label><input type="radio" name="visibility" value="private" defaultChecked disabled={uploading} /><span><b>Private</b><small>Hidden from Family Head. Your doctor needs consent and a valid access grant.</small></span></label>
                      <label><input type="radio" name="visibility" value="shared" disabled={uploading} /><span><b>Shared with Family Head</b><small>Visible to your family head. Never public on the internet.</small></span></label>
                    </fieldset>}
                    <div className="care-actions">
                      <button type="submit" className="button button--primary" disabled={uploading}>
                        {uploading ? 'Uploading…' : 'Upload report'}
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => {
                          setShowUploadForm(false)
                          setUploadFileName('')
                        }}
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
                  <ReportLibrary key={memberId} reports={reports}
                    ownerName={selectedMember?.displayName ?? 'Member'} canChangeSharing={isOwnProfile}
                    onToggleSharing={(item) => void toggleReportSharing(item)}
                    onViewOriginal={(item) => setOriginalReport(item)}
                    onReview={isSharedView ? undefined : (item) => void openReport(item.id)}
                    reviewLabel={(report) => reportStep(report, selectedReport)}
                    onDelete={isSharedView ? undefined : (item) => setReportToDelete(item)} />
                )}
                {!isSharedView && memberId && <DeletedReports key={`trash-${memberId}`} memberId={memberId}
                  ownerName={selectedMember?.displayName ?? 'Member'} refreshKey={trashVersion}
                  onRestored={() => void loadRecords()} onMessage={setMessage} />}
                {reportToDelete && <RecordDialog eyebrow="Move to Recently deleted" title="Delete this report?" onClose={() => { if (!deletingReport) setReportToDelete(null) }}>
                  <p className="hr-confirm__text"><b>{reportToDelete.originalFileName}</b> will be hidden from your records, your doctor and symptom checks. You can restore it from Recently deleted.</p>
                  <div className="hr-confirm__actions">
                    <button type="button" className="button button--secondary" disabled={deletingReport} onClick={() => setReportToDelete(null)}>Cancel</button>
                    <button type="button" className="button button--danger" disabled={deletingReport} onClick={() => void deleteReport(reportToDelete)}>{deletingReport ? 'Deleting…' : 'Delete report'}</button>
                  </div>
                </RecordDialog>}
              </div>

            </section>
          )}
          {activeTab === 'records' && (
            <ManualRecordsPanel
              records={records}
              totalCount={totalCount}
              pageSize={RECORDS_PAGE_SIZE}
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
              onCloseForm={() => {
                setEditingRecord(null)
                setShowRecordForm(false)
              }}
              onEdit={(record) => {
                setEditingRecord(record)
                setShowRecordForm(true)
              }}
              onSave={saveRecord}
              onQuickAdd={quickAddRecord}
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
          {activeTab === 'vitals' && !isSharedView && <VitalsPanel vitals={vitals} onAdd={addVital} />}
        </>
      )}
    </div>
  )
}
