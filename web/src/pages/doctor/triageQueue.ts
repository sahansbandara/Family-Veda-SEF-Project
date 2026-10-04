// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Presentation rules for the doctor's Triage Cases work queue. Everything here is derived from
// the two authoritative lists (/doctors/me/cases and /doctors/case-pool); nothing invents a
// status, a count or an action the backend has not offered.
import type { AvailableCaseDto, TriageCaseDto } from '../../services/apiClient'

export type QueueTab = 'available' | 'mine' | 'completed' | 'emergency'
export type QueueSort = 'oldest' | 'newest' | 'priority'
export type QueueTone = 'muted' | 'primary' | 'warning' | 'success' | 'danger'
export type QueueActionKind = 'claim' | 'acknowledge' | 'approval' | 'evidence' | 'none'

export type QueueCase = {
  id: string
  /** Database case number; absent on an older API build. */
  caseNumber?: number
  /** Released only for cases this doctor holds a grant on. */
  memberDisplayName?: string | null
  familyName?: string | null
  priority: string
  status: string
  createdAt: string
  /** The doctor holds an active case grant (listed by /doctors/me/cases). */
  mine: boolean
  /** The backend lists the case in the claimable pool and it is not already granted to this doctor. */
  claimable: boolean
}

export type QueueAction = { kind: QueueActionKind; label: string; message?: string }

const ACTIVE = new Set(['Claimed', 'PendingDoctorReview', 'LowConfidence'])
const AWAITING_REVIEW = new Set(['PendingDoctorReview', 'LowConfidence'])
const COMPLETED = new Set(['Approved', 'ApprovedRevised', 'Rejected', 'FailedSafe'])
const PRIORITY_RANK: Record<string, number> = { Emergency: 2, Priority: 1, Routine: 0 }

export const QUEUE_TABS: { id: QueueTab; label: string }[] = [
  { id: 'available', label: 'Available' },
  { id: 'mine', label: 'My Cases' },
  { id: 'completed', label: 'Completed' },
  { id: 'emergency', label: 'Emergency' },
]

/** A granted case wins over its pool entry, so a case this doctor already holds never offers a second claim. */
export function mergeQueue(assigned: TriageCaseDto[], pool: AvailableCaseDto[]): QueueCase[] {
  const mineIds = new Set(assigned.map((item) => item.id))
  return [
    ...assigned.map((item) => ({
      id: item.id,
      caseNumber: item.caseNumber,
      memberDisplayName: item.memberDisplayName,
      familyName: item.familyName,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt,
      mine: true,
      claimable: false,
    })),
    ...pool
      .filter((item) => !mineIds.has(item.id))
      .map((item) => ({
        id: item.id,
        caseNumber: item.caseNumber,
        priority: item.priority,
        status: item.status ?? 'Available',
        createdAt: item.createdAt,
        mine: false,
        claimable: true,
      })),
  ]
}

export const isEmergencyReferral = (item: QueueCase) => item.status === 'Escalated'
export const isAwaitingReview = (item: QueueCase) => item.mine && AWAITING_REVIEW.has(item.status)

export function tabOf(item: QueueCase): QueueTab | null {
  if (isEmergencyReferral(item)) return 'emergency'
  if (item.claimable) return 'available'
  if (item.mine && COMPLETED.has(item.status)) return 'completed'
  if (item.mine && ACTIVE.has(item.status)) return 'mine'
  return null
}

export function queueCounts(cases: QueueCase[]) {
  return {
    available: cases.filter((item) => tabOf(item) === 'available').length,
    mine: cases.filter((item) => tabOf(item) === 'mine').length,
    awaitingReview: cases.filter((item) => tabOf(item) === 'mine' && isAwaitingReview(item)).length,
    completed: cases.filter((item) => tabOf(item) === 'completed').length,
    emergency: cases.filter((item) => tabOf(item) === 'emergency').length,
  }
}

/** Doctor-facing copy for a backend status. Presentation only; the stored status is unchanged. */
export function statusLabel(item: QueueCase): string {
  if (item.claimable && item.status !== 'Escalated') return 'Available'
  switch (item.status) {
    case 'Claimed':
      return 'Assigned to me · In review'
    case 'PendingDoctorReview':
      return 'Awaiting clinical review'
    case 'LowConfidence':
      return 'AI confidence insufficient'
    case 'Approved':
      return 'Approved'
    case 'ApprovedRevised':
      return 'Approved with revisions'
    case 'Rejected':
      return 'Rejected'
    case 'Escalated':
      return item.priority === 'Emergency' ? 'Emergency referral' : 'Escalated for urgent care'
    case 'FailedSafe':
      return 'Processing stopped safely'
    default:
      return 'AI processing'
  }
}

export function statusTone(item: QueueCase): QueueTone {
  if (item.status === 'Escalated') return 'danger'
  if (item.claimable) return 'primary'
  if (item.status === 'LowConfidence' || item.status === 'FailedSafe') return 'warning'
  if (item.status === 'Approved' || item.status === 'ApprovedRevised') return 'success'
  if (item.status === 'Rejected') return 'muted'
  return 'primary'
}

export function priorityTone(priority: string): QueueTone {
  if (priority === 'Emergency') return 'danger'
  if (priority === 'Priority') return 'warning'
  return 'muted'
}

/** The one action the backend state supports for this doctor. Never a UI-only transition. */
export function actionFor(item: QueueCase): QueueAction {
  if (item.claimable) {
    return item.status === 'Escalated'
      ? { kind: 'acknowledge', label: 'Acknowledge Emergency' }
      : { kind: 'claim', label: 'Claim Case' }
  }
  if (!item.mine) return { kind: 'none', label: '', message: 'This case is not available to you.' }
  switch (item.status) {
    case 'Claimed':
    case 'PendingDoctorReview':
      return { kind: 'approval', label: 'Open Approval Desk' }
    case 'LowConfidence':
      return { kind: 'evidence', label: 'Review Available Evidence' }
    case 'Escalated':
      return { kind: 'none', label: '', message: 'You acknowledged this referral. The patient was directed to in-person care.' }
    case 'FailedSafe':
      return { kind: 'none', label: '', message: 'Processing stopped safely. No AI output was produced for review.' }
    case 'Approved':
    case 'ApprovedRevised':
    case 'Rejected':
      return { kind: 'none', label: '', message: 'The clinical decision is recorded. No further action is needed here.' }
    default:
      return { kind: 'none', label: '', message: 'Still being processed. It will be ready for review shortly.' }
  }
}

export type WorkflowStep = { label: string; state: 'done' | 'current' | 'upcoming' | 'stopped' }

/** Progress shown in the preview, derived from the real status only. */
export function workflowSteps(item: QueueCase): WorkflowStep[] {
  if (item.status === 'Escalated') {
    return [
      { label: 'Request received', state: 'done' },
      { label: item.priority === 'Emergency' ? 'Emergency referral issued' : 'Escalated for urgent care', state: 'stopped' },
      { label: item.mine ? 'Acknowledged by you' : 'Awaiting doctor acknowledgement', state: item.mine ? 'done' : 'current' },
    ]
  }
  if (item.status === 'FailedSafe') {
    return [
      { label: 'Request received', state: 'done' },
      { label: 'Processing stopped safely', state: 'stopped' },
    ]
  }
  const decided = COMPLETED.has(item.status)
  const lowConfidence = item.status === 'LowConfidence'
  const inReview = item.status === 'Claimed'
  const ready = item.claimable || AWAITING_REVIEW.has(item.status) || inReview || decided
  return [
    { label: 'Request received', state: 'done' },
    {
      label: lowConfidence ? 'AI confidence insufficient' : 'AI draft prepared',
      state: ready ? (lowConfidence ? 'stopped' : 'done') : 'current',
    },
    {
      label: inReview ? 'In clinical review' : 'Ready for clinical review',
      state: decided ? 'done' : ready ? 'current' : 'upcoming',
    },
    { label: decided ? statusLabel(item) : 'Doctor decision', state: decided ? 'done' : 'upcoming' },
  ]
}

/** The database case number as 0001; falls back to the id prefix when an older API omits it. */
export const caseReference = (item: { id: string; caseNumber?: number }) =>
  item.caseNumber && item.caseNumber > 0 ? String(item.caseNumber).padStart(4, '0') : item.id.slice(0, 8)

export function filterAndSort(
  cases: QueueCase[],
  options: { tab: QueueTab; priority: string; status: string; search: string; sort: QueueSort },
): QueueCase[] {
  const term = options.search.trim().toLowerCase()
  const time = (item: QueueCase) => new Date(item.createdAt).valueOf()
  return cases
    .filter(
      (item) =>
        tabOf(item) === options.tab &&
        (options.priority === 'ALL' || item.priority === options.priority) &&
        (options.status === 'ALL' || item.status === options.status) &&
        (term === '' ||
          `${item.id} ${caseReference(item)} ${item.memberDisplayName ?? ''} ${item.familyName ?? ''}`.toLowerCase().includes(term)),
    )
    .sort((left, right) => {
      if (options.sort === 'newest') return time(right) - time(left)
      if (options.sort === 'priority') {
        const rank = (PRIORITY_RANK[right.priority] ?? 0) - (PRIORITY_RANK[left.priority] ?? 0)
        if (rank !== 0) return rank
      }
      return time(left) - time(right)
    })
}

export function formatSubmitted(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return 'Submission time unavailable'
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
