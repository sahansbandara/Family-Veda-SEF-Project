import { describe, expect, it } from 'vitest'
import { grantCountdown, mergeQueue } from './triageQueue'

const now = Date.parse('2026-10-18T10:00:00Z')
const at = (ms: number) => new Date(now + ms).toISOString()
const H = 3_600_000

describe('grantCountdown', () => {
  it('returns null without an expiry', () => {
    expect(grantCountdown(null, now)).toBeNull()
  })
  it('is muted with more than 12 hours left', () => {
    expect(grantCountdown(at(30 * H), now)).toEqual({ label: 'Access ends in 1d 6h', tone: 'muted' })
  })
  it('turns amber inside 12 hours', () => {
    expect(grantCountdown(at(6 * H + 15 * 60_000), now)).toEqual({ label: 'Access ends in 6h 15m', tone: 'warning' })
  })
  it('shows minutes in the last hour', () => {
    expect(grantCountdown(at(20 * 60_000), now)?.label).toBe('Access ends in 20m')
  })
  it('turns red once expired', () => {
    expect(grantCountdown(at(-1), now)).toEqual({ label: 'Access expired', tone: 'danger' })
  })
})

describe('mergeQueue grant expiry', () => {
  it('carries grantExpiresAt onto granted cases', () => {
    const [item] = mergeQueue([{ id: 'c1', episodeId: 'e', memberId: 'm', status: 'Claimed', priority: 'Routine', createdAt: at(0), grantExpiresAt: at(H) }], [])
    expect(item.grantExpiresAt).toBe(at(H))
  })
})
