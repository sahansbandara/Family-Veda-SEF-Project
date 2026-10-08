const { chromium } = require('playwright-core')
;(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true})
 for (const [email,routes] of [['demo-head@example.invalid',['/dashboard','/triage','/family']],['demo-admin@example.invalid',['/dashboard','/doctor-verification','/users']],['demo-doctor@example.invalid',['/approvals','/families']]]) {
  const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})
  const p=await c.newPage()
  await p.goto('http://localhost:5177/login')
  const f=p.locator('.auth-form-login')
  await f.locator('input[type="email"]').fill(email)
  await f.locator('input[type="password"]').fill(process.env.FV_TEST_PASSWORD)
  await f.locator('button[type="submit"]').click()
  await p.waitForURL(u=>!u.pathname.startsWith('/login'))
  for (const r of routes){
   await p.evaluate(t=>{history.pushState({},'',t);dispatchEvent(new PopStateEvent('popstate'))},r)
   await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(800)
   const o=await p.evaluate(()=>{const w=document.documentElement.clientWidth;const bad=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>w+1}).slice(0,4).map(e=>e.tagName.toLowerCase()+'.'+String(e.className).split(' ')[0]+':'+Math.round(e.getBoundingClientRect().right));return [document.documentElement.scrollWidth-w,bad.join(' ')]})
   console.log(email.split('@')[0],r,o[0],o[1])
  }
  await c.close()
 }
 await b.close()
})()
