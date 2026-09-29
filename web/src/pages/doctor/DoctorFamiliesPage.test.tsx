import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
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

  it('opens the requests tab from the URL and accepts a request', async () => {
    render(<MemoryRouter initialEntries={['/families?tab=requests']}><DoctorFamiliesPage /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }))
    expect(mocks.acceptFamilyDoctorRequest).toHaveBeenCalledWith('req-1')
    expect(await screen.findByText(/You are now the family doctor for Synthetic Wijesinghe Family/)).toBeInTheDocument()
  })
})
