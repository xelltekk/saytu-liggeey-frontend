import {createRequire} from 'node:module'
import {join} from 'node:path'
import {homedir} from 'node:os'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url), runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright')), {expect}=require(join(runtime,'playwright/test'))
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for(const kind of ['facture','devis']) {
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),writes=[],errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/api/**',route=>{
   const req=route.request()
   if(req.method()!=='GET'){writes.push(req.postDataJSON());return route.fulfill({json:{id:123,...req.postDataJSON()}})}
   return route.fulfill({json:{data:[{id:1,nom:'Client de contrôle',code:'CLI-1'}]}})
  })
  await page.goto('http://127.0.0.1:5187/tests/document-designation-harness.html?kind='+kind)
  const editor=page.getByRole('textbox',{name:'Désignation',exact:true})
  await expect(editor).toHaveText('Service initial')
  await editor.fill('Installation informatique');await editor.press('End');await editor.press('Enter');await page.keyboard.type('Configuration des postes et formation')
  await editor.press('Control+A');await page.getByRole('button',{name:'Souligné',exact:true}).click()
  await page.getByRole('button',{name:kind==='devis'?'Modifier le devis':'Modifier',exact:true}).click()
  await expect(page.getByText('Document enregistré',{exact:true})).toBeVisible()
  assert.equal(writes.length,1);assert(writes[0].lignes[0].designation.includes('\n'));assert(/<u>/.test(writes[0].lignes[0].designation_html))
  assert.equal(writes[0].lignes[0].prix_unitaire_ht,1000);assert.deepEqual(errors,[])
  await page.screenshot({path:join(process.env.SAYTU_TEST_OUTPUT,kind+'-form.png'),fullPage:true})
  console.log('PASS real '+kind+' form: formatted payload and unchanged amounts')
  await page.close()
 }
}finally{await browser.close()}
