// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitForReading } from './pollReading'

describe('waitForReading', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('polls every interval until the report leaves Processing', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ocrStatus: 'Processing' })
      .mockResolvedValueOnce({ ocrStatus: 'Processing' })
      .mockResolvedValueOnce({ ocrStatus: 'Completed' })
    const result = waitForReading(fetch, { intervalMs: 3000, maxMs: 240000 })
    await vi.advanceTimersByTimeAsync(9000)
    await expect(result).resolves.toEqual({ ocrStatus: 'Completed' })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('returns a failed read so the reason can be shown', async () => {
    const fetch = vi.fn().mockResolvedValue({ ocrStatus: 'Failed', ocrErrorCode: 'OCR_TIMEOUT' })
    const result = waitForReading(fetch, { intervalMs: 3000 })
    await vi.advanceTimersByTimeAsync(3000)
    await expect(result).resolves.toEqual({ ocrStatus: 'Failed', ocrErrorCode: 'OCR_TIMEOUT' })
  })

  it('keeps polling through a failed request', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ ocrStatus: 'Completed' })
    const result = waitForReading(fetch, { intervalMs: 3000 })
    await vi.advanceTimersByTimeAsync(6000)
    await expect(result).resolves.toEqual({ ocrStatus: 'Completed' })
  })

  it('gives up after the cap', async () => {
    const fetch = vi.fn().mockResolvedValue({ ocrStatus: 'Processing' })
    const result = waitForReading(fetch, { intervalMs: 3000, maxMs: 12000 })
    await vi.advanceTimersByTimeAsync(15000)
    await expect(result).resolves.toBeNull()
    expect(fetch.mock.calls.length).toBeLessThanOrEqual(4)
  })

  it('stops when the user switches profile', async () => {
    let active = true
    const fetch = vi.fn().mockResolvedValue({ ocrStatus: 'Processing' })
    const result = waitForReading(fetch, { intervalMs: 3000, isActive: () => active })
    await vi.advanceTimersByTimeAsync(3000)
    active = false
    await vi.advanceTimersByTimeAsync(3000)
    await expect(result).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
