import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), getFamilyDoctor: vi.fn(), getFamilyDoctorSlots: vi.fn() }))
vi.mock('../../store/hooks', () => ({ useAppSelector: (selector: (state: object) => unknown) => selector({ auth: { user: { role: 'ADULT_MEMBER' } } }) }))
vi.mock('../../services/apiClient', () => ({ apiClient: { get: mocks.get }, threePortalApi: mocks, doctorWorkspaceApi: { getFamilyDoctorSlots: mocks.getFamilyDoctorSlots } }))
import { MyDoctorPage } from './MyDoctorPage'

function page() { return render(<MemoryRouter><MyDoctorPage /></MemoryRouter>) }

describe('MyDoctor availability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.get.mockResolvedValue({ data: { id: 'synthetic-family' } })
    mocks.getFamilyDoctor.mockResolvedValue({ data: { id: 'synthetic-doctor', displayName: 'Synthetic Doctor', specialty: 'Family Medicine' } })
  })

  it('loads the chosen date and renders UTC slots in Sri Lanka time', async () => {
    mocks.getFamilyDoctorSlots.mockResolvedValue({ data: { date: '2026-10-06', availabilityConfigured: true, slotMinutes: 30, slots: ['2026-10-06T03:30:00Z'] } })
    page()
    await screen.findByLabelText('Appointment date')
    fireEvent.change(screen.getByLabelText('Appointment date'), { target: { value: '2026-10-06' } })
    await waitFor(() => expect(mocks.getFamilyDoctorSlots).toHaveBeenCalledWith('synthetic-family', '2026-10-06'))
    expect(await screen.findByText(/9:00\s*(AM|am)/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request' })).not.toBeInTheDocument()
  })

  it('keeps a failure retryable and distinguishes unconfigured availability from no slots', async () => {
    mocks.getFamilyDoctorSlots.mockRejectedValueOnce(new Error('Synthetic offline')).mockResolvedValue({ data: { date: '2026-10-06', availabilityConfigured: false, slotMinutes: 30, slots: [] } })
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Retry availability' }))
    expect(await screen.findByRole('heading', { name: 'Availability is not configured yet' })).toBeInTheDocument()
    expect(mocks.getFamilyDoctorSlots).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(/9:00\s*(AM|am)/)).not.toBeInTheDocument()
  })

  it('does not invent appointment times while availability is still loading', async () => {
    let finish!: (result: { data: object }) => void
    mocks.getFamilyDoctorSlots.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    page()
    await screen.findByLabelText('Appointment date')
    await waitFor(() => expect(finish).toBeTypeOf('function'))
    expect(screen.queryByText(/9:00\s*(AM|am)/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry availability' })).not.toBeInTheDocument()
  })

  it('shows no slots only after configured availability has loaded', async () => {
    mocks.getFamilyDoctorSlots.mockResolvedValue({ data: { date: '2026-10-06', availabilityConfigured: true, slotMinutes: 30, slots: [] } })
    page()
    expect(await screen.findByText('No available times on this date')).toBeInTheDocument()
    expect(screen.queryByText(/Availability is not configured/)).not.toBeInTheDocument()
  })

  it('ignores a previous date response after the selected appointment date changes', async () => {
    let finishOld!: (result: { data: object }) => void
    mocks.getFamilyDoctorSlots.mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve }))
      .mockResolvedValue({ data: { date: '2026-10-06', availabilityConfigured: true, slotMinutes: 30, slots: ['2026-10-06T05:30:00Z'] } })
    page()
    await screen.findByLabelText('Appointment date')
    await waitFor(() => expect(finishOld).toBeTypeOf('function'))
    fireEvent.change(screen.getByLabelText('Appointment date'), { target: { value: '2026-10-06' } })
    expect(await screen.findByText(/11:00\s*(AM|am)/)).toBeInTheDocument()
    await act(async () => finishOld({ data: { date: '2026-10-05', availabilityConfigured: true, slotMinutes: 30, slots: ['2026-10-05T03:30:00Z'] } }))
    expect(screen.queryByText(/9:00\s*(AM|am)/)).not.toBeInTheDocument()
    expect(screen.getByText(/11:00\s*(AM|am)/)).toBeInTheDocument()
  })
})
