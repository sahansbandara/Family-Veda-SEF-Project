// Owner: S3 · Triage & Agent Orchestration — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Patient-safe reasons only: no model, provider or internal detail is shown (RULE 2, RULE 9).
const _reasons = <String, String>{
  'AGENT_UNAVAILABLE':
      'The review assistant was unavailable when your request arrived.',
  'INVALID_AGENT_SCHEMA':
      'The automatic check could not produce a safe summary for your doctor.',
  'MISSING_REQUIRED_AGENT_EVIDENCE':
      'The automatic check could not produce a safe summary for your doctor.',
  'SAFETY_VALIDATION_FAILED':
      'The automatic check could not produce a safe summary for your doctor.',
  'TOOL_DENIED':
      'Some health information needed for the check could not be used under the current privacy settings.',
  'PROCESS_INTERRUPTED':
      'The service was interrupted while preparing your request.',
  'WORKER_FAILURE': 'The service was interrupted while preparing your request.',
  'DOCTOR_RESPONSE_DELAY': 'A doctor did not respond within the expected time.',
};

String failureReason(String? code) =>
    _reasons[code] ?? 'The request could not be prepared automatically.';
