import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../../store/slices/authSlice'
import { profileApi, type MyProfileDto } from '../../services/apiClient'
import { ProfilePage } from './ProfilePage'
import { passwordStrength } from './passwordStrength'

const familyProfile: MyProfileDto = {
  userId: 'u1', email: 'synthetic.head@example.invalid', displayName: 'Synthetic Head', userType: 'FamilyUser',
  createdAt: '2026-01-01T00:00:00Z', familyRole: 'Head', familyName: 'Synthetic Family', familyCode: 'FV-ABC234',
  dateOfBirth: '1985-06-15', sexForClinicalReference: 'Female',
}

const ok = <T,>(data: T) => Promise.resolve({ data } as never)

function renderPage(profile: MyProfileDto = familyProfile) {
  vi.spyOn(profileApi, 'getMine').mockReturnValue(ok(profile))
  const store = configureStore({ reducer: { auth: authReducer } })
  render(<Provider store={store}><MemoryRouter><ProfilePage /></MemoryRouter></Provider>)
  return store
}

describe('ProfilePage', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('enables Save only when the display name changes and Discard resets it', async () => {
    renderPage()
    const input = await screen.findByLabelText('Display name')
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()
    fireEvent.change(input, { target: { value: 'New Name' } })
    expect(save).toBeEnabled()
    fireEvent.change(input, { target: { value: 'A' } })
    expect(save).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(input).toHaveValue('Synthetic Head')
  })

  it('saves the display name through the API', async () => {
    renderPage()
    const update = vi.spyOn(profileApi, 'updateMine').mockReturnValue(ok({ ...familyProfile, displayName: 'New Name' }))
    fireEvent.change(await screen.findByLabelText('Display name'), { target: { value: 'New Name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith('New Name'))
    expect(await screen.findByRole('status')).toHaveTextContent('Profile saved.')
  })

  it('switches sections and shows read-only family tiles without editable clinical fields', async () => {
    renderPage()
    const tab = await screen.findByRole('button', { name: /Account information/ })
    fireEvent.click(tab)
    expect(tab).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('FV-ABC234')).toBeInTheDocument()
    expect(screen.getByText('1985-06-15')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Date of birth/)).toBeNull()
    expect(screen.getByRole('link', { name: 'Family' })).toHaveAttribute('href', '/family')
  })

  it('hides family tiles for a doctor and links to the doctor profile', async () => {
    renderPage({ ...familyProfile, userType: 'Doctor', familyRole: null })
    fireEvent.click(await screen.findByRole('button', { name: /Account information/ }))
    expect(screen.queryByText('Family Code')).toBeNull()
    expect(screen.getByRole('link', { name: 'Doctor profile' })).toHaveAttribute('href', '/doctor-profile')
  })

  it('toggles password visibility, rates strength and blocks mismatched passwords', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Security/ }))
    const eye = screen.getByRole('button', { name: 'Show new password' })
    expect(eye).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(eye)
    expect(screen.getByRole('button', { name: 'Hide new password' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Synthetic-Pass-42!' } })
    expect(screen.getByText('Strength: Strong')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old-password' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different-1' } })
    const change = vi.spyOn(profileApi, 'changePassword')
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByRole('status')).toHaveTextContent('The new passwords do not match.')
    expect(change).not.toHaveBeenCalled()
  })

  it('scores password strength from the typed value', () => {
    expect(passwordStrength('').score).toBe(0)
    expect(passwordStrength('abc').meetsMinimum).toBe(false)
    expect(passwordStrength('abcdefgh').score).toBe(2)
    expect(passwordStrength('Abcdefg1!').score).toBe(3)
  })
})
