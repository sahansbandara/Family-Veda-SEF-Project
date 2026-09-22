import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))

import { RecordsPage } from './RecordsPage'

const member = { id: 'synthetic-member-01', displayName: 'Synthetic Member', role: 'Head', dateOfBirth: '1990-01-01' }

function stubLists() {
  mocks.get.mockImplementation((url: string, config?: { params?: { sort?: string } }) => {
    if (url === '/families/me') return Promise.resolve({ data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member] } })
    if (url === '/members/me') return Promise.resolve({ data: member })
    if (url.startsWith('/members/synthetic-member-01/records')) {
      const newestFirst = config?.params?.sort !== 'oldest'
      const items = newestFirst
        ? [{ id: 'r2', title: 'Newer synthetic note', recordType: 'Note', occurredOn: '2026-06-01', summary: null }, { id: 'r1', title: 'Older synthetic note', recordType: 'Note', occurredOn: '2026-01-01', summary: null }]
        : [{ id: 'r1', title: 'Older synthetic note', recordType: 'Note', occurredOn: '2026-01-01', summary: null }, { id: 'r2', title: 'Newer synthetic note', recordType: 'Note', occurredOn: '2026-06-01', summary: null }]
      return Promise.resolve({ data: { items, page: 1, pageSize: 20, totalCount: 2, totalPages: 1 } })
    }
    if (url.startsWith('/members/synthetic-member-01/lab-reports')) return Promise.resolve({ data: [] })
    if (url.startsWith('/members/synthetic-member-01/vitals')) return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

describe('RecordsPage', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
  })

  it('loads records and sends newest sort by default', async () => {
    stubLists()
    render(<MemoryRouter><RecordsPage /></MemoryRouter>)

    expect(await screen.findByText('Newer synthetic note')).toBeInTheDocument()
    expect(mocks.get).toHaveBeenCalledWith(
      '/members/synthetic-member-01/records',
      expect.objectContaining({ params: expect.objectContaining({ sort: 'newest', page: 1, pageSize: 20 }) }),
    )
  })

  it('requests oldest sort when the toolbar sort changes', async () => {
    stubLists()
    render(<MemoryRouter><RecordsPage /></MemoryRouter>)
    await screen.findByText('Newer synthetic note')

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'date-asc' } })

    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith(
      '/members/synthetic-member-01/records',
      expect.objectContaining({ params: expect.objectContaining({ sort: 'oldest' }) }),
    ))
  })

  it('shows a retryable error when the record list fails', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member] } })
      if (url === '/members/me') return Promise.resolve({ data: member })
      return Promise.reject(new Error('synthetic list failure'))
    })
    render(<MemoryRouter><RecordsPage /></MemoryRouter>)

    expect(await screen.findByText('Records could not be loaded for this profile.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('marks a lab value outside the recorded reference range with colour and icon', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member] } })
      if (url === '/members/me') return Promise.resolve({ data: member })
      if (url.startsWith('/members/synthetic-member-01/records')) {
        return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
      }
      if (url.startsWith('/members/synthetic-member-01/lab-reports')) {
        return Promise.resolve({ data: [{ id: 'lab-1', memberId: member.id, originalFileName: 'synthetic-report.png', ocrStatus: 'Completed', collectedAt: '2026-06-01T00:00:00Z' }] })
      }
      if (url === '/lab-reports/lab-1') {
        return Promise.resolve({
          data: {
            id: 'lab-1',
            memberId: member.id,
            originalFileName: 'synthetic-report.png',
            ocrStatus: 'Completed',
            collectedAt: '2026-06-01T00:00:00Z',
            values: [{ id: 'v1', analyte: 'Synthetic analyte', value: 20, unit: 'unit', referenceLow: 11, referenceHigh: 15, wasManuallyConfirmed: false }],
            flags: [],
          },
        })
      }
      if (url.startsWith('/members/synthetic-member-01/vitals')) return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    render(<MemoryRouter><RecordsPage /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: /review extraction/i }))
    expect(await screen.findByText('Outside recorded range')).toBeInTheDocument()
    expect(screen.getByTitle('Outside recorded reference range')).toBeInTheDocument()
    expect(screen.queryByText(/diagnos/i)).not.toBeInTheDocument()
  })
})
