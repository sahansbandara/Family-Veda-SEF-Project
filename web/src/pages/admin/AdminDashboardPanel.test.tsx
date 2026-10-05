import '@testing-library/jest-dom/vitest'

import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../services/apiClient', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: { items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 } }) },
}))

import authReducer from '../../store/slices/authSlice'
import { AdminDashboardPanel } from './AdminDashboardPanel'

describe('AdminDashboardPanel', () => {
  it('shows real zero counts on an empty system instead of sample numbers', async () => {
    const store = configureStore({ reducer: { auth: authReducer } })
    render(<Provider store={store}><MemoryRouter><AdminDashboardPanel /></MemoryRouter></Provider>)

    const tile = await screen.findByRole('link', { name: 'Verified doctors: open' })
    expect(tile).toHaveTextContent('0')
    expect(tile).not.toHaveTextContent(/^Verified doctors2/)
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
    expect(screen.getByText('Nothing waiting')).toBeInTheDocument()
  })
})
