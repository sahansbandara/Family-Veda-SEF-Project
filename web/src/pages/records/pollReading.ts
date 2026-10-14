// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
// Reading a report is a background job on the server (POST /extract returns 202). The client polls the report
// until it leaves "Processing". Polling stops after a cap; the library still shows "Reading report" until a refresh.
export const READING_POLL_INTERVAL_MS = 3_000
export const READING_POLL_MAX_MS = 240_000

export type PollOptions = { intervalMs?: number; maxMs?: number; isActive?: () => boolean }

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Resolves with the first report whose status is not Processing, or null when the cap elapses or polling is abandoned. */
export async function waitForReading<T extends { ocrStatus: string }>(
  fetchReport: () => Promise<T>,
  { intervalMs = READING_POLL_INTERVAL_MS, maxMs = READING_POLL_MAX_MS, isActive = () => true }: PollOptions = {},
): Promise<T | null> {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    await wait(intervalMs)
    if (!isActive()) return null
    try {
      const report = await fetchReport()
      if (report.ocrStatus !== 'Processing') return report
    } catch {
      // A failed poll is retried on the next tick; the server state is unaffected.
    }
  }
  return null
}
