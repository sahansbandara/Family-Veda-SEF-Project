// Captures current React screens for the QMSE evidence folder, per role and viewport.
// Local only: refuses any non-loopback web origin. Synthetic seed accounts only (RULE 7).
//
//   FV_WEB_BASE=http://localhost:5177 FV_TEST_PASSWORD=<seed password> \
//     node docs/QMSE/tools/capture-web.cjs <output-dir> [role ...]
//
// Requires playwright-core on NODE_PATH and a local Google Chrome. The password is read from
// the environment and never written to the output.
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright-core')

const base = (process.env.FV_WEB_BASE || 'http://localhost:5177').replace(/\/$/, '')
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) {
  throw new Error('capture-web runs only against a local web origin.')
}
const password = process.env.FV_TEST_PASSWORD
if (!password) throw new Error('FV_TEST_PASSWORD is not set.')

const outDir = path.resolve(process.argv[2] || 'docs/QMSE/evidence/web')
const onlyRoles = process.argv.slice(3)

const desktop = { name: '1440', width: 1440, height: 900 }
const phone = { name: '390', width: 390, height: 844 }
const smallPhone = { name: '375', width: 375, height: 812 }
const tablet = { name: '768', width: 768, height: 1024 }

// `wide` pages are captured at every viewport; the rest at desktop and 390 px.
const roles = [
  {
    role: 'family-head',
    email: 'demo-head@example.invalid',
    pages: [
      ['dashboard', '/dashboard', true],
      ['family', '/family'],
      ['records', '/records'],
      ['triage', '/triage', true],
      ['family-risk', '/family-risk'],
      ['appointments', '/appointments'],
      ['my-doctor', '/my-doctor'],
      ['notifications', '/notifications'],
      ['privacy', '/privacy'],
      ['own-audit-log', '/audit'],
    ],
  },
  {
    role: 'adult-member',
    email: 'demo-member@example.invalid',
    pages: [
      ['dashboard', '/dashboard'],
      ['records', '/records'],
      ['triage', '/triage'],
      ['appointments', '/appointments'],
      ['my-family', '/my-family'],
    ],
  },
  {
    role: 'doctor',
    email: 'demo-doctor@example.invalid',
    pages: [
      ['dashboard', '/dashboard', true],
      ['approvals', '/approvals', true],
      ['cases', '/cases'],
      ['families', '/families'],
      ['doctor-calendar', '/doctor-calendar'],
      ['doctor-profile', '/doctor-profile'],
    ],
  },
  {
    role: 'admin',
    email: 'demo-admin@example.invalid',
    pages: [
      ['dashboard', '/dashboard'],
      ['doctor-verification', '/doctor-verification'],
      ['family-head-verification', '/family-head-verification'],
      ['users', '/users'],
      ['audit', '/audit'],
    ],
  },
]

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(700)
}

async function shoot(page, name, viewport, manifest, meta) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  await page.waitForTimeout(400)
  const file = `${name}-${viewport.name}.png`
  await page.screenshot({ path: path.join(outDir, file), fullPage: true })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  manifest.push({ file, viewport: viewport.name, horizontalOverflowPx: overflow, ...meta })
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  const manifest = []
  const browser = await chromium.launch({ channel: 'chrome', headless: true })

  const anonymous = await browser.newPage()
  for (const [name, route] of [['public-login', '/login'], ['public-register', '/register']]) {
    await anonymous.goto(base + route)
    await settle(anonymous)
    for (const viewport of [desktop, phone]) {
      await shoot(anonymous, name, viewport, manifest, { role: 'anonymous', route, finalPath: route })
    }
  }
  // Protected-route check: an anonymous visitor must not reach the dashboard.
  await anonymous.goto(base + '/dashboard')
  await settle(anonymous)
  await shoot(anonymous, 'public-dashboard-redirect', desktop, manifest, {
    role: 'anonymous', route: '/dashboard', finalPath: new URL(anonymous.url()).pathname,
  })
  await anonymous.close()

  for (const { role, email, pages } of roles) {
    if (onlyRoles.length && !onlyRoles.includes(role)) continue
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(base + '/login')
    // The auth page renders the sign-in and register forms together; scope to sign-in.
    const form = page.locator('.auth-form-login')
    await form.locator('input[type="email"]').fill(email)
    await form.locator('input[type="password"]').fill(password)
    await form.locator('button[type="submit"]').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 })
    await settle(page)

    for (const [name, route, wide] of pages) {
      await page.setViewportSize({ width: desktop.width, height: desktop.height })
      // Client-side navigation keeps the in-memory access token.
      await page.evaluate((target) => {
        window.history.pushState({}, '', target)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }, route)
      await settle(page)
      const meta = { role, route, finalPath: new URL(page.url()).pathname }
      const viewports = wide ? [desktop, tablet, phone, smallPhone] : [desktop, phone]
      for (const viewport of viewports) {
        await shoot(page, `${role}-${name}`, viewport, manifest, meta)
      }
      console.log(`${role} ${route} -> ${meta.finalPath}`)
    }
    await context.close()
  }

  await browser.close()
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  const overflowing = manifest.filter((entry) => entry.horizontalOverflowPx > 0)
  console.log(`${manifest.length} screenshots; ${overflowing.length} with horizontal overflow`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
