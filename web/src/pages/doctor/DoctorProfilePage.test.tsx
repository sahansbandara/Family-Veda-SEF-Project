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
    expect(screen.getByText('0 active days')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Enable Monday' }))
    expect(screen.getByText('1 active day')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save weekly hours' }))

    await waitFor(() => expect(mocks.replaceAvailability).toHaveBeenCalledWith([{ dayOfWeek: 'Monday', startTime: '09:00:00', endTime: '16:00:00' }]))
    expect(await screen.findByText(/Weekly hours saved/)).toBeInTheDocument()
  })

  it('refuses overlapping ranges before calling the API', async () => {
    render(<MemoryRouter><DoctorProfilePage /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Enable Tuesday' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add time range for Tuesday' }))
    fireEvent.change(screen.getByLabelText('Tuesday range 2 start'), { target: { value: '10:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save weekly hours' }))

    expect(await screen.findByText('Check Tuesday: time ranges must not overlap.')).toBeInTheDocument()
    expect(mocks.replaceAvailability).not.toHaveBeenCalled()
  })

  it('saves the practice profile and blocks a period through the API', async () => {
    mocks.updateProfile.mockResolvedValue({ data: { id: 'd-1', displayName: 'Dr Synthetic', email: 'doc@example.invalid', registrationNumberLastFour: '0001',
      verificationStatus: 'Verified', specialty: 'Family Medicine', acceptingNewFamilies: false, slotMinutes: 30 } })
    mocks.addBlockedTime.mockResolvedValue({ data: {} })
    render(<MemoryRouter><DoctorProfilePage /></MemoryRouter>)

    fireEvent.change(await screen.findByLabelText('Specialty'), { target: { value: 'Family Medicine' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Accepting new families' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save profile changes' }))
    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ specialty: 'Family Medicine', acceptingNewFamilies: false, slotMinutes: 30 })))
    expect(await screen.findByText('Not accepting')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-12T09:00' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-10-12T08:00' } })
    fireEvent.click(screen.getByRole('button', { name: '+ Block this period' }))
    expect(await screen.findByText('Choose an end date and time later than the start.')).toBeInTheDocument()
    expect(mocks.addBlockedTime).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-10-12T17:00' } })
    fireEvent.click(screen.getByRole('button', { name: '+ Block this period' }))
    await waitFor(() => expect(mocks.addBlockedTime).toHaveBeenCalledWith({
      startsAt: new Date('2026-10-12T09:00').toISOString(), endsAt: new Date('2026-10-12T17:00').toISOString(), reason: undefined,
    }))
  })
})
