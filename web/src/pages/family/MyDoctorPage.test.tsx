import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ role: 'ADULT_MEMBER', get: vi.fn(), getFamilyDoctor: vi.fn(), getFamilyDoctorSlots: vi.fn(), getPendingFamilyDoctorRequest: vi.fn(), getDoctorDirectory: vi.fn(), requestFamilyDoctor: vi.fn(), cancelFamilyDoctorRequest: vi.fn() }))
vi.mock('../../store/hooks', () => ({ useAppSelector: (selector: (state: object) => unknown) => selector({ auth: { user: { role: mocks.role } } }) }))
vi.mock('../../services/apiClient', () => ({ apiClient: { get: mocks.get }, threePortalApi: mocks, doctorWorkspaceApi: { getFamilyDoctorSlots: mocks.getFamilyDoctorSlots } }))
import { MyDoctorPage } from './MyDoctorPage'

function page() { return render(<MemoryRouter><MyDoctorPage /></MemoryRouter>) }

describe('MyDoctor availability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.role = 'ADULT_MEMBER'
    mocks.getPendingFamilyDoctorRequest.mockResolvedValue({ data: '' })
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

const directoryDoctor = { id: 'synthetic-new', displayName: 'Dr. Synthetic Wijesinghe', specialty: 'Family Medicine', clinic: 'Synthetic Coastal Clinic', city: 'Negombo', district: 'Gampaha', languages: 'Sinhala, English' }
const otherDoctor = { id: 'synthetic-other', displayName: 'Dr. Synthetic Silva', specialty: 'General Practice', clinic: 'Synthetic Central Care', city: 'Kandy', district: 'Kandy', languages: 'Sinhala, English' }
const pendingRequest = { id: 'synthetic-request', familyId: 'synthetic-family', familyName: 'Synthetic Family', memberCount: 3, doctor: directoryDoctor, status: 'Pending', createdAt: '2026-10-05T03:30:00Z' }

describe('MyDoctor relationship states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.role = 'FAMILY_HEAD'
    mocks.get.mockResolvedValue({ data: { id: 'synthetic-family' } })
    mocks.getFamilyDoctor.mockResolvedValue({ data: '' })
    mocks.getPendingFamilyDoctorRequest.mockResolvedValue({ data: '' })
    mocks.getDoctorDirectory.mockResolvedValue({ data: [directoryDoctor, otherDoctor] })
    mocks.getFamilyDoctorSlots.mockResolvedValue({ data: { date: '2026-10-06', availabilityConfigured: true, slotMinutes: 30, slots: ['2026-10-06T03:30:00Z'] } })
  })

  it('lets a family head with no doctor filter the directory and send a confirmed request', async () => {
    mocks.requestFamilyDoctor.mockResolvedValue({ data: pendingRequest })
    page()
    expect(await screen.findByRole('heading', { name: 'Find a doctor your family can rely on.' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Dr. Synthetic Silva' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Gampaha' } })
    expect(screen.queryByRole('heading', { name: 'Dr. Synthetic Silva' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Request Dr. Synthetic Wijesinghe' }))
    expect(mocks.requestFamilyDoctor).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    await waitFor(() => expect(mocks.requestFamilyDoctor).toHaveBeenCalledWith('synthetic-family', { doctorId: 'synthetic-new' }))
    expect(await screen.findByRole('heading', { name: 'Your request is on its way.' })).toBeInTheDocument()
  })

  it('shows the pending request and cancels it only after confirmation', async () => {
    mocks.getPendingFamilyDoctorRequest.mockResolvedValue({ data: pendingRequest })
    mocks.cancelFamilyDoctorRequest.mockResolvedValue({ data: { ...pendingRequest, status: 'Cancelled' } })
    page()
    expect(await screen.findByRole('heading', { name: 'Dr. Synthetic Wijesinghe' })).toBeInTheDocument()
    expect(mocks.getDoctorDirectory).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel request' }))
    expect(mocks.cancelFamilyDoctorRequest).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    fireEvent.click(Array.from(dialog.querySelectorAll('button')).find((button) => button.textContent === 'Cancel request')!)
    await waitFor(() => expect(mocks.cancelFamilyDoctorRequest).toHaveBeenCalledWith('synthetic-family', 'synthetic-request'))
    expect(await screen.findByRole('heading', { name: 'Find a doctor your family can rely on.' })).toBeInTheDocument()
  })

  it('keeps the directory collapsed for an assigned family and carries the chosen slot to booking', async () => {
    mocks.getFamilyDoctor.mockResolvedValue({ data: { id: 'synthetic-doctor', displayName: 'Synthetic Doctor', specialty: 'Family Medicine' } })
    page()
    const slot = await screen.findByRole('button', { name: /9:00\s*(AM|am)/ })
    expect(mocks.getDoctorDirectory).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Request appointment' })).toBeDisabled()
    fireEvent.click(slot)
    expect(screen.getByRole('link', { name: 'Request appointment' }).getAttribute('href')).toContain('slot=2026-10-06T03%3A30%3A00Z')
    fireEvent.click(screen.getByRole('button', { name: /Explore directory/ }))
    expect(await screen.findByRole('button', { name: 'Request change to Dr. Synthetic Wijesinghe' })).toBeInTheDocument()
  })

  it('does not offer request, change or cancel controls to an adult member', async () => {
    mocks.role = 'ADULT_MEMBER'
    mocks.getPendingFamilyDoctorRequest.mockResolvedValue({ data: pendingRequest })
    page()
    expect(await screen.findByRole('heading', { name: 'Your request is on its way.' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel request' })).not.toBeInTheDocument()
    expect(mocks.getDoctorDirectory).not.toHaveBeenCalled()
  })
})
