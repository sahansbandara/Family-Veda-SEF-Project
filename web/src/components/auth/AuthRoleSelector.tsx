// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// Role selector card chips for auth registration forms.

export type AuthRole = 'FAMILY' | 'MEMBER' | 'DOCTOR'

interface RoleOption {
  value: AuthRole
  label: string
  icon: string
  description: string
}

const ROLES: RoleOption[] = [
  { value: 'FAMILY',  label: 'Family Head', icon: '🏠', description: 'Create and manage your family account' },
  { value: 'MEMBER',  label: 'Adult Member', icon: '👤', description: 'Join an existing family account' },
  { value: 'DOCTOR',  label: 'Doctor',       icon: '🩺', description: 'Register as a verified clinician' },
]

export interface AuthRoleSelectorProps {
  value: AuthRole
  onChange: (role: AuthRole) => void
}

export function AuthRoleSelector({ value, onChange }: AuthRoleSelectorProps) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: '0 0 8px' }}>
      <legend className="sr-only">Select your role</legend>
      <div className="auth-role-selector">
        {ROLES.map((role) => (
          <button
            key={role.value}
            type="button"
            role="radio"
            aria-checked={value === role.value}
            className={`auth-role-card ${value === role.value ? 'selected' : ''}`}
            onClick={() => onChange(role.value)}
            title={role.description}
          >
            <span className="auth-role-card-icon" aria-hidden="true">{role.icon}</span>
            {role.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
