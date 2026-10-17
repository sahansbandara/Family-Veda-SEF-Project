// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Live countdown for the doctor's time-bound case grant. Display only: access is enforced by the API.
import { useEffect, useState } from 'react'
import { grantCountdown } from './triageQueue'

export function GrantExpiryChip({ expiresAt }: { expiresAt?: string | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!expiresAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [expiresAt])
  const countdown = grantCountdown(expiresAt, now)
  if (!countdown) return null
  return (
    <span
      className={`status-badge status-badge--${countdown.tone}`}
      title={`Case access ends ${new Date(expiresAt!).toLocaleString()}`}
    >
      <span aria-hidden="true">⏱ </span>
      {countdown.label}
    </span>
  )
}
