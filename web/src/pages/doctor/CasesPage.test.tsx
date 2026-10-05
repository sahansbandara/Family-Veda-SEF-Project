// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))

import { CasesPage } from './CasesPage'
import { actionFor, complaintSummary, followUpError, mergeQueue, statusLabel, tabOf } from './triageQueue'

// Synthetic data only.
const granted = (id: string, status: string, priority = 'Routine', referralClosed = false) => ({
  id,
  episodeId: 'episode',
  memberId: 'member',
  status,
  priority,
  createdAt: '2026-09-29T08:00:00Z',
  referralClosed,
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

describe('closed emergency referral', () => {
  it('leaves the Emergency queue for Completed and offers no further action', () => {
    const closed = mergeQueue([granted('emer0001', 'Escalated', 'Emergency', true)], [])[0]
    expect(tabOf(closed)).toBe('completed')
    expect(statusLabel(closed)).toBe('Referral closed')
    expect(actionFor(closed).kind).toBe('none')
  })

  it('offers follow-up, not a decision, on an acknowledged referral', () => {
    const acknowledged = mergeQueue([granted('emer0001', 'Escalated', 'Emergency')], [])[0]
    expect(tabOf(acknowledged)).toBe('emergency')
    expect(actionFor(acknowledged).kind).toBe('follow-up')
  })
})

describe('followUpError', () => {
  it('shows the validation or conflict sentence, and hides everything else', () => {
    expect(followUpError({ response: { status: 400, data: { errors: { phoneNumber: ['Add a phone number first.'] } } } }, 'fallback')).toBe('Add a phone number first.')
    expect(followUpError({ response: { status: 409, data: { detail: 'Already shared.' } } }, 'fallback')).toBe('Already shared.')
    expect(followUpError({ response: { status: 404 } }, 'fallback')).toMatch(/no longer available/)
    expect(followUpError({ response: { status: 500, data: { detail: 'stack trace' } } }, 'fallback')).toBe('fallback')
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

  describe('acknowledged emergency follow-up', () => {
    beforeEach(() => {
      assigned = [granted('emer0002-x', 'Escalated', 'Emergency')]
      pool = []
      mocks.post.mockResolvedValue({ data: {} })
    })

    async function openFollowUp() {
      renderPage()
      fireEvent.click(await screen.findByRole('tab', { name: /Emergency/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Open case emer0002' }))
      return screen.getByRole('complementary', { name: 'Selected case preview' })
    }

    it('closes the referral only after confirmation', async () => {
      const preview = await openFollowUp()
      fireEvent.click(within(preview).getByRole('button', { name: 'Mark Referral Closed' }))
      expect(mocks.post).not.toHaveBeenCalled()
      expect(within(preview).getByText(/The patient still sees the referral to in-person care/)).toBeInTheDocument()
      fireEvent.click(within(preview).getByRole('button', { name: 'Close Referral' }))
      await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/triage-cases/emer0002-x/close-referral'))
      expect(await screen.findByText(/Referral emer0002 closed\. It moved to Completed/)).toBeInTheDocument()
    })

    it('shares the contact number and reports a missing profile phone safely', async () => {
      mocks.post.mockRejectedValueOnce({ response: { status: 400, data: { errors: { phoneNumber: ['Add a phone number to your profile before sharing your contact.'] } } } })
      const preview = await openFollowUp()
      fireEvent.click(within(preview).getByRole('button', { name: 'Share My Contact Number' }))
      fireEvent.click(within(preview).getByRole('button', { name: 'Send My Number' }))
      expect(await within(preview).findByRole('alert')).toHaveTextContent('Add a phone number to your profile')
      fireEvent.click(within(preview).getByRole('button', { name: 'Send My Number' }))
      expect(await screen.findByText(/Your contact number was sent to the patient for case emer0002/)).toBeInTheDocument()
      expect(mocks.post).toHaveBeenLastCalledWith('/triage-cases/emer0002-x/share-contact')
    })

    it('books a follow-up appointment and refuses a missing or past time', async () => {
      const preview = await openFollowUp()
      fireEvent.click(within(preview).getByRole('button', { name: 'Book Follow-up Appointment' }))
      const when = within(preview).getByLabelText('Date and time')
      fireEvent.change(when, { target: { value: '2020-01-01T10:00' } })
      fireEvent.submit(when.closest('form')!)
      expect(await within(preview).findByRole('alert')).toHaveTextContent('Choose a time in the future.')
      expect(mocks.post).not.toHaveBeenCalled()
      fireEvent.change(when, { target: { value: '2099-01-01T10:00' } })
      fireEvent.change(within(preview).getByLabelText('Duration'), { target: { value: '45' } })
      fireEvent.submit(when.closest('form')!)
      await waitFor(() =>
        expect(mocks.post).toHaveBeenCalledWith('/triage-cases/emer0002-x/appointments', {
          startsAt: new Date('2099-01-01T10:00').toISOString(),
          durationMinutes: 45,
          reason: 'Follow-up after urgent care referral',
        }),
      )
      expect(await screen.findByText(/Follow-up appointment booked for case emer0002/)).toBeInTheDocument()
    })
  })

  it('shows a closed referral under Completed, not Emergency', async () => {
    assigned = [granted('emer0003-x', 'Escalated', 'Emergency', true)]
    pool = []
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Completed/ }))
    expect(within(screen.getByRole('tabpanel')).getByText('Referral closed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Emergency/ }))
    expect(within(screen.getByRole('tabpanel')).queryByText('Referral closed')).not.toBeInTheDocument()
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
