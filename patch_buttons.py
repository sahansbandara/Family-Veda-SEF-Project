import re
with open('web/src/styles/portal-dashboard.css', 'r') as f:
    content = f.read()

# Make fv-btn more like Image 1 (pill shaped, bordered, primary is filled pill)
content = re.sub(r'border-radius: 12px;', 'border-radius: 999px;', content)
# We might need to ensure the fv-btn padding is suitable for a pill
content = re.sub(r'padding: 9px 13px;', 'padding: 8px 18px;', content)

# Remove the fv-hero eyebrow that was replaced incorrectly (or rather, just make it look good)
content = content.replace('.fv-panel h2 { margin: 0; font-size: 1.2rem; color: var(--text-heading); }', '.fv-panel h2 { margin: 0; font-size: 1.15rem; color: var(--text-heading); font-weight: 700; }')

# For the fv-tabs, Image 1 has them looking like a flat list with active state having a line or pill
# Our fv-tabs already has a bottom border active state. Let's make it rounded text or so.
# Leave tabs for now.

with open('web/src/styles/portal-dashboard.css', 'w') as f:
    f.write(content)
