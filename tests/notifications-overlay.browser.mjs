import {createRequire} from 'node:module'
import {join} from 'node:path'
import {homedir} from 'node:os'
import {mkdir} from 'node:fs/promises'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url), runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright')), {expect}=require(join(runtime,'playwright/test'))
const out=process.env.SAYTU_TEST_OUTPUT;await mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true})
try {for(const width of [360,650,1440]) {
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',route=>route.fulfill({json:route.request().url().includes('badges')?{rh_alertes:30}:{rh_alertes:Array.from({length:30},(_,i)=>({key:'rh-'+i,type:'conge',label:'Congé',title:'Notification de contrôle '+i,message:'Votre demande de congé a été traitée.',date:'2026-11-03',level:'info'}))}}))
 await page.goto('http://127.0.0.1:5187/tests/notifications-harness.html')
 const bell=page.getByRole('button',{name:'Afficher les notifications'}),panel=page.getByRole('dialog',{name:'Notifications',exact:true})
 await bell.click();await expect(panel).toBeVisible();await expect(page.getByText('Notification de contrôle 0',{exact:true})).toBeVisible()
 await expect(panel).toHaveCSS('transform','none');const bounds=await panel.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width&&bounds.y+bounds.height<=900)
 assert(await page.evaluate(()=>{const p=document.getElementById('notifications-panel'),b=p.getBoundingClientRect();return p.parentElement===document.body&&p.contains(document.elementFromPoint(b.x+60,Math.min(b.bottom-60,300)))}))
 const footer=await page.getByText('Centre complet',{exact:true}).boundingBox()
 await panel.locator('.notifications-scroll-area').evaluate(el=>el.scrollTop=el.scrollHeight)
 assert.deepEqual(await page.getByText('Centre complet',{exact:true}).boundingBox(),footer)
 await page.getByRole('button',{name:'Rafraîchir',exact:false}).click();await expect(panel).toBeVisible()
 await panel.locator('.notifications-scroll-area').evaluate(el=>el.scrollTop=0)
 await page.screenshot({path:join(out,`notifications-${width}.png`)})
 await page.keyboard.press('Escape');await expect(panel).not.toBeVisible();await expect(bell).toBeFocused()
 await bell.click();await expect(panel).toBeVisible();await page.getByRole('button',{name:'Fermer les notifications'}).click();await expect(panel).not.toBeVisible()
 await bell.click();await page.getByText('Bloc de page au premier plan').click({position:{x:5,y:200}});await expect(panel).not.toBeVisible()
 assert.deepEqual(errors,[]);console.log('PASS overlay '+width+'px, stacking, scrolling, refresh, Escape and outside click');await page.close()
}}finally{await browser.close()}
