// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Tests for the redesigned DoctorRegisterPage (3-step stepper).

import '@testing-library/jest-dom/vitest'
import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import authReducer from '../../store/slices/authSlice'
import { DoctorRegisterPage } from './DoctorRegisterPage'

// Mock asset imports so Vitest doesn't choke on binary files
vi.mock('../../assets/logo.png',     () => ({ default: 'logo.png' }))
vi.mock('../../assets/Register.webp', () => ({ default: 'register.webp' }))

// Mock CSS import
vi.mock('../../styles/auth-shell.css', () => ({}))

function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer } })
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/register/doctor']}>
          <DoctorRegisterPage />
        </MemoryRouter>
      </Provider>,
    ),
  }
}

describe('DoctorRegisterPage — Premium Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders Step 1 with account fields on initial load', () => {
    renderPage()

    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('renders stepper with three steps', () => {
    renderPage()
    // Stepper has nav landmark
    const stepper = screen.getByRole('navigation', { name: /registration progress/i })
    expect(stepper).toBeInTheDocument()
  })

  it('shows the hero panel with brand name', () => {
    renderPage()
    // FamilyVeda appears in both the hero panel and the form logo mark
    expect(screen.getAllByText('FamilyVeda').length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT contain demo credentials, synthetic text, or quick-fill controls', () => {
    renderPage()

    expect(screen.queryByText(/quick fill/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/synthetic clinician/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/never enter a real registration number/i)).not.toBeInTheDocument()
  })

  // ── Step 1 validation ──────────────────────────────────────────────────────

  it('shows validation error when continuing with empty Step 1 fields', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/enter your full name/i)).toBeInTheDocument()
    })
  })

  it('shows email validation error for invalid email', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Dr Test' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('shows password too short error', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Dr Test' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'dr@test.lk' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument()
    })
  })

  it('shows password mismatch error', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/full name/i),      { target: { value: 'Dr Test' } })
    fireEvent.change(screen.getByLabelText(/email address/i),  { target: { value: 'dr@test.lk' } })
    fireEvent.change(screen.getByLabelText(/^password/i),      { target: { value: 'ValidPassword1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i),{ target: { value: 'DifferentPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  // ── Step navigation ────────────────────────────────────────────────────────

  it('advances to Step 2 when Step 1 is valid', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText(/full name/i),       { target: { value: 'Dr. Jane Smith' } })
    fireEvent.change(screen.getByLabelText(/email address/i),   { target: { value: 'jane@hospital.lk' } })
    fireEvent.change(screen.getByLabelText(/^password/i),       { target: { value: 'ValidPassword1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i),{ target: { value: 'ValidPassword1!' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText('Professional details')).toBeInTheDocument()
      expect(screen.getByLabelText(/slmc registration number/i)).toBeInTheDocument()
    })
  })

  it('Back button returns from Step 2 to Step 1', async () => {
    renderPage()

    // Go to step 2
    fireEvent.change(screen.getByLabelText(/full name/i),       { target: { value: 'Dr. Jane Smith' } })
    fireEvent.change(screen.getByLabelText(/email address/i),   { target: { value: 'jane@hospital.lk' } })
    fireEvent.change(screen.getByLabelText(/^password/i),       { target: { value: 'ValidPassword1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i),{ target: { value: 'ValidPassword1!' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText('Professional details')).toBeInTheDocument()
    })

    // Go back
    fireEvent.click(screen.getByRole('button', { name: /back/i }))

    await waitFor(() => {
      expect(screen.getByText('Create your account')).toBeInTheDocument()
    })
  })

  // ── Step 2 validation ──────────────────────────────────────────────────────

  it('shows registration number error when Step 2 continues without it', async () => {
    renderPage()

    // Advance to step 2
    fireEvent.change(screen.getByLabelText(/full name/i),       { target: { value: 'Dr. Jane Smith' } })
    fireEvent.change(screen.getByLabelText(/email address/i),   { target: { value: 'jane@hospital.lk' } })
    fireEvent.change(screen.getByLabelText(/^password/i),       { target: { value: 'ValidPassword1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i),{ target: { value: 'ValidPassword1!' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/slmc registration number/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /review details/i }))

    await waitFor(() => {
      expect(screen.getByText(/enter your registration number/i)).toBeInTheDocument()
    })
  })

  // ── Step 3 Review ──────────────────────────────────────────────────────────

  it('shows review page with entered data', async () => {
    renderPage()

    // Step 1
    fireEvent.change(screen.getByLabelText(/full name/i),       { target: { value: 'Dr. Jane Smith' } })
    fireEvent.change(screen.getByLabelText(/email address/i),   { target: { value: 'jane@hospital.lk' } })
    fireEvent.change(screen.getByLabelText(/^password/i),       { target: { value: 'ValidPassword1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i),{ target: { value: 'ValidPassword1!' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => screen.getByLabelText(/slmc registration number/i))

    // Step 2
    fireEvent.change(screen.getByLabelText(/slmc registration number/i), { target: { value: 'SLMC-1234' } })
    fireEvent.click(screen.getByRole('button', { name: /review details/i }))

    await waitFor(() => {
      expect(screen.getByText('Review & submit')).toBeInTheDocument()
      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('jane@hospital.lk')).toBeInTheDocument()
      expect(screen.getByText('Reg: SLMC-1234')).toBeInTheDocument()
    })
  })

  it('shows the verification pending notice on review step', async () => {
    renderPage()

    // Step 1
    fireEvent.change(screen.getByLabelText(/full name/i),       { target: { value: 'Dr. Jane Smith' } })
    fireEvent.change(screen.getByLabelText(/email address/i),   { target: { value: 'jane@hospital.lk' } })
    fireEvent.change(screen.getByLabelText(/^password/i),       { target: { value: 'ValidPassword1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i),{ target: { value: 'ValidPassword1!' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => screen.getByLabelText(/slmc registration number/i))

    // Step 2
    fireEvent.change(screen.getByLabelText(/slmc registration number/i), { target: { value: 'SLMC-1234' } })
    fireEvent.click(screen.getByRole('button', { name: /review details/i }))

    await waitFor(() => {
      // The pending notice has role="note"
      const notice = screen.getByRole('note')
      expect(notice).toBeInTheDocument()
      expect(notice).toHaveTextContent(/your profile will be reviewed/i)
      expect(notice).toHaveTextContent(/verification required/i)
    })
  })

  // ── Password visibility toggle ─────────────────────────────────────────────

  it('toggles password visibility', () => {
    renderPage()

    const pwInput = screen.getByLabelText(/^password/i)
    expect(pwInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getAllByRole('button', { name: /show password/i })[0]
    fireEvent.click(toggleBtn)
    expect(pwInput).toHaveAttribute('type', 'text')
  })

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('has accessible main landmark with label', () => {
    renderPage()
    expect(screen.getByRole('main', { name: /doctor registration/i })).toBeInTheDocument()
  })
})
