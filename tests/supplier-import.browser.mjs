import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/BAMBA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const { expect } = require('C:/Users/BAMBA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
await mkdir('output/supplier-import', { recursive: true })
try {
 for (const width of [390,1440]) {
  const page = await browser.newPage({viewport:{width,height:1000}}); await page.clock.install()
  const errors=[], requests=[], saved=[];let planRequests=0
  page.on('pageerror',e=>errors.push(e.message))
  const report={id:'11111111-1111-4111-8111-111111111111',database_name:'demo.sql',blockers:[],warnings:[],modules:[{key:'facture_fourn',rows:52}],coverage:{groups:[],excluded:[],review:[]}}
  await page.route('**/api/**',route=>{
   const req=route.request(),path=new URL(req.url()).pathname.replace(/^\/api/,'')
   if(path==='/data-imports')return route.fulfill({json:{reports:[],limits:{database:104857600,documents:104857600,total:209715200}}})
   if(path.endsWith('/analyze'))return route.fulfill({status:201,json:report})
   if(path.endsWith('/runs'))return route.fulfill({json:{runs:path.endsWith('/supplier-invoices/runs')?[{result:{items:saved}}]:[]}})
   if(path.endsWith('/supplier-invoices/plan')){
    planRequests++;assert(req.headers()['content-type'].startsWith('multipart/form-data'));assert(req.postData().includes('demo.sql'))
    const rows=Array.from({length:51},(_,i)=>({source_id:String(i+1),origin_source_id:'0',reference:`FA-${i+1}`,client:'Fournisseur test',date:'2024-01-01',type:'standard',total:'118.00',paid:'30.00',credits:'0.00',remaining:'88.00',currency:'XOF',status:'ready',lines_count:1,issues:[],issues_count:0,warnings:i===0?['Échéance source absente : date de facture proposée.']:[]}))
    rows.push({...rows[0],source_id:'52',reference:'FA-52',status:'blocked',issues:['Facture classée payée avec un reste non expliqué.'],issues_count:1,warnings:[]})
    return route.fulfill({json:{session_token:'private-token',rows,summary:{total:52,ready:51,blocked:1,already_imported:0},blockers:[],notice:'Reprise historique : références et dates conservées.'}})
   }
   if(path.endsWith('/supplier-invoices/execute')){
    const body=req.postDataJSON();requests.push(body);assert.equal(body.confirmed,true);assert.equal(body.session_token,'private-token');assert(!('database' in body))
    if(requests.length===1)return route.fulfill({status:503,json:{message:'Interruption de test'}})
    assert.equal(body.ids.length,requests.length===2?50:1);saved.push(...body.ids.map(id=>({source_id:id})))
    return route.fulfill({json:{created:body.ids.length,payments_created:requests.length===2?1:0,already_processed:0}})
   }
   if(path==='/fournisseurs-reglements/factures/1')return route.fulfill({json:{id:1,numero:'SI-001',fournisseur_id:10,fournisseur:{id:10,nom:'Fournisseur test'},reference_fournisseur:'FOUR-001',objet:'Prestation historique',import_dolibarr:true,date_facture:'2024-01-01',date_echeance:'2024-02-01',statut:'partiellement_payee',montant_ht:'100.00',montant_tva:'18.00',total_ttc:'118.00',montant_paye:'30.00',reste_a_payer:'88.00',lignes_importees:[{id:1,designation:'Prestation historique',description:'Détail original',quantite:'1.000',unite:'service',prix_unitaire_ht:'100.00',taux_tva:'18.00',remise_pourcent:'0.00',total_ttc:'118.00'}]}})
   return route.fulfill({json:path.includes('/pilotage/')||/\/(stats|badges|summary)$/.test(path)?{}:[]})
  })
  await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html');await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor()
  await page.evaluate(()=>window.testNavigate('/importation'))
  await page.getByRole('button',{name:'Migrer depuis Dolibarr',exact:true}).click()
  await page.locator('#import-database').setInputFiles({name:'demo.sql',mimeType:'application/sql',buffer:Buffer.from('SQL test')})
  await page.getByRole('button',{name:'Analyser les fichiers'}).click()
  await page.getByLabel('Pays des tiers').fill('Sénégal');await page.getByLabel('Devise de la sauvegarde').fill('XOF')
  await page.getByRole('button',{name:'Continuer vers les données'}).click()
  await page.getByRole('button',{name:'Factures fournisseurs (52)',exact:true}).click()
  await page.getByRole('button',{name:'Contrôler les factures fournisseurs'}).click()
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
  await page.screenshot({path:`output/supplier-import/${width}.png`,fullPage:true})
  await page.getByRole('button',{name:'Vérifier le bilan',exact:true}).click()
  await expect(page.getByText('52 dans la sauvegarde · 51 traités dans les lots enregistrés')).toBeVisible()
  await page.evaluate(()=>window.testNavigate('/fournisseurs-reglements/factures/1'))
  await expect(page.getByRole('heading',{name:'SI-001',exact:true})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Lignes de la facture d’origine'})).toBeVisible()
  await expect(page.getByText('Détail original')).toBeVisible()
  await expect(page.getByRole('button',{name:'Enregistrer',exact:true})).toHaveCount(0)
  await page.screenshot({path:`output/supplier-import/native-${width}.png`,fullPage:true})
  assert.deepEqual(errors,[]);console.log(`PASS ${width}px: supplier import, native invoice lines, 51 documents in two batches, stable retry, one upload, exceptions and history`);await page.close()
 }
}finally{await browser.close()}
