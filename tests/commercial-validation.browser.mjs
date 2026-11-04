import {createRequire} from 'node:module'
import {join} from 'node:path'
import {homedir} from 'node:os'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url), runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright')), {expect}=require(join(runtime,'playwright/test'))
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for(const kind of ['produit','facture','devis']) {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),writes=[],errors=[]
  let mode='offline'
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/api/**',async route=>{
   const req=route.request()
   if(req.method()!=='GET'){
    writes.push(req.postDataJSON())
    if(mode==='offline') return route.abort('failed')
    if(mode==='validation') return route.fulfill({status:422,json:{errors:{[kind==='produit'?'libelle':'lignes.0.designation']:['Valeur à corriger sur le serveur.']}}})
    await new Promise(resolve=>setTimeout(resolve,300))
    return route.fulfill({json:{id:123,...req.postDataJSON()}})
   }
   return route.fulfill({json:{data:[{id:1,nom:'Client de contrôle',code:'CLI-1'}]}})
  })
  await page.goto('http://127.0.0.1:5187/tests/tax-select-harness.html?kind='+kind+'&mode=edit')
  const input=kind==='produit'?page.locator('[data-validation-field="libelle"]'):page.getByRole('textbox',{name:'Désignation',exact:true})
  await input.fill('   ')
  const submit=page.locator('button[type=submit]')
  await submit.click()
  await expect(page.locator('[role=alert]')).toContainText('ne doit pas être vide')
  await expect(input).toBeFocused()
  assert.equal(writes.length,0)
  await input.fill('Service corrigé')
  if(kind!=='produit') {
   const quantity=page.locator('[data-validation-field="lignes.0.quantite"]')
   await quantity.fill('0');await submit.click()
   await expect(page.locator('[role=alert]')).toContainText('0.001')
   assert.equal(writes.length,0);await quantity.fill('1')
   const date=page.locator('[data-validation-field="'+(kind==='devis'?'date_validite':'date_echeance')+'"]')
   await date.fill('2026-10-01');await submit.click()
   await expect(page.locator('[role=alert]')).toContainText('ne doit pas précéder')
   assert.equal(writes.length,0);await date.fill('2026-12-03')
  }
  await submit.click()
  await expect(page.locator('[role=alert]')).toContainText('Connexion interrompue')
  if(kind==='produit') await expect(input).toHaveValue('Service corrigé')
  else await expect(input).toHaveText('Service corrigé')
  mode='validation';await submit.click()
  await expect(page.locator('[role=alert]')).toContainText('Valeur à corriger sur le serveur')
  await expect(input).toBeFocused()
  await page.screenshot({path:join(process.env.SAYTU_TEST_OUTPUT,kind+'-validation.png'),fullPage:true})
  mode='success';const before=writes.length
  await submit.click();await submit.press('Enter')
  await expect(page.getByText('Document enregistré',{exact:true})).toBeVisible()
  assert.equal(writes.length,before+1)
  assert.deepEqual(errors,[])
  console.log('PASS '+kind+': inline errors, focus, no invalid write, retained input after network failure, 422, single pending save')
  await page.close()
 }
 const page=await browser.newPage(), writes=[]
 await page.route('**/api/**',route=>{
  const req=route.request()
  if(req.url().endsWith('/image')) return route.abort('failed')
  if(req.method()==='POST'){writes.push(req.postDataJSON());return route.fulfill({json:{id:456,reference:'TEST',...req.postDataJSON()}})}
  return route.fulfill({json:{data:[]}})
 })
 await page.goto('http://127.0.0.1:5187/tests/tax-select-harness.html?kind=produit&mode=new')
 await page.locator('[data-validation-field="libelle"]').fill('Produit avec photo')
 await page.locator('input[type=file]').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')})
 await page.locator('button[type=submit]').click()
 await expect(page.getByText('Document enregistré',{exact:true})).toBeVisible()
 assert.equal(writes.length,1)
 console.log('PASS product saved event after image failure: one product created, no creation retry')
 await page.close()
}finally{await browser.close()}
