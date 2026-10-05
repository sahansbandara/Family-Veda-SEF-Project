// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))

import { CasesPage } from './CasesPage'
import { actionFor, complaintSummary, mergeQueue, statusLabel, tabOf } from './triageQueue'

// Synthetic data only.
const granted = (id: string, status: string, priority = 'Routine') => ({
  id,
  episodeId: 'episode',
  memberId: 'member',
  status,
  priority,
  createdAt: '2026-09-29T08:00:00Z',
})
type Complaint = { symptoms: string[]; durationDays: number; severity: number; notes?: string | null; ageBand: string }
const pooled = (id: string, status = 'PendingDoctorReview', priority = 'Routine', complaint?: Complaint) => ({
  id,
  status,
  priority,
  createdAt: '2026-09-30T08:00:00Z',
  complaint,
})
const syntheticComplaint: Complaint = {
  symptoms: ['synthetic_signal_a', 'synthetic_signal_b'],
  durationDays: 1,
  severity: 6,
  notes: 'Synthetic note text.',
  ageBand: '40–49',
}
const paged = <T,>(items: T[]) => ({ data: { items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 } })

let assigned: ReturnType<typeof granted>[] = []
let pool: ReturnType<typeof pooled>[] = []

function renderPage() {
  return render(
    <MemoryRouter>
      <CasesPage />
    </MemoryRouter>,
  )
}

describe('triageQueue rules', () => {
  it('never offers a second claim for a case the doctor already holds', () => {
    const [item] = mergeQueue([granted('aaaaaaaa-1', 'Claimed')], [pooled('aaaaaaaa-1', 'Claimed')])
    expect(item.claimable).toBe(false)
    expect(actionFor(item).kind).toBe('approval')
    expect(tabOf(item)).toBe('mine')
  })

  it('does not label a safe failure as an emergency', () => {
    const [item] = mergeQueue([granted('bbbbbbbb-1', 'FailedSafe', 'Emergency')], [])
    expect(statusLabel(item)).toBe('Processing stopped safely')
    expect(tabOf(item)).toBe('completed')
    expect(actionFor(item).kind).toBe('none')
  })

  it('offers acknowledgement, not claim, for a pooled emergency referral', () => {
    const [item] = mergeQueue([], [pooled('cccccccc-1', 'Escalated', 'Emergency')])
    expect(tabOf(item)).toBe('emergency')
    expect(actionFor(item)).toMatchObject({ kind: 'acknowledge', label: 'Acknowledge Emergency' })
  })
})

describe('complaintSummary', () => {
  it('summarises what was reported without any identity', () => {
    expect(complaintSummary(syntheticComplaint)).toBe('synthetic signal a, synthetic signal b · 1 day · Severity 6 / 10 · Age 40–49')
  })

  it('is absent when an older API released no complaint', () => {
    expect(complaintSummary(undefined)).toBeNull()
    expect(complaintSummary(null)).toBeNull()
  })

  it('carries the pool complaint onto the queue case, but not onto a granted one', () => {
    const merged = mergeQueue([granted('mine0001', 'Claimed')], [pooled('pool0001', 'PendingDoctorReview', 'Routine', syntheticComplaint)])
    expect(merged.find((item) => item.id === 'pool0001')?.complaint).toEqual(syntheticComplaint)
    expect(merged.find((item) => item.id === 'mine0001')?.complaint).toBeUndefined()
  })
})

describe('CasesPage', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    assigned = [granted('mine0001-x', 'Claimed'), granted('done0001-x', 'ApprovedRevised')]
    pool = [pooled('pool0001-x'), pooled('emer0001-x', 'Escalated', 'Emergency')]
    mocks.get.mockImplementation((url: string) => {
      if (url === '/doctors/me/cases') return Promise.resolve(paged(assigned))
      if (url === '/doctors/case-pool') return Promise.resolve(paged(pool))
      if (url === '/triage-cases/mine0001-x/review')
        return Promise.resolve({
          data: {
            ...granted('mine0001-x', 'Claimed'),
            traces: [],
            submittedEpisode: { id: 'e', memberId: 'member', symptoms: ['Sore throat'], durationDays: 2, severity: 3, createdAt: '' },
          },
        })
      return Promise.reject(new Error('unexpected url'))
    })
  })

  it('shows real counts and only claimable cases under Available', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Triage Case Management' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: 'Queue summary' })
    expect(within(summary).getByRole('button', { name: /01\s*Available Cases/ })).toBeInTheDocument()
    expect(within(summary).getByRole('button', { name: /01\s*My Active Cases/ })).toBeInTheDocument()
    expect(within(summary).getByRole('button', { name: /01\s*Emergency Referrals/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Case pool0001' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Case mine0001' })).not.toBeInTheDocument()
    expect(screen.getByText('Details available after authorized access.')).toBeInTheDocument()
  })

  it('lets a doctor read the complaint before claiming, without a name or a review call', async () => {
    pool = [pooled('pool0001', 'PendingDoctorReview', 'Routine', syntheticComplaint)]
    renderPage()
    expect(await screen.findByText('synthetic signal a, synthetic signal b · 1 day · Severity 6 / 10 · Age 40–49')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Preview case pool0001' }))
    const preview = screen.getByRole('complementary', { name: 'Selected case preview' })
    expect(within(preview).getByText('Synthetic note text.')).toBeInTheDocument()
    expect(within(preview).getByText('6 / 10')).toBeInTheDocument()
    expect(within(preview).getByText(/Age band 40–49\. Name and family are shown after you claim the case\./)).toBeInTheDocument()
    expect(mocks.get).not.toHaveBeenCalledWith('/triage-cases/pool0001/review')
  })

  it('claims a case and re-reads the queue from the server', async () => {
    mocks.post.mockImplementation(() => {
      assigned = [...assigned, granted('pool0001-x', 'Claimed')]
      pool = pool.filter((item) => item.id !== 'pool0001-x')
      return Promise.resolve({ data: {} })
    })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Claim Case pool0001' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/triage-cases/pool0001-x/claim'))
    expect(await screen.findByText(/Case pool0001 is now assigned to you/)).toBeInTheDocument()
    // The doctor is taken to My Cases with the claimed case listed and open in the preview.
    expect(screen.getByRole('tab', { name: /My Cases/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('heading', { name: 'Case pool0001' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Claim Case pool0001' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText(/is now assigned to you/)).not.toBeInTheDocument()
  })

  it('gives safe conflict feedback when another doctor claims first', async () => {
    mocks.post.mockImplementation(() => {
      pool = pool.filter((item) => item.id !== 'pool0001-x')
      return Promise.reject({ response: { status: 409 } })
    })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Claim Case pool0001' }))
    expect(await screen.findByText(/Another doctor claimed this case first/)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Case pool0001' })).not.toBeInTheDocument())
  })

  it('opens an assigned case with its complaint and a link to the Approval Desk', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /My Cases/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Open case mine0001' }))
    const preview = screen.getByRole('complementary', { name: 'Selected case preview' })
    expect(await within(preview).findByText('Sore throat')).toBeInTheDocument()
    expect(within(preview).getByText('2 days')).toBeInTheDocument()
    expect(within(preview).getByRole('link', { name: 'Open Approval Desk' })).toHaveAttribute(
      'href',
      '/approvals?case=mine0001-x',
    )
    expect(within(preview).queryByRole('button', { name: /claim/i })).not.toBeInTheDocument()
  })

  it('shows emergency referrals with explicit text and an acknowledge action', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Emergency/ }))
    expect(within(screen.getByRole('tabpanel')).getByText('Emergency referral')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Acknowledge Emergency emer0001' })).toBeInTheDocument()
  })

  it('filters by search and shows completed cases with readable status', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Completed/ }))
    expect(within(screen.getByRole('tabpanel')).getByText('Approved with revisions')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: /search by case reference/i }), {
      target: { value: 'zzzz' },
    })
    expect(screen.getByText('No cases match the current search or filters.')).toBeInTheDocument()
  })

  it('shows a retryable error when the queue cannot be loaded', async () => {
    mocks.get.mockRejectedValue(new Error('synthetic failure'))
    renderPage()
    expect(await screen.findByText('The triage case queue could not be loaded.')).toBeInTheDocument()
  })
})
