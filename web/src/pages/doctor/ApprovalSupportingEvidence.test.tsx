import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ApprovalSupportingEvidence } from './ApprovalSupportingEvidence'
const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))
beforeEach(() => mocks.get.mockReset())
it('shows latest recorded values and only supplied report details', async () => {
  mocks.get.mockResolvedValue({ data: { clinicalAccess: true, vitals: [
    { vitalType: 'heart_rate', value: 80, unit: 'bpm', measuredAt: '2026-10-03T08:00:00Z' },
    { vitalType: 'heart_rate', value: 75, unit: 'bpm', measuredAt: '2026-10-02T08:00:00Z' },
  ], labReports: [{ id: 'synthetic-report', fileName: 'Synthetic report', values: [{ analyte: 'Synthetic analyte', value: 4, unit: 'units' }] }] } })
  render(<ApprovalSupportingEvidence memberId="synthetic-member" />)
  expect(await screen.findByText('heart rate')).toBeInTheDocument()
  expect(screen.getByText('80')).toBeInTheDocument()
  expect(screen.queryByText('75')).not.toBeInTheDocument()
  expect(screen.getByText('Synthetic report')).toBeInTheDocument()
  expect(screen.getByText(/Synthetic analyte: 4 units/)).toBeInTheDocument()
})
it('distinguishes restricted records from empty records and allows failure retry', async () => {
  mocks.get.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce({ data: { clinicalAccess: true, vitals: [], labReports: null } })
  render(<ApprovalSupportingEvidence memberId="synthetic-member" />)
  await screen.findAllByText(/Records could not be loaded/)
  fireEvent.click(screen.getAllByRole('button', { name: 'Retry supporting evidence' })[0])
  const emptyNotes = await screen.findAllByText('Not available')
  expect(emptyNotes).toHaveLength(4)
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
  fireEvent.click(screen.getByRole('button', { name: 'View original report' }))
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
  const opener = await screen.findByRole('button', { name: 'View original report' })
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
