// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Approving an invitation demotes a Head to Adult Member; the session must refresh in place, never reload.
import '@testing-library/jest-dom/vitest'

import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getIncomingInvitations: vi.fn(),
  approveInvitation: vi.fn(),
  rejectInvitation: vi.fn(),
  refreshSession: vi.fn(),
}))
vi.mock('../../services/apiClient', () => ({
  familyLifecycleApi: mocks,
  refreshSession: mocks.refreshSession,
  setSessionTokens: vi.fn(),
  apiClient: { post: vi.fn() },
}))

import authReducer, { signedIn } from '../../store/slices/authSlice'
import { IncomingInvitationsPanel } from './IncomingInvitationsPanel'

const invitation = {
  id: 'inv-1', familyName: 'Synthetic Family', invitedByName: 'Synthetic Head', relationshipType: 'Sibling',
  createdAt: '2026-09-29T08:00:00Z', expiresAt: '2026-10-13T08:00:00Z', canApprove: true, blockedReason: null,
}

function renderPanel() {
  const store = configureStore({ reducer: { auth: authReducer } })
  store.dispatch(signedIn({ id: 'u-1', name: 'Synthetic User', role: 'FAMILY_HEAD' }))
  render(<Provider store={store}><MemoryRouter><IncomingInvitationsPanel onMessage={vi.fn()} /></MemoryRouter></Provider>)
  return store
}

describe('IncomingInvitationsPanel', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mocks.getIncomingInvitations.mockResolvedValueOnce({ data: [invitation] }).mockResolvedValue({ data: [] })
    mocks.approveInvitation.mockResolvedValue({ data: {} })
  })
  afterEach(() => vi.clearAllMocks())

  it('keeps the user signed in and adopts the Adult Member role after approving', async () => {
    mocks.refreshSession.mockResolvedValue({
      userId: 'u-1', displayName: 'Synthetic User', userType: 'FamilyUser', familyRole: 'AdultMember',
      accessToken: 'a', refreshToken: 'r', accessTokenExpiresAt: '2026-09-29T09:00:00Z',
    })
    const store = renderPanel()

    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }))

    await waitFor(() => expect(store.getState().auth.user?.role).toBe('MEMBER'))
    expect(mocks.approveInvitation).toHaveBeenCalledWith('inv-1')
  })

  it('signs out cleanly when the session cannot be refreshed', async () => {
    mocks.refreshSession.mockRejectedValue(new Error('refresh failed'))
    const store = renderPanel()

    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }))

    await waitFor(() => expect(store.getState().auth.user).toBeNull())
  })
})
