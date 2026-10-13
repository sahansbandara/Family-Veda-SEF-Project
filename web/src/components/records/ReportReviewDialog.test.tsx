// Owner: S2 · Health Records & Extraction — synthetic report review regressions.
import '@testing-library/jest-dom/vitest'
import type { FormEvent } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LabReportDetailDto } from '../../services/apiClient'

// Protected-byte loading/rendering has its own OriginalReportPreview regressions.
vi.mock('./OriginalReportPreview', () => ({
  OriginalReportPreview: ({ originalFileName, onCheckReport, checkDisabled }: { originalFileName: string; onCheckReport?: () => void; checkDisabled?: boolean }) => (
    <><div role="img" aria-label={`Original report image: ${originalFileName}`} />{onCheckReport && <button onClick={onCheckReport} disabled={checkDisabled}>Viewer recheck</button>}</>
  ),
}))

import { ReportReviewDialog } from './ReportReviewDialog'

const report: LabReportDetailDto = {
  id: 'synthetic-report-review',
  memberId: 'synthetic-member-review',
  originalFileName: 'synthetic-review.png',
  ocrStatus: 'Completed',
  hasOriginalFile: true,
  values: [{
    id: 'synthetic-value-review',
    analyte: 'Synthetic analyte',
    value: 12,
    unit: 'unit',
    referenceLow: 10,
    referenceHigh: 20,
    wasManuallyConfirmed: false,
  }],
  flags: [],
}

function renderReview(overrides: Partial<Parameters<typeof ReportReviewDialog>[0]> = {}) {
  const onClose = vi.fn()
  const onRetry = vi.fn()
  const onSubmit = vi.fn(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    return false
  })
  const props = {
    report,
    hasOriginalFile: true,
    loading: false,
    error: '',
    title: 'Check extracted values',
    onClose,
    onRetry,
    onSubmit,
    ...overrides,
  }
  return { ...render(<ReportReviewDialog {...props} />), props }
}

describe('ReportReviewDialog', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses an icon close button and confirms removal before changing the draft', () => {
    renderReview()
    expect(screen.getByRole('button', { name: 'Close report review' })).toHaveTextContent('')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: 'Delete value Synthetic analyte' }))
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure'))
    expect(screen.getByDisplayValue('Synthetic analyte')).toBeInTheDocument()
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Delete value Synthetic analyte' }))
    expect(screen.queryByDisplayValue('Synthetic analyte')).not.toBeInTheDocument()
    expect(document.querySelector('input[name=deletedValueIds]')).toHaveValue('synthetic-value-review')
    expect(screen.getByRole('button', { name: 'Confirm values' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo removals (1)' }))
    expect(screen.getByDisplayValue('Synthetic analyte')).toBeInTheDocument()
    expect(document.querySelector('input[name=deletedValueIds]')).toBeNull()
  })

  it('adds missing fields and preserves them when saving fails', async () => {
    let form: FormData | undefined
    renderReview({ onSubmit: async (event) => { event.preventDefault(); form = new FormData(event.currentTarget); return false } })
    fireEvent.click(screen.getByRole('button', { name: 'Add value' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Test name' }), { target: { value: 'Synthetic missed field' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Value Synthetic missed field' }), { target: { value: '5' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Unit Synthetic missed field' }), { target: { value: 'unit' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Confirm values' }).closest('form')!)
    await screen.findByText('Values could not be saved. Your edits are still here. Please retry.')
    expect(form?.getAll('valueIds')).toHaveLength(2)
    expect(screen.getByDisplayValue('Synthetic missed field')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close report review' }))
    expect(screen.getByRole('button', { name: 'Leave without confirming' })).toBeInTheDocument()
  })
  it('opens a named modal containing the original and editable extracted values', () => {
    renderReview()
    expect(screen.getByRole('dialog', { name: 'Check extracted values' })).toHaveAttribute('open')
    expect(screen.getAllByRole('img', { name: 'Original report image: synthetic-review.png' })).toHaveLength(1)
    expect(screen.getByDisplayValue('Synthetic analyte')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12')).toHaveAttribute('type', 'number')
    expect(screen.getByRole('button', { name: 'Confirm values' })).toBeInTheDocument()
  })

  it('keeps an unconfirmed review open until leaving is explicitly chosen', () => {
    const { props } = renderReview()
    fireEvent.click(screen.getByRole('button', { name: /^Close/i }))
    expect(props.onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep reviewing' }))
    expect(screen.queryByRole('button', { name: 'Leave without confirming' })).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Synthetic analyte')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Close/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Leave without confirming' }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('prevents the native Escape cancellation and applies the same unfinished-review warning', () => {
    const { props } = renderReview()
    const cancel = new Event('cancel', { bubbles: false, cancelable: true })
    fireEvent(screen.getByRole('dialog'), cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(props.onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Keep reviewing' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
  })

  it('applies the unfinished-review warning to a backdrop click', () => {
    const { props } = renderReview()
    fireEvent.click(screen.getByRole('dialog'))
    expect(props.onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Leave without confirming' })).toBeInTheDocument()
  })

  it('retains edited values and the close guard after an unsuccessful confirmation', async () => {
    const { props } = renderReview()
    const analyte = screen.getByDisplayValue('Synthetic analyte')
    fireEvent.change(analyte, { target: { value: 'Edited synthetic analyte' } })
    fireEvent.submit(analyte.closest('form')!)
    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/Values could not be saved.*Your edits are still here/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Edited synthetic analyte')).toBeInTheDocument()
    expect(props.onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^Close/i }))
    expect(screen.getByRole('button', { name: 'Keep reviewing' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keep reviewing' }))
    expect(screen.getByDisplayValue('Edited synthetic analyte')).toBeInTheDocument()
  })

  it('closes an already confirmed unchanged report without warning', () => {
    const confirmed = { ...report, values: report.values.map((value) => ({ ...value, wasManuallyConfirmed: true })) }
    const { props } = renderReview({ report: confirmed })
    fireEvent.click(screen.getByRole('button', { name: /^Close/i }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Leave without confirming' })).not.toBeInTheDocument()
  })

  it('prevents duplicate confirmations and dismissal while a save is pending', async () => {
    let finishSave!: (saved: boolean) => void
    const pendingSave = new Promise<boolean>((resolve) => { finishSave = resolve })
    const onSubmit = vi.fn(() => pendingSave)
    const { props } = renderReview({ onSubmit })
    const form = screen.getByDisplayValue('Synthetic analyte').closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /^Close/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Confirm|Saving/i })).toBeDisabled()
    const cancel = new Event('cancel', { bubbles: false, cancelable: true })
    fireEvent(screen.getByRole('dialog'), cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(props.onClose).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Leave without confirming' })).not.toBeInTheDocument()
    await act(async () => { finishSave(false); await pendingSave })
    expect(screen.getByRole('button', { name: 'Confirm values' })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^Close/i })).toBeEnabled()
  })

  it('guards an edited confirmed report until the edited values are saved', () => {
    const confirmed = { ...report, values: report.values.map((value) => ({ ...value, wasManuallyConfirmed: true })) }
    const { props } = renderReview({ report: confirmed })
    fireEvent.change(screen.getByDisplayValue('Synthetic analyte'), { target: { value: 'Edited confirmed analyte' } })
    fireEvent.click(screen.getByRole('button', { name: /^Close/i }))
    expect(props.onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Keep reviewing' })).toBeInTheDocument()
  })

  it('shows a loading state without a confirmation form', () => {
    renderReview({ report: null, loading: true })
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm values' })).not.toBeInTheDocument()
  })

  it('offers retry when report details fail to load', () => {
    const { props } = renderReview({ report: null, error: 'Synthetic report could not be loaded.' })
    expect(screen.getByText('Synthetic report could not be loaded.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Retry|Try again/i }))
    expect(props.onRetry).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Confirm values' })).not.toBeInTheDocument()
  })
  it('shows why reading failed and retries without claiming success or confirming missing values', async () => {
    const onExtract = vi.fn().mockResolvedValue(false)
    renderReview({ report: { ...report, ocrStatus: 'Failed', ocrErrorCode: 'NO_VALUES_FOUND', values: [] }, onExtract })
    expect(screen.getByRole('alert')).toHaveTextContent('Why it could not be read: No test results found')
    expect(screen.queryByRole('button', { name: 'Confirm values' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Check report again' }))
    expect(onExtract).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/Reading could not be completed/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check report again' })).toBeEnabled()
  })

  it('rechecks completed unconfirmed values through the existing callback without confirming', async () => {
    const onExtract = vi.fn().mockResolvedValue(true)
    const { props } = renderReview({ onExtract })
    expect(screen.getByText(/enhanced reading passes/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Check report again' }))
    await waitFor(() => expect(onExtract).toHaveBeenCalledTimes(1))
    expect(props.onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/Review and confirm the results yourself/)).toBeInTheDocument()
  })

  it('protects unsaved edits by disabling rechecking until they are saved', () => {
    const onExtract = vi.fn()
    renderReview({ onExtract })
    fireEvent.change(screen.getByDisplayValue('Synthetic analyte'), { target: { value: 'Edited synthetic analyte' } })
    expect(screen.getByRole('button', { name: 'Check report again' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Viewer recheck' })).toBeDisabled()
    expect(screen.getByText('Save your edits before checking the report again.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Check report again' }))
    expect(onExtract).not.toHaveBeenCalled()
  })

  it('does not offer rechecking when any value has already been confirmed', () => {
    renderReview({ report: { ...report, values: [
      ...report.values,
      { ...report.values[0], id: 'synthetic-confirmed', wasManuallyConfirmed: true },
    ] }, onExtract: vi.fn() })
    expect(screen.queryByRole('button', { name: 'Check report again' })).not.toBeInTheDocument()
  })

  it('allows a failed recheck with retained drafts but hides rechecking while processing', () => {
    const onExtract = vi.fn()
    const { rerender, props } = renderReview({ report: { ...report, ocrStatus: 'Failed' }, onExtract })
    expect(screen.getByRole('button', { name: 'Check report again' })).toBeEnabled()
    rerender(<ReportReviewDialog {...props} report={{ ...report, ocrStatus: 'Processing' }} />)
    expect(screen.queryByRole('button', { name: 'Check report again' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh status' })).toBeInTheDocument()
  })

  it('offers to read a report that was never read', () => {
    const onExtract = vi.fn().mockResolvedValue(true)
    renderReview({ report: { ...report, ocrStatus: 'Pending', values: [] }, onExtract })
    fireEvent.click(screen.getByRole('button', { name: 'Read report now' }))
    expect(onExtract).toHaveBeenCalledTimes(1)
  })

  it('shows numbered progress and points confirmed values to doctor review, not AI output', () => {
    renderReview({ report: { ...report, values: report.values.map((value) => ({ ...value, wasManuallyConfirmed: true })) } })
    const steps = screen.getByRole('list', { name: 'Report progress' })
    expect(steps).toHaveTextContent(/Uploaded.*Reading text.*Values found.*You confirmed.*Doctor review/)
    expect(screen.getByRole('link', { name: 'Go to Symptoms & Triage' })).toHaveAttribute('href', '/triage')
    expect(screen.getByText(/you only see what your doctor approves/)).toBeInTheDocument()
  })

  it('keeps keyboard focus inside the leave warning', () => {
    renderReview()
    fireEvent.click(screen.getByRole('button', { name: /^Close/i }))
    const leave = screen.getByRole('button', { name: 'Leave without confirming' })
    const keep = screen.getByRole('button', { name: 'Keep reviewing' })
    leave.focus()
    fireEvent.keyDown(leave, { key: 'Tab' })
    expect(keep).toHaveFocus()
    fireEvent.keyDown(keep, { key: 'Tab', shiftKey: true })
    expect(leave).toHaveFocus()
  })

  it('rechecks from the viewer and switches to extracted values without confirmation', async () => {
    const onExtract = vi.fn(async () => true)
    renderReview({ onExtract })
    fireEvent.click(screen.getByRole('button', { name: 'Viewer recheck' }))
    await waitFor(() => expect(onExtract).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Confirm values' })).toBeInTheDocument()
  })
  it.each(['confirmed-value', 'confirmed-flag', 'processing'])('blocks viewer recheck for %s', (state) => {
    const onExtract = vi.fn(async () => true)
    renderReview({ onExtract, report: { ...report, ocrStatus: state === 'processing' ? 'Processing' : 'Completed', values: report.values.map((value) => ({ ...value, wasManuallyConfirmed: state === 'confirmed-value' })), flags: state === 'confirmed-flag' ? [{ id: 'synthetic-flag', memberId: report.memberId, conditionCode: 'SYNTHETIC', finding: 'Synthetic fixture', confidence: 1, manuallyConfirmed: true }] : [] } })
    expect(screen.getByRole('button', { name: 'Viewer recheck' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Viewer recheck' }))
    expect(onExtract).not.toHaveBeenCalled()
  })

})
