import re
with open('web/src/styles/portal-dashboard.css', 'r') as f:
    content = f.read()

# Make fv-panel clean white with soft shadow
new_fv_panel = """.fv-panel { background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px -4px rgba(0,0,0,0.03); min-width: 0; }
.fv-panel h2 { margin: 0; font-size: 1.15rem; color: var(--text-heading); font-weight: 700; }"""
content = re.sub(r'\.fv-panel \{ background: linear-gradient.*?\}', '.fv-panel { background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px -4px rgba(0,0,0,0.03); min-width: 0; }', content, flags=re.DOTALL)

# Make fv-hero a nice gradient like login page vibe (Image 3)
new_fv_hero = """.fv-hero {
  display: flex; justify-content: space-between; align-items: center; gap: 18px;
  padding: 32px; border: none; border-radius: 24px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: #fff;
  box-shadow: 0 10px 30px -10px rgba(42,82,152, 0.4);
  position: relative; overflow: hidden;
}
.fv-hero h1 { margin: 0; font-size: 2rem; color: #fff; }
.fv-hero p { margin: 8px 0 0; color: rgba(255,255,255,0.8); }
.fv-eyebrow { margin: 0 0 6px; color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
"""
content = re.sub(r'\.fv-hero \{.*?overflow: hidden;\n\}', '.fv-hero {\n  display: flex; justify-content: space-between; align-items: center; gap: 18px;\n  padding: 32px; border: none; border-radius: 24px;\n  background: linear-gradient(135deg, #0b2545 0%, #146cff 100%);\n  color: #fff;\n  box-shadow: 0 10px 30px -10px rgba(20, 108, 255, 0.4);\n  position: relative; overflow: hidden;\n}', content, flags=re.DOTALL)
content = re.sub(r'\.fv-hero h1 \{.*?\}', '.fv-hero h1 { margin: 0; font-size: 2rem; color: #fff; }', content)
content = re.sub(r'\.fv-hero p \{.*?\}', '.fv-hero p { margin: 8px 0 0; color: rgba(255,255,255,0.8); }', content)
content = re.sub(r'\.fv-eyebrow \{.*?\}', '.fv-eyebrow { margin: 0 0 6px; color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }', content)


# Make metric cards clean and premium
new_fv_metric = """.fv-metric { background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px -4px rgba(0,0,0,0.02); }"""
content = re.sub(r'\.fv-metric \{ background: linear-gradient.*?\}', '.fv-metric { background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px -4px rgba(0,0,0,0.02); }', content, flags=re.DOTALL)

with open('web/src/styles/portal-dashboard.css', 'w') as f:
    f.write(content)
