// Owner: S4 · whole-project ownership waiver
import { describe, expect, it } from 'vitest'
import type { AgentTraceDto } from '../../services/apiClient'
import { buildSafetyChecks, isNoDataTrace, traceConfidence } from './safetyRules'

const base: AgentTraceDto = { stepNumber: 1, agent: 'SafetyValidation', status: 'Completed', toolsRequested: [], toolsAllowed: [], toolsDenied: [], confidence: 0, latencyMilliseconds: 10, outputSchemaValid: true, hasOutput: true }
const pipeline = [{ ...base, agent: 'Context', confidence: 0.8 }, { ...base, agent: 'Analysis', confidence: 0.9 }, base]

describe('recorded agent evidence', () => {
  it('passes valid required evidence without counting deterministic safety confidence', () => {
    expect(buildSafetyChecks(pipeline).every((check) => check.passed)).toBe(true)
    expect(traceConfidence(base)).toBe('Deterministic — confidence not applicable')
  })
  it('keeps explicit optional NoData not applicable with a reason', () => {
    const optional = { ...base, agent: 'FamilialRisk', status: 'NoData', hasData: false, hasOutput: false }
    expect(buildSafetyChecks([...pipeline, optional]).every((check) => check.passed)).toBe(true)
    expect(isNoDataTrace(optional)).toBe(true)
  })
  it('required NoData fails evidence rather than receiving an optional exemption', () => {
    const checks = buildSafetyChecks([pipeline[0], { ...pipeline[1], status: 'NoData', hasData: false }, base])
    expect(checks[4].passed).toBe(false)
    expect(isNoDataTrace({ ...base, agent: 'Analysis', status: 'NoData' })).toBe(false)
  })
  it('legacy synthetic demo confidence and schema claims do not pass', () => {
    const demo = pipeline.map((trace) => ({ ...trace, modelName: 'synthetic-demo', hasOutput: false, confidence: 0.8 }))
    expect(buildSafetyChecks(demo).filter((check) => !check.passed)).toHaveLength(4)
    expect(traceConfidence(demo[0])).toBe('Not applicable')
  })
  it('missing review outputs fail even when old trace metadata claims completion', () => {
    expect(buildSafetyChecks(pipeline, {})[4].passed).toBe(false)
    expect(buildSafetyChecks(pipeline, { contextJson: '{}', analysisJson: 'null' })[4].passed).toBe(false)
  })
  it('denied tools, schema mismatch and real low confidence fail their checks', () => {
    const checks = buildSafetyChecks([{ ...pipeline[0], toolsDenied: ['denied'], outputSchemaValid: false, confidence: 0.59 }, pipeline[1], base])
    expect(checks[1].passed).toBe(false)
    expect(checks[2].passed).toBe(false)
    expect(checks[3].passed).toBe(false)
  })
  it('fails closed with no traces', () => {
    expect(buildSafetyChecks([]).every((check) => !check.passed)).toBe(true)
  })
})
