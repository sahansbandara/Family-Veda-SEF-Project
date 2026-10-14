import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: api }))
vi.mock('./ReportThumbnail', () => ({ ReportThumbnail: () => <span>Report preview</span> }))
import { DeletedReports } from './DeletedReports'
import { ReportLibrary } from './ReportLibrary'

const removable = { id: 'synthetic-junk', memberId: 'synthetic-member', originalFileName: 'synthetic-junk.pdf', contentType: 'application/pdf', ocrStatus: 'Failed', deletedAt: '2026-10-05T03:30:00Z', canDeletePermanently: true }
const held = { ...removable, id: 'synthetic-held', originalFileName: 'synthetic-held.png', canDeletePermanently: false }

function trash(onRestored = vi.fn(), onMessage = vi.fn()) {
  render(<DeletedReports memberId="synthetic-member" ownerName="Synthetic Member" refreshKey={0} onRestored={onRestored} onMessage={onMessage} />)
  return { onRestored, onMessage }
}

describe('Recently deleted reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [removable, held] })
    api.post.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: '' })
  })

  it('stays out of the way when nothing is deleted or the profile is not manageable', async () => {
    api.get.mockRejectedValue(new Error('Synthetic 404'))
    const { container } = render(<DeletedReports memberId="synthetic-member" ownerName="Synthetic Member" refreshKey={0} onRestored={vi.fn()} onMessage={vi.fn()} />)
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/members/synthetic-member/lab-reports/deleted'))
    expect(container).toBeEmptyDOMElement()
  })

  it('restores a report and tells the page to reload the library', async () => {
    const { onRestored } = trash()
    fireEvent.click(await screen.findByRole('button', { name: /Recently deleted \(2\)/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Restore synthetic-junk.pdf' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/lab-reports/synthetic-junk/restore'))
    await waitFor(() => expect(onRestored).toHaveBeenCalled())
    expect(api.delete).not.toHaveBeenCalled()
  })

  it('deletes permanently only after a second confirmation', async () => {
    trash()
    fireEvent.click(await screen.findByRole('button', { name: /Recently deleted/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete synthetic-junk.pdf permanently' }))
    expect(api.delete).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/lab-reports/synthetic-junk/permanent'))
  })

  it('does not offer permanent deletion for a report the server is holding, and shows the server reason on refusal', async () => {
    api.delete.mockRejectedValue({ response: { data: { detail: 'Synthetic refusal reason.' } } })
    const { onMessage } = trash()
    fireEvent.click(await screen.findByRole('button', { name: /Recently deleted/ }))
    expect(screen.getByRole('button', { name: 'Delete synthetic-held.png permanently' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restore synthetic-held.png' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Delete synthetic-junk.pdf permanently' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete permanently' }))
    await waitFor(() => expect(onMessage).toHaveBeenCalledWith('Synthetic refusal reason.'))
  })
})

describe('ReportLibrary delete action', () => {
  const report = { id: 'synthetic-live', memberId: 'synthetic-member', originalFileName: 'synthetic-live.png', ocrStatus: 'Failed', hasOriginalFile: true }

  it('offers Delete in list and grid only when the page allows it', () => {
    const onDelete = vi.fn()
    const { rerender } = render(<ReportLibrary reports={[report]} ownerName="Synthetic Member" canChangeSharing={false} onViewOriginal={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete synthetic-live.png' }))
    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete synthetic-live.png' }))
    expect(onDelete).toHaveBeenCalledTimes(2)
    rerender(<ReportLibrary reports={[report]} ownerName="Synthetic Member" canChangeSharing={false} onViewOriginal={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Delete synthetic-live.png' })).not.toBeInTheDocument()
  })
})
