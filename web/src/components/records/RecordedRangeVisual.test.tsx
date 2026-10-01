// Owner: S2 · Health Records & Extraction.
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecordedRangeVisual } from './RecordedRangeVisual'
import type { LabValueDto } from '../../services/apiClient'

const value: LabValueDto = {
  id: 'synthetic-value',
  analyte: 'Glucose',
  value: 96,
  unit: 'mg/dL',
  referenceLow: 70,
  referenceHigh: 99,
  wasManuallyConfirmed: true,
}
describe('RecordedRangeVisual', () => {
  it('uses the confirmed value and source interval with its unit', () => {
    render(<RecordedRangeVisual value={value} />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/96 mg\/dL.*70 to 99 mg\/dL/)
  })
  it('does not visualize an unconfirmed extracted value', () => {
    const { container } = render(<RecordedRangeVisual value={{ ...value, wasManuallyConfirmed: false }} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('does not invent a missing or inverted source interval', () => {
    const { rerender } = render(<RecordedRangeVisual value={{ ...value, referenceLow: null }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText(/No complete printed reference interval/)).toBeInTheDocument()
    rerender(<RecordedRangeVisual value={{ ...value, referenceLow: 99, referenceHigh: 70 }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it('labels an outside value without clipping it off the diagram', () => {
    render(<RecordedRangeVisual value={{ ...value, value: 140 }} />)
    const image = screen.getByRole('img')
    expect(image).toHaveAccessibleName(/140 mg\/dL.*Outside the printed interval/)
    const marker = image.querySelector('.care-range-marker')
    expect(Number(marker?.getAttribute('x1'))).toBeGreaterThan(24)
    expect(Number(marker?.getAttribute('x1'))).toBeLessThan(296)
  })
})
