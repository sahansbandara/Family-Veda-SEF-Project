import re
with open('web/src/components/layout/AppLayout.tsx', 'r') as f:
    content = f.read()

original = """  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar">
        <NavLink className="brand" to={brandDestination} aria-label="Family Veda dashboard">
          <span className="brand-mark">
            <img src={markUrl} alt="" width={42} height={42} />
          </span>
          <span>
            <strong>Family Veda</strong>
            <small>{user ? portalName[user.role] : 'Clinical decision support'}</small>
          </span>
        </NavLink>
        <div className="session-summary">
          {user && <NotificationBell />}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
            aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
          >
            <span aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>
            <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
          </button>
          {user?.role === 'DOCTOR' && user?.verificationStatus === 'VERIFIED' && (
            <span className="status-badge status-badge--success" style={{ fontWeight: 700 }}>
              VERIFIED
            </span>
          )}
          <span>
            <strong>{user?.name}</strong>
            <small>{user ? roleLabel[user.role] : ''}</small>
          </span>
          <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
          <button type="button" className="button button--secondary" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <nav className="primary-nav glass glass--thin" aria-label="Primary navigation">
        {visibleItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : undefined}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {user?.role === 'MEMBER' && <HeadTransferBanner />}
        <Outlet />
      </main>
      {showEmergencyHelp && <EmergencyHelp />}
      <footer className="app-footer">
        Clinical decision-support system. Access is controlled and activity is audited.
      </footer>
    </div>
  )"""

new = """  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="app-sidebar glass glass--thin">
        <NavLink className="brand" to={brandDestination} aria-label="Family Veda dashboard">
          <span className="brand-mark">
            <img src={markUrl} alt="" width={36} height={36} />
          </span>
          <span>
            <strong>Family Veda</strong>
            <small>{user ? portalName[user.role] : 'Clinical decision support'}</small>
          </span>
        </NavLink>
        <nav className="primary-nav" aria-label="Primary navigation">
          {visibleItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : undefined}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="upgrade-card">
            <strong>Upgrade to PRO</strong>
            <p>Improve your development process and start doing more with Family Veda PRO!</p>
            <button type="button" className="button button--primary" style={{width: '100%', borderRadius: 999}}>UPDATE TO PRO</button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <h1 className="header-page-title">Dashboard</h1>
          </div>
          <div className="session-summary">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
              aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
            >
              <span aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>
              <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
            </button>
            {user?.role === 'DOCTOR' && user?.verificationStatus === 'VERIFIED' && (
              <span className="status-badge status-badge--success" style={{ fontWeight: 700 }}>
                VERIFIED
              </span>
            )}
            <span className="lang-switcher">EN</span>
            {user && <NotificationBell />}
            <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
            <button type="button" className="button button--secondary" onClick={() => void signOut()} style={{borderRadius: 999}}>
              Sign out
            </button>
          </div>
        </header>
        
        <main id="main-content" className="main-content" tabIndex={-1}>
          {user?.role === 'MEMBER' && <HeadTransferBanner />}
          <Outlet />
        </main>
        {showEmergencyHelp && <EmergencyHelp />}
        <footer className="app-footer">
          Clinical decision-support system. Access is controlled and activity is audited.
        </footer>
      </div>
    </div>
  )"""

content = content.replace(original, new)
with open('web/src/components/layout/AppLayout.tsx', 'w') as f:
    f.write(content)
