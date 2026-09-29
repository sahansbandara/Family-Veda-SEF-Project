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

describe('DoctorMemberPage', () => {
  beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()))

  it('shows a restricted view without counts when there is no visit or case grant', async () => {
    mocks.getMemberWorkspace.mockResolvedValue({ data: { ...base, clinicalAccess: false, accessBasis: 'Family doctor assignment only.', records: null, labReports: null, vitals: null, hereditaryFlags: null } })
    renderPage()

    expect(await screen.findByText('RESTRICTED')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Records' }))
    expect(screen.getByText('Records restricted')).toBeInTheDocument()
    expect(screen.queryByText(/No records/)).not.toBeInTheDocument()
  })

  it('shows consented labs with deterministic range status during a visit and saves a note', async () => {
    mocks.getMemberWorkspace.mockResolvedValue({ data: { ...base, clinicalAccess: true, accessBasis: 'Confirmed visit + member consent', consentedCategories: ['Conditions'],
      records: [], vitals: null, hereditaryFlags: null,
      labReports: [{ id: 'lab-1', fileName: 'synthetic-cbc.png', collectedAt: null, values: [{ analyte: 'Synthetic Hb', value: 11.2, unit: 'g/dL', referenceLow: 12, referenceHigh: 15, rangeStatus: 'BelowRange', confirmed: true }] }] } })
    mocks.addNote.mockResolvedValue({ data: {} })
    renderPage()

    expect(await screen.findByText('ACCESS PERMITTED')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Labs' }))
    expect(screen.getByText('Below range')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Vitals' }))
    expect(screen.getByText('Vitals restricted')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }))
    fireEvent.change(screen.getByLabelText('New visit note'), { target: { value: 'Synthetic visit note' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }))
    expect(mocks.addNote).toHaveBeenCalledWith('m-1', { content: 'Synthetic visit note', noteType: 'VisitNote' })
  })
})
