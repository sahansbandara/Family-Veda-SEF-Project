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

    const toggle = await screen.findByRole('switch', { name: 'Share synthetic-cbc.png with Family Head' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(mocks.patch).toHaveBeenCalledWith('/lab-reports/lab-1/sharing', { sharedWithFamilyHead: true })
  })

  it('loads every page of records so older items keep their sharing controls', async () => {
    mocks.get.mockImplementation((url: string, config?: { params?: { page?: number } }) => {
      if (url === '/members/me') return Promise.resolve({ data: me })
      if (url === '/members/m-adult/lab-reports') return Promise.resolve({ data: [] })
      if (url === '/members/m-adult/consents') return Promise.resolve({ data: [] })
      if (url === '/members/m-adult/records') {
        const page = config?.params?.page ?? 1
        return Promise.resolve({ data: { items: [{ id: `rec-${page}`, memberId: 'm-adult', recordType: 'Note', title: `Synthetic note page ${page}`, occurredOn: '2026-08-01', sharedWithFamilyHead: false }], page, pageSize: 50, totalCount: 2, totalPages: 2 } })
      }
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    renderAs('MEMBER')

    expect(await screen.findByText('Synthetic note page 2')).toBeInTheDocument()
    expect(screen.getByText('0 shared · 2 private')).toBeInTheDocument()
  })
})

describe('PrivacyPage (Family Head)', () => {
  const head = { id: 'm-head', familyId: 'f-1', displayName: 'Synthetic Head', dateOfBirth: '1980-01-01', role: 'Head' }
  const minor = { id: 'm-minor', familyId: 'f-1', displayName: 'Synthetic Child', dateOfBirth: '2015-01-01', role: 'MinorMember' }
  const adult = { id: 'm-adult', familyId: 'f-1', displayName: 'Synthetic Adult', dateOfBirth: '1995-01-01', role: 'AdultMember' }

  beforeEach(() => {
    mocks.get.mockReset(); mocks.patch.mockReset(); mocks.put.mockReset()
    mocks.get.mockImplementation((url: string, config?: { params?: { page?: number } }) => {
      if (url === '/families/me') return Promise.resolve({ data: { id: 'f-1', name: 'Synthetic Family', members: [head, minor, adult] } })
      if (url === '/members/me') return Promise.resolve({ data: head })
      if (url === '/members/m-head/consents') return Promise.resolve({ data: [{ id: 'c-h', memberId: 'm-head', category: 'Conditions', status: 'Granted', grantedByGuardian: false }] })
      if (url === '/members/m-minor/consents') return Promise.resolve({ data: [{ id: 'c-m', memberId: 'm-minor', category: 'HereditaryFlags', status: 'NotSet', grantedByGuardian: false }] })
      if (url === '/members/m-adult/lab-reports') return Promise.resolve({ data: [{ id: 'lab-1' }] })
      if (url === '/members/m-adult/records') return Promise.resolve({ data: { items: [], page: 1, pageSize: 1, totalCount: 0, totalPages: 0 } })
      if (url === '/families/f-1/doctor') return Promise.resolve({ data: { id: 'd-1', displayName: 'Dr. Synthetic Doctor', specialty: 'General Practice' } })
      if (url === '/audit') {
        const page = config?.params?.page ?? 1
        return Promise.resolve({ data: { items: [{ id: `a-${page}`, eventType: page === 1 ? 'CONSENT_CHANGED' : 'RECORD_CREATED', resourceType: 'Consent', outcome: 'Success', createdAt: '2026-09-01T10:00:00Z' }], page, pageSize: 20, totalCount: 2, totalPages: 2 } })
      }
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    mocks.put.mockResolvedValue({})
  })

  it('grants a minor consent through a real switch and never shows adult toggles', async () => {
    renderAs('FAMILY_HEAD')

    const toggle = await screen.findByRole('switch', { name: 'Family history (screening flags) consent for Synthetic Child' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(/1 item shared with you/)).toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /Synthetic Adult/ })).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(mocks.put).toHaveBeenCalledWith('/members/m-minor/consents/HereditaryFlags', { status: 'Granted' })
    expect(await screen.findByRole('status')).toHaveTextContent('Synthetic Child')
  })

  it('shows the assigned doctor and paged access history with metadata-only details', async () => {
    renderAs('FAMILY_HEAD')

    fireEvent.click(await screen.findByRole('tab', { name: 'Doctor access' }))
    expect(screen.getByRole('heading', { name: 'Dr. Synthetic Doctor' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Doctor' })).toHaveAttribute('href', '/my-doctor')

    fireEvent.click(screen.getByRole('tab', { name: 'Access history' }))
    expect(screen.getByRole('tab', { name: 'Access history' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(screen.getByText('Success')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByText('Health record added')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })
})
