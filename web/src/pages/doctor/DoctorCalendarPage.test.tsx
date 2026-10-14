import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getDoctorAppointments: vi.fn(),
  setAppointmentStatus: vi.fn(),
  reschedule: vi.fn(),
  getSchedule: vi.fn(),
}))

vi.mock('../../services/apiClient', () => ({
  threePortalApi: {
    getDoctorAppointments: mocks.getDoctorAppointments,
    setAppointmentStatus: mocks.setAppointmentStatus,
  },
  doctorWorkspaceApi: {
    reschedule: mocks.reschedule,
    getSchedule: mocks.getSchedule,
  },
}))

import { DoctorCalendarPage } from './DoctorCalendarPage'

// Synthetic appointments placed relative to today so the default selection (today) always has data.
const at = (dayOffset: number, hour: number) => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, 0).toISOString()
}

const doctor = { id: 'd-1', displayName: 'Dr. Synthetic Verified Doctor' }
const make = (id: string, startsAt: string, status: string, memberDisplayName: string, reason: string) => ({
  id, startsAt, status, memberId: `m-${id}`, memberDisplayName, familyName: 'Synthetic Demonstration Family', reason, durationMinutes: 30, doctor, createdAt: startsAt,
})

const confirmed = make('apt-1', at(0, 10), 'Confirmed', 'Synthetic Head', 'Routine health checkup')
const requested = make('apt-2', at(0, 14), 'Requested', 'Synthetic Minor', 'Follow-up visit')
const completed = make('apt-3', at(0, 16), 'Completed', 'Synthetic Adult', 'Annual review')
const tomorrow = make('apt-4', at(1, 9), 'Confirmed', 'Synthetic Elder', 'Review appointment')

const renderPage = () => render(<MemoryRouter><DoctorCalendarPage /></MemoryRouter>)
const drawer = () => within(screen.getByRole('dialog', { name: 'Appointment details' }))

describe('DoctorCalendarPage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.getDoctorAppointments.mockResolvedValue({ data: [confirmed, requested, completed, tomorrow] })
    mocks.getSchedule.mockResolvedValue({ data: { slotMinutes: 30, windows: [], blocked: [] } })
  })

  it('shows the compact header, API-driven metrics and the selected-day agenda', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'My Calendar' })).toBeInTheDocument()
    const agenda = within(await screen.findByRole('complementary', { name: 'Selected day' }))
    expect(await agenda.findByText('Synthetic Head')).toBeInTheDocument()
    expect(agenda.getByText('Follow-up visit')).toBeInTheDocument()
    expect(agenda.getByText(/3 appointments/)).toBeInTheDocument()

    const summary = within(screen.getByLabelText('Appointment summary'))
    expect(summary.getByText("Today's visits").nextElementSibling).toHaveTextContent('3')
    expect(summary.getByText('Pending requests').nextElementSibling).toHaveTextContent('1')
    expect(mocks.getDoctorAppointments).toHaveBeenCalledTimes(1)
  })

  it('updates the agenda when another date is selected', async () => {
    renderPage()
    const agenda = within(await screen.findByRole('complementary', { name: 'Selected day' }))
    await agenda.findByText('Synthetic Head')

    // Week view always contains tomorrow or, on a Saturday, needs one step forward.
    fireEvent.click(screen.getByRole('button', { name: 'Day' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next day' }))

    expect(await screen.findByText('Synthetic Elder')).toBeInTheDocument()
    expect(screen.queryByText('Synthetic Head')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(await screen.findByText('Synthetic Head')).toBeInTheDocument()
  })

  it('switches between month, week and day views', async () => {
    renderPage()
    await screen.findByRole('group', { name: 'Days of the month' })

    fireEvent.click(screen.getByRole('button', { name: 'Week' }))
    expect(screen.queryByRole('group', { name: 'Days of the month' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next week' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Day' }))
    expect(screen.getByRole('group', { name: 'Days of this week' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers only the actions the status allows', async () => {
    renderPage()
    const agenda = within(await screen.findByRole('complementary', { name: 'Selected day' }))

    fireEvent.click((await agenda.findByText('Synthetic Minor')).closest('button')!)
    expect(drawer().getByRole('button', { name: 'Confirm appointment' })).toBeInTheDocument()
    expect(drawer().getByRole('button', { name: 'Reschedule' })).toBeInTheDocument()
    expect(drawer().getByRole('button', { name: 'Cancel appointment' })).toBeInTheDocument()
    expect(drawer().queryByRole('button', { name: 'Complete visit' })).not.toBeInTheDocument()
    expect(drawer().queryByRole('button', { name: 'Mark no-show' })).not.toBeInTheDocument()
    fireEvent.click(drawer().getByRole('button', { name: 'Close appointment details' }))

    fireEvent.click(agenda.getByText('Synthetic Adult').closest('button')!)
    expect(drawer().getByText(/This appointment is closed/)).toBeInTheDocument()
    expect(drawer().queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument()
    expect(drawer().queryByRole('button', { name: 'Cancel appointment' })).not.toBeInTheDocument()
  })

  it('asks before completing, then shows the status the server returned', async () => {
    mocks.setAppointmentStatus.mockResolvedValue({ data: { ...confirmed, status: 'Completed' } })
    renderPage()
    const agenda = within(await screen.findByRole('complementary', { name: 'Selected day' }))
    fireEvent.click((await agenda.findByText('Synthetic Head')).closest('button')!)

    fireEvent.click(drawer().getByRole('button', { name: 'Complete visit' }))
    expect(mocks.setAppointmentStatus).not.toHaveBeenCalled()
    fireEvent.click(drawer().getByRole('button', { name: 'Yes, complete visit' }))

    await waitFor(() => expect(mocks.setAppointmentStatus).toHaveBeenCalledWith('apt-1', 'complete', undefined))
    expect(await screen.findByText("Synthetic Head's appointment marked as completed.")).toBeInTheDocument()
    expect(drawer().getByText(/This appointment is closed/)).toBeInTheDocument()
  })

  it('keeps the old status and shows the server error when an action is rejected', async () => {
    mocks.setAppointmentStatus.mockRejectedValue({ response: { data: { message: 'This appointment has already started. Reschedule it or cancel it instead.' } } })
    renderPage()
    const agenda = within(await screen.findByRole('complementary', { name: 'Selected day' }))
    fireEvent.click((await agenda.findByText('Synthetic Minor')).closest('button')!)

    fireEvent.click(drawer().getByRole('button', { name: 'Confirm appointment' }))

    expect(await drawer().findByRole('alert')).toHaveTextContent('This appointment has already started')
    expect(drawer().getByRole('button', { name: 'Confirm appointment' })).toBeInTheDocument()
    expect(screen.queryByText(/appointment confirmed/)).not.toBeInTheDocument()
  })

  it('reschedules through the backend and reports an overlap', async () => {
    mocks.reschedule.mockRejectedValue({ response: { data: { message: 'You already have an appointment overlapping this time.' } } })
    renderPage()
    const agenda = within(await screen.findByRole('complementary', { name: 'Selected day' }))
    fireEvent.click((await agenda.findByText('Synthetic Head')).closest('button')!)

    fireEvent.click(drawer().getByRole('button', { name: 'Reschedule' }))
    const future = new Date(Date.now() + 3 * 86_400_000)
    future.setHours(11, 0, 0, 0)
    const value = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}T11:00`
    fireEvent.change(drawer().getByLabelText('New date and time'), { target: { value } })
    fireEvent.click(drawer().getByRole('button', { name: 'Move appointment' }))

    await waitFor(() => expect(mocks.reschedule).toHaveBeenCalledWith('apt-1', future.toISOString(), undefined))
    expect(await drawer().findByRole('alert')).toHaveTextContent('overlapping this time')
  })

  it('closes the drawer with Escape and returns focus to the appointment', async () => {
    renderPage()
    const agenda = within(await screen.findByRole('complementary', { name: 'Selected day' }))
    const trigger = (await agenda.findByText('Synthetic Head')).closest('button')!
    fireEvent.click(trigger)

    expect(drawer().getByRole('button', { name: 'Close appointment details' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('shows a retry state when appointments fail to load', async () => {
    mocks.getDoctorAppointments.mockRejectedValueOnce(new Error('network'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    const agenda = within(await screen.findByRole('complementary', { name: 'Selected day' }))
    expect(await agenda.findByText('Synthetic Head')).toBeInTheDocument()
  })
})
