// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Invitations another Family Head sent to this account's email. Approve moves the user in; reject tells the Head.
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { familyLifecycleApi, refreshSession, type IncomingInvitationDto } from '../../services/apiClient'
import { useAppDispatch } from '../../store/hooks'
import { mapAuthResponse, signedIn, signedOut } from '../../store/slices/authSlice'
import { extractErrorMessage, formatDateTime } from './threePortalUtils'

type Props = { onChanged?: () => Promise<void> | void; onMessage: (message: string) => void }

export function IncomingInvitationsPanel({ onChanged, onMessage }: Props) {
  const [invitations, setInvitations] = useState<IncomingInvitationDto[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      setInvitations((await familyLifecycleApi.getIncomingInvitations()).data)
    } catch {
      // Optional panel: a failure must not hide the rest of the page.
      setInvitations([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function respond(invitation: IncomingInvitationDto, approve: boolean) {
    if (approve && !window.confirm(`Join ${invitation.familyName}? Your health data stays private unless you share it.`)) return
    setBusyId(invitation.id)
    try {
      if (approve) await familyLifecycleApi.approveInvitation(invitation.id)
      else await familyLifecycleApi.rejectInvitation(invitation.id)
      onMessage(approve ? `You joined ${invitation.familyName}.` : `Invitation from ${invitation.familyName} rejected.`)
      await load()
      if (approve) await adoptNewRole()
      else await onChanged?.()
    } catch (error) {
      onMessage(extractErrorMessage(error, approve ? 'The invitation could not be approved.' : 'The invitation could not be rejected.'))
      await load()
    } finally {
      setBusyId(null)
    }
  }

  // Joining moves this user into another family (a Head becomes an Adult Member), so the session must
  // carry the new role. Tokens live in memory, so a full page reload would sign the user out; refresh
  // the session in place instead. If the refresh fails, sign out rather than keep a stale role.
  async function adoptNewRole() {
    try {
      const session = await refreshSession()
      if (!session) throw new Error('no session')
      dispatch(signedIn(mapAuthResponse(session)))
      navigate('/family')
    } catch {
      dispatch(signedOut())
    }
  }

  if (invitations.length === 0) return null

  return (
    <section className="panel" aria-label="Invitations for you">
      <h2>Invitations for you</h2>
      <p className="muted">A Family Head invited your account email. Approve to join, or reject to let them know.</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Family</th>
              <th>Invited by</th>
              <th>Relationship</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td>{invitation.familyName}</td>
                <td>{invitation.invitedByName}</td>
                <td>{invitation.relationshipType || '—'}</td>
                <td>{formatDateTime(invitation.expiresAt)}</td>
                <td>
                  <div className="inline-actions">
                    <button
                      className="button button--primary"
                      type="button"
                      disabled={busyId === invitation.id || !invitation.canApprove}
                      title={invitation.blockedReason ?? undefined}
                      onClick={() => void respond(invitation, true)}
                    >
                      Approve
                    </button>
                    <button className="button button--secondary" type="button" disabled={busyId === invitation.id} onClick={() => void respond(invitation, false)}>
                      Reject
                    </button>
                  </div>
                  {invitation.blockedReason && <small className="muted">{invitation.blockedReason}</small>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
