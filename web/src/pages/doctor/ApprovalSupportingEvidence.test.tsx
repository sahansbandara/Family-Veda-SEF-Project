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
  expect(await screen.findByText(/No vitals have been recorded/)).toBeInTheDocument()
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
