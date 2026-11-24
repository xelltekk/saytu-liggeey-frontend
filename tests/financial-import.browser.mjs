import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/BAMBA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const { expect } = require('C:/Users/BAMBA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
await mkdir('output/financial-import', { recursive: true })
try {
 for (const width of [390,1440]) {
  const page = await browser.newPage({viewport:{width,height:1000}}); await page.clock.install()
  const errors=[], requests=[], saved=[];let planRequests=0
  page.on('pageerror',e=>errors.push(e.message))
  const report={id:'11111111-1111-4111-8111-111111111111',database_name:'demo.sql',blockers:[],warnings:[],modules:[{key:'facture',rows:52}],coverage:{groups:[],excluded:[],review:[]}}
  await page.route('**/api/**',route=>{
   const req=route.request(),path=new URL(req.url()).pathname.replace(/^\/api/,'')
   if(path==='/data-imports')return route.fulfill({json:{reports:[],limits:{database:104857600,documents:104857600,total:209715200}}})
   if(path.endsWith('/analyze'))return route.fulfill({status:201,json:report})
   if(path.endsWith('/runs'))return route.fulfill({json:{runs:path.endsWith('/invoices/runs')?[{result:{items:saved}}]:[]}})
   if(path.endsWith('/invoices/plan')){
    planRequests++;assert(req.headers()['content-type'].startsWith('multipart/form-data'));assert(req.postData().includes('demo.sql'))
    const rows=Array.from({length:51},(_,i)=>({source_id:String(i+1),origin_source_id:'0',reference:`FA-${i+1}`,client:'Client test',date:'2024-01-01',type:'standard',total:'118.00',paid:'30.00',credits:'20.00',remaining:'68.00',currency:'XOF',status:'ready',lines_count:1,issues:[],issues_count:0,warnings:i===0?['Échéance source absente : date de facture proposée.']:[]}))
    rows.push({...rows[0],source_id:'52',reference:'FA-52',status:'blocked',issues:['Facture classée payée avec un reste non expliqué.'],issues_count:1,warnings:[]})
    return route.fulfill({json:{session_token:'private-token',rows,summary:{total:52,ready:51,blocked:1,already_imported:0},blockers:[],notice:'Reprise historique : références et dates conservées.'}})
   }
   if(path.endsWith('/invoices/execute')){
    const body=req.postDataJSON();requests.push(body);assert.equal(body.confirmed,true);assert.equal(body.session_token,'private-token');assert(!('database' in body))
    if(requests.length===1)return route.fulfill({status:503,json:{message:'Interruption de test'}})
    assert.equal(body.ids.length,requests.length===2?50:1);saved.push(...body.ids.map(id=>({source_id:id})))
    return route.fulfill({json:{created:body.ids.length,payments_created:requests.length===2?1:0,already_processed:0}})
   }
   return route.fulfill({json:path.includes('/pilotage/')||/\/(stats|badges|summary)$/.test(path)?{}:[]})
  })
  await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html');await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor()
  await page.evaluate(()=>window.testNavigate('/importation'))
  await page.getByRole('button',{name:'Migrer depuis Dolibarr',exact:true}).click()
  await page.locator('#import-database').setInputFiles({name:'demo.sql',mimeType:'application/sql',buffer:Buffer.from('SQL test')})
  await page.getByRole('button',{name:'Analyser les fichiers'}).click()
  await page.getByLabel('Pays des tiers').fill('Sénégal');await page.getByLabel('Devise de la sauvegarde').fill('XOF')
  await page.getByRole('button',{name:'Continuer vers les données'}).click()
  await page.getByRole('button',{name:'Factures et paiements (52)',exact:true}).click()
  await page.getByRole('button',{name:'Contrôler les factures et règlements'}).click()
  await expect(page.getByText('1 facture(s) sans échéance', {exact:false})).toBeVisible()
  await expect(page.getByRole('button',{name:'Importer les documents prêts'})).toBeDisabled()
  await page.getByRole('checkbox',{name:/Je confirme le transfert/}).check()
  await page.getByRole('button',{name:'Importer les documents prêts'}).click()
  await expect(page.getByRole('alert')).toContainText('Interruption de test')
  await page.getByRole('button',{name:'Reprendre le transfert'}).click();await page.clock.fastForward(3000)
  await expect.poll(()=>requests.length).toBe(2);await page.clock.fastForward(3000)
  await expect.poll(()=>requests.length).toBe(3)
  await expect(page.getByText(/Transfert terminé : 51 document/)).toBeVisible()
  assert.equal(requests[0].request_id,requests[1].request_id);assert.notEqual(requests[1].request_id,requests[2].request_id);assert.equal(planRequests,1)
  await page.getByRole('combobox',{name:'Filtrer les documents'}).selectOption('blocked')
  await expect(page.getByText('FA-52',{exact:true}).filter({visible:true})).toBeVisible();await expect(page.getByText('Facture classée payée avec un reste non expliqué.').filter({visible:true})).toBeVisible()
  await page.screenshot({path:`output/financial-import/${width}.png`,fullPage:true})
  await page.getByRole('button',{name:'Vérifier le bilan',exact:true}).click()
  await expect(page.getByText('52 dans la sauvegarde · 51 traités dans les lots enregistrés')).toBeVisible()
  assert.deepEqual(errors,[]);console.log(`PASS ${width}px: financial import, 51 documents in two batches, stable retry, one upload, exceptions and history`);await page.close()
 }
}finally{await browser.close()}
