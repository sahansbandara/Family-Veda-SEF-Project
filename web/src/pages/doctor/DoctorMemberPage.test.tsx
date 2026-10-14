import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getMemberWorkspace: vi.fn(), addNote: vi.fn(), amendNote: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ doctorWorkspaceApi: mocks }))

import { DoctorMemberPage } from './DoctorMemberPage'

const base = {
  memberId: 'm-1', displayName: 'Synthetic Adult', role: 'AdultMember', familyId: 'f-1', familyName: 'Synthetic Family',
  visits: [], notes: [], consentedCategories: [],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/members/m-1']}>
      <Routes><Route path="/members/:memberId" element={<DoctorMemberPage />} /></Routes>
    </MemoryRouter>,
  )
}

const permitted = {
  ...base, clinicalAccess: true, accessBasis: 'Confirmed visit + member consent.', accessExpiresAt: '2026-10-07T18:14:00Z',
  consentedCategories: ['Conditions'], records: [], labReports: [], vitals: null, hereditaryFlags: null,
}

describe('DoctorMemberPage', () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()))

  it('shows a restricted view without counts when there is no visit or case grant', async () => {
    mocks.getMemberWorkspace.mockResolvedValue({ data: { ...base, clinicalAccess: false, accessBasis: 'Family doctor assignment only.', records: null, labReports: null, vitals: null, hereditaryFlags: null } })
    renderPage()

    expect(await screen.findByText('Clinical categories restricted')).toBeInTheDocument()
    for (const [tab, title] of [['Records', 'Records restricted'], ['Labs', 'Lab reports restricted'], ['Vitals', 'Vitals restricted']] as const) {
      fireEvent.click(screen.getByRole('tab', { name: tab }))
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    expect(screen.queryByText(/^No (records|lab reports|vitals)/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }))
    expect(screen.queryByRole('button', { name: 'Save note' })).not.toBeInTheDocument()
  })

  it('shows consented labs with deterministic range status during a visit and saves a note', async () => {
    mocks.getMemberWorkspace.mockResolvedValue({ data: { ...permitted,
      labReports: [{ id: 'lab-1', fileName: 'synthetic-cbc.png', collectedAt: null, values: [
        { analyte: 'Synthetic Hb', value: 11.2, unit: 'g/dL', referenceLow: 12, referenceHigh: 15, rangeStatus: 'BelowRange', confirmed: true },
        { analyte: 'Synthetic ESR', value: 12, unit: 'mm/h', referenceLow: null, referenceHigh: null, rangeStatus: 'RangeUnavailable', confirmed: true },
      ] }] } })
    mocks.addNote.mockResolvedValue({ data: {} })
    renderPage()

    expect(await screen.findByText('Clinical access permitted')).toBeInTheDocument()
    expect(screen.getByText('Conditions / Records')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Labs' }))
    expect(screen.getByText('Below range')).toBeInTheDocument()
    expect(screen.getByText('12 – 15 g/dL')).toBeInTheDocument()
    expect(screen.getByText('Not printed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Vitals' }))
    expect(screen.getByText('Vitals restricted')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }))
    fireEvent.change(screen.getByLabelText('New visit note'), { target: { value: 'Synthetic visit note' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }))
    expect(mocks.addNote).toHaveBeenCalledWith('m-1', { content: 'Synthetic visit note', noteType: 'VisitNote' })
    expect(await screen.findByText('Note saved.')).toBeInTheDocument()
  })

  it('tells an authorised empty category apart from a restricted one', async () => {
    mocks.getMemberWorkspace.mockResolvedValue({ data: permitted })
    renderPage()

    fireEvent.click(await screen.findByRole('tab', { name: 'Records' }))
    expect(screen.getByText('No records')).toBeInTheDocument()
    expect(screen.queryByText('Records restricted')).not.toBeInTheDocument()
  })

  it('groups vitals by type and unit with readable names and never builds a trend from one reading', async () => {
    mocks.getMemberWorkspace.mockResolvedValue({ data: { ...permitted, consentedCategories: ['VitalsSummary'], vitals: [
      { vitalType: 'heart_rate', value: 72, unit: 'bpm', measuredAt: '2026-10-01T08:00:00Z' },
      { vitalType: 'heart_rate', value: 74, unit: 'bpm', measuredAt: '2026-09-01T08:00:00Z' },
      { vitalType: 'blood_pressure_systolic', value: 116, unit: 'mmHg', measuredAt: '2026-09-20T08:00:00Z' },
    ] } })
    renderPage()

    fireEvent.click(await screen.findByRole('tab', { name: 'Vitals' }))
    expect(screen.queryByText('heart_rate')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Heart rate: 2 readings/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Systolic blood pressure/ }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText(/One reading recorded/)).toBeInTheDocument()
    expect(screen.queryByText(/116\s*\//)).not.toBeInTheDocument()
  })

  it('separates upcoming and past visits', async () => {
    mocks.getMemberWorkspace.mockResolvedValue({ data: { ...permitted, visits: [
      { appointmentId: 'a-1', startsAt: '2099-01-01T10:00:00Z', reason: 'Synthetic follow-up', status: 'Confirmed' },
      { appointmentId: 'a-2', startsAt: '2020-01-01T10:00:00Z', reason: 'Synthetic review', status: 'Completed' },
    ] } })
    renderPage()

    fireEvent.click(await screen.findByRole('tab', { name: 'Visits' }))
    expect(screen.getByRole('heading', { name: 'Upcoming' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Past' })).toBeInTheDocument()
  })

  it('amends a note as a new version and keeps the original in the history', async () => {
    mocks.getMemberWorkspace.mockResolvedValue({ data: { ...permitted, notes: [
      { id: 'n-2', familyId: 'f-1', noteType: 'VisitNote', content: 'Synthetic corrected', version: 2, amendsNoteId: 'n-1', createdAt: '2026-10-02T08:00:00Z' },
      { id: 'n-1', familyId: 'f-1', noteType: 'VisitNote', content: 'Synthetic original', version: 1, amendsNoteId: null, createdAt: '2026-10-01T08:00:00Z' },
    ] } })
    mocks.amendNote.mockResolvedValue({ data: {} })
    renderPage()

    fireEvent.click(await screen.findByRole('tab', { name: 'Notes' }))
    expect(screen.getByText('Synthetic original')).toBeInTheDocument()
    expect(screen.getByText(/Amendment v2/)).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /^Amend note/ })[0]!)
    fireEvent.change(screen.getByLabelText('Amendment (the original note is kept)'), { target: { value: 'Synthetic third version' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save amendment' }))
    expect(mocks.amendNote).toHaveBeenCalledWith('n-1', 'Synthetic third version')
    expect(await screen.findByText('Amendment saved. The original note is kept.')).toBeInTheDocument()
  })

  it('re-reads the workspace when a write is denied, so an expired grant leaves no clinical data on screen', async () => {
    mocks.getMemberWorkspace
      .mockResolvedValueOnce({ data: { ...permitted, records: [{ id: 'r-1', recordType: 'Condition', title: 'Synthetic condition', summary: null, occurredOn: '2026-01-01' }] } })
      .mockResolvedValue({ data: { ...base, clinicalAccess: false, accessBasis: 'Family doctor assignment only.', records: null, labReports: null, vitals: null, hereditaryFlags: null } })
    mocks.addNote.mockRejectedValue(new Error('forbidden'))
    renderPage()

    fireEvent.click(await screen.findByRole('tab', { name: 'Notes' }))
    fireEvent.change(screen.getByLabelText('New visit note'), { target: { value: 'Synthetic late note' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/)
    expect(await screen.findByText('Clinical categories restricted')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Records' }))
    expect(screen.queryByText('Synthetic condition')).not.toBeInTheDocument()
    expect(screen.getByText('Records restricted')).toBeInTheDocument()
  })
})
