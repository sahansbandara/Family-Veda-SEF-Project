// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Invitations another Family Head sent to this account's email. Approve moves the user in; reject tells the Head.
import { useCallback, useEffect, useState } from 'react'

import { familyLifecycleApi, type IncomingInvitationDto } from '../../services/apiClient'
import { extractErrorMessage, formatDateTime } from './threePortalUtils'

type Props = { onChanged?: () => Promise<void> | void; onMessage: (message: string) => void }

export function IncomingInvitationsPanel({ onChanged, onMessage }: Props) {
  const [invitations, setInvitations] = useState<IncomingInvitationDto[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

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
      if (approve) window.location.assign('/family')
      else await onChanged?.()
    } catch (error) {
      onMessage(extractErrorMessage(error, approve ? 'The invitation could not be approved.' : 'The invitation could not be rejected.'))
      await load()
    } finally {
      setBusyId(null)
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
