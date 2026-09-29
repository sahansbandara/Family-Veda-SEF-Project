// Owner: S1 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// My Family tabs (FH-2c): roster, Remove from Family, join requests, invitations.
import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  getRoster: vi.fn(),
  getInvitations: vi.fn(),
  cancelInvitation: vi.fn(),
  removeFromFamily: vi.fn(),
  getFamilyJoinRequests: vi.fn(),
  acceptJoinRequest: vi.fn(),
}))
vi.mock('../../services/apiClient', () => ({
  apiClient: { get: mocks.get, post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  familyLifecycleApi: {
    getRoster: mocks.getRoster,
    getInvitations: mocks.getInvitations,
    cancelInvitation: mocks.cancelInvitation,
    removeFromFamily: mocks.removeFromFamily,
  },
  threePortalApi: { getFamilyJoinRequests: mocks.getFamilyJoinRequests, acceptJoinRequest: mocks.acceptJoinRequest },
}))
vi.mock('../../styles/family-tabs.css', () => ({}))

import { FamilyPage } from './FamilyPage'

const family = { id: 'family-1', name: 'Synthetic Perera Family', familyCode: 'FV-7K4P92', members: [] }
const roster = [
  { id: 'head-1', displayName: 'Synthetic Head', role: 'Head', isMinor: false, isSelf: true, hasAccount: true },
  { id: 'adult-1', displayName: 'Synthetic Adult', role: 'AdultMember', isMinor: false, isSelf: false, hasAccount: true },
  { id: 'minor-1', displayName: 'Synthetic Minor', role: 'MinorMember', isMinor: true, isSelf: false, hasAccount: false },
]
const joinRequest = {
  id: 'jr-1', familyId: 'family-1', familyName: 'Synthetic Perera Family', requesterDisplayName: 'Synthetic Requester',
  requesterEmailMasked: 'r***@example.invalid', relationshipType: 'Cousin', status: 'Pending', createdAt: '2026-09-28T08:00:00Z',
}
const invitation = {
  id: 'inv-1', emailMasked: 's***@example.invalid', relationshipType: 'Sister', status: 'Pending',
  createdAt: '2026-09-28T08:00:00Z', expiresAt: '2026-09-30T08:00:00Z',
}

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><FamilyPage /></MemoryRouter>)
}

describe('FamilyPage', () => {
  beforeEach(() => {
    mocks.get.mockResolvedValue({ data: family })
    mocks.getRoster.mockResolvedValue({ data: roster })
    mocks.getInvitations.mockResolvedValue({ data: [invitation] })
    mocks.getFamilyJoinRequests.mockResolvedValue({ data: [joinRequest] })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })
  afterEach(() => vi.clearAllMocks())

  it('shows the Family Code, tab badges and a names-and-roles roster', async () => {
    renderAt('/family')

    expect(await screen.findByText('FV-7K4P92')).toBeInTheDocument()
    const members = await screen.findByRole('region', { name: 'Members' })
    expect(within(members).getByText('Synthetic Adult')).toBeInTheDocument()
    expect(within(members).getByText('Adult Member')).toBeInTheDocument()
    expect(within(members).getAllByRole('button', { name: 'Remove from Family' })).toHaveLength(1)
    expect(within(members).getByRole('button', { name: 'Delete profile' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('tab', { name: /Join Requests/ })).toHaveTextContent('1'))
  })

  it('removes an adult by moving them to their own household after confirmation', async () => {
    mocks.removeFromFamily.mockResolvedValue({ data: { memberId: 'adult-1', familyId: 'new', familyName: 'Synthetic Adult Family' } })
    renderAt('/family')

    fireEvent.click(await screen.findByRole('button', { name: 'Remove from Family' }))

    await waitFor(() => expect(mocks.removeFromFamily).toHaveBeenCalledWith('adult-1'))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('health history are kept'))
    expect(await screen.findByRole('status')).toHaveTextContent('Synthetic Adult was removed from the family')
  })

  it('accepts a join request from the Join Requests tab', async () => {
    mocks.acceptJoinRequest.mockResolvedValue({ data: {} })
    renderAt('/family?tab=requests')

    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }))

    await waitFor(() => expect(mocks.acceptJoinRequest).toHaveBeenCalledWith('jr-1'))
    expect(await screen.findByRole('status')).toHaveTextContent('Synthetic Requester joined the family')
  })

  it('lists invitations with masked emails and cancels one', async () => {
    mocks.cancelInvitation.mockResolvedValue({ data: {} })
    renderAt('/family?tab=invitations')

    expect(await screen.findByText('s***@example.invalid')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(mocks.cancelInvitation).toHaveBeenCalledWith('family-1', 'inv-1'))
  })
})
