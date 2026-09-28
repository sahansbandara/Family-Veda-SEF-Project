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
    expect(screen.getByRole('heading', { name: /Welcome back/i, level: 1 })).toBeInTheDocument()
  })

  it('has sign in button', () => {
    renderAuth()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('has create account button', () => {
    renderAuth()
    const buttons = screen.getAllByRole('button', { name: /Create an account/i })
    expect(buttons.length).toBeGreaterThan(0)
  })
})
