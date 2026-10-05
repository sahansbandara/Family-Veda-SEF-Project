// Owner: S3 · whole-project ownership waiver.
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))
import { TriagePage } from './TriagePage'

HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }

const episode = { id: 'episode', memberId: 'member', symptoms: ['Synthetic symptom'], durationDays: 2, severity: 3, notes: 'Synthetic notes', createdAt: '2026-10-05T10:00:00Z' }
const baseCase = { id: 'case', episodeId: 'episode', memberId: 'member', caseNumber: 123, status: 'Planning', priority: 'Routine', createdAt: episode.createdAt, doctorReceivedAt: episode.createdAt, canEdit: true, canWithdraw: true, submittedEpisode: episode }
let current: typeof baseCase
function renderPage() { return render(<MemoryRouter><TriagePage /></MemoryRouter>) }
async function openRequest() {
  fireEvent.click(await screen.findByRole('button', { name: /Synthetic Member.*Case 0123/ }))
  return screen.findByRole('dialog', { name: 'Request progress' })
}

describe('patient request popup', () => {
  beforeEach(() => {
    current = { ...baseCase }
    mocks.get.mockReset(); mocks.post.mockReset(); mocks.put.mockReset()
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: { id: 'family', members: [{ id: 'member', displayName: 'Synthetic Member' }] } })
      if (url === '/families/family/triage-cases') return Promise.resolve({ data: { items: [current] } })
      if (url.endsWith('/status')) return Promise.resolve({ data: current })
      if (url === `/triage-cases/${current.id}`) return Promise.resolve({ data: current })
      throw new Error(`Unexpected endpoint ${url}`)
    })
  })

  it('opens on request click, reports receipt without claiming doctor read, and reopens after close', async () => {
    renderPage()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    let popup = await openRequest()
    expect(await within(popup).findByText(/Added to your assigned doctor/)).toBeInTheDocument()
    expect(within(popup).queryByText('Doctor is reviewing your request')).not.toBeInTheDocument()
    expect(mocks.get.mock.calls.some(([url]) => /review|traces|approved-guidance/.test(url))).toBe(false)
    fireEvent.click(within(popup).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    popup = await openRequest()
    expect(popup).toBeInTheDocument()
  })

  it('prefills and replaces a request using the original submission contract', async () => {
    mocks.put.mockImplementation((_url, body) => {
      current = { ...baseCase, id: 'replacement', episodeId: 'new-episode', status: 'Submitted', submittedEpisode: { ...episode, ...body } }
      return Promise.resolve({ data: current })
    })
    renderPage()
    const popup = await openRequest()
    fireEvent.click(await within(popup).findByRole('button', { name: 'Edit request' }))
    fireEvent.change(within(popup).getByLabelText('Symptoms (comma-separated)'), { target: { value: 'Updated synthetic symptom' } })
    fireEvent.click(within(popup).getByRole('button', { name: 'Save and resubmit' }))
    await waitFor(() => expect(mocks.put).toHaveBeenCalledWith('/triage-cases/case/submission', { symptoms: ['Updated synthetic symptom'], durationDays: 2, severity: 3, notes: 'Synthetic notes' }))
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/triage-cases/replacement'))
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('requires withdrawal confirmation and keeps the original audit history wording', async () => {
    mocks.post.mockImplementation(() => { current = { ...current, status: 'Withdrawn', canEdit: false, canWithdraw: false }; return Promise.resolve({ data: current }) })
    renderPage()
    const popup = await openRequest()
    fireEvent.click(await within(popup).findByRole('button', { name: 'Delete request' }))
    expect(mocks.post).not.toHaveBeenCalled()
    fireEvent.click(within(popup).getByRole('button', { name: 'Keep request' }))
    expect(mocks.post).not.toHaveBeenCalled()
    fireEvent.click(within(popup).getByRole('button', { name: 'Delete request' }))
    fireEvent.click(within(popup).getByRole('button', { name: 'Confirm withdrawal' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(1))
    expect(mocks.post).toHaveBeenCalledWith('/triage-cases/case/withdraw')
    expect(await within(popup).findByText('This request was withdrawn.')).toBeInTheDocument()
  })

  it('refreshes server capabilities after review wins a withdrawal race', async () => {
    mocks.post.mockImplementation(() => { current = { ...current, status: 'Claimed', canEdit: false, canWithdraw: false }; return Promise.reject({ response: { status: 409 } }) })
    renderPage()
    const popup = await openRequest()
    fireEvent.click(await within(popup).findByRole('button', { name: 'Delete request' }))
    fireEvent.click(within(popup).getByRole('button', { name: 'Confirm withdrawal' }))
    expect(await within(popup).findByText(/This request changed or doctor review has started/)).toBeInTheDocument()
    await waitFor(() => expect(within(popup).queryByRole('button', { name: 'Edit request' })).not.toBeInTheDocument())
    expect(within(popup).queryByRole('button', { name: 'Delete request' })).not.toBeInTheDocument()
  })
})
