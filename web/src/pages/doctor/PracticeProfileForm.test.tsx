import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { DoctorPracticeProfileDto } from '../../services/apiClient'
import { PracticeProfileForm } from './PracticeProfileForm'
import { DISTRICTS, joinChoices, parseChoices, phoneProblem } from './practiceOptions'

// Synthetic profile. Stored the way older rows are: "InPerson,Video" and a free-text specialty.
const profile: DoctorPracticeProfileDto = {
  id: 'd-1', displayName: 'Dr Synthetic', email: 'doc@example.invalid', registrationNumberLastFour: '0001', verificationStatus: 'Verified',
  specialty: 'General Practice', clinic: 'Synthetic Family Clinic', district: 'Gampaha', city: 'Negombo', languages: 'Sinhala, English',
  consultationModes: 'InPerson,Video', phoneNumber: '0771234567', acceptingNewFamilies: true, slotMinutes: 30,
}

function setup(overrides: Partial<DoctorPracticeProfileDto> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined)
  render(<PracticeProfileForm profile={{ ...profile, ...overrides }} onSave={onSave} />)
  const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save profile changes' }))
  return { onSave, save }
}

describe('practice option helpers', () => {
  it('offers all 25 districts', () => expect(DISTRICTS).toHaveLength(25))

  it('parses stored choices, keeps unknown ones and joins them back', () => {
    expect(parseChoices('sinhala / English', ['Sinhala', 'English', 'Tamil'])).toEqual(['Sinhala', 'English'])
    expect(parseChoices('InPerson,Video', ['In-person'], { inperson: 'In-person' })).toEqual(['In-person', 'Video'])
    expect(parseChoices(null, ['Sinhala'])).toEqual([])
    expect(joinChoices(['Sinhala', 'Tamil'])).toBe('Sinhala, Tamil')
    expect(joinChoices([])).toBeNull()
  })

  it('accepts Sri Lankan mobile and landline numbers only', () => {
    for (const ok of ['', '0771234567', '+94771234567', '011 234 5678', '+94 (11) 234-5678']) expect(phoneProblem(ok)).toBeNull()
    for (const bad of ['12345', '077123456', '+1 555 010 0000', 'call me']) expect(phoneProblem(bad)).not.toBeNull()
  })
})

describe('PracticeProfileForm', () => {
  it('saves an untouched profile without losing any saved value', async () => {
    const { onSave, save } = setup()
    save()
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      specialty: 'General Practice', clinic: 'Synthetic Family Clinic', district: 'Gampaha', city: 'Negombo', languages: 'Sinhala, English',
      consultationModes: 'In-person, Video', phoneNumber: '0771234567', slotMinutes: 30, acceptingNewFamilies: true,
    }))
  })

  it('selects any combination of languages and never pre-selects one', async () => {
    const { onSave, save } = setup({ languages: null })
    const trigger = screen.getByRole('button', { name: /Languages spoken/ })
    expect(trigger).toHaveTextContent('Select languages')
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tamil' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sinhala' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'English' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Sinhala' }))
    save()
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ languages: 'Tamil, English' })))
  })

  it('offers only in-person, and keeps a saved unsupported mode until it is removed', async () => {
    const { onSave, save } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Consultation modes/ }))
    const modes = screen.getByRole('group', { name: 'Consultation modes' })
    expect(within(modes).getAllByRole('checkbox')).toHaveLength(1)
    expect(within(modes).getByRole('checkbox', { name: 'In-person' })).toBeChecked()
    expect(screen.getByText(/saved earlier/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove Video' }))
    save()
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ consultationModes: 'In-person' })))
  })

  it('clears the city when the district changes and lists the new district', async () => {
    const { onSave, save } = setup()
    const city = screen.getByRole('combobox', { name: 'City' })
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Kandy' } })
    expect(city).toHaveValue('')
    expect(screen.getByRole('status')).toHaveTextContent('City cleared because the district changed')

    fireEvent.click(city)
    expect(screen.queryByRole('option', { name: 'Negombo' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Peradeniya' }))
    save()
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ district: 'Kandy', city: 'Peradeniya', specialty: 'General Practice' })))
  })

  it('accepts a city and a clinic that are not listed', async () => {
    const { onSave, save } = setup()
    fireEvent.change(screen.getByRole('combobox', { name: 'City' }), { target: { value: 'Synthetic Town' } })
    fireEvent.click(screen.getByRole('option', { name: /City not listed — use: “Synthetic Town”/ }))
    const clinic = screen.getByRole('combobox', { name: 'Hospital / Clinic' })
    fireEvent.change(clinic, { target: { value: 'Synthetic New Clinic' } })
    fireEvent.blur(clinic)
    save()
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ city: 'Synthetic Town', clinic: 'Synthetic New Clinic' })))
  })

  it('searches specialties with the keyboard and rejects text that is not an option', async () => {
    const { onSave, save } = setup()
    const specialty = screen.getByRole('combobox', { name: 'Specialty' })
    fireEvent.change(specialty, { target: { value: 'not a specialty' } })
    expect(screen.getByText('No matches.')).toBeInTheDocument()
    fireEvent.blur(specialty)
    expect(specialty).toHaveValue('General Practice')

    fireEvent.change(specialty, { target: { value: 'derm' } })
    fireEvent.keyDown(specialty, { key: 'Enter' })
    expect(specialty).toHaveValue('Dermatology')
    save()
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ specialty: 'Dermatology' })))
  })

  it('blocks an invalid phone number before calling the API', () => {
    const { onSave, save } = setup()
    fireEvent.change(screen.getByLabelText('Professional phone'), { target: { value: '12345' } })
    save()
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a Sri Lankan phone number')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows the switch state as text and a saving state while the request runs', async () => {
    let finish = () => {}
    const onSave = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    render(<PracticeProfileForm profile={profile} onSave={onSave} />)
    expect(screen.getByText('On')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Accepting new families' }))
    expect(screen.getByText('Off')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save profile changes' }))
    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    finish()
    expect(await screen.findByRole('button', { name: 'Save profile changes' })).toBeEnabled()
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ acceptingNewFamilies: false }))
  })
})
