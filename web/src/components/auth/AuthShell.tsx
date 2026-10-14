// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// AuthShell — reusable split-panel container for auth pages.
//
// Usage (for S1 to adopt in AuthPage.tsx):
//
//   <AuthShell mode={isSignUpMode ? 'register' : 'login'}>
//     <AuthShell.Hero imageSrc={...} logoSrc={...} headline="..." subline="..." />
//     <AuthShell.Form>
//       {/* form content */}
//     </AuthShell.Form>
//   </AuthShell>
//
// The shell handles hero/form side-swap via data-mode attribute and CSS.
// Animation is pure CSS; no JS animation libraries required.

import { type ReactNode } from 'react'
import { AuthHero, type AuthHeroProps } from './AuthHero'
import '../../styles/auth-shell.css'

export type AuthMode = 'login' | 'register'

interface AuthShellProps {
  mode: AuthMode
  children: ReactNode
}

type AuthShellHeroProps = AuthHeroProps

interface AuthShellFormProps {
  children: ReactNode
}

function AuthShellHero(props: AuthShellHeroProps) {
  return <AuthHero {...props} />
}

function AuthShellForm({ children }: AuthShellFormProps) {
  return <div className="auth-form-panel">{children}</div>
}

export function AuthShell({ mode, children }: AuthShellProps) {
  return (
    <main className="auth-shell-page" aria-label={mode === 'login' ? 'Sign in' : 'Create account'}>
      <div className="auth-container" data-mode={mode}>
        {children}
      </div>
    </main>
  )
}

AuthShell.Hero = AuthShellHero
AuthShell.Form = AuthShellForm
