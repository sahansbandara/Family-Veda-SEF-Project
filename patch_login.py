import re
with open('web/src/pages/auth/LoginPage.tsx', 'r') as f:
    content = f.read()

# Replace the return statement
new_return = """  return (
    <main className="login-glass-page">
      <div className="login-glass-container">
        <div className="login-glass-left">
          <h2 id="sign-in-heading">Sign in</h2>
          <form onSubmit={handleSubmit} noValidate>
            <label className="field field--floating">
              <input
                type="email"
                autoComplete="email"
                value={email}
                placeholder="e.g. name@example.invalid"
                aria-describedby={error ? 'login-error' : undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
              <span>Email Address</span>
            </label>
            <label className="field field--floating">
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                placeholder="At least 8 characters"
                onChange={(event) => setPassword(event.target.value)}
              />
              <span>Password</span>
            </label>
            {(error || authError) && <p id="login-error" className="form-error" role="alert">{error || authError}</p>}
            <button type="submit" disabled={authStatus === 'loading'} className="button button--primary button--full" style={{borderRadius: 999, padding: '12px', marginTop: '16px'}}>
              {authStatus === 'loading' ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          
          <div className="demo-selector-box" style={{marginTop: '32px', background: 'transparent', border: 'none', padding: 0}}>
             <label htmlFor="demo-role-select" style={{color: 'var(--text)'}}>Quick fill demo role</label>
             <select
               id="demo-role-select"
               value={activeRole ?? ''}
               onChange={(e) => {
                 const selected = DEMO_CREDENTIALS.find((d) => d.role === e.target.value)
                 if (selected) fillCredentials(selected)
               }}
               style={{background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 999, padding: '8px 16px'}}
             >
               <option value="" disabled>Select a demo role to test...</option>
               {DEMO_CREDENTIALS.map((demo) => (
                 <option key={demo.role} value={demo.role}>
                   {demo.icon} {demo.role} — {demo.userType}
                 </option>
               ))}
             </select>
          </div>
        </div>
        <div className="login-glass-right">
          <div className="login-glass-right-content">
            <h1>Welcome<br/>Back</h1>
            <p>Sign in to continue to FamilyVeda.<br/>Access your authorized clinical or<br/>family workspace to continue<br/>where you left off.</p>
            <Link to="/register" className="button button--outline-white" style={{borderRadius: 999, padding: '10px 24px', display: 'inline-block', textDecoration: 'none', marginTop: '24px'}}>
              ← Not a member? Sign Up
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
"""

content = re.sub(r'  return \(\n    <main className="login-page">.*', new_return, content, flags=re.DOTALL)

with open('web/src/pages/auth/LoginPage.tsx', 'w') as f:
    f.write(content)

