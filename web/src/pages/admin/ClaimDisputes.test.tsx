import '@testing-library/jest-dom/vitest'

import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: { get: mocks.get, post: mocks.post } }))

import authReducer from '../../store/slices/authSlice'
import { AdminDashboardPanel } from './AdminDashboardPanel'
import { ClaimDisputesPanel } from './ClaimDisputesPanel'

const dispute = {
  id: 'dispute-1', registrationNumberLastFour: '7001', status: 'Open', registeredName: 'Dr. Synthetic Real', openedAt: '2026-10-18T00:00:00Z', duplicateLicenseFile: false,
  claimants: [
    { doctorId: 'doc-a', userId: 'u-a', displayName: 'Dr Synthetic Impostor', email: 'a@example.invalid', verificationStatus: 'Verified', registerMatch: 'NameMismatch', hasLicenseDocument: true, submittedAt: '2026-10-01T00:00:00Z', ownershipConfirmed: false, evidenceRequests: [] },
    { doctorId: 'doc-b', userId: 'u-b', displayName: 'Dr Synthetic Real', email: 'b@example.invalid', verificationStatus: 'Pending', registerMatch: 'Match', hasLicenseDocument: true, submittedAt: '2026-10-18T00:00:00Z', ownershipConfirmed: false, evidenceRequests: [] },
  ],
}

const page = (items: unknown[]) => ({ data: { items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 } })

describe('ClaimDisputesPanel', () => {
  beforeEach(() => { mocks.get.mockReset(); mocks.post.mockReset() })

  it('shows claimants side by side with register match and requires a reason to resolve', async () => {
    mocks.get.mockResolvedValue({ data: [dispute] })
    mocks.post.mockResolvedValue({ data: {} })
    render(<ClaimDisputesPanel />)

    expect(await screen.findByText('Name mismatch')).toBeInTheDocument()
    expect(screen.getByText('Register match')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/Dr Synthetic Real/))
    fireEvent.click(screen.getByRole('button', { name: 'Resolve dispute' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('A reason is required.')
    expect(mocks.post).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Synthetic licence matches register' } })
    fireEvent.click(screen.getByRole('button', { name: 'Resolve dispute' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/admin/disputes/dispute-1/resolve', { winnerDoctorId: 'doc-b', reason: 'Synthetic licence matches register' }))
  })

  it('renders nothing when there are no open disputes', async () => {
    mocks.get.mockResolvedValue({ data: [] })
    const { container } = render(<ClaimDisputesPanel />)
    await waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})

describe('AdminDashboardPanel Needs Attention actions', () => {
  beforeEach(() => { mocks.get.mockReset(); mocks.post.mockReset() })

  const renderDashboard = (doctor: Record<string, unknown>) => {
    mocks.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/admin/doctors' ? page([doctor]) : page([])))
    const store = configureStore({ reducer: { auth: authReducer } })
    render(<Provider store={store}><MemoryRouter><AdminDashboardPanel /></MemoryRouter></Provider>)
  }

  it('rejects a pending doctor only after a reason is given', async () => {
    mocks.post.mockResolvedValue({ data: {} })
    renderDashboard({ id: 'doc-1', userId: 'u-1', registrationNumberLastFour: '1234', verificationStatus: 'Pending', displayName: 'Dr Synthetic Pending', registerMatch: 'NotInRegister' })

    fireEvent.click(await screen.findByRole('button', { name: 'Reject' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reject' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('A reason is required.')
    expect(screen.getByText('Not in register')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Reason for/), { target: { value: 'Synthetic licence unreadable' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reject' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/admin/doctors/doc-1/reject', { reason: 'Synthetic licence unreadable' }))
  })

  it('disables Verify for a disputed claim', async () => {
    renderDashboard({ id: 'doc-2', userId: 'u-2', registrationNumberLastFour: '7001', verificationStatus: 'Pending', displayName: 'Dr Synthetic Real', claimDisputed: true, registerMatch: 'Match' })

    expect(await screen.findByRole('button', { name: 'Verify' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Request info' })).toBeEnabled()
    expect(screen.getByText('Disputed claim')).toBeInTheDocument()
  })
})
