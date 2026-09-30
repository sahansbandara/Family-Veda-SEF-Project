// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Profile settings for every portal: the signed-in user's own details, display name and password.
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { profileApi, type MyProfileDto } from '../../services/apiClient'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { signedIn } from '../../store/slices/authSlice'
import { PageHero } from '../dashboard/dashboardParts'
import { extractErrorMessage, formatDateTime } from '../family/threePortalUtils'

const accountTypeLabel: Record<string, string> = { FamilyUser: 'Family account', Doctor: 'Doctor', Admin: 'Clinic administrator' }
const familyRoleLabel: Record<string, string> = { Head: 'Family Head', AdultMember: 'Adult member', MinorMember: 'Minor member' }

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="muted">{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [profile, setProfile] = useState<MyProfileDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setProfile((await profileApi.getMine()).data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const displayName = String(new FormData(event.currentTarget).get('displayName') ?? '').trim()
    setBusy(true)
    try {
      const { data } = await profileApi.updateMine(displayName)
      setProfile(data)
      if (user) dispatch(signedIn({ ...user, name: data.displayName }))
      setMessage('Profile saved.')
    } catch (error) {
      setMessage(extractErrorMessage(error, 'Your profile could not be saved.'))
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    if (newPassword !== String(data.get('confirmPassword') ?? '')) {
      setMessage('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await profileApi.changePassword(currentPassword, newPassword)
      form.reset()
      setMessage('Password changed.')
    } catch (error) {
      setMessage(extractErrorMessage(error, 'The password could not be changed. Check your current password.'))
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') return <LoadingState label="Loading your profile" />
  if (status === 'error' || !profile) return <ErrorState message="Your profile could not be loaded." onRetry={() => void load()} />

  return (
    <div className="page-stack">
      <PageHero eyebrow="Account" title="Profile settings" purpose="Your own account details. Only you can see this page." />

      {message && <p role="status" className="status-banner">{message}</p>}

      <section className="panel" aria-label="Profile details">
        <h2>Profile details</h2>
        <dl className="profile-details">
          <Detail label="Name" value={profile.displayName} />
          <Detail label="Email" value={profile.email} />
          <Detail label="Account type" value={accountTypeLabel[profile.userType] ?? profile.userType} />
          <Detail label="Member since" value={formatDateTime(profile.createdAt)} />
          {profile.familyRole && (
            <>
              <Detail label="Family role" value={familyRoleLabel[profile.familyRole] ?? profile.familyRole} />
              <Detail label="Family" value={profile.familyName} />
              <Detail label="Family Code" value={profile.familyCode} />
              <Detail label="Date of birth" value={profile.dateOfBirth} />
              <Detail label="Sex for clinical reference" value={profile.sexForClinicalReference === 'NotSpecified' ? 'Not specified' : profile.sexForClinicalReference} />
            </>
          )}
        </dl>
        {profile.userType === 'Doctor' && (
          <p className="muted">
            Clinic, specialty and availability are managed in <Link to="/doctor-profile">Doctor profile</Link>.
          </p>
        )}
      </section>

      <section className="panel" aria-label="Edit profile">
        <h2>Edit profile</h2>
        <form className="form-grid" onSubmit={(event) => void saveName(event)}>
          <label>
            Display name
            <input name="displayName" defaultValue={profile.displayName} minLength={2} maxLength={120} required />
          </label>
          <button className="button button--primary" type="submit" disabled={busy}>Save</button>
        </form>
      </section>

      <section className="panel" aria-label="Change password">
        <h2>Change password</h2>
        <form className="form-grid" onSubmit={(event) => void changePassword(event)}>
          <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
          <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
          <button className="button button--primary" type="submit" disabled={busy}>Change password</button>
        </form>
      </section>
    </div>
  )
}
