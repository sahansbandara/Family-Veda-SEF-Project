import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { VitalDto } from '../../services/apiClient'
import { VitalsPanel } from './VitalsPanel'

const vitals: VitalDto[] = [
  { id: 'h2', memberId: 'm', vitalType: 'heart_rate', value: 76, unit: 'bpm', measuredAt: '2026-09-02T08:00:00Z' },
  { id: 'h1', memberId: 'm', vitalType: 'heart_rate', value: 80, unit: 'bpm', measuredAt: '2026-09-01T08:00:00Z' },
  { id: 's1', memberId: 'm', vitalType: 'blood_pressure_systolic', value: 128, unit: 'mmHg', measuredAt: '2026-09-01T08:00:00Z' },
  { id: 'd1', memberId: 'm', vitalType: 'blood_pressure_diastolic', value: 82, unit: 'mmHg', measuredAt: '2026-09-01T08:00:00Z' },
]

describe('VitalsPanel', () => {
  it('shows the latest reading per vital and the full history without interpretation', () => {
    render(<VitalsPanel vitals={vitals} onAdd={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Heart Rate: 76 bpm/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Blood Pressure: 128\/82 mmHg/ })).toBeInTheDocument()
    // header row + two heart-rate readings + one paired blood-pressure reading
    expect(screen.getAllByRole('row')).toHaveLength(4)
    expect(screen.queryByText(/normal|abnormal|diagnos|high|low/i)).not.toBeInTheDocument()
  })

  it('filters the history by vital type', async () => {
    const user = userEvent.setup()
    render(<VitalsPanel vitals={vitals} onAdd={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText('Vital type'), 'pressure')
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(2)
    expect(within(rows[1]).getByText('128/82')).toBeInTheDocument()
  })

  it('records blood pressure as a systolic and a diastolic reading with one timestamp', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    render(<VitalsPanel vitals={[]} onAdd={onAdd} />)
    expect(screen.getByText('No vitals recorded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Blood Pressure/ }))
    await user.type(screen.getByLabelText('Systolic (mmHg)'), '120')
    await user.type(screen.getByLabelText('Diastolic (mmHg)'), '80')
    await user.click(screen.getByRole('button', { name: 'Save vital' }))
    expect(onAdd).toHaveBeenCalledWith(
      [
        { vitalType: 'blood_pressure_systolic', value: 120, unit: 'mmHg' },
        { vitalType: 'blood_pressure_diastolic', value: 80, unit: 'mmHg' },
      ],
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    )
    expect(screen.queryByRole('button', { name: 'Save vital' })).not.toBeInTheDocument()
  })

  it('opens the recorded readings for one vital', async () => {
    const user = userEvent.setup()
    render(<VitalsPanel vitals={vitals} onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Heart Rate: 76 bpm/ }))
    const dialog = screen.getByRole('dialog', { name: 'Heart Rate' })
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(2)
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
