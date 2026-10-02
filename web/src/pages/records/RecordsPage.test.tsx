import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))
import { RecordsPage } from './RecordsPage'

const member = {
  id: 'synthetic-member-01',
  displayName: 'Synthetic Member',
  role: 'Head',
  dateOfBirth: '1990-01-01',
}
const minor = {
  id: 'synthetic-minor-02',
  displayName: 'Synthetic Minor',
  role: 'MinorMember',
  dateOfBirth: '2015-01-01',
}
const adult = {
  id: 'synthetic-adult-03',
  displayName: 'Synthetic Adult',
  role: 'AdultMember',
  dateOfBirth: '1990-01-01',
}
type LabReportDtoForTest = { id: string; memberId: string; originalFileName: string; ocrStatus: string; hasOriginalFile: boolean }

function stubLists() {
  mocks.get.mockImplementation((url: string, config?: { params?: { sort?: string } }) => {
    if (url === '/families/me')
      return Promise.resolve({
        data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member, minor] },
      })
    if (url === '/members/me') return Promise.resolve({ data: member })
    if (url.startsWith('/members/synthetic-member-01/records')) {
      const newestFirst = config?.params?.sort !== 'oldest'
      const items = newestFirst
        ? [
            {
              id: 'r2',
              title: 'Newer synthetic note',
              recordType: 'Note',
              occurredOn: '2026-06-01',
              summary: null,
            },
          ]
        : [
            {
              id: 'r1',
              title: 'Older synthetic note',
              recordType: 'Note',
              occurredOn: '2026-01-01',
              summary: null,
            },
          ]
      return Promise.resolve({ data: { items, page: 1, pageSize: 20, totalCount: 1, totalPages: 1 } })
    }
    if (url.startsWith('/members/synthetic-minor-02/records'))
      return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
    if (
      url.startsWith('/members/synthetic-member-01/lab-reports') ||
      url.startsWith('/members/synthetic-minor-02/lab-reports')
    )
      return Promise.resolve({ data: [] })
    if (
      url.startsWith('/members/synthetic-member-01/vitals') ||
      url.startsWith('/members/synthetic-minor-02/vitals')
    )
      return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

describe('RecordsPage', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset()
    mocks.put.mockReset()
  })

  it('defaults to Labs and opens the PNG/JPEG/PDF upload form from the query link', async () => {
    stubLists()
    render(
      <MemoryRouter initialEntries={['/records?upload=1']}>
        <RecordsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('tab', { name: 'Labs', selected: true })).toBeInTheDocument()
    expect(await screen.findByText('PNG, JPEG or PDF only, up to 10 MB.')).toBeInTheDocument()
    expect(screen.getByLabelText('Report file (PNG, JPEG or PDF)')).toHaveAttribute(
      'accept',
      'image/png,image/jpeg,application/pdf',
    )
  })

  it('requests oldest records only after the Records view sort changes', async () => {
    stubLists()
    render(
      <MemoryRouter initialEntries={['/records?tab=records']}>
        <RecordsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Newer synthetic note')).toBeInTheDocument()
    expect(mocks.get).toHaveBeenCalledWith(
      '/members/synthetic-member-01/records',
      expect.objectContaining({ params: expect.objectContaining({ sort: 'newest', page: 1, pageSize: 20 }) }),
    )
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'date-asc' } })
    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith(
        '/members/synthetic-member-01/records',
        expect.objectContaining({ params: expect.objectContaining({ sort: 'oldest' }) }),
      ),
    )
    expect(await screen.findByText('Older synthetic note')).toBeInTheDocument()
  })

  it('keeps an active manual-record draft mounted while search reloads the list', async () => {
    stubLists()
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/records?tab=records']}>
        <RecordsPage />
      </MemoryRouter>,
    )
    await screen.findByText('Newer synthetic note')
    await user.click(screen.getAllByRole('button', { name: 'Add record' })[0])
    const title = screen.getByLabelText('Title')
    await user.type(title, 'Synthetic draft')
    const search = screen.getByLabelText('Search records')
    await user.type(search, 'Synthetic')
    expect(search).toHaveFocus()
    expect(search).toHaveValue('Synthetic')
    expect(title).toHaveValue('Synthetic draft')
  })

  it('shows a retryable error when the authorized lists cannot be loaded', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me')
        return Promise.resolve({
          data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member] },
        })
      if (url === '/members/me') return Promise.resolve({ data: member })
      return Promise.reject(new Error('synthetic list failure'))
    })
    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Records could not be loaded for this profile.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('retries the initial profile bootstrap after member lookup fails', async () => {
    let memberAttempts = 0
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me')
        return Promise.resolve({
          data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member] },
        })
      if (url === '/members/me') {
        memberAttempts += 1
        return memberAttempts === 1
          ? Promise.reject(new Error('synthetic member lookup failure'))
          : Promise.resolve({ data: member })
      }
      if (url.startsWith('/members/synthetic-member-01/records'))
        return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
      if (
        url.startsWith('/members/synthetic-member-01/lab-reports') ||
        url.startsWith('/members/synthetic-member-01/vitals')
      )
        return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No lab reports')).toBeInTheDocument()
    expect(mocks.get).toHaveBeenCalledWith('/members/me')
    expect(memberAttempts).toBe(2)
  })

  it('keeps shared adult reports read-only and does not fetch raw extraction details', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me')
        return Promise.resolve({
          data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member, adult] },
        })
      if (url === '/members/me') return Promise.resolve({ data: member })
      if (
        url.startsWith('/members/synthetic-member-01/records') ||
        url.startsWith('/members/synthetic-adult-03/records')
      )
        return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
      if (url.startsWith('/members/synthetic-member-01/lab-reports')) return Promise.resolve({ data: [] })
      if (url.startsWith('/members/synthetic-adult-03/lab-reports'))
        return Promise.resolve({
          data: [
            {
              id: 'shared-lab-1',
              memberId: adult.id,
              originalFileName: 'synthetic-shared.png',
              ocrStatus: 'Completed',
              sharedWithFamilyHead: true,
            },
          ],
        })
      if (url.startsWith('/members/synthetic-member-01/vitals')) return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )
    await screen.findByText('No lab reports')
    fireEvent.change(screen.getByLabelText('Active profile'), { target: { value: adult.id } })
    expect(await screen.findByText('synthetic-shared.png')).toBeInTheDocument()
    expect(screen.getByText('Shared reports')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /check values|confirm values/i })).not.toBeInTheDocument()
    expect(mocks.get).not.toHaveBeenCalledWith('/lab-reports/shared-lab-1')
  })

  it('does not replace the active profile with a stale failed request', async () => {
    let rejectOwn: ((reason?: unknown) => void) | undefined
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me')
        return Promise.resolve({
          data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member, minor] },
        })
      if (url === '/members/me') return Promise.resolve({ data: member })
      if (url.startsWith('/members/synthetic-member-01/records'))
        return new Promise((_, reject) => {
          rejectOwn = reject
        })
      if (
        url.startsWith('/members/synthetic-member-01/lab-reports') ||
        url.startsWith('/members/synthetic-member-01/vitals')
      )
        return Promise.resolve({ data: [] })
      if (url.startsWith('/members/synthetic-minor-02/records'))
        return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
      if (
        url.startsWith('/members/synthetic-minor-02/lab-reports') ||
        url.startsWith('/members/synthetic-minor-02/vitals')
      )
        return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )
    await waitFor(() => expect(rejectOwn).toBeTypeOf('function'))
    fireEvent.change(screen.getByLabelText('Active profile'), { target: { value: minor.id } })
    rejectOwn?.(new Error('stale synthetic failure'))
    expect(await screen.findByText('No lab reports')).toBeInTheDocument()
    expect(screen.queryByText('Records could not be loaded for this profile.')).not.toBeInTheDocument()
  })

  it('does not reload or clear the new profile when an earlier record save completes', async () => {
    let resolveSave: (() => void) | undefined
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me')
        return Promise.resolve({
          data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member, minor] },
        })
      if (url === '/members/me') return Promise.resolve({ data: member })
      if (url.startsWith('/members/synthetic-member-01/records'))
        return Promise.resolve({
          data: {
            items: [
              {
                id: 'record-1',
                memberId: member.id,
                recordType: 'Note',
                title: 'Synthetic note',
                occurredOn: '2026-06-01',
              },
            ],
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        })
      if (
        url.startsWith('/members/synthetic-member-01/lab-reports') ||
        url.startsWith('/members/synthetic-member-01/vitals')
      )
        return Promise.resolve({ data: [] })
      if (url.startsWith('/members/synthetic-minor-02/records'))
        return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
      if (
        url.startsWith('/members/synthetic-minor-02/lab-reports') ||
        url.startsWith('/members/synthetic-minor-02/vitals')
      )
        return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    mocks.put.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        }),
    )
    render(
      <MemoryRouter initialEntries={['/records?tab=records']}>
        <RecordsPage />
      </MemoryRouter>,
    )
    await screen.findByText('Synthetic note')
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Update record' }))
    fireEvent.change(screen.getByLabelText('Active profile'), { target: { value: minor.id } })
    await act(async () => {
      resolveSave?.()
    })
    expect(await screen.findByText('No matching records')).toBeInTheDocument()
    expect(screen.queryByText('Health record updated.')).not.toBeInTheDocument()
  })

  it('clears the selected report immediately when the active profile changes', async () => {
    let resolveDetail: ((value: { data: object }) => void) | undefined
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me')
        return Promise.resolve({
          data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member, minor] },
        })
      if (url === '/members/me') return Promise.resolve({ data: member })
      if (
        url.startsWith('/members/synthetic-member-01/records') ||
        url.startsWith('/members/synthetic-minor-02/records')
      )
        return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
      if (url.startsWith('/members/synthetic-member-01/lab-reports'))
        return Promise.resolve({
          data: [
            {
              id: 'lab-1',
              memberId: member.id,
              originalFileName: 'synthetic-report.png',
              ocrStatus: 'Completed',
            },
          ],
        })
      if (
        url.startsWith('/members/synthetic-minor-02/lab-reports') ||
        url.startsWith('/members/synthetic-member-01/vitals') ||
        url.startsWith('/members/synthetic-minor-02/vitals')
      )
        return Promise.resolve({ data: [] })
      if (url === '/lab-reports/lab-1')
        return new Promise((resolve) => {
          resolveDetail = resolve
        })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Check values' }))
    fireEvent.change(screen.getByLabelText('Active profile'), { target: { value: minor.id } })
    await screen.findByText('No lab reports')
    expect(screen.getByText('Check extracted values')).toBeInTheDocument()
    await act(async () => {
      resolveDetail?.({
        data: {
          id: 'lab-1',
          memberId: member.id,
          originalFileName: 'synthetic-report.png',
          ocrStatus: 'Completed',
          values: [
            {
              id: 'v1',
              analyte: 'Synthetic analyte',
              value: 20,
              unit: 'unit',
              referenceLow: 11,
              referenceHigh: 15,
              wasManuallyConfirmed: false,
            },
          ],
          flags: [],
        },
      })
    })
    await waitFor(() => expect(screen.queryByText('Synthetic analyte')).not.toBeInTheDocument())
  })

  it('marks a report value outside the recorded reference range without clinical interpretation', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me')
        return Promise.resolve({
          data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member] },
        })
      if (url === '/members/me') return Promise.resolve({ data: member })
      if (url.startsWith('/members/synthetic-member-01/records'))
        return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
      if (url.startsWith('/members/synthetic-member-01/lab-reports'))
        return Promise.resolve({
          data: [
            {
              id: 'lab-1',
              memberId: member.id,
              originalFileName: 'synthetic-report.png',
              ocrStatus: 'Completed',
              collectedAt: '2026-06-01T00:00:00Z',
            },
          ],
        })
      if (url === '/lab-reports/lab-1')
        return Promise.resolve({
          data: {
            id: 'lab-1',
            memberId: member.id,
            originalFileName: 'synthetic-report.png',
            ocrStatus: 'Completed',
            values: [
              {
                id: 'v1',
                analyte: 'Synthetic analyte',
                value: 20,
                unit: 'unit',
                referenceLow: 11,
                referenceHigh: 15,
                wasManuallyConfirmed: false,
              },
            ],
            flags: [],
          },
        })
      if (url.startsWith('/members/synthetic-member-01/vitals')) return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Check values' }))
    await waitFor(() =>
      expect(screen.getByTitle('Outside recorded reference range')).toHaveTextContent(
        'Outside recorded range',
      ),
    )
    expect(screen.queryByText(/diagnos/i)).not.toBeInTheDocument()
  })

  it('clears the selected report and ignores a stale list response when the active profile changes', async () => {
    const minorA = { id: 'minor-a', displayName: 'Synthetic Minor A', role: 'MinorMember', dateOfBirth: '2015-01-01' }
    const minorB = { id: 'minor-b', displayName: 'Synthetic Minor B', role: 'MinorMember', dateOfBirth: '2016-01-01' }
    let resolveStaleA!: (value: { data: LabReportDtoForTest[] }) => void
    const staleA = new Promise<{ data: LabReportDtoForTest[] }>((resolve) => { resolveStaleA = resolve })
    let aReportCalls = 0
    mocks.get.mockImplementation((url: string) => {
      if (url === '/families/me') return Promise.resolve({ data: { id: 'synthetic-family-01', name: 'Synthetic Family', members: [member, minorA, minorB] } })
      if (url === '/members/me') return Promise.resolve({ data: member })
      if (url.endsWith('/records')) return Promise.resolve({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 } })
      if (url.endsWith('/vitals') || url.endsWith('/vitals/trends')) return Promise.resolve({ data: [] })
      if (url === '/members/synthetic-member-01/lab-reports') return Promise.resolve({ data: [] })
      if (url === '/members/minor-a/lab-reports') {
        aReportCalls += 1
        return aReportCalls === 1
          ? Promise.resolve({ data: [{ id: 'lab-a', memberId: minorA.id, originalFileName: 'minor-a.png', ocrStatus: 'Completed', hasOriginalFile: false }] })
          : staleA
      }
      if (url === '/members/minor-b/lab-reports') {
        return Promise.resolve({ data: [{ id: 'lab-b', memberId: minorB.id, originalFileName: 'minor-b.png', ocrStatus: 'Completed', hasOriginalFile: false }] })
      }
      if (url === '/lab-reports/lab-a') {
        return Promise.resolve({ data: { id: 'lab-a', memberId: minorA.id, originalFileName: 'minor-a.png', ocrStatus: 'Completed', values: [{ id: 'value-a', analyte: 'Minor A analyte', value: 1, unit: 'u', wasManuallyConfirmed: false }], flags: [] } })
      }
      return Promise.reject(new Error(`unexpected ${url}`))
    })

    render(<MemoryRouter><RecordsPage /></MemoryRouter>)
    const profile = await screen.findByLabelText('Active profile')
    fireEvent.change(profile, { target: { value: minorA.id } })
    fireEvent.click(await screen.findByRole('tab', { name: 'Labs' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Check values' }))
    expect(await screen.findByDisplayValue('Minor A analyte')).toBeInTheDocument()

    fireEvent.change(profile, { target: { value: minorB.id } })
    expect(screen.queryByDisplayValue('Minor A analyte')).not.toBeInTheDocument()
    expect(await screen.findByText('minor-b.png')).toBeInTheDocument()

    fireEvent.change(profile, { target: { value: minorA.id } })
    await waitFor(() => expect(aReportCalls).toBe(2))
    fireEvent.change(profile, { target: { value: minorB.id } })
    expect(await screen.findByText('minor-b.png')).toBeInTheDocument()
    resolveStaleA({ data: [{ id: 'lab-a-stale', memberId: minorA.id, originalFileName: 'stale-minor-a.png', ocrStatus: 'Completed', hasOriginalFile: false }] })

    await waitFor(() => expect(screen.queryByText('stale-minor-a.png')).not.toBeInTheDocument())
    expect(screen.getByText('minor-b.png')).toBeInTheDocument()
  })
})
