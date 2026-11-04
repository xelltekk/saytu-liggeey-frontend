import {createRequire} from 'node:module'
import {join} from 'node:path'
import {homedir} from 'node:os'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url), runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright')), {expect}=require(join(runtime,'playwright/test'))
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for(const width of [360,1440]) {
  const page=await browser.newPage({viewport:{width,height:1000}}), errors=[], writes=[], previews=[]
  let company={id:77,nom:'Société exemple',email:'contact@example.test',ville:'Dakar',pays:'Sénégal',couleur_principale:'#126789',devise_defaut:'XOF',tva_defaut:18}
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/api/**',route=>{
   const req=route.request(),url=req.url()
   if(url.includes('/apercu?')){previews.push(url);return route.fulfill({contentType:'application/pdf',body:'%PDF-1.4 example'})}
   if(url.endsWith('/logo')){company={...company,logo:'/test-logo.png'};return route.fulfill({json:{societe:company,logo:company.logo}})}
   if(req.method()==='PUT'){writes.push(req.postDataJSON());company={...company,...req.postDataJSON()};return route.fulfill({json:{societe:company}})}
   return route.fulfill({json:company})
  })
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')
  await page.route('**/test-logo.png*',route=>route.fulfill({contentType:'image/png',body:png}))
  await page.goto('http://127.0.0.1:5187/tests/company-branding-harness.html')
  await expect(page.getByRole('heading',{name:'Ma société',exact:true})).toBeVisible()
  const name=page.getByPlaceholder('Ex. : Votre société SARL').first()
  await name.fill('Identité personnalisée')
  await page.locator('input[type=file]').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:png})
  await expect(page.getByRole('img',{name:'Logo',exact:true})).toBeVisible()
  await expect(name).toHaveValue('Identité personnalisée')
  await page.getByRole('button',{name:'💾 Enregistrer',exact:true}).click()
  await expect.poll(()=>writes.length).toBe(1)
  assert.equal(writes[0].nom,'Identité personnalisée');assert.equal(writes[0].logo,undefined)
  for(const kind of ['facture','devis']) {
   await page.getByRole('button',{name:'Aperçu '+kind,exact:true}).click()
   await expect.poll(()=>previews.some(u=>u.endsWith('type='+kind))).toBe(true)
  }
  await page.getByRole('heading',{name:'Ma société',exact:true}).scrollIntoViewIfNeeded()
  await page.screenshot({path:join(process.env.SAYTU_TEST_OUTPUT,'company-'+width+'.png')})
  assert.deepEqual(errors,[])
  console.log('PASS company settings '+width+': logo upload preserves edits, save, invoice/quote preview')
  await page.close()
 }
}finally{await browser.close()}
