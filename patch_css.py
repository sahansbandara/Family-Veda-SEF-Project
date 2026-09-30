import re
with open('web/src/styles/components.css', 'r') as f:
    content = f.read()

# I will append the new styles and override .app-shell, etc.
# Or better, I will find .app-shell and .topbar in components.css and replace them.

original_app_shell = """.app-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}"""

new_app_shell = """.app-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 1fr;
  background: var(--surface-subtle); /* To get the soft gray body background */
}
.app-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 1400px; /* restrict width if necessary */
  margin: 0 auto;
  width: 100%;
}
.app-sidebar {
  background: linear-gradient(180deg, #5b79ff 0%, #4a65ff 100%);
  border-radius: 0 30px 30px 0;
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  color: #fff;
  z-index: 20;
}
.app-sidebar .brand strong {
  color: #fff;
  font-size: 1.25rem;
}
.app-sidebar .brand small {
  color: rgba(255,255,255,0.7);
}
.app-sidebar .primary-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  position: static;
  box-shadow: none;
  border-radius: 0;
  flex-wrap: nowrap;
}
.app-sidebar .primary-nav a {
  color: rgba(255, 255, 255, 0.7);
  padding: 10px 16px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 150ms ease;
}
.app-sidebar .primary-nav a:hover,
.app-sidebar .primary-nav a.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: inset 2px 0 0 0 #fff;
}
.sidebar-footer {
  margin-top: auto;
}
.upgrade-card {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 16px;
  text-align: center;
}
.upgrade-card strong {
  display: block;
  font-size: 0.95rem;
  margin-bottom: 6px;
}
.upgrade-card p {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.8);
  margin-bottom: 12px;
  line-height: 1.3;
}
.upgrade-card button {
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
  font-size: 0.75rem;
  padding: 8px 12px;
}
.upgrade-card button:hover {
  background: #fff;
  color: #4a65ff;
}
@media (max-width: 991px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .app-sidebar {
    height: auto;
    border-radius: 0 0 20px 20px;
    position: static;
  }
  .app-sidebar .primary-nav {
    flex-direction: row;
    overflow-x: auto;
  }
}
"""

content = content.replace(original_app_shell, new_app_shell)

original_topbar = """.topbar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-5);
  padding: var(--sp-3) clamp(20px, 4vw, 48px);
  border-radius: 0;
  border-inline: 0;
  border-top: 0;
  border-bottom: 2px solid var(--topbar-border);
  background: color-mix(in srgb, var(--surface) 96%, transparent);
  backdrop-filter: blur(var(--blur-regular));
  box-shadow: 0 2px 10px -2px rgba(20, 108, 255, 0.05);
}"""

new_topbar = """.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-5);
  padding: 24px clamp(20px, 4vw, 48px);
  border-radius: 0;
  border: 0;
  background: transparent;
}
.topbar-title .header-page-title {
  margin: 0;
  font-size: 1.7rem;
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-title .header-page-title::before {
  content: "≡";
  font-size: 1.4rem;
  color: var(--muted);
  cursor: pointer;
}
.lang-switcher {
  font-weight: 700;
  color: var(--muted);
  font-size: 0.85rem;
}
"""

content = content.replace(original_topbar, new_topbar)

# Let's fix primary-nav in components.css
primary_nav_orig = """.primary-nav {
  position: sticky;
  top: 76px;
  z-index: 11;
  display: flex;
  gap: var(--sp-2);
  margin: var(--sp-4) clamp(20px, 4vw, 48px) 0;
  padding: 6px;
  background: color-mix(in srgb, var(--surface) 50%, transparent);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  overflow-x: auto;
  scrollbar-width: none;
}"""

# Actually we can just comment it out or let it be overriden by the .app-sidebar .primary-nav above.
# The original has margin that might mess it up, so let's replace it.
content = content.replace(primary_nav_orig, "/* original primary-nav moved to .app-sidebar .primary-nav */")


with open('web/src/styles/components.css', 'w') as f:
    f.write(content)
