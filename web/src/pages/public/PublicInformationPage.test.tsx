// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
import '@testing-library/jest-dom/vitest'

import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PublicInformationPage } from './PublicInformationPage'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PublicInformationPage />
    </MemoryRouter>,
  )

describe('PublicInformationPage', () => {
  it.each([
    ['/about', 'About Family Veda'],
    ['/privacy-policy', 'Privacy and data use'],
    ['/terms', 'Terms for using Family Veda'],
  ])('renders the %s page under its own heading', (path, heading) => {
    renderAt(path)

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: heading })).toBeInTheDocument()
  })

  it('links every public page and sign-in from the header navigation', () => {
    renderAt('/about')

    const nav = within(screen.getByRole('navigation', { name: 'Public information' }))
    expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(nav.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy-policy')
    expect(nav.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    expect(nav.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })

  it('states the synthetic-data rule on the privacy policy', () => {
    renderAt('/privacy-policy')

    expect(screen.getByText(/designed for synthetic information only/i)).toBeInTheDocument()
    expect(screen.getByText(/private Google Drive location/i)).toBeInTheDocument()
  })

  it('states the clinical boundaries and emergency deferral', () => {
    renderAt('/terms')
    expect(screen.getByText(/does not provide a diagnosis, prescription, medication dosing or meal plan/i)).toBeInTheDocument()
    expect(screen.getByText(/seek urgent or emergency care/i)).toBeInTheDocument()
  })
})
