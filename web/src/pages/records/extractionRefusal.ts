// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
// 422 carries the backend's own reason for refusing extraction (e.g. the 4-page limit); it is safe to show as-is.
export function extractionRefusalMessage(error: unknown): string | null {
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } } | null)?.response
  return response?.status === 422 && typeof response.data?.detail === 'string' && response.data.detail.length > 0
    ? response.data.detail
    : null
}
