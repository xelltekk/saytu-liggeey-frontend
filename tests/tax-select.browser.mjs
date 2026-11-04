import {createRequire} from 'node:module'
import {join} from 'node:path'
import {homedir} from 'node:os'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url), runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright')), {expect}=require(join(runtime,'playwright/test'))
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for(const kind of ['produit','facture','devis']) {
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),writes=[],errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/api/**',route=>{
   const req=route.request()
   if(req.method()!=='GET'){writes.push(req.postDataJSON());return route.fulfill({json:{id:123,...req.postDataJSON()}})}
   return route.fulfill({json:{data:[{id:1,nom:'Client de contrôle',code:'CLI-1'}]}})
  })
  const url='http://127.0.0.1:5187/tests/tax-select-harness.html?kind='+kind
  const tax=page.getByRole('combobox',{name:'TVA (%)',exact:true}).first()
  await page.goto(url+'&mode=new')
  await expect(tax).toHaveValue('18')
  assert.deepEqual(await tax.locator('option').allTextContents(),['0 %','18 %'])
  for(const mode of ['edit','empty']) {
   await page.goto(url+'&mode='+mode)
   await expect(tax).toHaveValue(mode==='empty'?'18':'0')
   for(const rate of [0,18]) {
    await tax.selectOption(String(rate))
    await page.locator('button[type=submit]').click()
    await expect.poll(()=>writes.length).toBeGreaterThan(0)
    await expect(page.getByText('Document enregistré',{exact:true})).toBeVisible()
    await expect.poll(()=>kind==='produit'?writes.at(-1)?.taux_tva:writes.at(-1)?.lignes[0].taux_tva).toBe(rate)
   }
  }
  await page.goto(url+'&tax=10')
  await expect(tax).toHaveValue('10')
  await expect(tax.locator('option[value="10"]')).toHaveAttribute('disabled', '')
  await page.setViewportSize({width:360,height:800})
  await expect(tax).toBeVisible()
  assert.deepEqual(errors,[])
  console.log('PASS '+kind+': default 18, choices 0/18, saved numeric rates, empty recovery, legacy preservation, mobile')
  await page.close()
 }
}finally{await browser.close()}
