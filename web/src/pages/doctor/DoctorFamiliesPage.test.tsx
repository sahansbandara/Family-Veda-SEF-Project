import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getDoctorDashboard: vi.fn(),
  getMyFamilyDoctorRequests: vi.fn(),
  acceptFamilyDoctorRequest: vi.fn(),
  declineFamilyDoctorRequest: vi.fn(),
}))
vi.mock('../../services/apiClient', () => ({ threePortalApi: mocks }))

import { DoctorFamiliesPage } from './DoctorFamiliesPage'

const request = {
  id: 'req-1', familyId: 'f-2', familyName: 'Synthetic Wijesinghe Family', memberCount: 4,
  doctor: { id: 'd-1', displayName: 'Dr. Synthetic' }, status: 'Pending', createdAt: '2026-09-28T10:00:00Z',
}

describe('DoctorFamiliesPage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.getDoctorDashboard.mockResolvedValue({ data: { families: [
      { familyId: 'f-1', familyName: 'Synthetic Perera Family', memberCount: 4, nextAppointment: '2026-10-02T10:30:00Z' },
      { familyId: 'f-3', familyName: 'Synthetic Solo Family', memberCount: 1 },
    ] } })
    mocks.getMyFamilyDoctorRequests.mockResolvedValue({ data: [request] })
    mocks.acceptFamilyDoctorRequest.mockResolvedValue({})
  })

  it('shows assigned families from the API and labels a one-person family as an individual patient', async () => {
    render(<MemoryRouter initialEntries={['/families']}><DoctorFamiliesPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'My Families' })).toBeInTheDocument()
    expect(await screen.findByText('Synthetic Perera Family')).toBeInTheDocument()
    expect(screen.getByText('Synthetic Solo Family · Individual patient')).toBeInTheDocument()
    expect(screen.queryByText(/Dr\. Synthetic Perera/)).not.toBeInTheDocument()
  })

  it('shows summary figures taken from the API only', async () => {
    render(<MemoryRouter initialEntries={['/families']}><DoctorFamiliesPage /></MemoryRouter>)

    await screen.findByText('Synthetic Perera Family')
    expect(screen.getByText('Assigned households').parentElement).toHaveTextContent('02')
    expect(screen.getByText('New family requests').parentElement).toHaveTextContent('01')
    expect(screen.getByText('Families with upcoming visits').parentElement).toHaveTextContent('01')
  })

  it('searches assigned families by name', async () => {
    render(<MemoryRouter initialEntries={['/families']}><DoctorFamiliesPage /></MemoryRouter>)

    fireEvent.change(await screen.findByLabelText('Search assigned families'), { target: { value: 'solo' } })
    expect(screen.queryByText('Synthetic Perera Family')).not.toBeInTheDocument()
    expect(screen.getByText('Synthetic Solo Family · Individual patient')).toBeInTheDocument()
  })

  it('asks for confirmation before accepting a request and says no clinical access is granted', async () => {
    render(<MemoryRouter initialEntries={['/families?tab=requests']}><DoctorFamiliesPage /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }))
    expect(mocks.acceptFamilyDoctorRequest).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog', { name: 'Accept family request?' })
    expect(dialog).toHaveTextContent(/does not grant access to any member's clinical records/)

    fireEvent.click(within(dialog).getByRole('button', { name: 'Accept request' }))
    expect(await screen.findByText(/You are now the family doctor for Synthetic Wijesinghe Family/)).toBeInTheDocument()
    expect(mocks.acceptFamilyDoctorRequest).toHaveBeenCalledTimes(1)
    expect(mocks.acceptFamilyDoctorRequest).toHaveBeenCalledWith('req-1')
  })

  it('cancelling the confirmation changes nothing', async () => {
    render(<MemoryRouter initialEntries={['/families?tab=requests']}><DoctorFamiliesPage /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: 'Decline' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mocks.declineFamilyDoctorRequest).not.toHaveBeenCalled()
  })

  it('shows the server error when a decision fails and never reports success', async () => {
    mocks.acceptFamilyDoctorRequest.mockRejectedValue(new Error('network'))
    render(<MemoryRouter initialEntries={['/families?tab=requests']}><DoctorFamiliesPage /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Accept request' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/)
    expect(screen.queryByText(/You are now the family doctor/)).not.toBeInTheDocument()
  })
})
