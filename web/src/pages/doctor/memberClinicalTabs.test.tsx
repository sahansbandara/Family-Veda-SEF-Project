import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../services/apiClient', () => ({ apiClient: mocks }))

import { LabsTab } from './memberClinicalTabs'

it('clears an open original preview when the workspace member changes', () => {
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:synthetic'), revokeObjectURL: vi.fn() })
  mocks.get.mockResolvedValue({ data: new Blob(['synthetic'], { type: 'image/png' }) })
  const reports = [{ id: 'report-a', fileName: 'Synthetic original', hasOriginalFile: true, values: [] }]
  const view = render(<LabsTab memberId="member-a" labReports={reports} />)
  fireEvent.click(screen.getByRole('button', { name: 'View original report' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  view.rerender(<LabsTab memberId="member-b" labReports={reports} />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
