import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(), updateProfile: vi.fn(), getSchedule: vi.fn(), replaceAvailability: vi.fn(),
  addBlockedTime: vi.fn(), removeBlockedTime: vi.fn(),
}))
vi.mock('../../services/apiClient', () => ({ doctorWorkspaceApi: mocks }))

import { DoctorProfilePage } from './DoctorProfilePage'

describe('DoctorProfilePage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.getProfile.mockResolvedValue({ data: { id: 'd-1', displayName: 'Dr Synthetic', email: 'doc@example.invalid', registrationNumberLastFour: '0001',
      verificationStatus: 'Verified', specialty: 'General Practice', acceptingNewFamilies: true, slotMinutes: 30 } })
    mocks.getSchedule.mockResolvedValue({ data: { slotMinutes: 30, windows: [], blocked: [] } })
    mocks.replaceAvailability.mockResolvedValue({ data: { slotMinutes: 30, windows: [{ dayOfWeek: 'Monday', startTime: '09:00:00', endTime: '16:00:00' }], blocked: [] } })
  })

  it('shows the real registration suffix and saves weekly hours in clinic time', async () => {
    render(<MemoryRouter><DoctorProfilePage /></MemoryRouter>)

    expect(await screen.findByText('SLMC ••••0001')).toBeInTheDocument()
    expect(screen.queryByText(/9941/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Add hours' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save Hours' }))

    await waitFor(() => expect(mocks.replaceAvailability).toHaveBeenCalledWith([{ dayOfWeek: 'Monday', startTime: '09:00:00', endTime: '16:00:00' }]))
    expect(await screen.findByText(/Weekly hours saved/)).toBeInTheDocument()
  })
})
