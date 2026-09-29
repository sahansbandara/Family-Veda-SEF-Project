// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Privacy page for both family portals (docs/Three_Dashboards_UX_Plan.md §3 "Privacy & Access", §4 "Privacy").
// Family sharing (SharedWithFamilyHead) and doctor clinical consent are two separate controls (RULE 8).
import { useCallback, useEffect, useState } from 'react'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { useAppSelector } from '../../store/hooks'
import {
  apiClient,
  type AuditDto,
  type ConsentDto,
  type FamilyDto,
  type HealthRecordDto,
  type LabReportDto,
  type MemberDto,
  type PagedResult,
} from '../../services/apiClient'
import { Badge, PageHero } from '../dashboard/dashboardParts'
import { describeAccessEvent } from './privacyWording'

type SharedItem = { id: string; kind: 'report' | 'record'; title: string; date?: string; shared: boolean }

const consentLabels: Record<string, string> = {
  Conditions: 'Conditions',
  VitalsSummary: 'Vitals summary',
  HereditaryFlags: 'Family history (hereditary flags)',
}

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

/** Adult Member: per-item family sharing + clinical consent for the Family Doctor. */
function AdultPrivacy() {
  const [me, setMe] = useState<MemberDto | null>(null)
  const [items, setItems] = useState<SharedItem[]>([])
  const [consents, setConsents] = useState<ConsentDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
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
    try {
      await apiClient.patch(url, { sharedWithFamilyHead: !item.shared })
      setMessage(item.shared ? `"${item.title}" is now private from the Family Head.` : `"${item.title}" is now shared with the Family Head.`)
      await load()
    } catch {
      setMessage('Sharing could not be changed. Try again.')
    }
  }

  async function toggleConsent(consent: ConsentDto) {
    if (!me) return
    const next = consent.status === 'Granted' ? 'Revoked' : 'Granted'
    try {
      await apiClient.put(`/members/${me.id}/consents/${consent.category}`, { status: next })
      setMessage(`${consentLabels[consent.category] ?? consent.category}: ${next === 'Granted' ? 'granted' : 'revoked'}.`)
      await load()
    } catch {
      setMessage('Consent could not be changed. Try again.')
    }
  }

  const sharedCount = items.filter((item) => item.shared).length

  return (
    <div className="fv-page">
      <PageHero
        eyebrow="Privacy"
        title="Privacy"
        purpose="Family sharing and doctor access are two separate controls. Everything is private from your Family Head until you share it."
        action={status === 'ready' ? <Badge tone="info">{sharedCount} shared · {items.length - sharedCount} private</Badge> : undefined}
      />
      {message && <p role="status" className="status-banner">{message}</p>}
      {status === 'loading' ? <LoadingState label="Loading your privacy settings" /> : status === 'error' ? (
        <ErrorState message="Your privacy settings could not be loaded." onRetry={() => void load()} />
      ) : (
        <div className="fv-gridhalf">
          <section className="fv-panel" aria-labelledby="family-sharing-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">Family Head</p><h2 id="family-sharing-heading">Family Sharing</h2><p>Choose, item by item, what your Family Head can see.</p></div></div>
            {items.length === 0 ? (
              <EmptyState title="Nothing to share yet" message="Reports and records you add in My Health will appear here, private by default." />
            ) : (
              <div className="fv-stack">
                {items.map((item) => (
                  <div className="fv-item" key={`${item.kind}-${item.id}`}>
                    <div className="fv-row">
                      <b>{item.title}</b>
                      <Badge tone={item.shared ? 'info' : 'danger'}>{item.shared ? 'Shared' : 'Private'}</Badge>
                    </div>
                    <p>{item.kind === 'report' ? 'Lab report' : 'Health record'}{item.date ? ` · ${new Date(item.date).toLocaleDateString()}` : ''} · {item.shared ? 'Your Family Head can view this.' : 'Your Family Head cannot see this.'}</p>
                    <button type="button" className="fv-btn" onClick={() => void toggleSharing(item)}>
                      {item.shared ? 'Make private' : 'Share with Family Head'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="fv-panel" aria-labelledby="clinical-consent-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">Family Doctor</p><h2 id="clinical-consent-heading">Clinical Consent</h2><p>What your family doctor may use during a visit or a reviewed case. Revoking takes effect immediately.</p></div></div>
            {consents.length === 0 ? (
              <EmptyState title="No consent settings" message="Consent settings appear once your profile is linked to a family." />
            ) : (
              <div className="fv-stack">
                {consents.map((consent) => (
                  <div className="fv-item" key={consent.id}>
                    <div className="fv-row">
                      <b>{consentLabels[consent.category] ?? consent.category}</b>
                      <Badge tone={consent.status === 'Granted' ? 'ok' : consent.status === 'PendingReaffirmation' ? 'warn' : 'muted'}>
                        {consent.status === 'Granted' ? 'Granted' : consent.status === 'PendingReaffirmation' ? 'Needs your confirmation' : consent.status === 'Revoked' ? 'Revoked' : 'Not granted'}
                      </Badge>
                    </div>
                    <button type="button" className="fv-btn" onClick={() => void toggleConsent(consent)}>
                      {consent.status === 'Granted' ? 'Revoke' : 'Grant'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

type MemberSharing = { member: MemberDto; sharedCount: number }

/** Family Head: who shares what + recent access to head-visible data. Private adult items are never listed. */
function HeadPrivacy() {
  const [rows, setRows] = useState<MemberSharing[]>([])
  const [events, setEvents] = useState<AuditDto[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [{ data: family }, { data: mine }, audit] = await Promise.all([
        apiClient.get<FamilyDto>('/families/me'),
        apiClient.get<MemberDto>('/members/me'),
        apiClient.get<PagedResult<AuditDto>>('/audit', { params: { page: 1, pageSize: 10 } }),
      ])
      const others = family.members.filter((member) => member.id !== mine.id)
      // For adults the API returns only the items they chose to share (Phase 2), so a count is safe.
      const sharing = await Promise.all(others.map(async (member): Promise<MemberSharing> => {
        if (member.role === 'MinorMember') return { member, sharedCount: 0 }
        const [reports, records] = await Promise.all([
          apiClient.get<LabReportDto[]>(`/members/${member.id}/lab-reports`).catch(() => ({ data: [] as LabReportDto[] })),
          apiClient.get<PagedResult<HealthRecordDto>>(`/members/${member.id}/records`, { params: { page: 1, pageSize: 1 } })
            .catch(() => ({ data: { items: [], totalCount: 0 } as unknown as PagedResult<HealthRecordDto> })),
        ])
        return { member, sharedCount: reports.data.length + (records.data.totalCount ?? records.data.items.length) }
      }))
      setRows(sharing)
      setEvents(audit.data.items)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  return (
    <div className="fv-page">
      <PageHero
        eyebrow="Privacy & access"
        title="Privacy & Access"
        purpose="Who shares what with you, and who viewed your family's data. Adults' private items are never shown here."
      />
      {status === 'loading' ? <LoadingState label="Loading family privacy" /> : status === 'error' ? (
        <ErrorState message="Family privacy could not be loaded." onRetry={() => void load()} />
      ) : (
        <div className="fv-gridhalf">
          <section className="fv-panel" aria-labelledby="consent-sharing-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">Per member</p><h2 id="consent-sharing-heading">Consent &amp; Sharing</h2><p>Minors are managed by you. Adults decide for themselves.</p></div></div>
            {rows.length === 0 ? (
              <EmptyState title="Only you in this family" message="You're managing your own health. Invite family members from My Family any time." />
            ) : (
              <div className="fv-stack">
                {rows.map(({ member, sharedCount }) => (
                  <div className="fv-item" key={member.id}>
                    <div className="fv-row">
                      <b>{member.displayName}</b>
                      <Badge tone={member.role === 'MinorMember' ? 'warn' : 'info'}>{member.role === 'MinorMember' ? 'Minor' : 'Adult'}</Badge>
                    </div>
                    <p>
                      {member.role === 'MinorMember'
                        ? 'Guardian managed. You control this profile and its clinical consent.'
                        : sharedCount === 0 ? 'Nothing shared with you.' : `${sharedCount} item${sharedCount === 1 ? '' : 's'} shared with you.`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="fv-panel" aria-labelledby="recent-access-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">History</p><h2 id="recent-access-heading">Recent Access</h2><p>Access to data you can see. Clinical content is never shown in this list.</p></div></div>
            {events.length === 0 ? (
              <EmptyState title="No recent access" message="When someone views or changes your family's data, it will be listed here." />
            ) : (
              <ul className="fv-timeline">
                {events.map((event) => (
                  <li className="fv-event" key={event.id}>
                    <strong>{describeAccessEvent(event.eventType)}</strong>
                    <p>{new Date(event.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
