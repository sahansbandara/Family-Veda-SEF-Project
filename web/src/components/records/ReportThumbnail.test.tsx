import '@testing-library/jest-dom/vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))
vi.mock('./PdfReportCanvas', () => ({ PdfReportCanvas: ({ url, label, thumbnail }: { url: string; label: string; thumbnail?: boolean }) => <canvas aria-label={label} data-source={url} data-thumbnail={String(thumbnail)} /> }))
import { ReportThumbnail } from './ReportThumbnail'

let observe: IntersectionObserverCallback
let disconnect: ReturnType<typeof vi.fn>
const createObjectURL = vi.fn(() => 'blob:synthetic-preview')
const revokeObjectURL = vi.fn()

async function makeVisible() {
  await act(async () => observe([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
}

describe('ReportThumbnail secure lifecycle', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
    disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { observe = callback }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = disconnect
    })
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = revokeObjectURL
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('requests protected bytes lazily, then revokes the preview and aborts on unmount', async () => {
    mocks.get.mockResolvedValue({ data: new Blob(['synthetic'], { type: 'image/png' }) })
    const view = render(<ReportThumbnail reportId="synthetic-report" originalFileName="synthetic.png" hasOriginalFile />)
    expect(mocks.get).not.toHaveBeenCalled()
    await makeVisible()
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1))
    expect(mocks.get).toHaveBeenCalledWith('/lab-reports/synthetic-report/file', expect.objectContaining({ responseType: 'blob', signal: expect.any(AbortSignal) }))
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:synthetic-preview')
    const config = mocks.get.mock.calls[0][1] as { signal: AbortSignal }
    view.unmount()
    expect(config.signal.aborted).toBe(true)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-preview')
  })

  it('does not create an object URL when a late response arrives after unmount', async () => {
    let finish!: (result: { data: Blob }) => void
    mocks.get.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    const view = render(<ReportThumbnail reportId="synthetic-report" originalFileName="synthetic.png" hasOriginalFile />)
    await makeVisible()
    view.unmount()
    await act(async () => finish({ data: new Blob(['synthetic'], { type: 'image/png' }) }))
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('never fetches an unavailable original', async () => {
    render(<ReportThumbnail reportId="synthetic-missing" originalFileName="synthetic.pdf" hasOriginalFile={false} />)
    expect(mocks.get).not.toHaveBeenCalled()
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('rejects non-document response types rather than embedding arbitrary content', async () => {
    mocks.get.mockResolvedValue({ data: new Blob(['synthetic'], { type: 'text/html' }) })
    render(<ReportThumbnail reportId="synthetic-invalid" originalFileName="synthetic.png" hasOriginalFile />)
    await makeVisible()
    expect(await screen.findByText('Open report to retry preview')).toBeInTheDocument()
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('aborts the old profile request and prevents its late response replacing the current report', async () => {
    let finishOld!: (result: { data: Blob }) => void
    mocks.get.mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve }))
      .mockResolvedValueOnce({ data: new Blob(['current synthetic'], { type: 'image/png' }) })
    const view = render(<ReportThumbnail reportId="synthetic-old" originalFileName="synthetic-old.png" hasOriginalFile />)
    await makeVisible()
    const oldSignal = (mocks.get.mock.calls[0][1] as { signal: AbortSignal }).signal
    view.rerender(<ReportThumbnail reportId="synthetic-current" originalFileName="synthetic-current.png" hasOriginalFile />)
    await waitFor(() => expect(screen.getByRole('img')).toHaveAccessibleName('Report thumbnail: synthetic-current.png'))
    expect(oldSignal.aborted).toBe(true)
    await act(async () => finishOld({ data: new Blob(['stale synthetic'], { type: 'image/png' }) }))
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('img')).toHaveAccessibleName('Report thumbnail: synthetic-current.png')
    view.unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-preview')
  })

  it('passes private PDF bytes to the first-page canvas renderer', async () => {
    mocks.get.mockResolvedValue({ data: new Blob(['synthetic PDF'], { type: 'application/pdf' }) })
    render(<ReportThumbnail reportId="synthetic-pdf" originalFileName="synthetic.pdf" hasOriginalFile />)
    await makeVisible()
    const preview = await screen.findByLabelText('First page of synthetic.pdf')
    expect(preview).toHaveAttribute('data-source', 'blob:synthetic-preview')
    expect(preview).toHaveAttribute('data-thumbnail', 'true')
  })
})
