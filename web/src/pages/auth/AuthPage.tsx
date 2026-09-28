// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { z } from 'zod'

import { apiClient, type FamilyDto } from '../../services/apiClient'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { signIn, registerFamilyUser, registerDoctorUser, signedIn } from '../../store/slices/authSlice'
import { AuthStepper, type StepDef } from '../../components/auth/AuthStepper'
import loginBg from '../../assets/Loging.webp'
import registerBg from '../../assets/Register.webp'
import '../../styles/commercial-auth.css'

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

const accountSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your display name.').max(120),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
  confirm: z.string().min(1, 'Confirm your password.'),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match.',
  path: ['confirm'],
})

export function AuthPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { isAuthenticated, user, status: authStatus, error: authError } = useAppSelector((state) => state.auth)

  const isRegisterRoute = location.pathname.includes('/register')
  const [mode, setMode] = useState<'login' | 'register'>(isRegisterRoute ? 'register' : 'login')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Wizard State
  const [regStep, setRegStep] = useState(0)
  const [role, setRole] = useState<'FAMILY_HEAD' | 'MEMBER' | 'DOCTOR'>('FAMILY_HEAD')
  
  // Account Details
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  
  // Role Details
  const [familyName, setFamilyName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  
  const [connectionMethod, setConnectionMethod] = useState<'INVITATION' | 'LATER'>('INVITATION')
  const [invitationToken, setInvitationToken] = useState('')
  
  const [regNum, setRegNum] = useState('')
  const [specialty, setSpecialty] = useState('')
  
  const [regError, setRegError] = useState('')

  useEffect(() => {
    setMode(location.pathname.includes('/register') ? 'register' : 'login')
  }, [location])

  if (isAuthenticated && authStatus !== 'loading') {
    if (mode === 'login' || (user && user.role !== 'ONBOARDING')) {
      if (user?.role === 'DOCTOR' && user?.verificationStatus !== 'VERIFIED') return <Navigate to="/doctor-status" replace />
      return <Navigate to={user?.role === 'ONBOARDING' ? '/onboarding' : '/dashboard'} replace />
    }
  }

  const toggleMode = () => {
    setRegStep(0)
    navigate(mode === 'login' ? '/register' : '/login', { replace: true })
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    const parsed = signInSchema.safeParse({ email: loginEmail, password: loginPassword })
    if (!parsed.success) {
      setLoginError(parsed.error.issues[0]?.message ?? 'Check the form and try again.')
      return
    }

    const result = await dispatch(signIn(parsed.data))
    if (signIn.rejected.match(result)) return

    const destination =
      result.payload.role === 'ONBOARDING'
        ? '/onboarding'
        : result.payload.role === 'DOCTOR' && result.payload.verificationStatus !== 'VERIFIED'
        ? '/doctor-status'
        : (location.state as { from?: string } | null)?.from ?? '/dashboard'
    navigate(destination, { replace: true })
  }

  const handleNextStep = () => {
    setRegError('')
    if (regStep === 1) {
      const parsed = accountSchema.safeParse({ displayName: regName, email: regEmail, password: regPassword, confirm: regConfirm })
      if (!parsed.success) {
        setRegError(parsed.error.issues[0]?.message ?? 'Check your details.')
        return
      }
    }
    
    if (regStep === 2) {
      if (role === 'FAMILY_HEAD') {
        if (!dateOfBirth) { setRegError('Date of birth is required.'); return }
        if (!familyName) { setRegError('Family workspace name is required.'); return }
      } else if (role === 'MEMBER') {
        if (!dateOfBirth) { setRegError('Date of birth is required.'); return }
      } else if (role === 'DOCTOR') {
        if (!regNum || regNum.length < 4) { setRegError('Enter a valid SLMC registration number.'); return }
      }
    }

    if (regStep === 3 && role === 'MEMBER') {
      if (connectionMethod === 'INVITATION' && !invitationToken) {
        setRegError('Invitation token is required.'); return
      }
    }

    setRegStep((s) => s + 1)
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegError('')

    try {
      // Step 1: Create Identity
      let currentUser = user
      if (!currentUser) {
        if (role === 'DOCTOR') {
          const res = await dispatch(registerDoctorUser({ displayName: regName, email: regEmail, password: regPassword })).unwrap()
          currentUser = res
        } else {
          const res = await dispatch(registerFamilyUser({ displayName: regName, email: regEmail, password: regPassword })).unwrap()
          currentUser = res
        }
      }
      if (!currentUser) throw new Error('Account creation failed')

      // Step 2: Role Specific Onboarding
      if (role === 'DOCTOR') {
        try { 
          await apiClient.post('/doctors/register', { registrationNumber: regNum.trim(), specialty: specialty.trim() || null }) 
        } catch { 
          setRegError('Account created, but synthetic doctor profile failed.') 
          return
        }
        navigate('/doctor-status', { replace: true })
      } 
      else if (role === 'FAMILY_HEAD') {
        let family: FamilyDto
        try { family = (await apiClient.get<FamilyDto>('/families/me')).data } 
        catch { family = (await apiClient.post<FamilyDto>('/families', { name: familyName })).data }
        await apiClient.post(`/families/${family.id}/members`, { displayName: currentUser.name, dateOfBirth, role: 'Head', userId: currentUser.id })
        dispatch(signedIn({ ...currentUser, role: 'FAMILY_HEAD' }))
        navigate('/dashboard', { replace: true })
      } 
      else if (role === 'MEMBER') {
        if (connectionMethod === 'INVITATION') {
          await apiClient.post('/families/invitations/accept', { token: invitationToken.trim(), dateOfBirth })
          dispatch(signedIn({ ...currentUser, role: 'MEMBER' }))
          navigate('/dashboard', { replace: true })
        } else {
          // Join Later
          navigate('/onboarding', { replace: true })
        }
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed. Check details.')
    }
  }

  const mainBg = mode === 'login' ? loginBg : registerBg;
  const textBg = mode === 'login' ? registerBg : loginBg;

  let steps: StepDef[] = []
  if (role === 'FAMILY_HEAD') {
    steps = [{ label: 'Role' }, { label: 'Account' }, { label: 'Personal' }, { label: 'Review' }]
  } else if (role === 'MEMBER') {
    steps = [{ label: 'Role' }, { label: 'Account' }, { label: 'Personal' }, { label: 'Connection' }, { label: 'Review' }]
  } else if (role === 'DOCTOR') {
    steps = [{ label: 'Role' }, { label: 'Account' }, { label: 'Professional' }, { label: 'Verification' }, { label: 'Review' }]
  }

  const isFinalStep = regStep === steps.length - 1

  return (
    <main aria-label={mode === 'login' ? 'Sign in' : 'Create account'} 
      className={`auth-page-root mode-${mode}`} 
      style={{ backgroundImage: `url(${mainBg})` }}
    >
      <div className="auth-overlay"></div>
      
      <div className="auth-main-container">
        
        {/* Left Text Panel (Register Mode) */}
        <div 
          className="auth-text-panel auth-text-left"
          style={{ backgroundImage: `url(${textBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="auth-text-overlay"></div>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', color: 'white' }}>
              Let's Get Started
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '85%', color: 'white' }}>
              Secure access to your health, family and clinical care. Create a unified workspace for seamless clinical decision support and familial risk mapping.
            </p>
            <button type="button" className="auth-mode-switch-btn" onClick={toggleMode}>
              Already a Member? Sign In
            </button>
          </div>
        </div>

        {/* Right Text Panel (Login Mode) */}
        <div 
          className="auth-text-panel auth-text-right"
          style={{ backgroundImage: `url(${textBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="auth-text-overlay"></div>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', color: 'white' }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '85%', color: 'white' }}>
              Sign in to continue to FamilyVeda. Access your authorized clinical or family workspace to continue where you left off.
            </p>
            <button type="button" className="auth-mode-switch-btn" onClick={toggleMode}>
              Not a member? Sign Up
            </button>
          </div>
        </div>

        {/* Sliding Glass Panel */}
        <div className="auth-glass-panel">
          
          {/* Register Form */}
          <div className="auth-form-content auth-form-register">
            <h2 style={{ fontSize: '2.4rem', fontWeight: 700, marginBottom: '24px', color: 'white' }}>Sign up</h2>
            
            <AuthStepper steps={steps} currentStep={regStep} />
            
            <form onSubmit={isFinalStep ? handleRegister : (e) => { e.preventDefault(); handleNextStep() }} noValidate>
              
              {/* STEP 0: ROLE */}
              {regStep === 0 && (
                <div>
                  <div 
                    className={`auth-role-card ${role === 'FAMILY_HEAD' ? 'selected' : ''}`}
                    onClick={() => setRole('FAMILY_HEAD')}
                  >
                    <div className="auth-role-title">Family Head</div>
                    <div className="auth-role-desc">Create and manage a new family workspace.</div>
                  </div>
                  <div 
                    className={`auth-role-card ${role === 'MEMBER' ? 'selected' : ''}`}
                    onClick={() => setRole('MEMBER')}
                  >
                    <div className="auth-role-title">Adult Member</div>
                    <div className="auth-role-desc">Join an existing family using an invitation token.</div>
                  </div>
                  <div 
                    className={`auth-role-card ${role === 'DOCTOR' ? 'selected' : ''}`}
                    onClick={() => setRole('DOCTOR')}
                  >
                    <div className="auth-role-title">Medical Practitioner</div>
                    <div className="auth-role-desc">Provide clinical care with verifiable credentials.</div>
                  </div>
                </div>
              )}

              {/* STEP 1: ACCOUNT */}
              {regStep === 1 && (
                <div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-name">Full Name</label>
                    <input id="reg-name" className="auth-form-input" value={regName} required autoComplete="name" onChange={(e) => setRegName(e.target.value)} />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-email">Email Address</label>
                    <input id="reg-email" type="email" className="auth-form-input" placeholder="e.g. name@example.invalid" value={regEmail} required autoComplete="email" onChange={(e) => setRegEmail(e.target.value)} />
                  </div>
                  <div className="auth-form-group" style={{ opacity: 0.5 }}>
                    <label>Mobile Number <em>(Coming Soon)</em></label>
                    <input className="auth-form-input" disabled placeholder="Not currently supported by API" />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-password">Create Password</label>
                    <input id="reg-password" type="password" className="auth-form-input" placeholder="At least 8 characters" value={regPassword} required minLength={12} onChange={(e) => setRegPassword(e.target.value)} />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-confirm">Confirm Password</label>
                    <input id="reg-confirm" type="password" className="auth-form-input" placeholder="Confirm your password" value={regConfirm} required onChange={(e) => setRegConfirm(e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 2: PERSONAL / PROFESSIONAL */}
              {regStep === 2 && (
                <div>
                  {role === 'DOCTOR' ? (
                    <>
                      <div className="auth-form-group">
                        <label htmlFor="reg-num">SLMC Registration Number</label>
                        <input id="reg-num" className="auth-form-input" value={regNum} required minLength={4} onChange={(e) => setRegNum(e.target.value)} />
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-specialty">Specialty / Designation</label>
                        <input id="reg-specialty" className="auth-form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                      </div>
                      <div className="auth-form-group" style={{ opacity: 0.5 }}>
                        <label>Hospital / Practice City / District <em>(Coming Soon)</em></label>
                        <input className="auth-form-input" disabled placeholder="Fields require API support" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="auth-form-group">
                        <label htmlFor="reg-dob">Date of Birth</label>
                        <input id="reg-dob" type="date" className="auth-form-input" value={dateOfBirth} required onChange={(e) => setDateOfBirth(e.target.value)} />
                      </div>
                      {role === 'FAMILY_HEAD' && (
                        <div className="auth-form-group">
                          <label htmlFor="reg-fam-name">Family Workspace Name</label>
                          <input id="reg-fam-name" className="auth-form-input" value={familyName} required onChange={(e) => setFamilyName(e.target.value)} />
                        </div>
                      )}
                      <div className="auth-form-group" style={{ opacity: 0.5 }}>
                        <label>Address & NIC <em>(Coming Soon)</em></label>
                        <input className="auth-form-input" disabled placeholder="Fields require API support" />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 3: SPECIFIC (Member Connection / Doctor Verification / Family Head Review) */}
              {regStep === 3 && (
                <div>
                  {role === 'MEMBER' && (
                    <>
                      <div 
                        className={`auth-role-card ${connectionMethod === 'INVITATION' ? 'selected' : ''}`}
                        onClick={() => setConnectionMethod('INVITATION')}
                      >
                        <div className="auth-role-title">Option A — I have an Invitation</div>
                        <div className="auth-role-desc">Enter a token provided by a Family Head.</div>
                      </div>
                      <div 
                        className={`auth-role-card ${connectionMethod === 'LATER' ? 'selected' : ''}`}
                        onClick={() => setConnectionMethod('LATER')}
                      >
                        <div className="auth-role-title">Option C — Join Later</div>
                        <div className="auth-role-desc">Create independent account and join a family later.</div>
                      </div>
                      
                      {connectionMethod === 'INVITATION' && (
                        <div className="auth-form-group" style={{ marginTop: '16px' }}>
                          <label htmlFor="reg-token">Invitation Token</label>
                          <input id="reg-token" className="auth-form-input" value={invitationToken} required onChange={(e) => setInvitationToken(e.target.value)} />
                        </div>
                      )}
                    </>
                  )}
                  {role === 'DOCTOR' && (
                    <div style={{ color: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(20, 108, 255, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid #146CFF' }}>
                      <h3 style={{ marginBottom: '8px' }}>Manual Verification Required</h3>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Your professional profile will be reviewed by an administrator before clinical access is enabled. 
                        Do not expect immediate access.
                      </p>
                      <div style={{ marginTop: '16px', opacity: 0.5 }}>
                        <label>Medical License Upload <em>(Coming Soon)</em></label>
                        <input className="auth-form-input" disabled placeholder="Document upload requires API support" />
                      </div>
                    </div>
                  )}
                  {role === 'FAMILY_HEAD' && (
                    <div className="auth-review-list">
                      <p><strong>Account:</strong> {regName} ({regEmail})</p>
                      <p><strong>Workspace:</strong> {familyName}</p>
                      <p><strong>Date of Birth:</strong> {dateOfBirth}</p>
                      <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: FINAL REVIEW (Member / Doctor) */}
              {regStep === 4 && (
                <div>
                  {role === 'MEMBER' && (
                    <div className="auth-review-list">
                      <p><strong>Account:</strong> {regName} ({regEmail})</p>
                      <p><strong>Date of Birth:</strong> {dateOfBirth}</p>
                      <p><strong>Connection:</strong> {connectionMethod === 'INVITATION' ? `Joining via Token (${invitationToken})` : 'Joining Later'}</p>
                    </div>
                  )}
                  {role === 'DOCTOR' && (
                    <div className="auth-review-list">
                      <p><strong>Account:</strong> {regName} ({regEmail})</p>
                      <p><strong>SLMC Registration:</strong> {regNum}</p>
                      {specialty && <p><strong>Specialty:</strong> {specialty}</p>}
                      <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#f59e0b' }}>
                        ⚠️ Clinical access will remain blocked until your credentials are verified.
                      </div>
                    </div>
                  )}
                  <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    By clicking submit, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}

              {(regError || (mode === 'register' && authError)) && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '16px', marginTop: '16px' }}>{regError || authError}</div>
              )}

              <div className="auth-btn-row">
                {regStep > 0 && (
                  <button type="button" className="auth-btn-secondary" onClick={() => { setRegError(''); setRegStep(s => s - 1) }} disabled={authStatus === 'loading'}>
                    Back
                  </button>
                )}
                <button type="submit" disabled={authStatus === 'loading'} className="auth-form-button" style={{ marginTop: 0 }}>
                  {isFinalStep ? (authStatus === 'loading' ? 'Submitting...' : (role === 'DOCTOR' ? 'Submit for Review' : 'Create Account')) : 'Continue'}
                </button>
              </div>
            </form>

          </div>

          {/* Login Form */}
          <div className="auth-form-content auth-form-login">
            <h2 style={{ fontSize: '2.4rem', fontWeight: 700, marginBottom: '32px', color: 'white' }}>Sign in</h2>
            
            <form onSubmit={handleLogin} noValidate>
              <div className="auth-form-group">
                <label htmlFor="login-email">Email Address</label>
                <input id="login-email" type="email" className="auth-form-input" placeholder="e.g. name@example.invalid" value={loginEmail} required autoComplete="email" onChange={(e) => setLoginEmail(e.target.value)} />
              </div>

              <div className="auth-form-group">
                <label htmlFor="login-password">Password</label>
                <input id="login-password" type="password" className="auth-form-input" placeholder="At least 8 characters" value={loginPassword} required autoComplete="current-password" onChange={(e) => setLoginPassword(e.target.value)} />
              </div>

              {(loginError || (mode === 'login' && authError)) && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '16px' }}>{loginError || authError}</div>
              )}

              <button type="submit" disabled={authStatus === 'loading'} className="auth-form-button">
                {authStatus === 'loading' ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

          </div>

        </div>
      </div>
    </main>
  )
}
