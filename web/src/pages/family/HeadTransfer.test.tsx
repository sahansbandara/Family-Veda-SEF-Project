// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// FH-3 Family Head transfer: Head proposes from Family Settings; the adult accepts from a banner.
import '@testing-library/jest-dom/vitest'

import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getRoster: vi.fn(),
  getPendingHeadTransfer: vi.fn(),
  proposeHeadTransfer: vi.fn(),
  getIncomingHeadTransfer: vi.fn(),
  acceptHeadTransfer: vi.fn(),
  declineHeadTransfer: vi.fn(),
  refreshSession: vi.fn(),
}))
vi.mock('../../services/apiClient', () => ({
  familyLifecycleApi: mocks,
  refreshSession: mocks.refreshSession,
  setSessionTokens: vi.fn(),
  apiClient: { post: vi.fn() },
}))

import authReducer, { signedIn } from '../../store/slices/authSlice'
import { FamilyHeadTransferSection } from './FamilyHeadTransferSection'
import { HeadTransferBanner } from './HeadTransferBanner'

const roster = [
  { id: 'head-1', displayName: 'Synthetic Head', role: 'Head', isMinor: false, isSelf: true, hasAccount: true },
  { id: 'adult-1', displayName: 'Synthetic Adult', role: 'AdultMember', isMinor: false, isSelf: false, hasAccount: true },
  { id: 'minor-1', displayName: 'Synthetic Minor', role: 'MinorMember', isMinor: true, isSelf: false, hasAccount: false },
]
const offer = {
  id: 'tr-1', familyId: 'family-1', familyName: 'Synthetic Family', fromMemberId: 'head-1', fromDisplayName: 'Synthetic Head',
  toMemberId: 'adult-1', toDisplayName: 'Synthetic Adult', status: 'Pending', createdAt: '2026-09-29T08:00:00Z',
}

describe('Family Head transfer', () => {
  beforeEach(() => vi.spyOn(window, 'confirm').mockReturnValue(true))
  afterEach(() => vi.clearAllMocks())

  it('offers only adults with an account and sends the proposal', async () => {
    mocks.getRoster.mockResolvedValue({ data: roster })
    mocks.getPendingHeadTransfer.mockResolvedValue({ data: '' })
    mocks.proposeHeadTransfer.mockResolvedValue({ data: offer })
    const onMessage = vi.fn()
    render(<FamilyHeadTransferSection familyId="family-1" onMessage={onMessage} />)

    const select = await screen.findByLabelText('New Family Head')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Select eligible adult member…', 'Synthetic Adult'])
    fireEvent.change(select, { target: { value: 'adult-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send transfer request' }))

    await waitFor(() => expect(mocks.proposeHeadTransfer).toHaveBeenCalledWith('family-1', 'adult-1'))
    expect(onMessage).toHaveBeenCalledWith(expect.stringContaining('must accept'))
  })

  it('lets the offered adult accept, then refreshes the session as Family Head', async () => {
    mocks.getIncomingHeadTransfer.mockResolvedValue({ data: offer })
    mocks.acceptHeadTransfer.mockResolvedValue({ data: { ...offer, status: 'Accepted' } })
    mocks.refreshSession.mockResolvedValue({
      userId: 'u-adult', displayName: 'Synthetic Adult', userType: 'FamilyUser', familyRole: 'Head',
      accessToken: 'a', refreshToken: 'r', accessTokenExpiresAt: '2026-09-29T09:00:00Z', familyHeadVerificationStatus: 'Verified',
    })
    const store = configureStore({ reducer: { auth: authReducer } })
    store.dispatch(signedIn({ id: 'u-adult', name: 'Synthetic Adult', role: 'MEMBER' }))
    render(<Provider store={store}><MemoryRouter><HeadTransferBanner /></MemoryRouter></Provider>)

    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }))

    await waitFor(() => expect(store.getState().auth.user?.role).toBe('FAMILY_HEAD'))
    expect(mocks.acceptHeadTransfer).toHaveBeenCalledWith('tr-1')
    expect(await screen.findByRole('status')).toHaveTextContent('You are now the Family Head of Synthetic Family')
  })

  it('renders nothing when no offer is waiting', async () => {
    mocks.getIncomingHeadTransfer.mockResolvedValue({ data: '' })
    const store = configureStore({ reducer: { auth: authReducer } })
    const { container } = render(<Provider store={store}><MemoryRouter><HeadTransferBanner /></MemoryRouter></Provider>)

    await waitFor(() => expect(mocks.getIncomingHeadTransfer).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
