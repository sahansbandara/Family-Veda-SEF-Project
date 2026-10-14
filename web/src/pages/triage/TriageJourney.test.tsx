import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))
import { TriagePage } from './TriagePage'

describe('Triage three-step journey', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: { id: 'synthetic-family', members: [{ id: 'synthetic-member', displayName: 'Synthetic Member', role: 'Head' }] } })
      if (url.endsWith('/triage-cases')) return Promise.resolve({ data: { items: [] } })
      if (url === '/triage-cases/synthetic-case') return Promise.resolve({ data: { id: 'synthetic-case', memberId: 'synthetic-member', status: 'Submitted', priority: 'Routine', createdAt: '2026-10-04T00:00:00Z' } })
      if (url.endsWith('/status')) return Promise.resolve({ data: { id: 'synthetic-case', status: 'Submitted', priority: 'Routine' } })
      return Promise.reject(new Error(`Unexpected ${url}`))
    })
  })

  it('validates symptoms before continuing and keeps drafts when going back', async () => {
    render(<MemoryRouter><TriagePage /></MemoryRouter>)
    await screen.findByRole('button', { name: 'Continue' })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Choose a symptom or describe it in your own words.')).toBeInTheDocument()
    expect(mocks.post).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Headache' }))
    fireEvent.change(screen.getByLabelText(/Describe the symptoms in your own words/), { target: { value: 'Synthetic detail' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.change(screen.getByLabelText('How many days have you had them?'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText(/Describe the symptoms in your own words/)).toHaveValue('Synthetic detail')
    expect(screen.getByRole('button', { name: 'Headache' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByLabelText('How many days have you had them?')).toHaveValue(4)
  })

  it('submits the existing episode/case contract only from review and resets after success', async () => {
    mocks.post.mockResolvedValueOnce({ data: { id: 'synthetic-episode' } }).mockResolvedValueOnce({ data: { id: 'synthetic-case', memberId: 'synthetic-member', status: 'Submitted', priority: 'Routine', createdAt: '2026-10-04T00:00:00Z' } })
    render(<MemoryRouter><TriagePage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Headache' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.change(screen.getByLabelText('How many days have you had them?'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('How severe do they feel?'), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(mocks.post).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Submit for doctor review' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(2))
    expect(mocks.post).toHaveBeenNthCalledWith(1, '/members/synthetic-member/episodes', expect.objectContaining({ symptoms: ['Headache'], durationDays: 4, severity: 6 }))
    expect(mocks.post).toHaveBeenNthCalledWith(2, '/episodes/synthetic-episode/triage')
    await screen.findByText(/Your request was submitted for review/)
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }))
    expect(screen.getByRole('button', { name: 'Headache' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText(/Describe the symptoms in your own words/)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.queryByText('Doctor-approved guidance')).not.toBeInTheDocument()
  })

  it('blocks an out-of-range duration before review and keeps the symptom draft', async () => {
    render(<MemoryRouter><TriagePage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Headache' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.change(screen.getByLabelText('How many days have you had them?'), { target: { value: '-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByLabelText('How many days have you had them?')).not.toBeValid()
    expect(screen.queryByRole('button', { name: 'Submit for doctor review' })).not.toBeInTheDocument()
    expect(mocks.post).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('How many days have you had them?'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('button', { name: 'Submit for doctor review' })).toBeInTheDocument()
  })

  it('accepts same-day symptoms with duration zero', async () => {
    render(<MemoryRouter><TriagePage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Headache' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.change(screen.getByLabelText('How many days have you had them?'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('button', { name: 'Submit for doctor review' })).toBeInTheDocument()
    expect(screen.getByLabelText('Review symptom request')).toHaveTextContent('0 days')
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('preserves confirmed submission when only the request-list refresh fails', async () => {
    let caseLoads = 0
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: { id: 'synthetic-family', members: [{ id: 'synthetic-member', displayName: 'Synthetic Member', role: 'Head' }] } })
      if (url.endsWith('/triage-cases')) return ++caseLoads === 1 ? Promise.resolve({ data: { items: [] } }) : Promise.reject(new Error('Synthetic refresh failure'))
      if (url === '/triage-cases/synthetic-case') return Promise.resolve({ data: { id: 'synthetic-case', memberId: 'synthetic-member', status: 'Submitted', priority: 'Routine', createdAt: '2026-10-04T00:00:00Z' } })
      if (url.endsWith('/status')) return Promise.resolve({ data: { id: 'synthetic-case', status: 'Submitted', priority: 'Routine' } })
      return Promise.reject(new Error(`Unexpected ${url}`))
    })
    mocks.post.mockResolvedValueOnce({ data: { id: 'synthetic-episode' } }).mockResolvedValueOnce({ data: { id: 'synthetic-case', memberId: 'synthetic-member', status: 'Submitted', priority: 'Routine', createdAt: '2026-10-04T00:00:00Z' } })
    render(<MemoryRouter><TriagePage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Headache' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit for doctor review' }))
    expect(await screen.findByText(/The request list could not be refreshed/)).toHaveTextContent('Your request was submitted for review.')
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }))
    expect(screen.queryByText(/Could not confirm submission/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Headache' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(mocks.post).toHaveBeenCalledTimes(2)
  })
})
