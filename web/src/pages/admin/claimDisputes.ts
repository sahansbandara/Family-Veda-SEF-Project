// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
import { apiClient, type RegisterMatch } from '../../services/apiClient'

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
