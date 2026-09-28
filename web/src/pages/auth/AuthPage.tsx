// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { z } from 'zod'

import { apiClient } from '../../services/apiClient'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { signIn, registerFamilyUser, registerDoctorUser } from '../../store/slices/authSlice'
import logoUrl from '../../assets/logo.png'
import loginBg from '../../assets/Loging.webp'
import registerBg from '../../assets/Register.webp'
import '../../styles/commercial-auth.css'

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

const registrationSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your display name.').max(120),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
  role: z.enum(['FAMILY', 'DOCTOR']),
  registrationNumber: z.string().optional(),
  specialty: z.string().optional(),
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

  const [role, setRole] = useState<'FAMILY' | 'DOCTOR'>('FAMILY')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regNum, setRegNum] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [regError, setRegError] = useState('')

  useEffect(() => {
    setMode(location.pathname.includes('/register') ? 'register' : 'login')
    const params = new URLSearchParams(location.search)
    if (params.get('role') === 'DOCTOR') setRole('DOCTOR')
  }, [location])

  if (isAuthenticated) {
    if (user?.role === 'DOCTOR' && user?.verificationStatus !== 'VERIFIED') return <Navigate to="/doctor-status" replace />
    return <Navigate to={user?.role === 'ONBOARDING' ? '/onboarding' : '/dashboard'} replace />
  }

  const toggleMode = () => {
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

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegError('')
    const parsed = registrationSchema.safeParse({ 
      displayName: regName, email: regEmail, password: regPassword, 
      role, registrationNumber: regNum, specialty 
    })
    
    if (!parsed.success) { 
      setRegError(parsed.error.issues[0]?.message ?? 'Check the form.')
      return 
    }
    if (role === 'DOCTOR' && (!regNum || regNum.length < 4)) {
      setRegError('Enter a valid synthetic registration identifier.')
      return
    }

    if (role === 'FAMILY') {
      const result = await dispatch(registerFamilyUser({ displayName: regName, email: regEmail, password: regPassword }))
      if (registerFamilyUser.fulfilled.match(result)) navigate('/onboarding', { replace: true })
    } else {
      const result = await dispatch(registerDoctorUser({ displayName: regName, email: regEmail, password: regPassword }))
      if (!registerDoctorUser.fulfilled.match(result)) return
      
      try { 
        await apiClient.post('/doctors/register', { 
          registrationNumber: regNum.trim(), 
          specialty: specialty.trim() || null 
        }) 
      } catch { 
        setRegError('Account created, but the synthetic doctor profile needs attention.') 
        return
      }
      navigate('/doctor-status', { replace: true })
    }
  }

  const bgImage = mode === 'login' ? loginBg : registerBg

  return (
    <main aria-label={mode === 'login' ? 'Sign in' : 'Create account'} 
      className={`auth-page-root mode-${mode}`} 
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="auth-overlay"></div>
      
      <div className="auth-main-container">
        
        {/* Left Text Panel (Register Mode) */}
        <div className="auth-text-panel auth-text-left">
          <img src={logoUrl} alt="Logo" width={48} height={48} style={{ borderRadius: '12px', marginBottom: '24px' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            Let's Get Started
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '85%' }}>
            Secure access to your health, family and clinical care. Create a unified workspace for seamless clinical decision support and familial risk mapping.
          </p>
        </div>

        {/* Right Text Panel (Login Mode) */}
        <div className="auth-text-panel auth-text-right">
          <img src={logoUrl} alt="Logo" width={48} height={48} style={{ borderRadius: '12px', marginBottom: '24px' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '85%' }}>
            Sign in to continue to FamilyVeda. Access your authorized clinical or family workspace to continue where you left off.
          </p>
        </div>

        {/* Sliding Glass Panel */}
        <div className="auth-glass-panel">
          
          {/* Register Form */}
          <div className="auth-form-content auth-form-register">
            <h2 style={{ fontSize: '2rem', marginBottom: '32px' }}>Sign up</h2>
            
            <form onSubmit={handleRegister} noValidate>
              <div className="auth-form-group">
                <label htmlFor="reg-role">Account Type</label>
                <select id="reg-role" className="auth-form-input" value={role} onChange={(e) => setRole(e.target.value as 'FAMILY' | 'DOCTOR')}>
                  <option value="FAMILY">Family Member</option>
                  <option value="DOCTOR">Medical Practitioner</option>
                </select>
              </div>

              <div className="auth-form-group">
                <label htmlFor="reg-name">Your Name</label>
                <input id="reg-name" className="auth-form-input" value={regName} required autoComplete="name" onChange={(e) => setRegName(e.target.value)} />
              </div>

              <div className="auth-form-group">
                <label htmlFor="reg-email">Your Email</label>
                <input id="reg-email" type="email" className="auth-form-input" value={regEmail} required autoComplete="email" onChange={(e) => setRegEmail(e.target.value)} />
              </div>

              <div className="auth-form-group">
                <label htmlFor="reg-password">Create Password</label>
                <input id="reg-password" type="password" className="auth-form-input" value={regPassword} required minLength={12} onChange={(e) => setRegPassword(e.target.value)} />
              </div>

              {role === 'DOCTOR' && (
                <>
                  <div className="auth-form-group">
                    <label htmlFor="reg-num">Registration Number</label>
                    <input id="reg-num" className="auth-form-input" value={regNum} required minLength={4} onChange={(e) => setRegNum(e.target.value)} />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-specialty">Specialty</label>
                    <input id="reg-specialty" className="auth-form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                  </div>
                </>
              )}

              {(regError || (mode === 'register' && authError)) && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '16px' }}>{regError || authError}</div>
              )}

              <button type="submit" disabled={authStatus === 'loading'} className="auth-form-button">
                {authStatus === 'loading' ? 'Creating...' : 'Sign up'}
              </button>
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
