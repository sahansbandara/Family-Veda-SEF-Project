// Owner: S1 · Family, Identity & Consent — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Password strength computed from the typed value. The backend requires at least 8 characters.
export interface PasswordStrength { score: 0 | 1 | 2 | 3 | 4; label: string; meetsMinimum: boolean }

export function passwordStrength(value: string): PasswordStrength {
  if (!value) return { score: 0, label: 'Enter a new password', meetsMinimum: false }
  const meetsMinimum = value.length >= 8
  if (!meetsMinimum) return { score: 1, label: 'Too short — use at least 8 characters', meetsMinimum }
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length
  const points = variety + (value.length >= 12 ? 1 : 0) + (value.length >= 16 ? 1 : 0)
  if (points >= 5) return { score: 4, label: 'Strong', meetsMinimum }
  if (points >= 4) return { score: 3, label: 'Good', meetsMinimum }
  return { score: 2, label: 'Fair — add upper case, numbers or symbols', meetsMinimum }
}
