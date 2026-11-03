import {createRequire} from 'node:module'
import {join} from 'node:path'
import {homedir} from 'node:os'
import {mkdir} from 'node:fs/promises'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url)
const runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright'))
const {expect}=require(join(runtime,'playwright/test'))
const output=process.env.SAYTU_TEST_OUTPUT
await mkdir(output,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for (const width of [360,1440]) {
  const page=await browser.newPage({viewport:{width,height:950}}), errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/api/**',route=>route.fulfill({json:{data:[]}}))
  await page.goto('http://127.0.0.1:5187/tests/designation-harness.html')
  const editor=page.getByRole('textbox',{name:'Désignation',exact:true})
  await editor.fill('Ordinateur portable')
  await editor.press('End');await editor.press('Enter');await editor.press('End');await page.keyboard.type('Mémoire 16 Go')
  await expect(page.getByTestId('plain')).toHaveText(/Ordinateur portable\s+Mémoire 16 Go/)
  assert((await page.getByTestId('plain').textContent()).includes('\n'))
  await editor.press('Control+A');await page.getByRole('button',{name:'Gras',exact:true}).click()
  assert(await editor.locator('b,strong').count()>0)
  await editor.press('Control+A');await page.getByRole('button',{name:'Italique',exact:true}).click()
  assert(await editor.locator('i,em').count()>0)
  await editor.press('Control+A');await page.getByRole('button',{name:'Souligné',exact:true}).click()
  assert(await editor.locator('u').count()>0)
  await page.getByRole('button',{name:'Enregistrer l’essai'}).click()
  const saved=JSON.parse(await page.getByTestId('saved').textContent())
  await page.getByRole('button',{name:'Vider',exact:true}).click();await page.getByRole('button',{name:'Rouvrir',exact:true}).click()
  await expect(editor).toContainText('Mémoire 16 Go');assert(await editor.locator('u').count()>0)
  await page.getByRole('button',{name:'Enregistrer l’essai'}).click();assert.deepEqual(JSON.parse(await page.getByTestId('saved').textContent()),saved)
  await page.screenshot({path:join(output,`designation-${width}.png`),fullPage:true})
  await page.getByRole('button',{name:'Rechercher un produit',exact:true}).click()
  await page.getByPlaceholder('Référence ou nom du produit').click()
  await page.getByRole('button',{name:/PR-001/}).click()
  await expect(editor).toHaveText('Ordinateur portable');assert.equal(await editor.locator('u,b,strong').count(),0)
  await editor.press('Control+A');await page.getByRole('button',{name:'Liste à puces',exact:true}).click()
  assert(await editor.locator('ul li').count()>0)
  assert.deepEqual(errors,[])
  console.log(`PASS editor ${width}px: multiline, formatting, save/reopen, product selection, list`)
  await page.close()
 }
} finally {await browser.close()}
