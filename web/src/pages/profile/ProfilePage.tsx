// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Profile settings for every portal: the signed-in user's own details, display name and password.
// Only displayName and the password are editable — the backend exposes no other self-service edits.
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ErrorState, LoadingState } from '../../components/shared/ViewState'
import { profileApi, type MyProfileDto } from '../../services/apiClient'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { signedIn } from '../../store/slices/authSlice'
import { extractErrorMessage, formatDateTime } from '../family/threePortalUtils'
import { passwordStrength } from './passwordStrength'

const accountTypeLabel: Record<string, string> = { FamilyUser: 'Family account', Doctor: 'Doctor', Admin: 'Clinic administrator' }
const familyRoleLabel: Record<string, string> = { Head: 'Family Head', AdultMember: 'Adult member', MinorMember: 'Minor member' }

type SectionId = 'personal' | 'account' | 'security'
const sections: { id: SectionId; label: string; hint: string }[] = [
  { id: 'personal', label: 'Personal details', hint: 'Your display name' },
  { id: 'account', label: 'Account information', hint: 'Identity and family' },
  { id: 'security', label: 'Security', hint: 'Change password' },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

function Tile({ label, value, helper }: { label: string; value?: string | null; helper?: string }) {
  return (
    <div className="ps-tile">
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
      {helper && <small>{helper}</small>}
    </div>
  )
}

function PasswordField({ name, label, autoComplete, value, onChange }: {
  name: string; label: string; autoComplete: string; value: string; onChange: (v: string) => void
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="ps-field">
      {label}
      <span className="ps-password">
        <input name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required
          minLength={name === 'currentPassword' ? undefined : 8} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="ps-eye" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="M3 3l18 18" />}</svg>
        </button>
      </span>
    </label>
  )
}

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [profile, setProfile] = useState<MyProfileDto | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState<SectionId>('personal')
  const [displayName, setDisplayName] = useState('')
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const { data } = await profileApi.getMine()
      setProfile(data)
      setDisplayName(data.displayName)
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
    const trimmed = displayName.trim()
    setBusy(true)
    try {
      const { data } = await profileApi.updateMine(trimmed)
      setProfile(data)
      setDisplayName(data.displayName)
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
    if (pw.newPassword !== pw.confirmPassword) {
      setMessage('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await profileApi.changePassword(pw.currentPassword, pw.newPassword)
      form.reset()
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage('Password changed.')
    } catch (error) {
      setMessage(extractErrorMessage(error, 'The password could not be changed. Check your current password.'))
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') return <LoadingState label="Loading your profile" />
  if (status === 'error' || !profile) return <ErrorState message="Your profile could not be loaded." onRetry={() => void load()} />

  const trimmed = displayName.trim()
  const nameValid = trimmed.length >= 2 && trimmed.length <= 120
  const nameChanged = trimmed !== profile.displayName
  const strength = passwordStrength(pw.newPassword)
  const roleLabel = accountTypeLabel[profile.userType] ?? profile.userType
  const sex = profile.sexForClinicalReference === 'NotSpecified' ? 'Not specified' : profile.sexForClinicalReference
  const headHelper = 'Changed by your Family Head or support'

  return (
    <div className="page-stack profile-settings">
      <header className="ps-hero">
        <p className="ps-hero__eyebrow">Account</p>
        <h1>Profile settings</h1>
        <p>Your own account details, display name and password.</p>
        <div className="ps-chips">
          <span className="ps-chip">{roleLabel}</span>
          {profile.familyRole && <span className="ps-chip">{familyRoleLabel[profile.familyRole] ?? profile.familyRole}</span>}
          <span className="ps-chip ps-chip--ok"><span className="ps-dot" aria-hidden="true" />Signed in</span>
        </div>
      </header>

      {message && <p role="status" className="status-banner">{message}</p>}

      <div className="ps-layout">
        <aside className="ps-side">
          <div className="ps-card ps-identity">
            <div className="ps-avatar" aria-hidden="true">{initials(profile.displayName)}</div>
            <div>
              <strong>{profile.displayName}</strong>
              <span>{profile.email}</span>
              <span className="ps-chip ps-chip--soft">{roleLabel}</span>
              {profile.familyRole && profile.familyName && (
                <small>{profile.familyName}{profile.familyCode ? ` · ${profile.familyCode}` : ''}</small>
              )}
            </div>
          </div>
          <nav className="ps-nav" aria-label="Profile sections">
            {sections.map((s) => (
              <button key={s.id} type="button" className="ps-nav__item" aria-current={active === s.id ? 'true' : undefined}
                onClick={() => setActive(s.id)}>
                <strong>{s.label}</strong>
                <span>{s.hint}</span>
              </button>
            ))}
          </nav>
          <p className="ps-note">This page is only for you. Nobody else in your family or clinic can see or change it here.</p>
        </aside>

        <div className="ps-main">
          {active === 'personal' && (
            <section className="ps-card" aria-labelledby="ps-personal">
              <h2 id="ps-personal">Personal details</h2>
              <p className="ps-caption">This is the name shown across Family Veda.</p>
              <form className="ps-form" onSubmit={(e) => void saveName(e)}>
                <label className="ps-field">
                  Display name
                  <input name="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    minLength={2} maxLength={120} required aria-invalid={!nameValid} />
                </label>
                {!nameValid && <small className="ps-error">Use 2 to 120 characters.</small>}
                <div className="ps-actions">
                  <button className="button" type="button" disabled={busy || displayName === profile.displayName}
                    onClick={() => setDisplayName(profile.displayName)}>Discard</button>
                  <button className="button button--primary" type="submit" disabled={busy || !nameValid || !nameChanged}>Save</button>
                </div>
              </form>
              {profile.userType === 'Doctor' && (
                <p className="ps-caption">Clinic, specialty and availability are managed in <Link to="/doctor-profile">Doctor profile</Link>.</p>
              )}
            </section>
          )}

          {active === 'account' && (
            <section className="ps-card" aria-labelledby="ps-account">
              <h2 id="ps-account">Account information</h2>
              <p className="ps-caption">Read-only details linked to your identity.</p>
              <dl className="ps-tiles">
                <Tile label="Email" value={profile.email} helper="Contact support to change" />
                <Tile label="Account type" value={roleLabel} />
                <Tile label="Member since" value={formatDateTime(profile.createdAt)} />
                {profile.familyRole && (
                  <>
                    <Tile label="Family role" value={familyRoleLabel[profile.familyRole] ?? profile.familyRole} />
                    <Tile label="Family" value={profile.familyName} />
                    <Tile label="Family Code" value={profile.familyCode} />
                    <Tile label="Date of birth" value={profile.dateOfBirth} helper={headHelper} />
                    <Tile label="Sex for clinical reference" value={sex} helper={headHelper} />
                  </>
                )}
              </dl>
              {profile.familyRole && <p className="ps-caption">Manage members and consent in <Link to="/family">Family</Link>.</p>}
              {profile.userType === 'Doctor' && <p className="ps-caption">Professional details live in <Link to="/doctor-profile">Doctor profile</Link>.</p>}
            </section>
          )}

          {active === 'security' && (
            <section className="ps-card" aria-labelledby="ps-security">
              <h2 id="ps-security">Security</h2>
              <p className="ps-caption">Change the password you use to sign in.</p>
              <form className="ps-form" onSubmit={(e) => void changePassword(e)}>
                <PasswordField name="currentPassword" label="Current password" autoComplete="current-password"
                  value={pw.currentPassword} onChange={(v) => setPw({ ...pw, currentPassword: v })} />
                <PasswordField name="newPassword" label="New password" autoComplete="new-password"
                  value={pw.newPassword} onChange={(v) => setPw({ ...pw, newPassword: v })} />
                <div className="ps-strength" data-score={strength.score}>
                  <div className="ps-strength__bar" aria-hidden="true">{[1, 2, 3, 4].map((i) => <span key={i} className={i <= strength.score ? 'on' : ''} />)}</div>
                  <small aria-live="polite">Strength: {strength.label}</small>
                </div>
                <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password"
                  value={pw.confirmPassword} onChange={(v) => setPw({ ...pw, confirmPassword: v })} />
                <div className="ps-actions">
                  <button className="button button--primary" type="submit" disabled={busy}>Change password</button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
