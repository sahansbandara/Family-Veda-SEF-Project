// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor → one assigned family: roster (names and roles only) with the current access state per member.
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { doctorWorkspaceApi, type FamilyRosterForDoctorDto } from '../../services/apiClient'
import { Badge, PageHero } from '../dashboard/dashboardParts'

const roleLabel: Record<string, string> = { Head: 'Family Head', AdultMember: 'Adult', MinorMember: 'Minor' }

export function DoctorFamilyDetailPage() {
  const { familyId = '' } = useParams()
  const [family, setFamily] = useState<FamilyRosterForDoctorDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setFamily((await doctorWorkspaceApi.getFamilyRoster(familyId)).data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [familyId])
  useEffect(() => { void load() }, [load])

  return (
    <div className="fv-page">
      <PageHero
        eyebrow="My Families"
        title={family?.familyName ?? 'Family'}
        purpose="Members of a family you care for. Clinical details open only during a confirmed visit or a shared case, with the member's consent."
        action={<Link className="fv-btn" to="/families">All families</Link>}
      />
      {status === 'loading' ? <LoadingState label="Loading family" /> : status === 'error' || !family ? (
        <ErrorState message="This family could not be loaded. You may no longer be its family doctor." onRetry={() => void load()} />
      ) : (
        <section className="fv-panel" aria-label="Members">
          <div className="fv-members">
            {family.members.map((member) => (
              <div className="fv-member" key={member.id}>
                <div className="fv-row">
                  <b>{member.displayName}</b>
                  <Badge tone={member.role === 'MinorMember' ? 'warn' : 'info'}>{roleLabel[member.role] ?? member.role}</Badge>
                </div>
                <p>{member.clinicalAccess ? 'Clinical access active (visit or shared case).' : 'Clinical details restricted until a confirmed visit or shared case.'}</p>
                <Link className={member.clinicalAccess ? 'fv-btn fv-btn--primary' : 'fv-btn'} to={`/members/${member.id}`}>View Member</Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
