import '@testing-library/jest-dom/vitest'

import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), put: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))

import authReducer, { signedIn } from '../../store/slices/authSlice'
import { PrivacyPage } from './PrivacyPage'

const me = { id: 'm-adult', familyId: 'f-1', displayName: 'Synthetic Adult', dateOfBirth: '1995-01-01', role: 'AdultMember' }

function renderAs(role: 'MEMBER' | 'FAMILY_HEAD') {
  const store = configureStore({ reducer: { auth: authReducer } })
  store.dispatch(signedIn({ id: 'u-1', name: 'Synthetic User', role }))
  return render(<Provider store={store}><MemoryRouter><PrivacyPage /></MemoryRouter></Provider>)
}

describe('PrivacyPage (Adult Member)', () => {
  beforeEach(() => {
    mocks.get.mockReset(); mocks.patch.mockReset(); mocks.put.mockReset()
    mocks.get.mockImplementation((url: string) => {
      if (url === '/members/me') return Promise.resolve({ data: me })
      if (url === '/members/m-adult/lab-reports') return Promise.resolve({ data: [{ id: 'lab-1', memberId: 'm-adult', originalFileName: 'synthetic-cbc.png', ocrStatus: 'Completed', sharedWithFamilyHead: false }] })
      if (url === '/members/m-adult/records') return Promise.resolve({ data: { items: [{ id: 'rec-1', memberId: 'm-adult', recordType: 'Note', title: 'Synthetic note', occurredOn: '2026-08-01', sharedWithFamilyHead: true }], page: 1, pageSize: 50, totalCount: 1, totalPages: 1 } })
      if (url === '/members/m-adult/consents') return Promise.resolve({ data: [{ id: 'c-1', memberId: 'm-adult', category: 'Conditions', status: 'Granted', grantedByGuardian: false }] })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    mocks.patch.mockResolvedValue({})
  })

  it('shows sharing and consent as two separate controls with real item state', async () => {
    renderAs('MEMBER')

    expect(screen.getByRole('heading', { name: 'Privacy', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText('synthetic-cbc.png')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Family Sharing' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Clinical Consent' })).toBeInTheDocument()
    expect(screen.getByText('1 shared · 1 private')).toBeInTheDocument()
  })

  it('shares a private report through the sharing endpoint', async () => {
    renderAs('MEMBER')

    fireEvent.click(await screen.findByRole('button', { name: 'Share with Family Head' }))
    expect(mocks.patch).toHaveBeenCalledWith('/lab-reports/lab-1/sharing', { sharedWithFamilyHead: true })
  })
})
