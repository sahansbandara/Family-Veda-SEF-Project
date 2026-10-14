// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor → one assigned family: roster (names and roles only) with the current access state per member.
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { doctorWorkspaceApi, type FamilyRosterForDoctorDto } from '../../services/apiClient'
import '../../styles/doctor-families.css'
import { Avatar, Breadcrumbs, Empty, Icon, Pill, Strip } from './familyParts'
import { roleLabel } from './familyWorkspace'

type AccessFilter = 'all' | 'active' | 'restricted'

export function DoctorFamilyDetailPage() {
  const { familyId = '' } = useParams()
  const [family, setFamily] = useState<FamilyRosterForDoctorDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [filter, setFilter] = useState<AccessFilter>('all')

  const load = useCallback(async () => {
    setStatus('loading')
    setFamily(null)
    try {
      setFamily((await doctorWorkspaceApi.getFamilyRoster(familyId)).data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [familyId])
  useEffect(() => { void load() }, [load])

  const members = family?.members ?? []
  const withGrant = members.filter((member) => member.clinicalAccess).length
  // Filters only the roster the API already returned for this assigned family.
  const visible = members.filter((member) => filter === 'all' || (filter === 'active') === member.clinicalAccess)

  return (
    <div className="dfam">
      <Breadcrumbs trail={[{ label: 'My Families', to: '/families' }, { label: family?.familyName ?? 'Family' }]} />
      <header className="dfam-head">
        <div>
          <span className="dfam-eyebrow">Long-term assigned care</span>
          <h1>{family?.familyName ?? 'Family'}</h1>
          <p>Household directory: names, roles and the current access state of each member.</p>
          {family && <p>{members.length} member{members.length === 1 ? '' : 's'} · {withGrant} with an active care grant</p>}
        </div>
        <div className="dfam-head__actions">
          <Link className="dfam-btn" to="/families"><Icon name="left" /> All Families</Link>
        </div>
      </header>

      {status === 'loading' ? <LoadingState label="Loading family" /> : status === 'error' || !family ? (
        <ErrorState message="This family could not be loaded. You may no longer be its family doctor." onRetry={() => void load()} />
      ) : (
        <>
          <Strip>Assignment makes you eligible to care for this family; it is not blanket clinical access. Clinical details open only during a confirmed visit or a shared case, with the member's consent. Restricted categories are never counted or previewed.</Strip>
          <section className="dfam-panel" aria-label="Members">
            <div className="dfam-panel__body">
              <div className="dfam-section-head">
                <div>
                  <span className="dfam-eyebrow">Member directory</span>
                  <h2>Household members</h2>
                  <p>Select a member to open their care workspace.</p>
                </div>
                <div className="dfam-tools">
                  <label>Access status
                    <select className="dfam-select" value={filter} onChange={(event) => setFilter(event.target.value as AccessFilter)}>
                      <option value="all">All members</option>
                      <option value="active">Active care grant</option>
                      <option value="restricted">Restricted</option>
                    </select>
                  </label>
                </div>
              </div>
              {visible.length === 0 ? (
                <Empty title="No members in this filter" message={members.length === 0 ? 'This family has no members yet.' : 'Choose another access status.'} />
              ) : (
                <div className="dfam-grid">
                  {visible.map((member) => (
                    <article className="dfam-card" key={member.id}>
                      <div className="dfam-card__top">
                        <div className="dfam-person">
                          <Avatar name={member.displayName} />
                          <div><h3>{member.displayName}</h3><small>{roleLabel(member.role)}</small></div>
                        </div>
                        <Pill tone={member.clinicalAccess ? 'ok' : 'muted'}>{member.clinicalAccess ? 'Active care grant' : 'Restricted'}</Pill>
                      </div>
                      <p className={member.clinicalAccess ? 'dfam-access dfam-access--ok' : 'dfam-access'}>
                        <Icon name={member.clinicalAccess ? 'shield' : 'lock'} size={15} />
                        {member.clinicalAccess ? 'Clinical access active (visit or shared case).' : 'Clinical data restricted until a confirmed visit or shared case.'}
                      </p>
                      <Link className={member.clinicalAccess ? 'dfam-btn dfam-btn--primary dfam-btn--block' : 'dfam-btn dfam-btn--block'} to={`/members/${member.id}`} aria-label={`${member.clinicalAccess ? 'Open Member Workspace' : 'View Access Details'}: ${member.displayName}`}>
                        {member.clinicalAccess ? 'Open Member Workspace' : 'View Access Details'} <Icon name="right" size={14} />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
