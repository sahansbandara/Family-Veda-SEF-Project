// Owner: S3 · Triage & Agent Orchestration — Karunathilaka K.D.J.C (IT24100551)
import '@testing-library/jest-dom/vitest'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))

import { TriagePage } from './TriagePage'

HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }

const family = {
  id: 'fam-1',
  name: 'Synthetic',
  members: [
    {
      id: 'm-1',
      familyId: 'fam-1',
      displayName: 'Synthetic Member',
      dateOfBirth: '1990-01-01',
      role: 'Head',
    },
  ],
}
const cases = [
  {
    id: 'case-1',
    episodeId: 'e-1',
    memberId: 'm-1',
    status: 'PendingDoctorReview',
    priority: 'Routine',
    createdAt: '2026-09-01T00:00:00Z',
  },
]

function routeGet(status: object, guidance?: object, listedCases = cases) {
  mocks.get.mockImplementation((url: string) => {
    if (url === '/families/me') return Promise.resolve({ data: family })
    if (url.endsWith('/triage-cases')) return Promise.resolve({ data: { items: listedCases } })
    if (url.endsWith('/status')) return Promise.resolve({ data: status })
    if (/\/triage-cases\/[^/]+$/.test(url)) return Promise.resolve({ data: listedCases.find((item) => url.endsWith(item.id)) })
    if (url.endsWith('/approved-guidance'))
      return guidance ? Promise.resolve({ data: guidance }) : Promise.reject(new Error('not approved'))
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

function page(entry = '/triage?view=guidance') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <TriagePage />
    </MemoryRouter>,
  )
}

describe('TriagePage', () => {
  it('preserves submitted input when automatic preparation is interrupted', async () => {
    const detail = { ...cases[0], status: 'FailedSafe', submittedEpisode: {
      symptoms: ['Synthetic description'], durationDays: 2, severity: 3, notes: 'Synthetic additional note',
    } }
    routeGet({ id: 'case-1', status: 'FailedSafe', priority: 'Routine', failureCode: 'PROCESS_INTERRUPTED' }, undefined, [detail])
    page()
    fireEvent.click(await screen.findByRole('button', { name: /Synthetic Member.*Case/ }))
    expect(await screen.findByText('Your submitted details')).toBeInTheDocument()
    expect(screen.getByText('Synthetic description')).toBeInTheDocument()
    expect(screen.getByText('Synthetic additional note')).toBeInTheDocument()
    expect(screen.getByText(/Duration: 2 days/)).toHaveTextContent('Severity: 3/10')
    expect(screen.getByText('This request could not be prepared for review')).toBeInTheDocument()
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('hides the keyboard without losing multiline symptom descriptions or submitting', async () => {
    routeGet({ id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' })
    page('/triage?view=new')
    const description = await screen.findByLabelText(/Describe the symptoms in your own words/i)
    act(() => description.focus())
    fireEvent.change(description, { target: { value: 'Synthetic first line\nSynthetic second line' } })
    const hide = await screen.findByRole('button', { name: 'Hide keyboard' })
    fireEvent.blur(description, { relatedTarget: hide })
    act(() => hide.focus())
    expect(hide).toHaveFocus()
    fireEvent.click(hide)
    expect(description).not.toHaveFocus()
    expect(description).toHaveValue('Synthetic first line\nSynthetic second line')
    expect(screen.queryByRole('button', { name: 'Hide keyboard' })).not.toBeInTheDocument()
    expect(mocks.post).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
    const notes = await screen.findByLabelText(/Anything else the doctor should know/i)
    act(() => notes.focus())
    fireEvent.change(notes, { target: { value: 'Synthetic note\nSecond line' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Hide keyboard' }))
    expect(notes).not.toHaveFocus()
    expect(notes).toHaveValue('Synthetic note\nSecond line')
    expect(mocks.post).not.toHaveBeenCalled()
  })

  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.put.mockReset()
    mocks.delete.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a referral instead of AI output when the case failed safe', async () => {
    routeGet({ id: 'case-1', status: 'FailedSafe', priority: 'Routine', failureCode: 'AGENT_UNAVAILABLE' })
    page()
    fireEvent.click(await screen.findByRole('button', { name: /Synthetic Member.*Case/ }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('This request could not be prepared for review')
    expect(alert).toHaveTextContent('The review assistant was unavailable')
    expect(alert).not.toHaveTextContent('AGENT_UNAVAILABLE')
    expect(screen.queryByText('Doctor-approved guidance')).not.toBeInTheDocument()
  })

  it('never renders internal doctor notes in the patient doctor-response card', async () => {
    routeGet({ id: 'case-1', status: 'Rejected', priority: 'Routine' }, undefined, cases.map((item) => ({ ...item, latestDecisionAction: 'Reject', latestDecisionReason: 'SYNTHETIC-INTERNAL-NOTE-MARKER' })))
    page()
    fireEvent.click(await screen.findByRole('button', { name: /Synthetic Member.*Case/ }))
    expect(await screen.findByText('Doctor response')).toBeInTheDocument()
    expect(screen.queryByText(/SYNTHETIC-INTERNAL-NOTE-MARKER/)).not.toBeInTheDocument()
  })

  it('requests approved guidance only for exact approval statuses and never fetches patient traces', async () => {
    routeGet(
      { id: 'case-1', status: 'ApprovedRevised', priority: 'Routine' },
      {
        caseId: 'case-1',
        status: 'ApprovedRevised',
        finalAdvisory: 'Please arrange an in-person clinical review.',
        approvedAt: '2026-09-02T00:00:00Z',
        disclaimer: 'Not a diagnosis.',
      },
    )
    page()
    expect(await screen.findByText('Doctor-approved guidance')).toBeInTheDocument()
    expect(screen.getByText('Please arrange an in-person clinical review.')).toBeInTheDocument()
    expect(mocks.get.mock.calls.some(([url]) => String(url).includes('/traces'))).toBe(false)
  })

  it('preselects an approved request for the dashboard guidance link', async () => {
    const listedCases = [
      cases[0],
      { ...cases[0], id: 'case-approved', status: 'Approved', createdAt: '2026-09-02T00:00:00Z' },
    ]
    routeGet(
      { id: 'case-approved', status: 'Approved', priority: 'Routine' },
      {
        caseId: 'case-approved',
        status: 'Approved',
        finalAdvisory: 'Approved text.',
        approvedAt: '2026-09-02T00:00:00Z',
        disclaimer: 'Not a diagnosis.',
      },
      listedCases,
    )
    page('/triage?view=guidance')
    expect(await screen.findByText('Approved text.')).toBeInTheDocument()
  })

  it('stops polling after an approved request is loaded', async () => {
    vi.useFakeTimers()
    routeGet(
      { id: 'case-1', status: 'Approved', priority: 'Routine' },
      {
        caseId: 'case-1',
        status: 'Approved',
        finalAdvisory: 'Approved text.',
        approvedAt: '2026-09-02T00:00:00Z',
        disclaimer: 'Not a diagnosis.',
      },
    )
    page()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByText('Approved text.')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000)
    })
    expect(mocks.get.mock.calls.filter(([url]) => url === '/triage-cases/case-1/status')).toHaveLength(1)
  })

  it('keeps approved guidance visible when its already selected request card is clicked', async () => {
    routeGet(
      { id: 'case-1', status: 'Approved', priority: 'Routine' },
      {
        caseId: 'case-1',
        status: 'Approved',
        finalAdvisory: 'Approved text.',
        approvedAt: '2026-09-02T00:00:00Z',
        disclaimer: 'Not a diagnosis.',
      },
    )
    page()
    expect(await screen.findByText('Approved text.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Synthetic Member.*Guidance available/ }))
    expect(screen.getByText('Approved text.')).toBeInTheDocument()
    expect(screen.queryByText('Loading request progress')).not.toBeInTheDocument()
  })

  it('keeps the current progress visible while a background refresh is in flight', async () => {
    vi.useFakeTimers()
    let statusCalls = 0
    let resolveRefresh: ((value: { data: object }) => void) | undefined
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: family })
      if (url.endsWith('/triage-cases')) return Promise.resolve({ data: { items: cases } })
      if (/\/triage-cases\/[^/]+$/.test(url)) return Promise.resolve({ data: cases[0] })
      if (url.endsWith('/status')) {
        statusCalls += 1
        return statusCalls === 1
          ? Promise.resolve({ data: { id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' } })
          : new Promise((resolve) => {
              resolveRefresh = resolve
            })
      }
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    page()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    if (!screen.queryByRole('dialog')) fireEvent.click(screen.getByRole('button', { name: /Synthetic Member.*Case/ }))
    expect(screen.getByText('Doctor review')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(resolveRefresh).toBeDefined()
    expect(screen.getByText('Doctor review')).toBeInTheDocument()
    expect(screen.queryByText('Loading request progress')).not.toBeInTheDocument()
    resolveRefresh?.({ data: { id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' } })
    await Promise.resolve()
    vi.clearAllTimers()
  })

  it('shows an explicit retry when a progress request fails', async () => {
    let attempts = 0
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: family })
      if (url.endsWith('/triage-cases')) return Promise.resolve({ data: { items: cases } })
      if (/\/triage-cases\/[^/]+$/.test(url)) return Promise.resolve({ data: cases[0] })
      if (url.endsWith('/status'))
        return ++attempts === 1
          ? Promise.reject(new Error('offline'))
          : Promise.resolve({ data: { id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' } })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    page()
    await screen.findByRole('button', { name: /Synthetic Member.*Case/ })
    fireEvent.click(screen.getByRole('button', { name: /Synthetic Member.*Case/ }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    if (screen.queryByRole('button', { name: 'Retry progress' })) fireEvent.click(screen.getByRole('button', { name: 'Retry progress' }))
    await waitFor(() => expect(screen.getByText('Doctor review')).toBeInTheDocument())
  })

  it('does not show guidance from a case that was deselected before its response arrived', async () => {
    let resolveFirst: ((value: { data: object }) => void) | undefined
    const listedCases = [
      cases[0],
      { ...cases[0], id: 'case-2', status: 'Approved', createdAt: '2026-09-02T00:00:00Z' },
    ]
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: family })
      if (url.endsWith('/triage-cases')) return Promise.resolve({ data: { items: listedCases } })
      if (/\/triage-cases\/[^/]+$/.test(url)) return Promise.resolve({ data: listedCases.find((item) => url.endsWith(item.id)) })
      if (url === '/triage-cases/case-1/status')
        return new Promise((resolve) => {
          resolveFirst = resolve
        })
      if (url === '/triage-cases/case-2/status')
        return Promise.resolve({ data: { id: 'case-2', status: 'Approved', priority: 'Routine' } })
      if (url === '/triage-cases/case-2/approved-guidance')
        return Promise.resolve({
          data: {
            caseId: 'case-2',
            status: 'Approved',
            finalAdvisory: 'Current case guidance.',
            approvedAt: '2026-09-02T00:00:00Z',
            disclaimer: 'Not a diagnosis.',
          },
        })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    page('/triage')
    await waitFor(() => expect(resolveFirst).toBeDefined())
    fireEvent.click(screen.getAllByRole('button', { name: /Synthetic Member.*Case/ })[1])
    expect(await screen.findByText('Current case guidance.')).toBeInTheDocument()
    resolveFirst?.({ data: { id: 'case-1', status: 'Approved', priority: 'Routine' } })
    await waitFor(() => expect(screen.queryByText('Current case guidance.')).toBeInTheDocument())
    expect(mocks.get).not.toHaveBeenCalledWith('/triage-cases/case-1/approved-guidance')
  })

  it('explains refused member access and preserves the draft', async () => {
    routeGet({ id: 'case-1', status: 'Submitted', priority: 'Routine' })
    mocks.post.mockRejectedValueOnce({ response: { status: 404 } })
    page('/triage')
    fireEvent.click(await screen.findByRole('button', { name: 'Fever' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit for doctor review' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Adults must submit their own requests')
    expect(screen.getByRole('alert')).toHaveTextContent('guardian must grant health-condition consent')
    expect(mocks.post).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Submit for doctor review' })).toBeEnabled()
  })

  it('warns against duplicate submission after an uncertain triage response', async () => {
    routeGet({ id: 'case-1', status: 'Submitted', priority: 'Routine' })
    mocks.post.mockResolvedValueOnce({ data: { id: 'synthetic-episode' } }).mockRejectedValueOnce(new Error('timeout'))
    page('/triage')
    fireEvent.click(await screen.findByRole('button', { name: 'Fever' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit for doctor review' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Check your requests before retrying')
    expect(mocks.post).toHaveBeenCalledTimes(2)
  })

  it('submits selected symptoms with the existing duration and severity contract', async () => {
    routeGet({ id: 'case-2', status: 'Submitted', priority: 'Routine' }, undefined, [
      { ...cases[0], id: 'case-2', status: 'Submitted' },
    ])
    mocks.post
      .mockResolvedValueOnce({ data: { id: 'episode-2' } })
      .mockResolvedValueOnce({ data: { ...cases[0], id: 'case-2', status: 'Submitted' } })
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Headache' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit for doctor review' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(2))
    expect(mocks.post).toHaveBeenNthCalledWith(
      1,
      '/members/m-1/episodes',
      expect.objectContaining({ symptoms: ['Headache'], durationDays: 1, severity: 3 }),
    )
    expect(screen.getByText(/Your request was submitted for review/)).toBeInTheDocument()
  })

  it('labels each request with its own case reference so same-day requests stay distinguishable', async () => {
    const listedCases = [cases[0], { ...cases[0], id: 'case-2' }]
    routeGet({ id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' }, undefined, listedCases)
    page()
    expect(await screen.findByText(/^Case case-1 ·/)).toBeInTheDocument()
    expect(screen.getByText(/^Case case-2 ·/)).toBeInTheDocument()
  })
})

describe('TriagePage request filters', () => {
  afterEach(() => { cleanup() })
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.put.mockReset()
    mocks.delete.mockReset()
  })

  it('filters the request list by review state without changing the selected case', async () => {
    const listedCases = [cases[0], { ...cases[0], id: 'case-2', status: 'Approved', caseNumber: 9 }]
    routeGet({ id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' }, undefined, listedCases)
    page('/triage')
    expect(await screen.findByText(/^Case 0009 ·/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'In review' }))
    expect(screen.queryByText(/^Case 0009 ·/)).not.toBeInTheDocument()
    expect(screen.getByText(/^Case case-1 ·/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guidance ready' }))
    expect(screen.getByText(/^Case 0009 ·/)).toBeInTheDocument()
    expect(screen.queryByText(/^Case case-1 ·/)).not.toBeInTheDocument()
  })

  it('moves withdrawn requests out of All into the Deleted filter', async () => {
    const listedCases = [cases[0], { ...cases[0], id: 'case-3', status: 'Withdrawn', caseNumber: 12 }]
    routeGet({ id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' }, undefined, listedCases)
    page('/triage')
    expect(await screen.findByText(/^Case case-1 ·/)).toBeInTheDocument()
    expect(screen.queryByText(/^Case 0012 ·/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Deleted' }))
    expect(screen.getByText(/^Case 0012 ·/)).toBeInTheDocument()
    expect(screen.queryByText(/^Case case-1 ·/)).not.toBeInTheDocument()
  })

  it('shows only claimed requests in the Claimed filter and keeps them out of In review', async () => {
    const listedCases = [cases[0], { ...cases[0], id: 'case-4', status: 'Claimed', caseNumber: 14 }]
    routeGet({ id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' }, undefined, listedCases)
    page('/triage')
    expect(await screen.findByText(/^Case case-1 ·/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'In review' }))
    expect(screen.queryByText(/^Case 0014 ·/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Claimed' }))
    expect(screen.getByText(/^Case 0014 ·/)).toBeInTheDocument()
    expect(screen.queryByText(/^Case case-1 ·/)).not.toBeInTheDocument()
  })

  it('permanently deletes a withdrawn request after confirmation', async () => {
    const listedCases = [cases[0], { ...cases[0], id: 'case-3', status: 'Withdrawn', caseNumber: 12 }]
    routeGet({ id: 'case-3', status: 'Withdrawn', priority: 'Routine' }, undefined, listedCases)
    mocks.delete.mockResolvedValue({ status: 204 })
    page('/triage')
    await screen.findByText(/^Case case-1 ·/)
    fireEvent.click(await screen.findByRole('button', { name: 'Deleted' }))
    fireEvent.click(await screen.findByText(/^Case 0012 ·/))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete permanently' }))
    expect(screen.getByText(/This cannot be undone/)).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: 'Delete permanently' })
    fireEvent.click(buttons[buttons.length - 1])
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith('/triage-cases/case-3'))
    await waitFor(() => expect(screen.queryByText(/^Case 0012 ·/)).not.toBeInTheDocument())
  })

  it('hides Delete permanently outside the Deleted filter', async () => {
    const listedCases = [{ ...cases[0], id: 'case-3', status: 'Withdrawn', caseNumber: 12 }]
    routeGet({ id: 'case-3', status: 'Withdrawn', priority: 'Routine' }, undefined, listedCases)
    page('/triage?case=case-3')
    await act(async () => { await Promise.resolve() })
    expect(screen.queryByRole('button', { name: 'Delete permanently' })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Deleted' }))
    fireEvent.click(await screen.findByText(/^Case 0012 ·/))
    expect(await screen.findByRole('button', { name: 'Delete permanently' })).toBeInTheDocument()
    expect(screen.getByText('Deleted. Remove it permanently below.')).toBeInTheDocument()
  })

  it('explains when permanent delete is unavailable on the server', async () => {
    const listedCases = [cases[0], { ...cases[0], id: 'case-3', status: 'Withdrawn', caseNumber: 12 }]
    routeGet({ id: 'case-3', status: 'Withdrawn', priority: 'Routine' }, undefined, listedCases)
    mocks.delete.mockRejectedValue({ response: { status: 405 } })
    page('/triage')
    await screen.findByText(/^Case case-1 ·/)
    fireEvent.click(await screen.findByRole('button', { name: 'Deleted' }))
    fireEvent.click(await screen.findByText(/^Case 0012 ·/))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete permanently' }))
    const buttons = screen.getAllByRole('button', { name: 'Delete permanently' })
    fireEvent.click(buttons[buttons.length - 1])
    expect(await screen.findByText('Permanent delete is not available on this server yet. Update the backend and try again.')).toBeInTheDocument()
  })

  it('shows an access message when the case cannot be loaded with 404', async () => {
    routeGet({ id: 'case-1', status: 'PendingDoctorReview', priority: 'Routine' })
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: family })
      if (url.endsWith('/triage-cases')) return Promise.resolve({ data: { items: cases } })
      return Promise.reject({ response: { status: 404 } })
    })
    page('/triage')
    fireEvent.click(await screen.findByText(/^Case case-1 ·/))
    expect(await screen.findByText(/You no longer have access to this request/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry progress' })).not.toBeInTheDocument()
  })
})
