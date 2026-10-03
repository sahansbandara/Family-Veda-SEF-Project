import { describe, expect, it } from 'vitest'
import type { CaseReviewDto } from '../../services/apiClient'
import { reviewReasons } from './approvalReview'
const base: CaseReviewDto = { id: 'synthetic-case', memberId: 'synthetic-member', status: 'PendingDoctorReview', priority: 'Routine', draftAdvisoryJson: '{}', traces: [] }
describe('case-specific review reasons', () => {
  it('shows the submitted symptoms and duration for a routine case', () => {
    const reasons = reviewReasons({ ...base, submittedEpisode: { id: 'episode', memberId: base.memberId, symptoms: ['Synthetic_symptom_A', 'Synthetic symptom B'], durationDays: 2, severity: 4, createdAt: '2026-10-03' } })
    expect(reasons).toContain('Submitted symptoms: Synthetic symptom A, Synthetic symptom B. Reported duration: 2 days. This submitted episode requires clinician review.')
  })
  it('shows a clear fallback when case-specific information is missing', () => {
    expect(reviewReasons(base)).toContain('Specific review findings are unavailable; review the submitted information during clinical assessment.')
  })
  it('quotes existing analysis review findings without turning them into a diagnosis', () => {
    expect(reviewReasons({ ...base, analysisJson: JSON.stringify({ Deviations: ['Synthetic observation requires confirmation'], Confidence: 0.8 }) })).toContain('AI draft finding for clinician review: Synthetic observation requires confirmation')
  })
  it('keeps malformed analysis out of clinical reasons', () => {
    expect(reviewReasons({ ...base, analysisJson: '{broken' }).join(' ')).not.toContain('{broken')
  })
  it('preserves low-confidence, priority and approval-gate reasons', () => {
    const reasons = reviewReasons({ ...base, status: 'LowConfidence', priority: 'Priority' })
    expect(reasons.join(' ')).toContain('confidence fell below')
    expect(reasons).toContain('Triage priority for this request is Priority.')
    expect(reasons).toContain('AI output cannot reach the patient until a doctor records a decision.')
  })
})
