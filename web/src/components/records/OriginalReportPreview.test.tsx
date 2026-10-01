import '@testing-library/jest-dom/vitest'

import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))

import { OriginalReportPreview } from './OriginalReportPreview'

describe('OriginalReportPreview', () => {
  beforeEach(() => mocks.get.mockReset())
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('loads the protected image as a blob and offers the original download', async () => {
    mocks.get.mockResolvedValue({ data: new Blob(['synthetic'], { type: 'image/png' }) })
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:synthetic'), revokeObjectURL: vi.fn() })
    render(<OriginalReportPreview reportId="report-1" originalFileName="synthetic.png" hasOriginalFile />)

    expect(screen.getByText('Loading original image…')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'Original report image: synthetic.png' })).toHaveAttribute('src', 'blob:synthetic')
    expect(mocks.get).toHaveBeenCalledWith('/lab-reports/report-1/file', expect.objectContaining({ responseType: 'blob' }))
    expect(screen.getByRole('link', { name: 'Download original image' })).toHaveAttribute('download', 'synthetic.png')
  })

  it('shows unavailable without requesting a missing original', () => {
    render(<OriginalReportPreview reportId="report-2" originalFileName="missing.png" hasOriginalFile={false} />)
    expect(screen.getByText('Original image unavailable.')).toBeInTheDocument()
    expect(mocks.get).not.toHaveBeenCalled()
  })

  it('aborts a stale report request and ignores its late response', async () => {
    let resolveFirst!: (value: { data: Blob }) => void
    const first = new Promise<{ data: Blob }>((resolve) => { resolveFirst = resolve })
    mocks.get
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce({ data: new Blob(['second'], { type: 'image/png' }) })
    const createObjectURL = vi.fn(() => 'blob:second')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const view = render(<OriginalReportPreview reportId="report-1" originalFileName="first.png" hasOriginalFile />)
    const firstSignal = mocks.get.mock.calls[0][1].signal as AbortSignal
    view.rerender(<OriginalReportPreview reportId="report-2" originalFileName="second.png" hasOriginalFile />)

    expect(firstSignal.aborted).toBe(true)
    expect(await screen.findByRole('img', { name: 'Original report image: second.png' })).toHaveAttribute('src', 'blob:second')
    await act(async () => {
      resolveFirst({ data: new Blob(['first'], { type: 'image/png' }) })
      await first
    })
    expect(createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('revokes the ready object URL when the report changes', async () => {
    mocks.get.mockResolvedValue({ data: new Blob(['synthetic'], { type: 'image/png' }) })
    const createObjectURL = vi.fn(() => 'blob:first')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const view = render(<OriginalReportPreview reportId="report-1" originalFileName="first.png" hasOriginalFile />)
    await screen.findByRole('img', { name: 'Original report image: first.png' })
    view.rerender(<OriginalReportPreview reportId="report-2" originalFileName="second.png" hasOriginalFile={false} />)

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first')
    expect(screen.getByText('Original image unavailable.')).toBeInTheDocument()
  })

})
