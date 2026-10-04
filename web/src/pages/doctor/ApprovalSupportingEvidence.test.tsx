import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ApprovalSupportingEvidence } from './ApprovalSupportingEvidence'
const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))
beforeEach(() => mocks.get.mockReset())
it('shows the latest value with its backend range status, and report values on request', async () => {
  mocks.get.mockResolvedValue({ data: { clinicalAccess: true, ageYears: 42, vitals: [
    { vitalType: 'heart_rate', value: 104, unit: 'bpm', measuredAt: '2026-10-03T08:00:00Z', referenceLow: 60, referenceHigh: 100, rangeStatus: 'AboveRange', trend: 'Rising' },
    { vitalType: 'heart_rate', value: 75, unit: 'bpm', measuredAt: '2026-10-02T08:00:00Z', referenceLow: 60, referenceHigh: 100, rangeStatus: 'WithinRange', trend: 'NotEnoughReadings' },
    { vitalType: 'weight', value: 74.5, unit: 'kg', measuredAt: '2026-10-03T08:00:00Z' },
  ], vitalReferences: [{ vitalType: 'heart_rate', label: 'Heart rate (resting)', unit: 'bpm', low: 60, high: 100, ageBand: '18+ years', source: 'Synthetic source' }],
  labReports: [{ id: 'synthetic-report', fileName: 'Synthetic report.pdf', values: [{ analyte: 'Synthetic analyte', value: 4, unit: 'units', rangeStatus: 'RangeUnavailable' }] }] } })
  render(<ApprovalSupportingEvidence memberId="synthetic-member" />)
  const heart = await screen.findByRole('button', { name: /Heart rate/ })
  expect(within(heart).getByText('104')).toBeInTheDocument()
  expect(within(heart).getByText('Above reference range')).toBeInTheDocument()
  expect(within(heart).getByText('Above reference range').closest('.approval-chip')).toHaveClass('approval-chip--high')
  expect(heart.querySelector('.approval-vital__icon--heart')).not.toBeNull()
  expect(within(heart).getByText('Reference 60 – 100 bpm')).toBeInTheDocument()
  expect(within(heart).getByText('Rising')).toBeInTheDocument()
  expect(screen.queryByText('75')).not.toBeInTheDocument()
  // Weight never gets an invented range.
  expect(within(screen.getByRole('button', { name: /Weight/ })).getByText('No reference range')).toBeInTheDocument()

  fireEvent.click(heart)
  const history = screen.getByRole('region', { name: 'Heart rate history' })
  expect(within(history).getByText(/\+29 bpm across 2 readings/)).toBeInTheDocument()
  expect(within(history).getByText('75 bpm')).toBeInTheDocument()

  expect(screen.getByText('Reference ranges for age 42')).toBeInTheDocument()
  expect(screen.getByText('Source: Synthetic source')).toBeInTheDocument()

  expect(screen.getByText('Synthetic report.pdf')).toBeInTheDocument()
  expect(screen.queryByText('Synthetic analyte')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '1 confirmed value' }))
  expect(screen.getByText('Synthetic analyte')).toBeInTheDocument()
  expect(screen.getByText('4 units')).toBeInTheDocument()
})
it('shows no reference table rows when none are configured for the age', async () => {
  mocks.get.mockResolvedValue({ data: { clinicalAccess: true, ageYears: 9, vitalReferences: [], labReports: [], vitals: [
    { vitalType: 'heart_rate', value: 96, unit: 'bpm', measuredAt: '2026-10-03T08:00:00Z', rangeStatus: 'RangeUnavailable', trend: 'NotEnoughReadings' },
  ] } })
  render(<ApprovalSupportingEvidence memberId="synthetic-minor" />)
  const heart = await screen.findByRole('button', { name: /Heart rate/ })
  expect(within(heart).getByText('No reference range')).toBeInTheDocument()
  expect(screen.getByText(/No reference intervals are configured for this age/)).toBeInTheDocument()
})
it('distinguishes restricted records from empty records and allows failure retry', async () => {
  mocks.get.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce({ data: { clinicalAccess: true, vitals: [], labReports: null } })
  render(<ApprovalSupportingEvidence memberId="synthetic-member" />)
  await screen.findAllByText(/Records could not be loaded/)
  fireEvent.click(screen.getAllByRole('button', { name: 'Retry supporting evidence' })[0])
  expect(await screen.findByText(/No vitals are recorded/)).toBeInTheDocument()
  expect(screen.getByText(/current grant or consent/)).toBeInTheDocument()
})
it('does not show stale records after changing the selected member', async () => {
  let resolve!: (value: unknown) => void
  mocks.get.mockReturnValueOnce(new Promise((done) => { resolve = done })).mockResolvedValueOnce({ data: { clinicalAccess: true, vitals: [], labReports: [] } })
  const view = render(<ApprovalSupportingEvidence memberId="synthetic-a" />)
  view.rerender(<ApprovalSupportingEvidence memberId="synthetic-b" />)
  await screen.findByText(/No supporting reports/)
  await act(async () => resolve({ data: { clinicalAccess: true, vitals: [], labReports: [{ id: 'old', fileName: 'Stale synthetic report', values: [] }] } }))
  expect(within(view.container).queryByText('Stale synthetic report')).not.toBeInTheDocument()
})

it('loads an available original only after the doctor opens it and aborts it on member change', async () => {
  let resolveFile!: (value: { data: Blob }) => void
  const file = new Promise<{ data: Blob }>((resolve) => { resolveFile = resolve })
  mocks.get
    .mockResolvedValueOnce({ data: { clinicalAccess: true, vitals: [], labReports: [{ id: 'report-a', fileName: 'Synthetic original', hasOriginalFile: true, values: [] }] } })
    .mockReturnValueOnce(file)
    .mockResolvedValue({ data: { clinicalAccess: true, vitals: [], labReports: [] } })
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:synthetic'), revokeObjectURL: vi.fn() })

  const view = render(<ApprovalSupportingEvidence memberId="synthetic-a" />)
  await screen.findByText('Synthetic original')
  expect(mocks.get).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Preview Synthetic original' }))
  expect(mocks.get).toHaveBeenLastCalledWith('/doctors/me/members/synthetic-a/lab-reports/report-a/file', expect.objectContaining({ responseType: 'blob' }))
  const signal = mocks.get.mock.calls[1][1].signal as AbortSignal
  view.rerender(<ApprovalSupportingEvidence memberId="synthetic-b" />)
  expect(signal.aborted).toBe(true)
  await act(async () => resolveFile({ data: new Blob(['synthetic'], { type: 'image/png' }) }))
  expect(within(view.container).queryByRole('dialog')).not.toBeInTheDocument()
})

it('traps focus in a native preview dialog, closes with Escape, and clears on case change', async () => {
  mocks.get.mockResolvedValue({ data: { clinicalAccess: true, vitals: [], labReports: [{ id: 'report-a', fileName: 'Synthetic original', hasOriginalFile: true, values: [] }] } })
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:synthetic'), revokeObjectURL: vi.fn() })
  const view = render(<ApprovalSupportingEvidence memberId="synthetic-member" caseId="case-a" />)
  const opener = await screen.findByRole('button', { name: 'Preview Synthetic original' })
  opener.focus()
  fireEvent.click(opener)
  const dialog = screen.getByRole('dialog', { name: 'Original report preview' })
  expect(dialog.tagName).toBe('DIALOG')
  expect(screen.getByRole('button', { name: 'Close preview' })).toHaveFocus()
  fireEvent(dialog, new Event('cancel', { cancelable: true }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(opener).toHaveFocus()

  fireEvent.click(opener)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  view.rerender(<ApprovalSupportingEvidence memberId="synthetic-member" caseId="case-b" />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
