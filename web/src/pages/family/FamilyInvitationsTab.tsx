// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Invitations tab: invite an adult by email, then resend or cancel. Only a keyed hash of the email is
// stored, so resending asks for the same address again. The one-time token is shown once, here.
import { type FormEvent, useCallback, useEffect, useState } from 'react'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { familyLifecycleApi, type FamilyInvitationDto, type FamilyInvitationSummaryDto } from '../../services/apiClient'
import { FriendlyStatusBadge } from './threePortalShared'
import { extractErrorMessage, formatDateTime } from './threePortalUtils'

type Props = { familyId: string; onChanged: () => Promise<void>; onMessage: (message: string) => void }

export function FamilyInvitationsTab({ familyId, onChanged, onMessage }: Props) {
  const [invitations, setInvitations] = useState<FamilyInvitationSummaryDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [issued, setIssued] = useState<FamilyInvitationDto | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setInvitations((await familyLifecycleApi.getInvitations(familyId)).data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [familyId])

  useEffect(() => {
    void load()
  }, [load])

  async function afterChange(message: string) {
    onMessage(message)
    await Promise.all([load(), onChanged()])
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setIsSubmitting(true)
    try {
      const { data } = await familyLifecycleApi.createInvitation(familyId, {
        email: String(form.get('email') || '').trim(),
        relationshipType: String(form.get('relationshipType') || '').trim() || undefined,
      })
      formElement.reset()
      setIssued(data)
      await afterChange(`Invitation created. Share the token privately before ${formatDateTime(data.expiresAt)}.`)
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The invitation could not be created.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function resend(invitation: FamilyInvitationSummaryDto) {
    const email = window.prompt(`Re-enter the email address for ${invitation.emailMasked ?? 'this invitation'} to issue a new token:`)
    if (!email) return
    try {
      const { data } = await familyLifecycleApi.resendInvitation(familyId, invitation.id, email.trim())
      setIssued(data)
      await afterChange('New invitation token issued. The previous token no longer works.')
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The invitation could not be resent.'))
    }
  }

  async function cancel(invitation: FamilyInvitationSummaryDto) {
    if (!window.confirm(`Cancel the invitation for ${invitation.emailMasked ?? 'this adult'}?`)) return
    try {
      await familyLifecycleApi.cancelInvitation(familyId, invitation.id)
      if (issued?.id === invitation.id) setIssued(null)
      await afterChange('Invitation cancelled.')
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The invitation could not be cancelled.'))
    }
  }

  return (
    <>
      <section className="panel" aria-label="Invite adult">
        <h2>Invite adult</h2>
        <p className="muted">The token works once, only for the account with this email, for 48 hours.</p>
        <form className="form-grid" onSubmit={(event) => void invite(event)}>
          <label>
            Adult account email
            <input name="email" type="email" required maxLength={254} placeholder="adult@example.invalid" />
          </label>
          <label>
            Relationship (optional)
            <input name="relationshipType" maxLength={40} placeholder="e.g. spouse, son" />
          </label>
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create invitation'}
          </button>
        </form>
        {issued && (
          <label className="field">
            <span>One-time invitation token (shown once)</span>
            <input readOnly value={issued.token} onFocus={(event) => event.currentTarget.select()} />
          </label>
        )}
      </section>

      <section className="panel" aria-label="Invitations">
        <h2>Invitations</h2>
        {status === 'loading' ? (
          <LoadingState label="Loading invitations" />
        ) : status === 'error' ? (
          <ErrorState message="Invitations could not be loaded." onRetry={() => void load()} />
        ) : invitations.length === 0 ? (
          <EmptyState title="No invitations yet" message="Invitations you create will appear here." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Invited</th>
                  <th>Relationship</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => {
                  const open = invitation.status === 'Pending' || invitation.status === 'Expired'
                  return (
                    <tr key={invitation.id}>
                      <td>{invitation.emailMasked ?? 'Adult (email hidden)'}</td>
                      <td>{invitation.relationshipType ?? '—'}</td>
                      <td><FriendlyStatusBadge status={invitation.status} /></td>
                      <td>{formatDateTime(invitation.expiresAt)}</td>
                      <td>
                        {open ? (
                          <div className="inline-actions">
                            <button className="button button--secondary" type="button" onClick={() => void resend(invitation)}>Resend</button>
                            {invitation.status === 'Pending' && (
                              <button className="button button--danger" type="button" onClick={() => void cancel(invitation)}>Cancel</button>
                            )}
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
