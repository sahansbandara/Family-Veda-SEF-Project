// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// My Family, per Family_Veda_Family_Head_Mockup: Members | Join Requests | Invitations | Family Settings.
// The active tab lives in ?tab= so the dashboard can deep-link (e.g. /family?tab=requests).
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../../components/shared/ViewState'
import { apiClient, familyLifecycleApi, threePortalApi, type FamilyDto } from '../../services/apiClient'
import '../../styles/family-tabs.css'
import { FamilyInvitationsTab } from './FamilyInvitationsTab'
import { FamilyJoinRequestsTab } from './FamilyJoinRequestsTab'
import { FamilyMembersTab } from './FamilyMembersTab'
import { FamilySettingsTab } from './FamilySettingsTab'

const tabs = [
  { id: 'members', label: 'Members' },
  { id: 'requests', label: 'Join Requests' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'settings', label: 'Family Settings' },
] as const
type TabId = (typeof tabs)[number]['id']

export function FamilyPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: TabId = tabs.some((item) => item.id === requested) ? (requested as TabId) : 'members'

  const [family, setFamily] = useState<FamilyDto | null>(null)
  const [counts, setCounts] = useState({ requests: 0, invitations: 0 })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')

  // `silent` refreshes after a tab action without swapping the page for a spinner.
  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading')
    try {
      const { data } = await apiClient.get<FamilyDto>('/families/me')
      setFamily(data)
      setStatus('ready')
      // Tab badges are a convenience; a failure here must not hide the page.
      const [requests, invitations, incoming] = await Promise.allSettled([
        threePortalApi.getFamilyJoinRequests(data.id, 'Pending'),
        familyLifecycleApi.getInvitations(data.id),
        familyLifecycleApi.getIncomingInvitations(),
      ])
      setCounts({
        requests:
          (requests.status === 'fulfilled' ? requests.value.data.length : 0) +
          (incoming.status === 'fulfilled' ? incoming.value.data.length : 0),
        invitations: invitations.status === 'fulfilled' ? invitations.value.data.filter((x) => x.status === 'Pending').length : 0,
      })
    } catch {
      if (!silent) setStatus('error')
    }
  }, [])

  const refresh = useCallback(() => load(true), [load])

  useEffect(() => {
    void load()
  }, [load])

  if (status === 'loading') return <LoadingState label="Loading your family" />
  if (status === 'error') return <ErrorState message="Family details could not be loaded." onRetry={() => void load()} />
  if (!family) return <EmptyState title="No family profile" message="Create a family through onboarding first." />

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setMessage(`Family Code ${code} copied.`)
    } catch {
      setMessage('The code could not be copied. Select it and copy it manually.')
    }
  }

  const badge = (id: TabId) => (id === 'requests' ? counts.requests : id === 'invitations' ? counts.invitations : 0)

  return (
    <div className="page-stack">
      <header className="fv-hero">
        <div>
          <p className="fv-eyebrow">Membership</p>
          <h1>My Family</h1>
          <p>Manage members, join requests, invitations and family settings. Adult health data stays private unless shared.</p>
        </div>
        {family.familyCode && (
          <div className="family-hero-card">
            <small>Family Code</small>
            <strong className="family-code">{family.familyCode}</strong>
            <span>Adults still need your approval to join.</span>
            <button type="button" className="family-hero-copy" onClick={() => void copyCode(family.familyCode ?? '')}>
              Copy code
            </button>
          </div>
        )}
      </header>

      <div className="tab-bar" role="tablist" aria-label="My Family sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => {
              setMessage('')
              setParams({ tab: item.id }, { replace: true })
            }}
          >
            {item.label}
            {badge(item.id) > 0 && <span className="tab-count">{badge(item.id)}</span>}
          </button>
        ))}
      </div>

      {message && <p role="status" className="status-banner">{message}</p>}

      {tab === 'members' && (
        <FamilyMembersTab
          family={family}
          pending={counts}
          onInviteAdult={() => setParams({ tab: 'invitations' }, { replace: true })}
          onChanged={refresh}
          onMessage={setMessage}
        />
      )}
      {tab === 'requests' && <FamilyJoinRequestsTab familyId={family.id} onChanged={refresh} onMessage={setMessage} />}
      {tab === 'invitations' && <FamilyInvitationsTab familyId={family.id} onChanged={refresh} onMessage={setMessage} />}
      {tab === 'settings' && <FamilySettingsTab family={family} onChanged={refresh} onMessage={setMessage} />}
    </div>
  )
}
