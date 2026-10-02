import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getDoctorAppointments: vi.fn(),
  setAppointmentStatus: vi.fn(),
  reschedule: vi.fn(),
}))

vi.mock('../../services/apiClient', () => ({
  threePortalApi: {
    getDoctorAppointments: mocks.getDoctorAppointments,
    setAppointmentStatus: mocks.setAppointmentStatus,
  },
  doctorWorkspaceApi: {
    reschedule: mocks.reschedule,
  },
}))

import { DoctorCalendarPage } from './DoctorCalendarPage'

const sampleAppointments = [
  {
    id: 'apt-1',
    startsAt: '2026-10-05T10:00:00Z',
    status: 'Confirmed' as const,
    memberId: 'm-1',
    memberDisplayName: 'Synthetic Head',
    familyName: 'Synthetic Demonstration Family',
    reason: 'Routine health checkup',
  },
  {
    id: 'apt-2',
    startsAt: '2026-10-05T14:30:00Z',
    status: 'Requested' as const,
    memberId: 'm-2',
    memberDisplayName: 'Synthetic Minor',
    familyName: 'Synthetic Demonstration Family',
    reason: 'Follow-up for asthma',
  },
  {
    id: 'apt-3',
    startsAt: '2026-10-12T09:00:00Z',
    status: 'Confirmed' as const,
    memberId: 'm-3',
    memberDisplayName: 'Adult Brother',
    familyName: 'Synthetic Perera Family',
    reason: 'Annual blood review',
  },
]

describe('DoctorCalendarPage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.getDoctorAppointments.mockResolvedValue({ data: sampleAppointments })
    mocks.setAppointmentStatus.mockResolvedValue({})
  })

  it('renders the interactive month calendar grid and navigates months', async () => {
    render(
      <MemoryRouter>
        <DoctorCalendarPage />
      </MemoryRouter>
    )

    // Heading and Calendar card
    expect(await screen.findByRole('heading', { name: 'Calendar' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Monthly Calendar Overview' })).toBeInTheDocument()

    // Weekdays
    expect(screen.getByRole('columnheader', { name: 'Sun' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Mon' })).toBeInTheDocument()

    // Month navigation buttons
    const prevBtn = screen.getByRole('button', { name: /Previous month/i })
    const nextBtn = screen.getByRole('button', { name: /Next month/i })
    const todayBtn = screen.getByRole('button', { name: /Today/i })

    expect(prevBtn).toBeInTheDocument()
    expect(nextBtn).toBeInTheDocument()
    expect(todayBtn).toBeInTheDocument()

    // Navigating month
    fireEvent.click(nextBtn)
    fireEvent.click(prevBtn)
  })

  it('filters appointments when a day cell is clicked and allows clearing the filter', async () => {
    render(
      <MemoryRouter>
        <DoctorCalendarPage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Calendar' })).toBeInTheDocument()

    // Find the cell with 2 visits on Oct 5
    const oct5Cell = await screen.findByRole('button', { name: /5 Oct, 2 appointments/i })
    expect(oct5Cell).toBeInTheDocument()

    // Click Oct 5 to filter
    fireEvent.click(oct5Cell)

    // Filter banner appears
    expect(await screen.findByText(/Filtered to/i)).toBeInTheDocument()
    expect(screen.getByText('Routine health checkup')).toBeInTheDocument()
    expect(screen.getByText('Follow-up for asthma')).toBeInTheDocument()

    // Clear filter
    const clearBtn = screen.getByRole('button', { name: 'Clear date filter' })
    fireEvent.click(clearBtn)

    expect(screen.queryByText(/Filtered to/i)).not.toBeInTheDocument()
  })

  it('updates an appointment status from the calendar page', async () => {
    render(
      <MemoryRouter>
        <DoctorCalendarPage />
      </MemoryRouter>
    )

    // Default range is week, so Oct 5 appointment is visible
    const completeBtn = await screen.findByRole('button', { name: 'Complete' })
    fireEvent.click(completeBtn)

    expect(mocks.setAppointmentStatus).toHaveBeenCalledWith('apt-1', 'complete')
    expect(await screen.findByText(/Synthetic Head's appointment updated/i)).toBeInTheDocument()
  })
})
