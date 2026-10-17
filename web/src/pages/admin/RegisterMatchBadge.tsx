// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Result of the deterministic name check against the synthetic SLMC register. Advisory for the admin only.
import type { RegisterMatch } from '../../services/apiClient'
import { REGISTER_MATCH_LABEL } from './claimDisputes'

const TONE: Record<RegisterMatch, string> = { Match: 'ok', NameMismatch: 'danger', NotInRegister: 'warn' }

export function RegisterMatchBadge({ match }: { match?: RegisterMatch | null }) {
  if (!match) return null
  return (
    <span className={`register-match register-match--${TONE[match]}`} title="Name compared with the synthetic SLMC register">
      {REGISTER_MATCH_LABEL[match]}
    </span>
  )
}
