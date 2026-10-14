// Owner: S3 · Triage & Agent Orchestration — Karunathilaka K.D.J.C (IT24100551)
import '@testing-library/jest-dom/vitest'

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
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
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.put.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a referral instead of AI output when the case failed safe', async () => {
    routeGet({ id: 'case-1', status: 'FailedSafe', priority: 'Routine', failureCode: 'LLM_TIMEOUT' })
    page()
    fireEvent.click(await screen.findByRole('button', { name: /Synthetic Member.*Case/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Please seek in-person care')
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
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.put.mockReset()
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
})
