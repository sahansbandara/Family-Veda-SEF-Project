import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../../store/slices/authSlice'
import { apiClient } from '../../services/apiClient'
import { AuthPage } from './AuthPage'

const authResponse = {
  userId: 'user-1', displayName: 'Synthetic Person', userType: 'FamilyUser' as const,
  familyRole: 'Head', doctorVerificationStatus: null, familyHeadVerificationStatus: 'Pending',
  accessToken: 'access-token', refreshToken: 'refresh-token', accessTokenExpiresAt: new Date().toISOString(), familyCode: 'FV-ABC234',
}

const renderAuth = (path = '/login') => {
  window.history.pushState({}, '', path)
  const store = configureStore({ reducer: { auth: authReducer } })
  render(<Provider store={store}><BrowserRouter><AuthPage /></BrowserRouter></Provider>)
}

const change = (label: string, value: string) => fireEvent.change(screen.getAllByLabelText(label)[0], { target: { value } })
const continueRegistration = () => fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

function completeAccount() {
  change('Full Name', 'Synthetic Person')
  change('Email Address', 'synthetic.person@example.invalid')
  change('Mobile Number', '0771234567')
  change('Create Password', 'Synthetic-Pass-42!')
  change('Confirm Password', 'Synthetic-Pass-42!')
  continueRegistration()
}

function completePersonal() {
  change('Date of Birth', '1985-06-15')
  fireEvent.change(screen.getByLabelText('Clinical Sex Reference'), { target: { value: 'Female' } })
  change('Address Line 1', '12 Synthetic Lane')
  change('City', 'Kandy')
  fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Kandy' } })
  change('Postal Code (optional)', '20000')
}

describe('AuthPage', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('sends doctors to the dedicated registration form with licence upload', () => {
    renderAuth('/register')
    fireEvent.click(screen.getByText('Medical Practitioner'))
    continueRegistration()
    expect(window.location.pathname).toBe('/register/doctor')
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('renders the existing login controls', () => {
    renderAuth()
    expect(screen.getByRole('heading', { name: /Sign in/i, level: 2 })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Sign up/i }).length).toBeGreaterThan(0)
  })

  it('posts the complete atomic family-head payload only after terms are accepted', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: authResponse })
    renderAuth('/register')
    continueRegistration()
    completeAccount()
    completePersonal()
    change('Family Workspace Name', 'Synthetic Registration Family')
    change('Synthetic NIC', '200012345678')
    continueRegistration()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => expect(post).toHaveBeenCalledWith('/auth/register/family-head', expect.objectContaining({
      account: expect.objectContaining({ fullName: 'Synthetic Person', mobileNumber: '0771234567' }),
      personal: { dateOfBirth: '1985-06-15', sexForClinicalReference: 'Female' },
      address: expect.objectContaining({ district: 'Kandy', postalCode: '20000' }),
      familyName: 'Synthetic Registration Family', nationalId: '200012345678', acceptTerms: true,
    })))
  })

  it('posts family-code adult registration with a relationship', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { auth: { ...authResponse, familyRole: null }, connectionOutcome: 'JoinRequestPending' } })
    renderAuth('/register')
    fireEvent.click(screen.getByText('Adult Member'))
    continueRegistration()
    completeAccount()
    completePersonal()
    continueRegistration()
    fireEvent.click(screen.getByText('Option B — I have a Family Code'))
    change('Family Code', 'FV-ABC234')
    fireEvent.change(screen.getByLabelText('Relationship'), { target: { value: 'Sibling' } })
    continueRegistration()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => expect(post).toHaveBeenCalledWith('/auth/register/adult-member', expect.objectContaining({
      connection: { method: 'FamilyCode', invitationToken: null, familyCode: 'FV-ABC234', relationship: 'Sibling' }, acceptTerms: true,
    })))
  })

  it('shows a ProblemDetails field error inline', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue({ response: { data: { errors: { AcceptTerms: ['The terms must be accepted.'] } } } })
    renderAuth('/register')
    continueRegistration()
    completeAccount()
    completePersonal()
    change('Family Workspace Name', 'Synthetic Registration Family')
    change('Synthetic NIC', '200012345678')
    continueRegistration()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The terms must be accepted.'))
  })
})
