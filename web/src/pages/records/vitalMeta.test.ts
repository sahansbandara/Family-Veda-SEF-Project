import { describe, expect, it } from 'vitest'
import type { VitalDto } from '../../services/apiClient'
import { changeFromPrevious, groupVitals, trendValues, vitalKind } from './vitalMeta'

const vital = (id: string, vitalType: string, value: number, unit: string, measuredAt: string): VitalDto => ({
  id, memberId: 'synthetic-member', vitalType, value, unit, measuredAt,
})

describe('vitalMeta', () => {
  it('recognises seeded snake_case and free-text vital names', () => {
    expect(vitalKind('heart_rate')).toBe('heart')
    expect(vitalKind('Oxygen (SpO2)')).toBe('oxygen')
    expect(vitalKind('Body Weight')).toBe('weight')
    expect(vitalKind('synthetic custom')).toBe('other')
  })

  it('pairs systolic and diastolic readings that share a timestamp', () => {
    const groups = groupVitals([
      vital('s1', 'blood_pressure_systolic', 128, 'mmHg', '2026-09-01T08:00:00Z'),
      vital('d1', 'blood_pressure_diastolic', 82, 'mmHg', '2026-09-01T08:00:00Z'),
      vital('s2', 'blood_pressure_systolic', 131, 'mmHg', '2026-08-01T08:00:00Z'),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Blood Pressure')
    expect(groups[0].readings.map((reading) => reading.display)).toEqual(['128/82', '131/—'])
  })

  it('orders readings newest first and reports only the arithmetic change', () => {
    const [group] = groupVitals([
      vital('w1', 'weight', 75, 'kg', '2026-07-01T08:00:00Z'),
      vital('w3', 'weight', 74.5, 'kg', '2026-09-01T08:00:00Z'),
      vital('w2', 'weight', 74.5, 'kg', '2026-08-01T08:00:00Z'),
    ])
    expect(group.readings.map((reading) => reading.id)).toEqual(['w3', 'w2', 'w1'])
    expect(trendValues(group, 5)).toEqual([75, 74.5, 74.5])
    expect(changeFromPrevious(group, 0)).toEqual({ direction: 'same', text: 'No change' })
    expect(changeFromPrevious(group, 1)).toEqual({ direction: 'down', text: '0.5' })
    expect(changeFromPrevious(group, 2)).toBeNull()
  })

  it('does not mutate the supplied list', () => {
    const input = [vital('a', 'heart_rate', 76, 'bpm', '2026-09-01T08:00:00Z'), vital('b', 'heart_rate', 72, 'bpm', '2026-09-02T08:00:00Z')]
    const snapshot = JSON.stringify(input)
    groupVitals(input)
    expect(JSON.stringify(input)).toBe(snapshot)
  })
})
