// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import { apiClient, type EvidenceKind, type RegisterMatch } from '../../services/apiClient'

export const CLAIM_UNDER_REVIEW_MESSAGE = 'Your claim is under review because this number is already registered.'

export const REGISTER_MATCH_LABEL: Record<RegisterMatch, string> = {
  Match: 'Register match',
  NameMismatch: 'Name mismatch',
  NotInRegister: 'Not in register',
}

/** Licence files need the admin bearer token, so fetch as a blob instead of a plain link. */
export async function openLicenseDocument(doctorId: string) {
  const response = await apiClient.get<Blob>(`/admin/doctors/${doctorId}/license-document`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  window.open(url, '_blank', 'noopener')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}


export const EVIDENCE_KINDS: EvidenceKind[] = ['SlmcCertificate', 'NationalIdCopy', 'HospitalLetter', 'Other']

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  SlmcCertificate: 'SLMC certificate',
  NationalIdCopy: 'NIC copy',
  HospitalLetter: 'Hospital/employer letter',
  Other: 'Other',
}

export async function openEvidenceFile(fileId: string) {
  const response = await apiClient.get<Blob>(`/admin/evidence-files/${fileId}`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  window.open(url, '_blank', 'noopener')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Whole-second countdown parts to a deadline; expired when the deadline has passed. */
export function timeRemaining(dueAt: string, now: number = Date.now()) {
  const ms = new Date(dueAt).getTime() - now
  if (!(ms > 0)) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  const total = Math.floor(ms / 1000)
  return { expired: false, days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 }
}

export function formatRemaining(dueAt: string, now: number = Date.now()) {
  const r = timeRemaining(dueAt, now)
  return r.expired ? 'Deadline passed' : `${r.days}d ${r.hours}h ${r.minutes}m ${r.seconds}s`
}
