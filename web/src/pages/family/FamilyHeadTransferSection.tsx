// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// FH-3 "Transfer Family Head" (Family Settings). Two-person approval: the adult must accept.
import { type FormEvent, useCallback, useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { familyLifecycleApi, type HeadTransferDto, type RosterMemberDto } from '../../services/apiClient'
import { extractErrorMessage, formatDateTime } from './threePortalUtils'

type Props = { familyId: string; onMessage: (message: string) => void }

export function FamilyHeadTransferSection({ familyId, onMessage }: Props) {
  const [eligible, setEligible] = useState<RosterMemberDto[]>([])
  const [pending, setPending] = useState<HeadTransferDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [roster, open] = await Promise.all([
        familyLifecycleApi.getRoster(familyId),
        familyLifecycleApi.getPendingHeadTransfer(familyId),
      ])
      setEligible(roster.data.filter((member) => member.role === 'AdultMember' && member.hasAccount))
      setPending(open.data || null)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [familyId])

  useEffect(() => {
    void load()
  }, [load])

  async function propose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const toMemberId = String(new FormData(event.currentTarget).get('toMemberId') || '')
    const target = eligible.find((member) => member.id === toMemberId)
    if (!target) return onMessage('Choose an adult member first.')
    if (!window.confirm(`Offer the Family Head role to ${target.displayName}? You become an Adult Member once they accept.`)) return
    setIsSubmitting(true)
    try {
      await familyLifecycleApi.proposeHeadTransfer(familyId, toMemberId)
      onMessage(`Transfer request sent. ${target.displayName} must accept before anything changes.`)
      await load()
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The transfer request could not be sent.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function cancel() {
    if (!pending) return
    try {
      await familyLifecycleApi.cancelHeadTransfer(pending.id)
      onMessage('Transfer request cancelled.')
      await load()
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The transfer request could not be cancelled.'))
    }
  }

  return (
    <section className="panel" aria-label="Transfer Family Head">
      <h2>Transfer Family Head</h2>
      <p className="muted">
        Only you can start a transfer, and the adult must accept. You cannot leave the family while you are the Head.
      </p>
      {status === 'loading' ? (
        <LoadingState label="Loading transfer options" />
      ) : status === 'error' ? (
        <ErrorState message="Transfer options could not be loaded." onRetry={() => void load()} />
      ) : pending ? (
        <div className="inline-actions">
          <span>
            Waiting for <b>{pending.toDisplayName}</b> to answer · sent {formatDateTime(pending.createdAt)}
          </span>
          <button className="button button--secondary" type="button" onClick={() => void cancel()}>
            Cancel request
          </button>
        </div>
      ) : eligible.length === 0 ? (
        <p>No eligible adult yet. An adult member with their own account can take over.</p>
      ) : (
        <form className="form-grid" onSubmit={(event) => void propose(event)}>
          <label>
            New Family Head
            <select name="toMemberId" required defaultValue="">
              <option value="" disabled>Select eligible adult member…</option>
              {eligible.map((member) => (
                <option key={member.id} value={member.id}>{member.displayName}</option>
              ))}
            </select>
          </label>
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send transfer request'}
          </button>
        </form>
      )}
    </section>
  )
}
