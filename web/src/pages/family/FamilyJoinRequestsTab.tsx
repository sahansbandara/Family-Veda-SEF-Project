// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Join Requests tab. Knowing the Family Code never grants access: the Head accepts or declines.
import { useCallback, useEffect, useState } from 'react'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { threePortalApi, type JoinRequestDto } from '../../services/apiClient'
import { extractErrorMessage, formatDateTime } from './threePortalUtils'

type Props = { familyId: string; onChanged: () => Promise<void>; onMessage: (message: string) => void }

export function FamilyJoinRequestsTab({ familyId, onChanged, onMessage }: Props) {
  const [requests, setRequests] = useState<JoinRequestDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setRequests((await threePortalApi.getFamilyJoinRequests(familyId, 'Pending')).data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [familyId])

  useEffect(() => {
    void load()
  }, [load])

  async function respond(request: JoinRequestDto, accept: boolean) {
    setBusyId(request.id)
    try {
      if (accept) await threePortalApi.acceptJoinRequest(request.id)
      else await threePortalApi.declineJoinRequest(request.id)
      onMessage(accept ? `${request.requesterDisplayName} joined the family. Their health data stays private by default.` : `Request from ${request.requesterDisplayName} declined.`)
      await Promise.all([load(), onChanged()])
    } catch (error) {
      onMessage(extractErrorMessage(error, accept ? 'The request could not be accepted.' : 'The request could not be declined.'))
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="panel" aria-label="Pending join requests">
      <h2>Pending join requests</h2>
      <p className="muted">Knowing the Family Code does not grant access. Unanswered requests expire after 14 days.</p>
      {status === 'loading' ? (
        <LoadingState label="Loading join requests" />
      ) : status === 'error' ? (
        <ErrorState message="Join requests could not be loaded." onRetry={() => void load()} />
      ) : requests.length === 0 ? (
        <EmptyState title="No pending requests" message="Nobody is waiting to join your family right now." />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Requester</th>
                <th>Relationship</th>
                <th>Message</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    {request.requesterDisplayName} <small className="muted">{request.requesterEmailMasked}</small>
                  </td>
                  <td>{request.relationshipType}</td>
                  <td>{request.message || '—'}</td>
                  <td>{formatDateTime(request.createdAt)}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="button button--primary" type="button" disabled={busyId === request.id} onClick={() => void respond(request, true)}>
                        Accept
                      </button>
                      <button className="button button--secondary" type="button" disabled={busyId === request.id} onClick={() => void respond(request, false)}>
                        Decline
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
