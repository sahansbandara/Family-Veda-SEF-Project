import '@testing-library/jest-dom/vitest'

import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: { get: mocks.get, post: vi.fn() } }))

import authReducer from '../../store/slices/authSlice'
import { DoctorStatusPage } from './DoctorStatusPage'

describe('DoctorStatusPage', () => {
  it('explains a disputed SLMC claim instead of an error', async () => {
    mocks.get.mockResolvedValue({ data: { id: 'd', userId: 'u', registrationNumberLastFour: '7001', verificationStatus: 'Pending', claimDisputed: true } })
    const store = configureStore({ reducer: { auth: authReducer } })
    render(<Provider store={store}><DoctorStatusPage /></Provider>)

    expect(await screen.findByText(/Your claim is under review because this number is already registered\./)).toBeInTheDocument()
  })

  it('shows no dispute notice for an undisputed claim', async () => {
    mocks.get.mockResolvedValue({ data: { id: 'd', userId: 'u', registrationNumberLastFour: '1234', verificationStatus: 'Pending' } })
    const store = configureStore({ reducer: { auth: authReducer } })
    render(<Provider store={store}><DoctorStatusPage /></Provider>)

    expect(await screen.findByText('Doctor Profile & Status')).toBeInTheDocument()
    expect(screen.queryByText('Claim under review')).not.toBeInTheDocument()
  })
})
