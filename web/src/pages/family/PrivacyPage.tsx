// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Privacy & Access for both family portals (docs/Three_Dashboards_UX_Plan.md §3 "Privacy & Access", §4 "Privacy").
// Family sharing (SharedWithFamilyHead) and doctor clinical consent are two separate controls (RULE 8).
// Adult privacy stays independent: the Head never sees an adult's private items, counts or toggles.
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { useAppSelector } from '../../store/hooks'
import {
  apiClient,
  type AuditDto,
  type ConsentDto,
  type DoctorSummaryDto,
  type FamilyDto,
  type HealthRecordDto,
  type LabReportDto,
  type MemberDto,
  type PagedResult,
} from '../../services/apiClient'
import { AuditTimeline, Avatar, Chip, ConsentRows, PrivacyHero, RuleCards, StatTile, Switch, Tabs } from './privacyParts'
import { consentLabels, initials } from './privacyWording'

type SharedItem = { id: string; kind: 'report' | 'record'; title: string; date?: string; shared: boolean }

const AUDIT_PAGE_SIZE = 20

export function PrivacyPage() {
  const role = useAppSelector((state) => state.auth.user?.role)
  return role === 'FAMILY_HEAD' ? <HeadPrivacy /> : <AdultPrivacy />
}

/** Every record page, so the sharing controls and counts cover the whole history. */
async function loadAllRecords(memberId: string): Promise<HealthRecordDto[]> {
  const all: HealthRecordDto[] = []
  for (let page = 1; page <= 100; page++) {
    const { data } = await apiClient.get<PagedResult<HealthRecordDto>>(`/members/${memberId}/records`, { params: { page, pageSize: 50 } })
    all.push(...data.items)
    if (page >= data.totalPages || data.items.length === 0) break
  }
  return all
}

/** Valid transitions only: NotSet/Revoked/PendingReaffirmation → Granted, Granted → Revoked. */
function nextConsentStatus(consent: ConsentDto): 'Granted' | 'Revoked' {
  return consent.status === 'Granted' ? 'Revoked' : 'Granted'
}

/** Adult Member: per-item family sharing + clinical consent for the Family Doctor. */
function AdultPrivacy() {
  const [me, setMe] = useState<MemberDto | null>(null)
  const [items, setItems] = useState<SharedItem[]>([])
  const [consents, setConsents] = useState<ConsentDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setStatus('loading')
    try {
      const { data: mine } = await apiClient.get<MemberDto>('/members/me')
      const [reports, recordItems, consentResponse] = await Promise.all([
        apiClient.get<LabReportDto[]>(`/members/${mine.id}/lab-reports`),
        loadAllRecords(mine.id),
        apiClient.get<ConsentDto[]>(`/members/${mine.id}/consents`),
      ])
      setMe(mine)
      setItems([
        ...reports.data.map((report): SharedItem => ({ id: report.id, kind: 'report', title: report.originalFileName, date: report.collectedAt, shared: report.sharedWithFamilyHead === true })),
        ...recordItems.map((record): SharedItem => ({ id: record.id, kind: 'record', title: record.title, date: record.occurredOn, shared: record.sharedWithFamilyHead === true })),
      ])
      setConsents(consentResponse.data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  async function toggleSharing(item: SharedItem) {
    const url = item.kind === 'report' ? `/lab-reports/${item.id}/sharing` : `/records/${item.id}/sharing`
    setBusy(true)
    try {
      await apiClient.patch(url, { sharedWithFamilyHead: !item.shared })
      setMessage(item.shared ? `"${item.title}" is now private from the Family Head.` : `"${item.title}" is now shared with the Family Head.`)
      await load(true)
    } catch {
      setMessage('Sharing could not be changed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleConsent(consent: ConsentDto) {
    if (!me) return
    const next = nextConsentStatus(consent)
    setBusy(true)
    try {
      await apiClient.put(`/members/${me.id}/consents/${consent.category}`, { status: next })
      setMessage(`${consentLabels[consent.category] ?? consent.category}: ${next === 'Granted' ? 'granted' : 'revoked'}.`)
      await load(true)
    } catch {
      setMessage('Consent could not be changed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const sharedCount = items.filter((item) => item.shared).length
  const granted = consents.filter((consent) => consent.status === 'Granted').length

  return (
    <div className="fv-page privacy-access">
      <PrivacyHero
        eyebrow="Privacy"
        title="Privacy"
        purpose="Family sharing and doctor access are two separate controls. Everything is private from your Family Head until you share it."
        note="Your adult privacy stays independent. Your Family Head cannot change these settings."
      />
      {message && <p role="status" className="pa-status">{message}</p>}
      {status === 'loading' ? <LoadingState label="Loading your privacy settings" /> : status === 'error' ? (
        <ErrorState message="Your privacy settings could not be loaded." onRetry={() => void load()} />
      ) : (
        <>
          <div className="pa-stats">
            <StatTile label="Shared with Family Head" value={sharedCount} hint="Items you chose to share" />
            <StatTile label="Private" value={items.length - sharedCount} hint="Visible only to you" />
            <StatTile label="Doctor consents" value={`${granted}/${consents.length}`} hint="Categories granted" />
          </div>
          <div className="pa-grid">
            <section className="pa-card" aria-labelledby="family-sharing-heading">
              <div className="pa-card__head">
                <div><p className="pa-eyebrow">Family Head</p><h2 id="family-sharing-heading">Family Sharing</h2><p>Choose, item by item, what your Family Head can see.</p></div>
                <Chip tone="info">{sharedCount} shared · {items.length - sharedCount} private</Chip>
              </div>
              {items.length === 0 ? (
                <EmptyState title="Nothing to share yet" message="Reports and records you add in My Health will appear here, private by default." />
              ) : (
                <ul className="pa-toggles">
                  {items.map((item) => (
                    <li className="pa-toggle" key={`${item.kind}-${item.id}`}>
                      <div>
                        <b>{item.title}</b>
                        <span>{item.kind === 'report' ? 'Lab report' : 'Health record'}{item.date ? ` · ${new Date(item.date).toLocaleDateString()}` : ''}</span>
                        <Chip tone={item.shared ? 'ok' : 'muted'}>{item.shared ? 'Shared' : 'Private'}</Chip>
                      </div>
                      <Switch checked={item.shared} disabled={busy} label={`Share ${item.title} with Family Head`} onChange={() => void toggleSharing(item)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="pa-card" aria-labelledby="clinical-consent-heading">
              <div className="pa-card__head">
                <div><p className="pa-eyebrow">Family Doctor</p><h2 id="clinical-consent-heading">Clinical Consent</h2><p>What your family doctor may use during a reviewed case. Revoking takes effect immediately.</p></div>
              </div>
              <ConsentRows consents={consents} owner="you" busy={busy} onToggle={(consent) => void toggleConsent(consent)} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}

type HeadMember = { member: MemberDto; sharedCount: number; consents: ConsentDto[] }

const doctorRules = [
  { title: 'Assignment is not record access', body: 'Your family doctor is assigned to the family, but assignment alone does not open anyone’s records.' },
  { title: 'Per-case, time-bound grants', body: 'A doctor reads a member’s data only for a specific triage case, through a grant that expires automatically.' },
  { title: 'Consent categories', body: 'Conditions, vitals summary and family history screening flags are each shared only when consent is granted.' },
]

const privacyRules = [
  { title: 'Adult privacy stays independent', body: 'Adults control their own records and consent. You see only items an adult chose to share with you.' },
  { title: 'You manage minors', body: 'As guardian, you set doctor consent for members under 18. Changes apply immediately.' },
  { title: 'Every access is recorded', body: 'Views and changes are written to an audit log. The history shows the activity, never clinical content.' },
  { title: 'Doctor approval first', body: 'No AI output reaches anyone in your family until a licensed doctor has reviewed it.' },
]

/** Family Head: own + minors' consents, adults' shared counts, doctor assignment and access history. */
function HeadPrivacy() {
  const [self, setSelf] = useState<HeadMember | null>(null)
  const [rows, setRows] = useState<HeadMember[]>([])
  const [doctor, setDoctor] = useState<DoctorSummaryDto | null>(null)
  const [events, setEvents] = useState<AuditDto[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditPage, setAuditPage] = useState(1)
  const [auditPages, setAuditPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('members')

  const loadMembers = useCallback(async () => {
    const [{ data: family }, { data: mine }] = await Promise.all([
      apiClient.get<FamilyDto>('/families/me'),
      apiClient.get<MemberDto>('/members/me'),
    ])
    const loadConsents = (id: string) => apiClient.get<ConsentDto[]>(`/members/${id}/consents`).then((r) => r.data)
    const others = family.members.filter((member) => member.id !== mine.id)
    const loaded = await Promise.all(others.map(async (member): Promise<HeadMember> => {
      if (member.role === 'MinorMember') return { member, sharedCount: 0, consents: await loadConsents(member.id) }
      // Adults: only items they shared are returned to the Head; private items are never counted.
      const [reports, records] = await Promise.all([
        apiClient.get<LabReportDto[]>(`/members/${member.id}/lab-reports`).catch(() => ({ data: [] as LabReportDto[] })),
        apiClient.get<PagedResult<HealthRecordDto>>(`/members/${member.id}/records`, { params: { page: 1, pageSize: 1 } })
          .catch(() => ({ data: { items: [], totalCount: 0 } as unknown as PagedResult<HealthRecordDto> })),
      ])
      return { member, sharedCount: reports.data.length + (records.data.totalCount ?? records.data.items.length), consents: [] }
    }))
    setSelf({ member: mine, sharedCount: 0, consents: await loadConsents(mine.id) })
    setRows(loaded)
    return family
  }, [])

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setStatus('loading')
    try {
      const [family, audit] = await Promise.all([
        loadMembers(),
        apiClient.get<PagedResult<AuditDto>>('/audit', { params: { page: 1, pageSize: AUDIT_PAGE_SIZE } }),
      ])
      const assigned = await apiClient.get<DoctorSummaryDto | ''>(`/families/${family.id}/doctor`).then((r) => r.data || null).catch(() => null)
      setDoctor(assigned)
      setEvents(audit.data.items)
      setAuditTotal(audit.data.totalCount ?? audit.data.items.length)
      setAuditPage(1)
      setAuditPages(audit.data.totalPages ?? 1)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [loadMembers])
  useEffect(() => { void load() }, [load])

  async function loadMoreAudit() {
    setLoadingMore(true)
    try {
      const next = auditPage + 1
      const { data } = await apiClient.get<PagedResult<AuditDto>>('/audit', { params: { page: next, pageSize: AUDIT_PAGE_SIZE } })
      setEvents((current) => [...current, ...data.items.filter((item) => !current.some((existing) => existing.id === item.id))])
      setAuditPage(next)
      setAuditPages(data.totalPages ?? next)
    } catch {
      setMessage('More access history could not be loaded. Try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function toggleConsent(owner: MemberDto, consent: ConsentDto) {
    const next = nextConsentStatus(consent)
    setBusy(true)
    try {
      await apiClient.put(`/members/${owner.id}/consents/${consent.category}`, { status: next })
      setMessage(`${owner.displayName} · ${consentLabels[consent.category] ?? consent.category}: ${next === 'Granted' ? 'granted' : 'revoked'}.`)
      await loadMembers()
    } catch {
      setMessage('Consent could not be changed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const minors = rows.filter((row) => row.member.role === 'MinorMember')
  const managed = [...(self ? [self] : []), ...minors]
  const grantedCount = managed.reduce((sum, row) => sum + row.consents.filter((consent) => consent.status === 'Granted').length, 0)
  const consentTotal = managed.reduce((sum, row) => sum + row.consents.length, 0)

  return (
    <div className="fv-page privacy-access">
      <PrivacyHero
        eyebrow="Privacy & access"
        title="Privacy & Access"
        purpose="Manage doctor consent for yourself and the minors in your family, and see who accessed your family’s data."
        note="Adult privacy stays independent. Adults’ private items and settings are never shown here."
      />
      {message && <p role="status" className="pa-status">{message}</p>}
      {status === 'loading' ? <LoadingState label="Loading family privacy" /> : status === 'error' ? (
        <ErrorState message="Family privacy could not be loaded." onRetry={() => void load()} />
      ) : (
        <>
          <div className="pa-stats">
            <StatTile label="Minors you manage" value={minors.length} hint="Guardian-managed profiles" />
            <StatTile label="Consents granted" value={`${grantedCount}/${consentTotal}`} hint="You and your minors" />
            <StatTile label="Recorded access" value={auditTotal} hint="Entries in access history" />
            <StatTile label="Family doctor" value={doctor ? 'Assigned' : 'None'} hint={doctor ? doctor.displayName : 'No doctor connected'} />
          </div>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'members', label: 'Member permissions' },
              { id: 'doctor', label: 'Doctor access' },
              { id: 'history', label: 'Access history' },
              { id: 'rules', label: 'Privacy rules' },
            ]}
          >
            {tab === 'members' && (
              <div className="pa-members">
                {self && (
                  <article className="pa-card pa-member">
                    <div className="pa-member__head"><Avatar text={initials(self.member.displayName)} /><div><h2>{self.member.displayName}</h2><p>You · Family Head</p></div><Chip tone="info">You</Chip></div>
                    <ConsentRows consents={self.consents} owner={self.member.displayName} busy={busy} onToggle={(consent) => void toggleConsent(self.member, consent)} />
                  </article>
                )}
                {rows.length === 0 ? (
                  <EmptyState title="Only you in this family" message="You're managing your own health. Invite family members from My Family any time." />
                ) : rows.map(({ member, sharedCount, consents }) => (
                  <article className="pa-card pa-member" key={member.id}>
                    <div className="pa-member__head">
                      <Avatar text={initials(member.displayName)} />
                      <div><h2>{member.displayName}</h2><p>{member.role === 'MinorMember' ? 'Guardian managed by you' : 'Manages their own privacy'}</p></div>
                      <Chip tone={member.role === 'MinorMember' ? 'minor' : 'adult'}>{member.role === 'MinorMember' ? 'Minor' : 'Adult'}</Chip>
                    </div>
                    {member.role === 'MinorMember' ? (
                      <ConsentRows consents={consents} owner={member.displayName} busy={busy} onToggle={(consent) => void toggleConsent(member, consent)} />
                    ) : (
                      <p className="pa-muted">{sharedCount === 0 ? 'Nothing shared with you.' : `${sharedCount} item${sharedCount === 1 ? '' : 's'} shared with you.`} Their other settings stay private.</p>
                    )}
                  </article>
                ))}
                <p className="pa-muted">Relationships are managed in <Link to="/family">My Family</Link>.</p>
              </div>
            )}
            {tab === 'doctor' && (
              <div className="pa-stack">
                <section className="pa-card" aria-labelledby="assigned-doctor-heading">
                  <div className="pa-card__head"><div><p className="pa-eyebrow">Family doctor</p><h2 id="assigned-doctor-heading">Assigned doctor</h2></div></div>
                  {doctor ? (
                    <div className="pa-member__head">
                      <Avatar text={initials(doctor.displayName.replace(/^Dr\.?\s*/i, ''))} />
                      <div><h3>{doctor.displayName}</h3><p>{[doctor.specialty, doctor.clinic, doctor.city ?? doctor.district].filter(Boolean).join(' · ') || 'Family doctor'}</p></div>
                      <Link className="pa-btn" to="/my-doctor">My Doctor</Link>
                    </div>
                  ) : (
                    <p className="pa-muted">No family doctor is connected. <Link to="/my-doctor">Find a doctor in My Doctor</Link>.</p>
                  )}
                </section>
                <RuleCards rules={doctorRules} />
              </div>
            )}
            {tab === 'history' && (
              <AuditTimeline events={events} canLoadMore={auditPage < auditPages} loadingMore={loadingMore} onLoadMore={() => void loadMoreAudit()} />
            )}
            {tab === 'rules' && <RuleCards rules={privacyRules} />}
          </Tabs>
        </>
      )}
    </div>
  )
}
