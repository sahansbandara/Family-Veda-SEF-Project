import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), destroy: vi.fn(), getPage: vi.fn(), render: vi.fn(), cancel: vi.fn() }))
vi.mock('pdfjs-dist', () => ({ getDocument: mocks.getDocument, GlobalWorkerOptions: {} }))
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/assets/self-hosted-pdf-worker.mjs' }))
import { PdfReportCanvas } from './PdfReportCanvas'

describe('PdfReportCanvas lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.destroy.mockResolvedValue(undefined)
    mocks.render.mockReturnValue({ promise: Promise.resolve(), cancel: mocks.cancel })
    mocks.getPage.mockResolvedValue({ getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }), render: mocks.render })
    mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage: mocks.getPage }), destroy: mocks.destroy })
  })

  it('renders protected bytes with XFA disabled and controls page navigation', async () => {
    const view = render(<PdfReportCanvas url="blob:synthetic-pdf" label="Synthetic report" />)
    expect(await screen.findByRole('img', { name: 'Synthetic report' })).toBeInTheDocument()
    expect(mocks.getDocument).toHaveBeenCalledWith({ url: 'blob:synthetic-pdf', enableXfa: false })
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(2))
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    view.unmount()
    expect(mocks.destroy).toHaveBeenCalledTimes(1)
    expect(mocks.cancel).toHaveBeenCalled()
  })

  it('cancels unfinished rendering and destroys the parser on unmount', async () => {
    mocks.render.mockReturnValue({ promise: new Promise(() => {}), cancel: mocks.cancel })
    const view = render(<PdfReportCanvas url="blob:synthetic-pdf" label="Synthetic report" thumbnail />)
    await waitFor(() => expect(mocks.render).toHaveBeenCalled())
    expect(screen.queryByRole('navigation', { name: 'PDF pages' })).not.toBeInTheDocument()
    view.unmount()
    expect(mocks.cancel).toHaveBeenCalledTimes(1)
    expect(mocks.destroy).toHaveBeenCalledTimes(1)
  })

  it('ignores a document loaded after its protected URL was replaced', async () => {
    let finishOld!: (document: object) => void
    const staleGetPage = vi.fn()
    mocks.getDocument.mockReturnValueOnce({ promise: new Promise((resolve) => { finishOld = resolve }), destroy: mocks.destroy })
    const view = render(<PdfReportCanvas url="blob:synthetic-old" label="Synthetic old" thumbnail />)
    view.rerender(<PdfReportCanvas url="blob:synthetic-current" label="Synthetic current" thumbnail />)
    await screen.findByRole('img', { name: 'Synthetic current' })
    await act(async () => finishOld({ numPages: 1, getPage: staleGetPage }))
    expect(staleGetPage).not.toHaveBeenCalled()
    expect(mocks.destroy).toHaveBeenCalledTimes(1)
  })

  it('shows a readable fallback when protected PDF parsing fails', async () => {
    mocks.getDocument.mockReturnValue({ promise: Promise.reject(new Error('Synthetic malformed PDF')), destroy: mocks.destroy })
    render(<PdfReportCanvas url="blob:synthetic-invalid" label="Synthetic invalid" thumbnail />)
    expect(await screen.findByText('Preview unavailable. Open or download the report to view it.')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Synthetic invalid' })).not.toBeInTheDocument()
  })
})
