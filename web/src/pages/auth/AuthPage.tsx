// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { z } from 'zod'

import { apiClient, type FamilyDto } from '../../services/apiClient'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { signIn, registerFamilyUser, registerDoctorUser, signedIn } from '../../store/slices/authSlice'
import { AuthStepper } from '../../components/auth/AuthStepper'
import logoUrl from '../../assets/logo.png'
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
  
  // Role Details
  const [familyName, setFamilyName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [invitationToken, setInvitationToken] = useState('')
  const [regNum, setRegNum] = useState('')
  const [specialty, setSpecialty] = useState('')
  
  const [regError, setRegError] = useState('')

  useEffect(() => {
    setMode(location.pathname.includes('/register') ? 'register' : 'login')
  }, [location])

  if (isAuthenticated && authStatus !== 'loading') {
    // If they just registered, we might still need to finish onboarding inside the wizard,
    // but if the wizard is complete, we navigate. Wait, if isAuthenticated becomes true during Step 2 API call,
    // we need to prevent this redirect from interrupting Step 3!
    // Actually, it's safer to only redirect if they are not in the middle of registration.
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
      const parsed = accountSchema.safeParse({ displayName: regName, email: regEmail, password: regPassword })
      if (!parsed.success) {
        setRegError(parsed.error.issues[0]?.message ?? 'Check your details.')
        return
      }
    }
    setRegStep((s) => s + 1)
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegError('')
    
    // Final Validation
    if (role === 'DOCTOR' && (!regNum || regNum.length < 4)) {
      setRegError('Enter a valid synthetic registration identifier.')
      return
    }
    if (role === 'FAMILY_HEAD' && (!familyName || !dateOfBirth)) {
      setRegError('Workspace name and your date of birth are required.')
      return
    }
    if (role === 'MEMBER' && (!invitationToken || !dateOfBirth)) {
      setRegError('Invitation token and your date of birth are required.')
      return
    }

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
        await apiClient.post('/families/invitations/accept', { token: invitationToken.trim(), dateOfBirth })
        dispatch(signedIn({ ...currentUser, role: 'MEMBER' }))
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Check details.')
    }
  }

  const mainBg = mode === 'login' ? loginBg : registerBg;
  const textBg = mode === 'login' ? registerBg : loginBg;

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
            <img src={logoUrl} alt="Logo" width={48} height={48} style={{ borderRadius: '12px', marginBottom: '24px' }} />
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', color: 'white' }}>
              Let's Get Started
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '85%', color: 'white' }}>
              Secure access to your health, family and clinical care. Create a unified workspace for seamless clinical decision support and familial risk mapping.
            </p>
          </div>
        </div>

        {/* Right Text Panel (Login Mode) */}
        <div 
          className="auth-text-panel auth-text-right"
          style={{ backgroundImage: `url(${textBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="auth-text-overlay"></div>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <img src={logoUrl} alt="Logo" width={48} height={48} style={{ borderRadius: '12px', marginBottom: '24px' }} />
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', color: 'white' }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '85%', color: 'white' }}>
              Sign in to continue to FamilyVeda. Access your authorized clinical or family workspace to continue where you left off.
            </p>
          </div>
        </div>

        {/* Sliding Glass Panel */}
        <div className="auth-glass-panel">
          
          {/* Register Form */}
          <div className="auth-form-content auth-form-register">
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Sign up</h2>
            
            <AuthStepper 
              steps={[{ label: 'Role' }, { label: 'Account' }, { label: 'Profile' }]} 
              currentStep={regStep} 
            />
            
            <form onSubmit={regStep === 2 ? handleRegister : (e) => { e.preventDefault(); handleNextStep() }} noValidate>
              
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
                    <input id="reg-email" type="email" className="auth-form-input" value={regEmail} required autoComplete="email" onChange={(e) => setRegEmail(e.target.value)} />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-password">Create Password (12+ characters)</label>
                    <input id="reg-password" type="password" className="auth-form-input" value={regPassword} required minLength={12} onChange={(e) => setRegPassword(e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 2: PROFILE */}
              {regStep === 2 && (
                <div>
                  {role === 'DOCTOR' && (
                    <>
                      <div className="auth-form-group">
                        <label htmlFor="reg-num">SLMC Registration Number</label>
                        <input id="reg-num" className="auth-form-input" value={regNum} required minLength={4} onChange={(e) => setRegNum(e.target.value)} />
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-specialty">Specialty / Designation</label>
                        <input id="reg-specialty" className="auth-form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                      </div>
                    </>
                  )}
                  {role === 'FAMILY_HEAD' && (
                    <>
                      <div className="auth-form-group">
                        <label htmlFor="reg-fam-name">Family Workspace Name</label>
                        <input id="reg-fam-name" className="auth-form-input" value={familyName} required onChange={(e) => setFamilyName(e.target.value)} />
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-dob-head">Your Date of Birth</label>
                        <input id="reg-dob-head" type="date" className="auth-form-input" value={dateOfBirth} required onChange={(e) => setDateOfBirth(e.target.value)} />
                      </div>
                    </>
                  )}
                  {role === 'MEMBER' && (
                    <>
                      <div className="auth-form-group">
                        <label htmlFor="reg-token">Invitation Token</label>
                        <input id="reg-token" className="auth-form-input" value={invitationToken} required onChange={(e) => setInvitationToken(e.target.value)} />
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-dob-member">Your Date of Birth</label>
                        <input id="reg-dob-member" type="date" className="auth-form-input" value={dateOfBirth} required onChange={(e) => setDateOfBirth(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {(regError || (mode === 'register' && authError)) && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '16px' }}>{regError || authError}</div>
              )}

              <div className="auth-btn-row">
                {regStep > 0 && (
                  <button type="button" className="auth-btn-secondary" onClick={() => { setRegError(''); setRegStep(s => s - 1) }} disabled={authStatus === 'loading'}>
                    Back
                  </button>
                )}
                <button type="submit" disabled={authStatus === 'loading'} className="auth-form-button" style={{ marginTop: 0 }}>
                  {regStep < 2 ? 'Continue' : authStatus === 'loading' ? 'Creating...' : 'Complete Sign up'}
                </button>
              </div>
            </form>

            <div className="auth-form-switch">
              Already a Member? <button type="button" onClick={toggleMode}>Sign in here</button>
            </div>
          </div>

          {/* Login Form */}
          <div className="auth-form-content auth-form-login">
            <h2 style={{ fontSize: '2rem', marginBottom: '32px' }}>Sign in</h2>
            
            <form onSubmit={handleLogin} noValidate>
              <div className="auth-form-group">
                <label htmlFor="login-email">Email Address</label>
                <input id="login-email" type="email" className="auth-form-input" value={loginEmail} required autoComplete="email" onChange={(e) => setLoginEmail(e.target.value)} />
              </div>

              <div className="auth-form-group">
                <label htmlFor="login-password">Password</label>
                <input id="login-password" type="password" className="auth-form-input" value={loginPassword} required autoComplete="current-password" onChange={(e) => setLoginPassword(e.target.value)} />
              </div>

              {(loginError || (mode === 'login' && authError)) && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '16px' }}>{loginError || authError}</div>
              )}

              <button type="submit" disabled={authStatus === 'loading'} className="auth-form-button">
                {authStatus === 'loading' ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="auth-form-switch">
              Not a member? <button type="button" onClick={toggleMode}>Sign up here</button>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
