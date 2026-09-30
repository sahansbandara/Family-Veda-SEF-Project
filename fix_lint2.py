with open('web/src/pages/auth/LoginPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const setAppTheme = (nextTheme: 'light' | 'dark') => {", "  // const setAppTheme = (nextTheme: 'light' | 'dark') => {")
content = content.replace("    setTheme(nextTheme)", "    // setTheme(nextTheme)")
content = content.replace("    document.documentElement.setAttribute('data-theme', nextTheme)", "    // document.documentElement.setAttribute('data-theme', nextTheme)")
content = content.replace("    try {", "    // try {")
content = content.replace("      globalThis.localStorage?.setItem('fv-theme', nextTheme)", "      // globalThis.localStorage?.setItem('fv-theme', nextTheme)")
content = content.replace("    } catch {", "    // } catch {")
content = content.replace("      // ignore", "      // // ignore")
content = content.replace("    }", "    // }")
# wait, there's another }
# Better just use regex

import re
content = re.sub(r'  const setAppTheme = \(nextTheme: \'light\' \| \'dark\'\) => \{.*?\n  \}', '', content, flags=re.DOTALL)

with open('web/src/pages/auth/LoginPage.tsx', 'w') as f:
    f.write(content)
