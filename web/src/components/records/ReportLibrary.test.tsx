import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LabReportDto } from '../../services/apiClient'

vi.mock('./ReportThumbnail', () => ({ ReportThumbnail: () => <span>Report preview</span> }))
import { ReportLibrary } from './ReportLibrary'

const reports: LabReportDto[] = [
  { id: 'synthetic-private', memberId: 'synthetic-member', originalFileName: 'synthetic-private.png', ocrStatus: 'Completed', hasOriginalFile: true, sharedWithFamilyHead: false, collectedAt: '2026-10-01T00:00:00Z' },
  { id: 'synthetic-shared', memberId: 'synthetic-member', originalFileName: 'synthetic-shared.pdf', ocrStatus: 'Failed', hasOriginalFile: true, sharedWithFamilyHead: true, collectedAt: '2026-10-02T00:00:00Z' },
]

describe('ReportLibrary controls', () => {
  it('combines filename search and privacy filtering without fetching another profile', () => {
    render(<ReportLibrary reports={reports} ownerName="Synthetic Member" canChangeSharing={false} onViewOriginal={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Report visibility'), { target: { value: 'private' } })
    expect(screen.getByText('synthetic-private.png')).toBeInTheDocument()
    expect(screen.queryByText('synthetic-shared.pdf')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search reports'), { target: { value: 'shared' } })
    expect(screen.queryByText('synthetic-private.png')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Report visibility'), { target: { value: 'all' } })
    expect(screen.getByText('synthetic-shared.pdf')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Share with Family Head' })).not.toBeInTheDocument()
  })

  it('sorts actual collected dates without mutating the supplied report list', () => {
    render(<ReportLibrary reports={reports} ownerName="Synthetic Member" canChangeSharing={false} onViewOriginal={vi.fn()} />)
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Lab report synthetic-shared.pdf')
    fireEvent.change(screen.getByLabelText('Sort reports'), { target: { value: 'oldest' } })
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Lab report synthetic-private.png')
    expect(reports[0].id).toBe('synthetic-private')
  })

  it('preserves report actions through list/grid changes, including failed extraction originals', () => {
    const onViewOriginal = vi.fn()
    render(<ReportLibrary reports={[reports[1]]} ownerName="Synthetic Member" canChangeSharing={false} onViewOriginal={onViewOriginal} />)
    fireEvent.click(screen.getByRole('button', { name: 'List view' }))
    fireEvent.click(screen.getByRole('button', { name: 'View original report' }))
    expect(onViewOriginal).toHaveBeenCalledWith(reports[1])
    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }))
    expect(screen.getByText('synthetic-shared.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true')
  })
})
