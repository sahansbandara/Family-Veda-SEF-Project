import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../../store/slices/authSlice'
import { AuthPage } from './AuthPage'

const store = configureStore({
  reducer: { auth: authReducer },
})

const renderAuth = () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    </Provider>
  )
}

describe('AuthPage', () => {
  it('renders login heading', () => {
    renderAuth()
    expect(screen.getByRole('heading', { name: /Sign in/i, level: 2 })).toBeInTheDocument()
  })

  it('has sign in button', () => {
    renderAuth()
    const buttons = screen.getAllByRole('button', { name: /Sign in/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('has sign up button', () => {
    renderAuth()
    const buttons = screen.getAllByRole('button', { name: /Sign up/i })
    expect(buttons.length).toBeGreaterThan(0)
  })
})
