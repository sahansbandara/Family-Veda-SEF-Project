import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getFamilyRoster: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ doctorWorkspaceApi: mocks }))

import { DoctorFamilyDetailPage } from './DoctorFamilyDetailPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/families/f-1']}>
      <Routes><Route path="/families/:familyId" element={<DoctorFamilyDetailPage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('DoctorFamilyDetailPage', () => {
  beforeEach(() => {
    mocks.getFamilyRoster.mockReset()
    mocks.getFamilyRoster.mockResolvedValue({ data: { familyId: 'f-1', familyName: 'Synthetic Perera Family', members: [
      { id: 'm-1', displayName: 'Synthetic Adult', role: 'AdultMember', clinicalAccess: true },
      { id: 'm-2', displayName: 'Synthetic Head', role: 'Head', clinicalAccess: false },
    ] } })
  })

  it('shows the real grant state per member, not a blanket "accessible"', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Synthetic Perera Family' })).toBeInTheDocument()
    expect(screen.getByText('2 members · 1 with an active care grant')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Member Workspace: Synthetic Adult' })).toHaveAttribute('href', '/members/m-1')
    expect(screen.getByRole('link', { name: 'View Access Details: Synthetic Head' })).toHaveAttribute('href', '/members/m-2')
    expect(screen.getByText('Family Head')).toBeInTheDocument()
  })

  it('filters the roster by access state', async () => {
    renderPage()

    fireEvent.change(await screen.findByLabelText('Access status'), { target: { value: 'restricted' } })
    expect(screen.queryByText('Synthetic Adult')).not.toBeInTheDocument()
    expect(screen.getByText('Synthetic Head')).toBeInTheDocument()
  })

  it('shows an error state when the family is no longer assigned', async () => {
    mocks.getFamilyRoster.mockRejectedValue(new Error('404'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be loaded/)
  })
})
