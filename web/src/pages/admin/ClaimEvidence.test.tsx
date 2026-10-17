import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: { get: mocks.get, post: mocks.post } }))

import { EvidenceRequestBanner } from '../../components/doctor/EvidenceRequestBanner'
import { ClaimDisputesPanel } from './ClaimDisputesPanel'

const claimant = (id: string, extra: Record<string, unknown> = {}) => ({
  doctorId: id, userId: `u-${id}`, displayName: `Dr ${id}`, email: `${id}@example.invalid`, verificationStatus: 'Pending',
  registerMatch: 'Match', hasLicenseDocument: true, submittedAt: '2026-10-01T00:00:00Z', ownershipConfirmed: false, evidenceRequests: [], ...extra,
})
const dispute = (extra: Record<string, unknown> = {}) => ({
  id: 'dispute-1', status: 'Open', registrationNumberLastFour: '7001', registeredName: 'Dr Real', openedAt: '2026-10-18T00:00:00Z',
  duplicateLicenseFile: false, claimants: [claimant('a', { ownershipConfirmed: true }), claimant('b')], ...extra,
})

describe('admin evidence requests', () => {
  beforeEach(() => { mocks.get.mockReset(); mocks.post.mockReset() })

  it('posts the selected items, note and challenge flag', async () => {
    mocks.get.mockResolvedValue({ data: [dispute()] })
    mocks.post.mockResolvedValue({ data: {} })
    render(<ClaimDisputesPanel />)
    expect(await screen.findByText('Ownership confirmed')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Request evidence' })[1])
    fireEvent.click(screen.getByLabelText('SLMC certificate'))
    fireEvent.click(screen.getByLabelText('Hospital/employer letter'))
    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: 'Please send soon' } })
    fireEvent.click(screen.getByLabelText('Urgent 3-day challenge'))
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/admin/disputes/dispute-1/evidence-requests',
      { doctorId: 'b', items: ['SlmcCertificate', 'HospitalLetter'], note: 'Please send soon', isChallenge: true }))
  })

  it('defaults to a non-urgent request', async () => {
    mocks.get.mockResolvedValue({ data: [dispute()] })
    mocks.post.mockResolvedValue({ data: {} })
    render(<ClaimDisputesPanel />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Request evidence' }))[0])
    fireEvent.click(screen.getByLabelText('NIC copy'))
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/admin/disputes/dispute-1/evidence-requests',
      { doctorId: 'a', items: ['NationalIdCopy'], note: '', isChallenge: false }))
  })

  it('shows the duplicate licence file warning', async () => {
    mocks.get.mockResolvedValue({ data: [dispute({ duplicateLicenseFile: true })] })
    render(<ClaimDisputesPanel />)
    expect(await screen.findByText(/Duplicate licence file/)).toBeInTheDocument()
  })

  it('lists existing requests with files', async () => {
    const request = { id: 'r1', disputeId: 'dispute-1', requestedItems: ['SlmcCertificate'], note: null, isChallenge: false, requestedAt: '2026-10-18T00:00:00Z',
      dueAt: new Date(Date.now() + 86_400_000).toISOString(), status: 'Submitted', submittedAt: null,
      files: [{ id: 'f1', kind: 'SlmcCertificate', fileName: 'cert.pdf', contentType: 'application/pdf', sizeBytes: 10, uploadedAt: '2026-10-18T00:00:00Z' }] }
    mocks.get.mockResolvedValue({ data: [dispute({ claimants: [claimant('a', { evidenceRequests: [request] }), claimant('b')] })] })
    render(<ClaimDisputesPanel />)
    const list = await screen.findByRole('list', { name: /Evidence requests for Dr a/ })
    expect(within(list).getByText(/cert\.pdf/)).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: 'View' })).toBeInTheDocument()
  })
})

describe('EvidenceRequestBanner', () => {
  beforeEach(() => { mocks.get.mockReset(); mocks.post.mockReset() })
  const openRequest = (extra: Record<string, unknown> = {}) => ({
    id: 'req-1', disputeId: 'dispute-1', requestedItems: ['SlmcCertificate', 'NationalIdCopy'], note: null, isChallenge: true,
    requestedAt: '2026-10-18T00:00:00Z', dueAt: new Date(Date.now() + 2 * 86_400_000 + 3_600_000).toISOString(), status: 'Open', submittedAt: null, files: [], ...extra,
  })

  it('shows challenge text and a live countdown', async () => {
    mocks.get.mockResolvedValue({ data: [openRequest()] })
    render(<EvidenceRequestBanner />)
    expect(await screen.findByText(/Someone has claimed your SLMC number/)).toBeInTheDocument()
    expect(screen.getByText(/^2d \d+h \d+m \d+s$/)).toBeInTheDocument()
  })

  it('shows the plain request text when not a challenge', async () => {
    mocks.get.mockResolvedValue({ data: [openRequest({ isChallenge: false })] })
    render(<EvidenceRequestBanner />)
    expect(await screen.findByText('An administrator needs evidence that you hold this SLMC number.')).toBeInTheDocument()
  })

  it('uploads a chosen file as multipart and ticks the kind', async () => {
    mocks.get.mockResolvedValue({ data: [openRequest()] })
    const uploaded = openRequest({ files: [{ id: 'f1', kind: 'SlmcCertificate', fileName: 'cert.pdf', contentType: 'application/pdf', sizeBytes: 5, uploadedAt: '2026-10-18T01:00:00Z' }] })
    mocks.post.mockResolvedValue({ data: uploaded })
    render(<EvidenceRequestBanner />)
    const input = await screen.findByLabelText('File for SLMC certificate')
    fireEvent.change(input, { target: { files: [new File(['x'], 'cert.pdf', { type: 'application/pdf' })] } })
    fireEvent.click(screen.getByRole('button', { name: 'Upload SLMC certificate' }))

    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(1))
    const [url, body] = mocks.post.mock.calls[0] as [string, FormData]
    expect(url).toBe('/doctors/me/evidence-requests/req-1/files')
    expect(body.get('kind')).toBe('SlmcCertificate')
    expect((body.get('file') as File).name).toBe('cert.pdf')
    expect(await screen.findByLabelText('Uploaded')).toBeInTheDocument()
  })

  it('renders nothing when there are no open requests or the fetch fails', async () => {
    mocks.get.mockResolvedValue({ data: [openRequest({ status: 'Submitted' })] })
    const first = render(<EvidenceRequestBanner />)
    await waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(first.container).toBeEmptyDOMElement()
    first.unmount()

    mocks.get.mockRejectedValue(new Error('boom'))
    const second = render(<EvidenceRequestBanner />)
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2))
    expect(second.container).toBeEmptyDOMElement()
  })
})
