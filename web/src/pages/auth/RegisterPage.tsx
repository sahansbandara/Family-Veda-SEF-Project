import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { apiClient } from '../../services/apiClient'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { registerFamilyUser, signedIn } from '../../store/slices/authSlice'
import logoUrl from '../../assets/logo.png'

const SRI_LANKAN_NIC_REGEX = /^([0-9]{9}[vVxX]|[0-9]{12})$/

const headRegistrationSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(120, 'Display name must not exceed 120 characters.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address (e.g. name@example.invalid).'),
  nic: z
    .string()
    .trim()
    .refine(
      (val) => SRI_LANKAN_NIC_REGEX.test(val),
      'Enter a valid synthetic NIC (9 digits + V/X or 12 digits, e.g. 200012345678 or 991234567V).',
    ),
  address: z
    .string()
    .trim()
    .min(5, 'Residential address must be at least 5 characters.')
    .max(250, 'Residential address must not exceed 250 characters.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must not exceed 128 characters.'),
})

const adultRegistrationSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(120, 'Display name must not exceed 120 characters.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address (e.g. name@example.invalid).'),
  invitationToken: z
    .string()
    .trim()
    .min(10, 'Enter the invitation token provided by your family head.'),
  dateOfBirth: z
    .string()
    .min(1, 'Enter your date of birth.')
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`)
      const adultCutoff = new Date()
      adultCutoff.setUTCFullYear(adultCutoff.getUTCFullYear() - 18)
      return !Number.isNaN(date.valueOf()) && date <= adultCutoff
    }, 'Adult members must be at least 18 years old.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must not exceed 128 characters.'),
})

type FieldKey = 'displayName' | 'email' | 'nic' | 'address' | 'password' | 'invitationToken' | 'dateOfBirth'

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user, status, error: authError } = useAppSelector((state) => state.auth)
  const [accountType, setAccountType] = useState<'HEAD' | 'ADULT'>('HEAD')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [nic, setNic] = useState('')
  const [address, setAddress] = useState('')
  const [invitationToken, setInvitationToken] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [generalError, setGeneralError] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (globalThis.localStorage?.getItem('fv-theme') as 'light' | 'dark') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setAppTheme = (nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    try {
      globalThis.localStorage?.setItem('fv-theme', nextTheme)
    } catch {
      // persistence is a convenience; ignore a blocked or unavailable store
    }
  }

  if (isAuthenticated) {
    const isUnverifiedHead =
      user?.familyHeadVerificationStatus !== 'VERIFIED' && (user?.role === 'FAMILY_HEAD' || user?.role === 'ONBOARDING')
    return <Navigate to={isUnverifiedHead ? '/family-head-status' : user?.role === 'ONBOARDING' ? '/onboarding' : '/dashboard'} replace />
  }

  const clearFieldError = (key: FieldKey) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    }
    if (generalError) setGeneralError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (accountType === 'HEAD') {
      const parsed = headRegistrationSchema.safeParse({ displayName, email, nic, address, password })
      if (!parsed.success) {
        const formattedErrors: Partial<Record<FieldKey, string>> = {}
        for (const issue of parsed.error.issues) {
          const fieldName = issue.path[0] as FieldKey
          if (fieldName && !formattedErrors[fieldName]) {
            formattedErrors[fieldName] = issue.message
          }
        }
        setFieldErrors(formattedErrors)
        setGeneralError(parsed.error.issues[0]?.message ?? 'Please correct the highlighted errors.')
        return
      }

      setFieldErrors({})
      setGeneralError('')
      const result = await dispatch(registerFamilyUser(parsed.data))
      if (registerFamilyUser.fulfilled.match(result)) navigate('/family-head-status', { replace: true })
    } else {
      const parsed = adultRegistrationSchema.safeParse({ displayName, email, invitationToken, dateOfBirth, password })
      if (!parsed.success) {
        const formattedErrors: Partial<Record<FieldKey, string>> = {}
        for (const issue of parsed.error.issues) {
          const fieldName = issue.path[0] as FieldKey
          if (fieldName && !formattedErrors[fieldName]) {
            formattedErrors[fieldName] = issue.message
          }
        }
        setFieldErrors(formattedErrors)
        setGeneralError(parsed.error.issues[0]?.message ?? 'Please correct the highlighted errors.')
        return
      }

      setFieldErrors({})
      setGeneralError('')
      const result = await dispatch(
        registerFamilyUser({
          displayName: parsed.data.displayName,
          email: parsed.data.email,
          password: parsed.data.password,
        })
      )
      if (registerFamilyUser.fulfilled.match(result)) {
        try {
          await apiClient.post('/families/invitations/accept', {
            token: parsed.data.invitationToken.trim(),
            dateOfBirth: parsed.data.dateOfBirth,
          })
          dispatch(signedIn({ ...result.payload, role: 'MEMBER' }))
          navigate('/dashboard', { replace: true })
        } catch {
          setGeneralError('Account created, but invitation token is invalid, expired, or does not match this email.')
        }
      }
    }
  }

  return (
    <main className="login-page">
      {/* Top right clean theme toggle */}
      <div className="login-topbar">
        <div className="theme-toggle-group" role="group" aria-label="Theme mode switcher">
          <button
            type="button"
            className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setAppTheme('light')}
          >
            <span aria-hidden="true">☀️</span> Light
          </button>
          <button
            type="button"
            className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setAppTheme('dark')}
          >
            <span aria-hidden="true">🌙</span> Dark
          </button>
        </div>
      </div>

      {/* Central Registration Stage with interactive floating animated wings */}
      <div className="login-stage">
        {/* Left floating live indicators */}
        <aside className="login-wing login-wing--left" aria-hidden="true">
          <div className="live-floating-card live-floating-card--1">
            <span className="live-icon-badge">👨‍👩‍👧</span>
            <div>
              <strong>Family Circles</strong>
              <small><span className="pulse-dot" /> Multi-member care</small>
            </div>
          </div>
          <div className="live-floating-card live-floating-card--2">
            <span className="live-icon-badge">🧬</span>
            <div>
              <strong>Hereditary Tree</strong>
              <small>Familial risk mapping</small>
            </div>
          </div>
          <div className="live-floating-card live-floating-card--3">
            <span className="live-icon-badge">🛡️</span>
            <div>
              <strong>Granular Consent</strong>
              <small>Full data control</small>
            </div>
          </div>
        </aside>

        {/* Clean centered expanded registration card */}
        <div className="simple-login-card simple-login-card--wide">
          <div className="simple-login-brand">
            <img src={logoUrl} alt="Family Veda" width={56} height={56} />
            <h1>Family Veda</h1>
            <p>Family Portal</p>
          </div>

          <p className="eyebrow">Family registration</p>
          <h2 id="register-heading">Create account</h2>
          <p className="muted">
            {accountType === 'HEAD'
              ? 'Set up the account first, then create the family and your linked head profile.'
              : 'Register your adult profile and join an existing family using your invitation token.'}
          </p>

          <form onSubmit={submit} className="register-form-grid" noValidate>
            <label className="field field--full">
              <span>Account role</span>
              <select
                value={accountType}
                onChange={(event) => {
                  setAccountType(event.target.value as 'HEAD' | 'ADULT')
                  setFieldErrors({})
                  setGeneralError('')
                }}
                className="field-input"
              >
                <option value="HEAD">Family Head (Administers family & profiles)</option>
                <option value="ADULT">Adult Member (Joining with invitation token)</option>
              </select>
            </label>

            <label className="field">
              <span>Display name</span>
              <input
                value={displayName}
                autoComplete="name"
                placeholder="e.g. Sahan Bandara"
                className={fieldErrors.displayName ? 'field-input--error' : ''}
                onChange={(event) => {
                  setDisplayName(event.target.value)
                  clearFieldError('displayName')
                }}
                required
              />
              {fieldErrors.displayName && <span className="field-error-text" role="alert">{fieldErrors.displayName}</span>}
            </label>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                autoComplete="email"
                placeholder="name@example.invalid"
                className={fieldErrors.email ? 'field-input--error' : ''}
                onChange={(event) => {
                  setEmail(event.target.value)
                  clearFieldError('email')
                }}
                required
              />
              {fieldErrors.email && <span className="field-error-text" role="alert">{fieldErrors.email}</span>}
            </label>

            {accountType === 'HEAD' ? (
              <>
                <label className="field">
                  <span>Synthetic NIC</span>
                  <input
                    value={nic}
                    placeholder="e.g. 200012345678 or 991234567V"
                    maxLength={12}
                    className={fieldErrors.nic ? 'field-input--error' : ''}
                    onChange={(event) => {
                      setNic(event.target.value)
                      clearFieldError('nic')
                    }}
                    required
                  />
                  {fieldErrors.nic && <span className="field-error-text" role="alert">{fieldErrors.nic}</span>}
                </label>
                <label className="field">
                  <span>Residential address</span>
                  <input
                    value={address}
                    placeholder="e.g. 124 Temple Road, Colombo"
                    className={fieldErrors.address ? 'field-input--error' : ''}
                    onChange={(event) => {
                      setAddress(event.target.value)
                      clearFieldError('address')
                    }}
                    required
                  />
                  {fieldErrors.address && <span className="field-error-text" role="alert">{fieldErrors.address}</span>}
                </label>
              </>
            ) : (
              <>
                <label className="field">
                  <span>Invitation token</span>
                  <input
                    value={invitationToken}
                    placeholder="Paste 64-character token from family head"
                    className={fieldErrors.invitationToken ? 'field-input--error' : ''}
                    onChange={(event) => {
                      setInvitationToken(event.target.value)
                      clearFieldError('invitationToken')
                    }}
                    required
                  />
                  {fieldErrors.invitationToken && (
                    <span className="field-error-text" role="alert">{fieldErrors.invitationToken}</span>
                  )}
                </label>
                <label className="field">
                  <span>Date of birth</span>
                  <input
                    type="date"
                    value={dateOfBirth}
                    max={new Date(new Date().setUTCFullYear(new Date().getUTCFullYear() - 18)).toISOString().split('T')[0]}
                    className={fieldErrors.dateOfBirth ? 'field-input--error' : ''}
                    onChange={(event) => {
                      setDateOfBirth(event.target.value)
                      clearFieldError('dateOfBirth')
                    }}
                    required
                  />
                  {fieldErrors.dateOfBirth && (
                    <span className="field-error-text" role="alert">{fieldErrors.dateOfBirth}</span>
                  )}
                </label>
              </>
            )}

            <label className="field field--full">
              <span>Password</span>
              <input
                type="password"
                value={password}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={fieldErrors.password ? 'field-input--error' : ''}
                onChange={(event) => {
                  setPassword(event.target.value)
                  clearFieldError('password')
                }}
                required
              />
              {fieldErrors.password && <span className="field-error-text" role="alert">{fieldErrors.password}</span>}
            </label>
            {(generalError || authError) && <p className="form-error field--full" role="alert">{generalError || authError}</p>}
            <button type="submit" disabled={status === 'loading'} className="button button--primary button--full field--full">
              {status === 'loading' ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="privacy-note">Registering a synthetic clinician? <Link to="/register/doctor">Doctor registration</Link>.</p>
          <p className="privacy-note">Already registered? <Link to="/login">Sign in</Link>. Synthetic identities only.</p>
        </div>

        {/* Right floating live indicators */}
        <aside className="login-wing login-wing--right" aria-hidden="true">
          <div className="live-floating-card live-floating-card--4">
            <span className="live-icon-badge">⚡</span>
            <div>
              <strong>AI Triage Support</strong>
              <small>Verified by doctors</small>
            </div>
          </div>
          <div className="live-floating-card live-floating-card--5">
            <span className="live-icon-badge">📋</span>
            <div>
              <strong>Lab OCR Extraction</strong>
              <small>Instant digitization</small>
            </div>
          </div>
          <div className="live-floating-card live-floating-card--6">
            <span className="live-icon-badge">🔒</span>
            <div>
              <strong>Privacy First</strong>
              <small>SLMC verified clinicians</small>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
