// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// jsdom does not lay out CSS, so this pins the responsive contract of the vitals overview grid:
// 3 columns on desktop, 2 on tablet (≤1023px), 1 on phones (≤600px), and badges that wrap.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(__dirname, 'approval-desk.css'), 'utf8')

describe('approval vitals grid CSS', () => {
  it('uses at most three equal columns on desktop', () => {
    expect(css).toMatch(/\.approval-vitals \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
    expect(css).not.toMatch(/\.approval-vitals \{ grid-template-columns: repeat\(auto-fit, minmax\(170px/)
  })

  it('drops to two columns on tablet and one on phones', () => {
    expect(css).toMatch(/@media \(max-width: 1023px\) \{ \.approval-vitals \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \} \}/)
    expect(css).toMatch(/@media \(max-width: 600px\) \{\s*\.approval-vitals \{ grid-template-columns: minmax\(0, 1fr\); \}/)
  })

  it('lets range badges wrap inside the card instead of overflowing', () => {
    expect(css).toMatch(/\.approval-vital \.approval-chip \{[^}]*max-width: 100%;[^}]*white-space: normal;/)
    expect(css).toMatch(/\.approval-vitals > \.approval-vital \{ min-width: 0;/)
  })
})
