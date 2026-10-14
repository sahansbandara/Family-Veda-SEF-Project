// Owner: S4 · whole-project ownership waiver
// Deterministic presentation of recorded evidence; release enforcement stays in the backend.
import type { AgentTraceDto, CaseReviewDto } from '../../services/apiClient'

export const MIN_CONFIDENCE = 0.6
type Check = { label: string; passed: boolean }
export const NO_DATA_LABEL = 'Not applicable — no consented family-history data'

/** Only the optional family-history stage can explicitly declare itself not applicable. */
export function isNoDataTrace(trace: AgentTraceDto): boolean {
  return trace.agent === 'FamilialRisk' && trace.status === 'NoData'
}

export function isSyntheticTrace(trace: AgentTraceDto): boolean {
  return trace.modelName === 'synthetic-demo'
}

export function hasRecordedOutput(trace: AgentTraceDto): boolean {
  return trace.hasOutput !== false && !isSyntheticTrace(trace)
}

export function traceConfidence(trace: AgentTraceDto): string {
  if (trace.agent === 'SafetyValidation') return 'Deterministic — confidence not applicable'
  if (trace.agent === 'Coordinator' || isNoDataTrace(trace) || !hasRecordedOutput(trace)) return 'Not applicable'
  return `${Math.round(trace.confidence * 100)}%`
}

function confidenceCheck(traces: AgentTraceDto[]): Check {
  const specialists = traces.filter((trace) => ['Context', 'Analysis', 'FamilialRisk'].includes(trace.agent))
  const counted = specialists.filter((trace) => !isNoDataTrace(trace))
  return {
    label: 'Every specialist with evidence has confidence at or above 60% (deterministic safety excluded)',
    passed: counted.length > 0 && counted.every((trace) => hasRecordedOutput(trace) && trace.confidence >= MIN_CONFIDENCE),
  }
}

export function buildSafetyChecks(traces: AgentTraceDto[], review?: Pick<CaseReviewDto, 'contextJson' | 'analysisJson'>): Check[] {
  const safety = traces.find((trace) => trace.agent === 'SafetyValidation')
  const requiredPresent = ['Context', 'Analysis'].every((agent) => {
    const trace = traces.find((item) => item.agent === agent)
    return trace != null && trace.status === 'Completed' && trace.hasData !== false && hasRecordedOutput(trace) && trace.outputSchemaValid
  }) && (!review || [review.contextJson, review.analysisJson].every((raw) => {
    try { const output: unknown = JSON.parse(raw ?? 'null'); return output != null && typeof output === 'object' && !Array.isArray(output) && Object.keys(output).length > 0 }
    catch { return false }
  }))
  return [
    { label: 'Safety/Validation agent completed', passed: safety?.status === 'Completed' && hasRecordedOutput(safety) },
    { label: 'Every agent output matched its JSON schema', passed: traces.length > 0 && traces.every((trace) => isNoDataTrace(trace) || (hasRecordedOutput(trace) && trace.outputSchemaValid)) },
    { label: 'No agent requested a tool outside its allow-list', passed: traces.length > 0 && traces.every((trace) => trace.toolsDenied.length === 0) },
    confidenceCheck(traces),
    { label: 'Required Context and Analysis evidence is available', passed: requiredPresent },
  ]
}
