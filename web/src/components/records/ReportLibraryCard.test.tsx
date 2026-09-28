import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ReportLibraryCard } from './ReportLibraryCard'
import type { LabReportDto } from '../../services/apiClient'

const report: LabReportDto = {
  id: 'synthetic-report-01',
  memberId: 'synthetic-member-01',
  originalFileName: 'synthetic-cbc.png',
  ocrStatus: 'Completed',
  collectedAt: '2026-08-01T00:00:00Z',
  sharedWithFamilyHead: false,
  hasOriginalFile: true,
  rangeSummary: { belowRange: 1, withinRange: 2, aboveRange: 0, rangeUnavailable: 1 },
}

describe('ReportLibraryCard', () => {
  it('shows owner, visibility, file state and range counts without interpretation', () => {
    render(<ReportLibraryCard report={report} ownerName="Synthetic Adult" canChangeSharing={false} />)
    expect(screen.getByText(/Synthetic Adult/)).toBeInTheDocument()
    expect(screen.getByText('Private from Family Head')).toBeInTheDocument()
    expect(screen.getByText('Stored')).toBeInTheDocument()
    expect(screen.getByText('1 below · 2 within · 0 above · 1 no range')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Share with Family Head/ })).not.toBeInTheDocument()
    expect(document.body.textContent ?? '').not.toMatch(/diagnos|abnormal|disease/i)
  })

  it('lets the owner toggle sharing', () => {
    const onToggle = vi.fn()
    render(<ReportLibraryCard report={report} ownerName="Synthetic Adult" canChangeSharing onToggleSharing={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'Share with Family Head' }))
    expect(onToggle).toHaveBeenCalledWith(report)
  })

  it('offers to make a shared report private again', () => {
    render(<ReportLibraryCard report={{ ...report, sharedWithFamilyHead: true }} ownerName="Synthetic Adult" canChangeSharing onToggleSharing={vi.fn()} />)
    expect(screen.getByText('Shared with Family Head')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep private from Family Head' })).toHaveAttribute('aria-pressed', 'true')
  })
})
