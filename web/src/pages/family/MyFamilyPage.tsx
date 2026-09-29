// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Adult Member "My Family" (docs/Three_Dashboards_UX_Plan.md §4): membership card + options.
// Leaving or starting a household moves the member row with its history (DECISIONS 2026-09-29c)
// and resets family sharing to private (FamilyMembershipMover).
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import {
  apiClient,
  familyLifecycleApi,
  refreshSession,
  threePortalApi,
  type DoctorSummaryDto,
  type FamilyDto,
  type MemberDto,
  type RosterMemberDto,
} from '../../services/apiClient'
import { useAppDispatch } from '../../store/hooks'
import { mapAuthResponse, signedIn, signedOut } from '../../store/slices/authSlice'
import { Badge, PageHero } from '../dashboard/dashboardParts'
import { extractErrorMessage } from './threePortalUtils'

type Pending = 'start' | 'leave' | null

export function MyFamilyPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [family, setFamily] = useState<FamilyDto | null>(null)
  const [roster, setRoster] = useState<RosterMemberDto[]>([])
  const [me, setMe] = useState<MemberDto | null>(null)
  const [doctor, setDoctor] = useState<DoctorSummaryDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [confirming, setConfirming] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [{ data: familyData }, { data: mine }] = await Promise.all([
        apiClient.get<FamilyDto>('/families/me'),
        apiClient.get<MemberDto>('/members/me'),
      ])
      const [rosterResponse, doctorResponse] = await Promise.all([
        familyLifecycleApi.getRoster(familyData.id),
        threePortalApi.getFamilyDoctor(familyData.id).catch(() => ({ data: null })),
      ])
      setFamily(familyData); setMe(mine); setRoster(rosterResponse.data); setDoctor(doctorResponse.data || null)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  async function confirm() {
    if (!confirming) return
    setBusy(true)
    let familyName: string
    try {
      familyName = (await familyLifecycleApi.leaveFamily(confirming === 'start')).data.familyName
    } catch (error) {
      setMessage(extractErrorMessage(error, 'This could not be completed. Try again.'))
      setBusy(false)
      return
    }
    // The move is committed on the server. The member is now Head of their own household, so the
    // session must carry the new role. If the refresh fails, sign out rather than keep a stale role.
    setConfirming(null)
    try {
      const session = await refreshSession()
      if (!session) throw new Error('no session')
      dispatch(signedIn(mapAuthResponse(session)))
      setMessage(`You now manage your own household, ${familyName}. Your health history came with you and is private.`)
      navigate('/dashboard')
    } catch {
      dispatch(signedOut())
    } finally {
      setBusy(false)
    }
  }

  const head = roster.find((member) => member.role === 'Head')

  return (
    <div className="fv-page">
      <PageHero
        eyebrow="My family"
        title="My Family"
        purpose="Your family membership and options. Your health information stays yours wherever you go."
      />
      {message && <p role="status" className="status-banner">{message}</p>}
      {status === 'loading' ? <LoadingState label="Loading your family" /> : status === 'error' || !family ? (
        <ErrorState message="Your family could not be loaded." onRetry={() => void load()} />
      ) : (
        <div className="fv-gridhalf">
          <section className="fv-panel" aria-labelledby="membership-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">Membership</p><h2 id="membership-heading">{family.name}</h2></div><Badge tone="info">Adult Member</Badge></div>
            <div className="fv-stack">
              <div className="fv-item"><b>Family Head</b><p>{head?.displayName ?? 'Not set'}</p></div>
              <div className="fv-item"><b>Your role</b><p>Adult Member{me ? ` · ${me.displayName}` : ''}</p></div>
              <div className="fv-item"><b>Family Doctor</b><p>{doctor ? `${doctor.displayName}${doctor.specialty ? ` · ${doctor.specialty}` : ''}` : 'Not chosen yet. The Family Head chooses the family doctor.'}</p></div>
              <div className="fv-item"><b>Members</b><p>{roster.length} in this family. Names and roles only; nobody sees your private health data.</p></div>
            </div>
          </section>
          <section className="fv-panel" aria-labelledby="family-options-heading">
            <div className="fv-head"><div><p className="fv-eyebrow">Options</p><h2 id="family-options-heading">Family Options</h2></div></div>
            <div className="fv-stack">
              <div className="fv-item">
                <b>Start My Own Family</b>
                <p>Create your own household and become its Family Head. Your account and health history come with you.</p>
                <button type="button" className="fv-btn fv-btn--primary" onClick={() => setConfirming('start')}>Start My Own Family</button>
              </div>
              <div className="fv-item">
                <b>Leave Family</b>
                <p>You'll manage your own health on your own. Items you shared with this family become private again.</p>
                <button type="button" className="fv-btn" onClick={() => setConfirming('leave')}>Leave Family</button>
              </div>
              <div className="fv-item">
                <b>Join using a Family Code</b>
                <p>Possible once you're in your own household. Your join requests are listed on the join page.</p>
                <Link className="fv-btn" to="/join-family">Open join page</Link>
              </div>
            </div>
          </section>
        </div>
      )}
      {confirming && (
        <div className="fv-panel" role="alertdialog" aria-labelledby="confirm-heading" aria-describedby="confirm-body">
          <h2 id="confirm-heading">{confirming === 'start' ? 'Start your own family?' : `Leave ${family?.name ?? 'this family'}?`}</h2>
          <p id="confirm-body">
            You'll become the Family Head of a new household with its own Family Code. Your records, labs and cases move with you and stay private.
            Access that {family?.name ?? 'this family'}'s doctor had through this family ends.
          </p>
          <div className="fv-actions">
            <button type="button" className="fv-btn fv-btn--primary" disabled={busy} onClick={() => void confirm()}>
              {busy ? 'Working…' : confirming === 'start' ? 'Start My Own Family' : 'Leave Family'}
            </button>
            <button type="button" className="fv-btn" disabled={busy} onClick={() => setConfirming(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
