// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./ApprovalSupportingEvidence', () => ({ ApprovalSupportingEvidence: () => <div>Supporting evidence</div> }))

import type { CaseReviewDto } from '../../services/apiClient'
import { ApprovalEvidenceTabs } from './ApprovalEvidenceTabs'
import { caseInitials, shortRef } from './approvalReview'

const trace = (stepNumber: number, agent: string) => ({
  stepNumber, agent, status: 'Completed', toolsRequested: [], toolsAllowed: [], toolsDenied: [],
  confidence: 0.9, latencyMilliseconds: 120, outputSchemaValid: true,
})

const review: CaseReviewDto = {
  id: 'synthetic-case-01',
  memberId: 'synthetic-member-01',
  status: 'PendingDoctorReview',
  priority: 'Routine',
  contextJson: '{"summary":"Synthetic context summary"}',
  analysisJson: '{"deviations":["Synthetic analysis finding"]}',
  familialRiskJson: '{"screeningIndication":"Synthetic screening note"}',
  draftAdvisoryJson: '{"summary":"Synthetic draft summary"}',
  traces: [trace(0, 'Coordinator'), trace(1, 'Context'), trace(2, 'Analysis'), trace(3, 'FamilialRisk'), trace(4, 'SafetyValidation')],
}

describe('case reference helpers', () => {
  it('shows the database case number as four digits', () => {
    expect(shortRef({ id: 'b94621d8-6407', caseNumber: 7 })).toBe('0007')
  })

  it('falls back to the id prefix when an older API sends no case number', () => {
    expect(shortRef({ id: 'b94621d8-6407' })).toBe('b94621d8')
  })

  it('uses patient initials only when a name was released', () => {
    expect(caseInitials({ id: 'b94621d8', caseNumber: 12, memberDisplayName: 'Synthetic Arun Screening' })).toBe('SS')
    expect(caseInitials({ id: 'b94621d8', caseNumber: 12 })).toBe('12')
  })
})

describe('AI analysis tab', () => {
  it('keeps every AI output off the clinical overview', () => {
    render(<ApprovalEvidenceTabs review={review} />)

    expect(screen.getByRole('heading', { name: /why this case needs review/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /ai findings/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /familial risk agent/i })).not.toBeInTheDocument()
  })

  it('shows the draft, the four agents and the trace together', () => {
    render(<ApprovalEvidenceTabs review={review} />)
    fireEvent.click(screen.getByRole('tab', { name: 'AI analysis' }))

    for (const name of [/ai findings — plain language/i, /context agent/i, /analysis agent/i, /familial risk agent/i, /safety validation agent/i, /technical audit trace/i]) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getByText('Synthetic context summary')).toBeInTheDocument()
    expect(screen.getByText(/every agent output matched its json schema/i)).toBeInTheDocument()
  })

  it('switches one agent between plain language and JSON without affecting the others', () => {
    render(<ApprovalEvidenceTabs review={review} />)
    fireEvent.click(screen.getByRole('tab', { name: 'AI analysis' }))
    const toggle = screen.getByRole('group', { name: 'Analysis agent view' })

    fireEvent.click(within(toggle).getByRole('button', { name: 'JSON' }))

    expect(screen.getByLabelText('Analysis agent raw JSON')).toHaveTextContent('"deviations"')
    expect(screen.queryByLabelText('Context agent raw JSON')).not.toBeInTheDocument()

    fireEvent.click(within(toggle).getByRole('button', { name: 'Plain language' }))
    expect(screen.queryByLabelText('Analysis agent raw JSON')).not.toBeInTheDocument()
    expect(screen.getByText('Synthetic analysis finding')).toBeInTheDocument()
  })
})
