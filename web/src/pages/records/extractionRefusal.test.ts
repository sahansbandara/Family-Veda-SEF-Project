// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// Ownership binding — do not edit file if not yours. docs/OWNERSHIP.tsv
import { describe, expect, it } from 'vitest'
import { extractionRefusalMessage } from './extractionRefusal'

describe('extractionRefusalMessage', () => {
  it('returns the backend reason when a report is refused for having more than four pages', () => {
    const detail = 'This report has 6 pages. Reports longer than 4 pages cannot be read automatically. Upload only the result pages or use manual entry.'
    expect(extractionRefusalMessage({ response: { status: 422, data: { detail } } })).toBe(detail)
  })

  it.each([
    [{ response: { status: 500, data: { detail: 'Internal stack detail' } } }],
    [{ response: { status: 422, data: {} } }],
    [new Error('Network Error')],
    [null],
  ])('falls back to the generic message for anything else', (error) => {
    expect(extractionRefusalMessage(error)).toBeNull()
  })
})
