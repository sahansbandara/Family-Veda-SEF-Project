// Owner: S3 · whole-project ownership waiver
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentPipeline } from './AgentPipeline'

const trace = { stepNumber: 1, agent: 'Context', status: 'Completed', toolsRequested: [], toolsAllowed: [], toolsDenied: [], confidence: 0.41, latencyMilliseconds: 10, outputSchemaValid: false, hasOutput: false, modelName: 'synthetic-demo' }

describe('agent pipeline evidence', () => {
  it('does not show a legacy demo trace as executed or give it confidence', () => {
    render(<AgentPipeline traces={[trace]} caseStatus="LowConfidence" />)
    expect(screen.getByText('Output unavailable')).toBeInTheDocument()
    expect(screen.queryByText('41%')).not.toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })
  it('labels deterministic safety and optional family no-data without confidence', () => {
    render(<AgentPipeline traces={[
      { ...trace, agent: 'SafetyValidation', hasOutput: true, modelName: 'deterministic', outputSchemaValid: true },
      { ...trace, stepNumber: 2, agent: 'FamilialRisk', status: 'NoData', modelName: 'synthetic-test' },
    ]} caseStatus="PendingDoctorReview" />)
    expect(screen.getByText('Deterministic — not applicable')).toBeInTheDocument()
    expect(screen.getByText('Not applicable — no family-history data')).toBeInTheDocument()
    expect(screen.queryByText('41%')).not.toBeInTheDocument()
  })
})
