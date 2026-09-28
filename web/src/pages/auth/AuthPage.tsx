// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { z } from 'zod'
import { isAxiosError } from 'axios'

import { apiClient } from '../../services/apiClient'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { completeRegistration, signIn, registerDoctorUser, clearAuthError } from '../../store/slices/authSlice'
import { AuthStepper, type StepDef } from '../../components/auth/AuthStepper'
import loginBg from '../../assets/Loging.webp'
import registerBg from '../../assets/Register.webp'
import '../../styles/commercial-auth.css'

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

const accountSchema = z.object({
  displayName: z.string().trim().regex(/^[\p{L}][\p{L} .'-]{1,119}$/u, 'Enter your full name (2–120 letters; spaces, dots, apostrophes and hyphens allowed).'),
  email: z.string().email('Enter a valid email address.'),
  mobileNumber: z.string().trim().regex(/^(?:0|\+94)7\d{8}$/, 'Enter a Sri Lankan mobile number, e.g. 0771234567 or +94771234567.'),
  password: z.string().min(8, 'Password must be 8–128 characters with upper and lower case letters, a number and a symbol.').max(128)
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/\d/, 'Password must include a number.')
    .regex(/[^A-Za-z0-9]/, 'Password must include a symbol.'),
  confirm: z.string().min(1, 'Confirm your password.'),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match.',
  path: ['confirm'],
})

const districts = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'] as const
const relationships = ['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Other'] as const
const clinicalSexes = ['Male', 'Female', 'NotSpecified'] as const
type FieldErrors = Record<string, string>

function problemDetailsErrors(error: unknown): FieldErrors {
  if (typeof error === 'object' && error !== null && 'fields' in error) {
    const fields = (error as { fields?: Record<string, string[]> }).fields
    if (fields) return Object.fromEntries(Object.entries(fields).map(([field, messages]) => [normaliseField(field), messages[0] ?? 'Check this field.']))
  }
  if (!isAxiosError(error)) return {}
  const data = error.response?.data as { errors?: Record<string, string[]>; detail?: string; title?: string } | undefined
  if (!data) return {}
  if (data.errors) return Object.fromEntries(Object.entries(data.errors).map(([field, messages]) => [normaliseField(field), messages[0] ?? 'Check this field.']))
  return data.detail || data.title ? { form: data.detail ?? data.title ?? 'Registration failed.' } : {}
}

function normaliseField(field: string) {
  const key = field.replace(/^.*\./, '').toLowerCase()
  return key === 'fullname' ? 'displayname' : key
}

const PasswordEye = ({ show, toggle }: { show: boolean, toggle: () => void }) => (
  <button type="button" onClick={toggle} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: "4px" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {show ? (
        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
      ) : (
        <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
      )}
    </svg>
  </button>
)

export function AuthPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { isAuthenticated, user, status: authStatus, error: authError } = useAppSelector((state) => state.auth)

  const isRegisterRoute = location.pathname.includes('/register')
  const [mode, setMode] = useState<'login' | 'register'>(isRegisterRoute ? 'register' : 'login')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [loginError, setLoginError] = useState('')

  // Wizard State
  const [regStep, setRegStep] = useState(0)
  const [role, setRole] = useState<'FAMILY_HEAD' | 'MEMBER' | 'DOCTOR'>('FAMILY_HEAD')
  
  // Account Details
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  
  // Role Details
  const [familyName, setFamilyName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [sexForClinicalReference, setSexForClinicalReference] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  const [connectionMethod, setConnectionMethod] = useState<'INVITATION' | 'FAMILY_CODE' | 'LATER'>('INVITATION')
  const [invitationToken, setInvitationToken] = useState('')
  const [familyCode, setFamilyCode] = useState('')
  const [relationship, setRelationship] = useState('')
  
  const [regNum, setRegNum] = useState('')
  const [specialty, setSpecialty] = useState('')
  
  const [regError, setRegError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    setMode(location.pathname.includes('/register') ? 'register' : 'login')
    dispatch(clearAuthError())
    setRegError('')
  }, [location, dispatch])

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
    setFieldErrors({})
    // Doctors use the dedicated multi-step form: professional details, licence upload and review.
    if (regStep === 0 && role === 'DOCTOR') {
      navigate('/register/doctor')
      return
    }
    if (regStep === 1) {
      const parsed = accountSchema.safeParse({ displayName: regName, email: regEmail, mobileNumber, password: regPassword, confirm: regConfirm })
      if (!parsed.success) {
        setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0]?.toString().toLowerCase() ?? 'form', issue.message])))
        setRegError('Check the highlighted details.')
        return
      }
    }
    
    if (regStep === 2) {
      if (role === 'FAMILY_HEAD') {
        if (!familyName.trim()) { setFieldErrors({ familyname: 'Family name is required.' }); setRegError('Check the highlighted details.'); return }
      } else if (role === 'DOCTOR') {
        if (!regNum || regNum.length < 4) { setRegError('Enter a valid SLMC registration number.'); return }
      }

      if (role !== 'DOCTOR') {
        const errors: FieldErrors = {}
        const dob = new Date(`${dateOfBirth}T00:00:00`)
        const adultCutoff = new Date()
        adultCutoff.setFullYear(adultCutoff.getFullYear() - 18)
        if (!dateOfBirth || Number.isNaN(dob.valueOf()) || dob < new Date('1900-01-01') || dob >= new Date()) errors.dateofbirth = 'Enter a valid date of birth.'
        else if (dob > adultCutoff) errors.dateofbirth = 'You must be at least 18 years old to register.'
        if (!clinicalSexes.includes(sexForClinicalReference as typeof clinicalSexes[number])) errors.sexforclinicalreference = 'Choose Male, Female or Not specified.'
        if (!addressLine1.trim()) errors.addressline1 = 'Address line 1 is required.'
        else if (addressLine1.trim().length > 120) errors.addressline1 = 'Address line 1 must be 120 characters or fewer.'
        if (addressLine2.length > 120) errors.addressline2 = 'Address line 2 must be 120 characters or fewer.'
        if (!city.trim()) errors.city = 'City is required.'
        else if (city.trim().length > 80) errors.city = 'City must be 80 characters or fewer.'
        if (!districts.includes(district as typeof districts[number])) errors.district = 'Choose a district.'
        if (postalCode && !/^\d{5}$/.test(postalCode.trim())) errors.postalcode = 'Postal code must be 5 digits.'
        if (role === 'FAMILY_HEAD' && !/^(?:\d{9}[VvXx]|\d{12})$/.test(nationalId.trim())) errors.nationalid = 'Enter a synthetic NIC: 9 digits followed by V or X, or 12 digits.'
        if (Object.keys(errors).length) { setFieldErrors(errors); setRegError('Check the highlighted details.'); return }
      }
    }

    if (regStep === 3 && role === 'MEMBER') {
      if (connectionMethod === 'INVITATION' && !invitationToken) {
        setFieldErrors({ 'connection.invitationtoken': 'Enter your invitation token.' }); setRegError('Check the highlighted details.'); return
      }
      if (connectionMethod === 'FAMILY_CODE' && (!/^FV-[A-HJ-NP-Z2-9]{6}$/.test(familyCode.trim().toUpperCase()) || !relationship)) {
        setFieldErrors({ ...(familyCode ? {} : { 'connection.familycode': 'Family codes look like FV-ABC234.' }), ...(relationship ? {} : { 'connection.relationship': 'Choose your relationship to the family.' }) }); setRegError('Check the highlighted details.'); return
      }
    }

    setRegStep((s) => s + 1)
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegError('')
    setFieldErrors({})

    if (role !== 'DOCTOR' && !acceptTerms) {
      setFieldErrors({ acceptterms: 'Accept the terms and privacy notice to continue.' })
      setRegError('Check the highlighted details.')
      return
    }

    try {
      if (role === 'DOCTOR') {
        if (!user) await dispatch(registerDoctorUser({ displayName: regName, email: regEmail, password: regPassword })).unwrap()
        try { 
          await apiClient.post('/doctors/register', { registrationNumber: regNum.trim(), specialty: specialty.trim() || null }) 
        } catch { 
          setRegError('Account created, but synthetic doctor profile failed.') 
          return
        }
        navigate('/doctor-status', { replace: true })
      } 
      else if (role === 'FAMILY_HEAD') {
        await dispatch(completeRegistration({ path: '/auth/register/family-head', body: registrationBody() })).unwrap()
        navigate('/dashboard', { replace: true })
      } 
      else if (role === 'MEMBER') {
        await dispatch(completeRegistration({ path: '/auth/register/adult-member', body: registrationBody() })).unwrap()
        navigate(connectionMethod === 'LATER' ? '/onboarding' : '/dashboard', { replace: true })
      }
    } catch (err) {
      const errors = problemDetailsErrors(err)
      setFieldErrors(errors)
      setRegError(errors.form ?? (err instanceof Error ? err.message : 'Registration failed. Check details.'))
    }
  }

  function registrationBody() {
    const account = { fullName: regName.trim(), email: regEmail.trim(), mobileNumber: mobileNumber.trim(), password: regPassword, confirmPassword: regConfirm }
    const personal = { dateOfBirth, sexForClinicalReference }
    const address = { addressLine1: addressLine1.trim(), addressLine2: addressLine2.trim() || null, city: city.trim(), district, postalCode: postalCode.trim() || null }
    if (role === 'FAMILY_HEAD') return { account, personal, familyName: familyName.trim(), nationalId: nationalId.trim(), address, acceptTerms }
    return { account, personal, address, connection: { method: connectionMethod === 'FAMILY_CODE' ? 'FamilyCode' : connectionMethod === 'INVITATION' ? 'Invitation' : 'Later', invitationToken: connectionMethod === 'INVITATION' ? invitationToken.trim() : null, familyCode: connectionMethod === 'FAMILY_CODE' ? familyCode.trim().toUpperCase() : null, relationship: connectionMethod === 'FAMILY_CODE' ? relationship : null }, acceptTerms }
  }

  const fieldError = (field: string) => fieldErrors[field] && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{fieldErrors[field]}</p>

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
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', width: '100%' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', color: 'white' }}>
              Let's Get<br />Started
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, color: 'white' }}>
              Secure access to your health, family and<br />
              clinical care. Create a unified workspace<br />
              for seamless clinical decision support<br />
              and familial risk mapping.
            </p>
            <button type="button" className="auth-mode-switch-btn" onClick={toggleMode} style={{ marginTop: '48px' }}>
              Already a Member? Sign In <span className="switch-arrow right-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Right Text Panel (Login Mode) */}
        <div 
          className="auth-text-panel auth-text-right"
          style={{ backgroundImage: `url(${textBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="auth-text-overlay"></div>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', width: '100%' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', color: 'white' }}>
              Welcome<br />Back
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, color: 'white' }}>
              Sign in to continue to FamilyVeda.<br />
              Access your authorized clinical or<br />
              family workspace to continue<br />
              where you left off.
            </p>
            <button type="button" className="auth-mode-switch-btn" onClick={toggleMode} style={{ marginTop: '48px' }}>
              <span className="switch-arrow left-arrow">←</span> Not a member? Sign Up
            </button>
          </div>
        </div>

        {/* Sliding Glass Panel */}
        <div className="auth-glass-panel">
          
          {/* Register Form */}
          <div className="auth-form-content auth-form-register">

            
            {regStep > 0 && <AuthStepper steps={steps} currentStep={regStep} />}
            
            <form onSubmit={isFinalStep ? handleRegister : (e) => { e.preventDefault(); handleNextStep() }} noValidate>
              
              {/* STEP 0: ROLE */}
              {regStep === 0 && (
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '24px', color: 'white' }}>Select Role</h2>
                  <div 
                    className={`auth-role-card-modern ${role === 'FAMILY_HEAD' ? 'selected' : ''}`}
                    onClick={() => setRole('FAMILY_HEAD')}
                  >
                    <div className="role-card-content">
                      <div className="auth-role-title">Family Head</div>
                      <div className="auth-role-desc">Create and manage a new family workspace.</div>
                    </div>
                    <div className="role-card-radio"></div>
                  </div>
                  <div 
                    className={`auth-role-card-modern ${role === 'MEMBER' ? 'selected' : ''}`}
                    onClick={() => setRole('MEMBER')}
                  >
                    <div className="role-card-content">
                      <div className="auth-role-title">Adult Member</div>
                      <div className="auth-role-desc">Join an existing family using an invitation token.</div>
                    </div>
                    <div className="role-card-radio"></div>
                  </div>
                  <div 
                    className={`auth-role-card-modern ${role === 'DOCTOR' ? 'selected' : ''}`}
                    onClick={() => setRole('DOCTOR')}
                  >
                    <div className="role-card-content">
                      <div className="auth-role-title">Medical Practitioner</div>
                      <div className="auth-role-desc">Provide clinical care with verifiable credentials.</div>
                    </div>
                    <div className="role-card-radio"></div>
                  </div>
                </div>
              )}

              {/* STEP 1: ACCOUNT */}
              {regStep === 1 && (
                <div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-name">Full Name</label>
                    <input id="reg-name" className="auth-form-input" placeholder="e.g. Sahan Sandaruwan" value={regName} required autoComplete="name" onChange={(e) => setRegName(e.target.value)} />
                    {fieldError('displayname')}
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-email">Email Address</label>
                    <input id="reg-email" type="email" className="auth-form-input" placeholder="e.g. name@example.invalid" value={regEmail} required autoComplete="email" onChange={(e) => setRegEmail(e.target.value)} />
                    {fieldError('email')}
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-mobile">Mobile Number</label>
                    <input id="reg-mobile" type="tel" className="auth-form-input" value={mobileNumber} required autoComplete="tel" placeholder="0771234567" onChange={(e) => setMobileNumber(e.target.value)} />
                    {fieldError('mobilenumber')}
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-password">Create Password</label>
                    <div style={{ position: 'relative' }}>
                      <input id="reg-password" type={showRegPassword ? 'text' : 'password'} className="auth-form-input" style={{ paddingRight: "40px" }} placeholder="At least 8 characters" value={regPassword} required minLength={8} onChange={(e) => setRegPassword(e.target.value)} />
                      <PasswordEye show={showRegPassword} toggle={() => setShowRegPassword(!showRegPassword)} />
                    </div>
                    {fieldError('password')}
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-confirm">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input id="reg-confirm" type={showRegPassword ? 'text' : 'password'} className="auth-form-input" style={{ paddingRight: "40px" }} placeholder="Confirm your password" value={regConfirm} required onChange={(e) => setRegConfirm(e.target.value)} />
                      <PasswordEye show={showRegPassword} toggle={() => setShowRegPassword(!showRegPassword)} />
                    </div>
                    {fieldError('confirm')}
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
                    </>
                  ) : (
                    <>
                      <div className="auth-form-group">
                        <label htmlFor="reg-dob">Date of Birth</label>
                        <input id="reg-dob" type="date" className="auth-form-input" value={dateOfBirth} required onChange={(e) => setDateOfBirth(e.target.value)} />
                        {fieldError('dateofbirth')}
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-sex">Clinical Sex Reference</label>
                        <select id="reg-sex" className="auth-form-input" value={sexForClinicalReference} required onChange={(e) => setSexForClinicalReference(e.target.value)}>
                          <option value="">Select an option</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="NotSpecified">Not specified</option>
                        </select>
                        {fieldError('sexforclinicalreference')}
                      </div>
                      {role === 'FAMILY_HEAD' && (
                        <>
                          <div className="auth-form-group">
                            <label htmlFor="reg-fam-name">Family Workspace Name</label>
                            <input id="reg-fam-name" className="auth-form-input" value={familyName} required onChange={(e) => setFamilyName(e.target.value)} />
                            {fieldError('familyname')}
                          </div>
                          <div className="auth-form-group">
                            <label htmlFor="reg-nic">Synthetic NIC</label>
                            <input id="reg-nic" className="auth-form-input" value={nationalId} required onChange={(e) => setNationalId(e.target.value)} />
                            {fieldError('nationalid')}
                          </div>
                        </>
                      )}
                      <div className="auth-form-group">
                        <label htmlFor="reg-address1">Address Line 1</label>
                        <input id="reg-address1" className="auth-form-input" value={addressLine1} required autoComplete="address-line1" onChange={(e) => setAddressLine1(e.target.value)} />
                        {fieldError('addressline1')}
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-address2">Address Line 2 <em>(optional)</em></label>
                        <input id="reg-address2" className="auth-form-input" value={addressLine2} autoComplete="address-line2" onChange={(e) => setAddressLine2(e.target.value)} />
                        {fieldError('addressline2')}
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-city">City</label>
                        <input id="reg-city" className="auth-form-input" value={city} required autoComplete="address-level2" onChange={(e) => setCity(e.target.value)} />
                        {fieldError('city')}
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-district">District</label>
                        <select id="reg-district" className="auth-form-input" value={district} required onChange={(e) => setDistrict(e.target.value)}>
                          <option value="">Select district</option>
                          {districts.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                        {fieldError('district')}
                      </div>
                      <div className="auth-form-group">
                        <label htmlFor="reg-postal">Postal Code <em>(optional)</em></label>
                        <input id="reg-postal" inputMode="numeric" className="auth-form-input" value={postalCode} autoComplete="postal-code" onChange={(e) => setPostalCode(e.target.value)} />
                        {fieldError('postalcode')}
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
                        className={`auth-role-card-modern ${connectionMethod === 'INVITATION' ? 'selected' : ''}`}
                        onClick={() => setConnectionMethod('INVITATION')}
                      >
                        <div className="role-card-content">
                          <div className="auth-role-title">Option A — I have an Invitation</div>
                          <div className="auth-role-desc">Enter a token provided by a Family Head.</div>
                        </div>
                        <div className="role-card-radio"></div>
                      </div>
                      <div
                        className={`auth-role-card-modern ${connectionMethod === 'FAMILY_CODE' ? 'selected' : ''}`}
                        onClick={() => setConnectionMethod('FAMILY_CODE')}
                      >
                        <div className="auth-role-title">Option B — I have a Family Code</div>
                        <div className="auth-role-desc">Request to join a family using its shared code.</div>
                      </div>
                      <div
                        className={`auth-role-card-modern ${connectionMethod === 'LATER' ? 'selected' : ''}`}
                        onClick={() => setConnectionMethod('LATER')}
                      >
                        <div className="role-card-content">
                          <div className="auth-role-title">Option C — Join Later</div>
                          <div className="auth-role-desc">Create independent account and join a family later.</div>
                        </div>
                        <div className="role-card-radio"></div>
                      </div>

                      {connectionMethod === 'INVITATION' && (
                        <div className="auth-form-group" style={{ marginTop: '16px' }}>
                          <label htmlFor="reg-token">Invitation Token</label>
                          <input id="reg-token" className="auth-form-input" value={invitationToken} required onChange={(e) => setInvitationToken(e.target.value)} />
                          {fieldError('connection.invitationtoken')}
                        </div>
                      )}
                      {connectionMethod === 'FAMILY_CODE' && (
                        <>
                          <div className="auth-form-group" style={{ marginTop: '16px' }}>
                            <label htmlFor="reg-family-code">Family Code</label>
                            <input id="reg-family-code" className="auth-form-input" value={familyCode} required placeholder="FV-ABC234" onChange={(e) => setFamilyCode(e.target.value)} />
                            {fieldError('connection.familycode')}
                          </div>
                          <div className="auth-form-group">
                            <label htmlFor="reg-relationship">Relationship</label>
                            <select id="reg-relationship" className="auth-form-input" value={relationship} required onChange={(e) => setRelationship(e.target.value)}>
                              <option value="">Select relationship</option>
                              {relationships.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            {fieldError('connection.relationship')}
                          </div>
                        </>
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
                    </div>
                  )}
                  {role === 'FAMILY_HEAD' && (
                    <div className="auth-review-list">
                      <p className="auth-review-item"><strong>Account:</strong> <span>{regName} <br/><span style={{ opacity: 0.7, fontSize: '0.85rem' }}>({regEmail})</span></span></p>
                      <p className="auth-review-item"><strong>Workspace:</strong> <span>{familyName}</span></p>
                      <p className="auth-review-item"><strong>Date of Birth:</strong> <span>{dateOfBirth}</span></p>
                      <label style={{ display: 'flex', gap: '8px', marginTop: '24px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                        I accept the Terms of Service and Privacy Policy.
                      </label>
                      {fieldError('acceptterms')}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: FINAL REVIEW (Member / Doctor) */}
              {regStep === 4 && (
                <div>
                  {role === 'MEMBER' && (
                    <div className="auth-review-list">
                      <p className="auth-review-item"><strong>Account:</strong> <span>{regName} <br/><span style={{ opacity: 0.7, fontSize: '0.85rem' }}>({regEmail})</span></span></p>
                      <p className="auth-review-item"><strong>Date of Birth:</strong> <span>{dateOfBirth}</span></p>
                      <p className="auth-review-item"><strong>Connection:</strong> <span>{connectionMethod === 'INVITATION' ? `Joining via Token (${invitationToken})` : connectionMethod === 'FAMILY_CODE' ? `Requesting via Family Code (${familyCode})` : 'Joining Later'}</span></p>
                      <label style={{ display: 'flex', gap: '8px', marginTop: '24px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                        I accept the Terms of Service and Privacy Policy.
                      </label>
                      {fieldError('acceptterms')}
                    </div>
                  )}
                  {role === 'DOCTOR' && (
                    <div className="auth-review-list">
                      <p className="auth-review-item"><strong>Account:</strong> <span>{regName} <br/><span style={{ opacity: 0.7, fontSize: '0.85rem' }}>({regEmail})</span></span></p>
                      <p className="auth-review-item"><strong>SLMC Registration:</strong> <span>{regNum}</span></p>
                      {specialty && <p className="auth-review-item"><strong>Specialty:</strong> <span>{specialty}</span></p>}
                      <div style={{ marginTop: '24px', fontSize: '0.9rem', color: '#f59e0b', lineHeight: 1.5 }}>
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
                <div style={{ position: 'relative' }}>
                  <input id="login-password" type={showLoginPassword ? 'text' : 'password'} className="auth-form-input" style={{ paddingRight: "40px" }} placeholder="At least 8 characters" value={loginPassword} required autoComplete="current-password" onChange={(e) => setLoginPassword(e.target.value)} />
                  <PasswordEye show={showLoginPassword} toggle={() => setShowLoginPassword(!showLoginPassword)} />
                </div>
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
