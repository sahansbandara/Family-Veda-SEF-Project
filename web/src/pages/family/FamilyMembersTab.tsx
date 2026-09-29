// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Members tab: roster (names + roles only), Add Minor, Remove from Family, minor consent + relationships.
// Removing an adult moves them, with their history, into their own household (DECISIONS 2026-09-29c).
import { type FormEvent, useCallback, useEffect, useState } from 'react'

import { ClinicalSexSelect } from '../../components/shared/ClinicalSexSelect'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import {
  apiClient,
  familyLifecycleApi,
  type ConsentDto,
  type FamilyDto,
  type RelationshipDto,
  type RosterMemberDto,
} from '../../services/apiClient'
import { extractErrorMessage } from './threePortalUtils'

type Props = { family: FamilyDto; onChanged: () => Promise<void>; onMessage: (message: string) => void }

const roleLabel: Record<RosterMemberDto['role'], string> = { Head: 'Family Head', AdultMember: 'Adult Member', MinorMember: 'Minor' }
const roleTone: Record<RosterMemberDto['role'], string> = { Head: 'success', AdultMember: 'primary', MinorMember: 'warning' }

export function FamilyMembersTab({ family, onChanged, onMessage }: Props) {
  const [roster, setRoster] = useState<RosterMemberDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selected, setSelected] = useState<RosterMemberDto | null>(null)
  const [consents, setConsents] = useState<ConsentDto[]>([])
  const [relationships, setRelationships] = useState<RelationshipDto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadRoster = useCallback(async () => {
    setStatus('loading')
    try {
      setRoster((await familyLifecycleApi.getRoster(family.id)).data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [family.id])

  useEffect(() => {
    void loadRoster()
  }, [loadRoster])

  async function refresh() {
    await Promise.all([loadRoster(), onChanged()])
  }

  async function addMinor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const displayName = String(form.get('displayName') || '').trim()
    const dateOfBirth = String(form.get('dateOfBirth') || '').trim()
    const dob = new Date(`${dateOfBirth}T00:00:00Z`)
    const adultCutoff = new Date()
    adultCutoff.setUTCHours(0, 0, 0, 0)
    adultCutoff.setUTCFullYear(adultCutoff.getUTCFullYear() - 18)
    if (!displayName || !dateOfBirth) return onMessage('Enter a display name and date of birth.')
    if (dob > new Date()) return onMessage('Date of birth cannot be in the future.')
    if (dob <= adultCutoff) return onMessage('A minor profile must be under 18. Invite adults from the Invitations tab.')

    setIsSubmitting(true)
    try {
      await apiClient.post(`/families/${family.id}/members`, {
        displayName,
        dateOfBirth,
        role: 'MinorMember',
        userId: null,
        sexForClinicalReference: String(form.get('sexForClinicalReference') || 'NotSpecified'),
      })
      formElement.reset()
      onMessage(`${displayName} added as a guardian-managed minor. Consents start as not set.`)
      await refresh()
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The minor profile could not be added.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function removeAdult(member: RosterMemberDto) {
    const confirmed = window.confirm(
      `Remove ${member.displayName} from the family?\n\nTheir account and health history are kept. They move to a household of their own and can join another family later.`,
    )
    if (!confirmed) return
    try {
      await familyLifecycleApi.removeFromFamily(member.id)
      onMessage(`${member.displayName} was removed from the family and notified.`)
      if (selected?.id === member.id) setSelected(null)
      await refresh()
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The member could not be removed.'))
    }
  }

  async function deleteMinor(member: RosterMemberDto) {
    if (!window.confirm(`Delete the minor profile for ${member.displayName}? Linked records may prevent deletion.`)) return
    try {
      await apiClient.delete(`/members/${member.id}`)
      onMessage(`${member.displayName}'s profile was deleted.`)
      if (selected?.id === member.id) setSelected(null)
      await refresh()
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The minor profile could not be deleted.'))
    }
  }

  async function openMember(member: RosterMemberDto) {
    setSelected(member)
    try {
      const [consentResponse, relationshipResponse] = await Promise.all([
        apiClient.get<ConsentDto[]>(`/members/${member.id}/consents`),
        apiClient.get<RelationshipDto[]>(`/members/${member.id}/relationships`),
      ])
      setConsents(consentResponse.data)
      setRelationships(relationshipResponse.data)
    } catch {
      setConsents([])
      setRelationships([])
      onMessage('Consent and relationship settings are not available for this member.')
    }
  }

  async function toggleConsent(consent: ConsentDto) {
    const next = consent.status === 'Granted' ? 'Revoked' : 'Granted'
    try {
      await apiClient.put(`/members/${consent.memberId}/consents/${consent.category}`, { status: next })
      if (selected) await openMember(selected)
      onMessage('Consent updated and audited.')
    } catch (error) {
      onMessage(extractErrorMessage(error, 'That consent change is not permitted for this profile.'))
    }
  }

  async function reaffirmConsents() {
    if (!selected) return
    try {
      setConsents((await apiClient.post<ConsentDto[]>(`/members/${selected.id}/consents/reaffirm`)).data)
      onMessage('Eligible consent choices reaffirmed.')
    } catch (error) {
      onMessage(extractErrorMessage(error, 'Only the adult account can reaffirm its own guardian-granted consent.'))
    }
  }

  async function addRelationship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await apiClient.post(`/members/${selected.id}/relationships`, {
        relatedMemberId: form.get('relatedMemberId'),
        relationshipType: form.get('relationshipType'),
        isBiological: form.get('isBiological') === 'on',
      })
      formElement.reset()
      await openMember(selected)
      onMessage('Relationship saved.')
    } catch (error) {
      onMessage(extractErrorMessage(error, 'The relationship could not be saved.'))
    }
  }

  // Consent and relationships are editable for the Head's own profile and for minors only.
  const canManage = (member: RosterMemberDto) => member.isSelf || member.isMinor
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <>
      <section className="panel" aria-label="Members">
        <h2>Members</h2>
        <p className="muted">Adult health privacy stays independent. You see names and roles only.</p>
        {status === 'loading' ? (
          <LoadingState label="Loading members" />
        ) : status === 'error' ? (
          <ErrorState message="Members could not be loaded." onRetry={() => void loadRoster()} />
        ) : roster.length === 0 ? (
          <EmptyState title="No members yet" message="Add a minor or invite an adult to get started." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((member) => (
                  <tr key={member.id}>
                    <td>
                      {member.displayName} {member.isSelf && <small className="muted">(you)</small>}
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${roleTone[member.role]}`}>{roleLabel[member.role]}</span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        {canManage(member) && (
                          <button className="button button--secondary" type="button" onClick={() => void openMember(member)}>
                            Consent & relationships
                          </button>
                        )}
                        {member.role === 'AdultMember' && member.hasAccount && (
                          <button className="button button--danger" type="button" onClick={() => void removeAdult(member)}>
                            Remove from Family
                          </button>
                        )}
                        {member.isMinor && (
                          <button className="button button--danger" type="button" onClick={() => void deleteMinor(member)}>
                            Delete profile
                          </button>
                        )}
                        {!canManage(member) && member.role !== 'AdultMember' && <span className="muted">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel" aria-label="Add minor">
        <h2>Add minor</h2>
        <p className="muted">Guardian-managed profile for a child under 18. Adults join by invitation or Family Code.</p>
        <form className="form-grid" onSubmit={(event) => void addMinor(event)}>
          <label>
            Display name
            <input name="displayName" required minLength={2} maxLength={100} placeholder="e.g. Kasun" />
          </label>
          <label>
            Date of birth
            <input name="dateOfBirth" type="date" max={todayStr} required />
          </label>
          <ClinicalSexSelect />
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add minor'}
          </button>
        </form>
      </section>

      {selected && (
        <>
          <section className="panel" aria-label={`Consent for ${selected.displayName}`}>
            <h2>Consent: {selected.displayName}</h2>
            {consents.some((consent) => consent.status === 'PendingReaffirmation') && (
              <button className="button button--primary" type="button" onClick={() => void reaffirmConsents()}>
                Reaffirm eligible consent
              </button>
            )}
            {consents.length === 0 ? (
              <EmptyState title="No consent settings" message="This profile has no consent categories you can manage." />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consents.map((consent) => (
                      <tr key={consent.id}>
                        <td>{consent.category}</td>
                        <td><StatusBadge status={consent.status} /></td>
                        <td>
                          {consent.status === 'PendingReaffirmation' ? (
                            'Adult reaffirmation required'
                          ) : (
                            <button className="button button--secondary" type="button" onClick={() => void toggleConsent(consent)}>
                              {consent.status === 'Granted' ? 'Revoke' : 'Grant'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel" aria-label={`Relationships for ${selected.displayName}`}>
            <h2>Relationships: {selected.displayName}</h2>
            <form className="form-grid" onSubmit={(event) => void addRelationship(event)}>
              <label>
                Related member
                <select name="relatedMemberId" required>
                  <option value="">Select member</option>
                  {roster
                    .filter((member) => member.id !== selected.id)
                    .map((member) => (
                      <option key={member.id} value={member.id}>{member.displayName}</option>
                    ))}
                </select>
              </label>
              <label>
                Relationship
                <input name="relationshipType" required maxLength={80} placeholder="e.g. parent or sibling" />
              </label>
              <label>
                <input name="isBiological" type="checkbox" /> Biological relationship
              </label>
              <button className="button button--primary" type="submit">Add relationship</button>
            </form>
            {relationships.length === 0 ? (
              <p className="muted">No relationships recorded.</p>
            ) : (
              <ul className="activity-list">
                {relationships.map((relationship) => (
                  <li key={relationship.id}>
                    <span>
                      {roster.find((member) => member.id === relationship.relatedMemberId)?.displayName ?? 'Family member'} ·{' '}
                      {relationship.relationshipType}
                    </span>
                    <small>{relationship.isBiological ? 'Biological' : 'Not biological'}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}
