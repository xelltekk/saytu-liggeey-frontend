import {createRequire} from 'node:module'
import {mkdir} from 'node:fs/promises'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url)
const {chromium}=require('C:/Users/BAMBA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const {expect}=require('C:/Users/BAMBA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test')
const browser=await chromium.launch({channel:'msedge',headless:true})
await mkdir('output/quote-import-selection',{recursive:true})
function row(id,{code='2',blocked=false,lines=1}={}){
 return {source_id:String(id),reference:`PR-${id}`,client:'Client test',date:'2024-01-01',validity:'2024-02-01',source_status:code==='2'?'Accepté':'Validé',source_status_code:code,currency:'XOF',status:blocked?'blocked':'ready',issues:blocked?['Client non rattaché.']:[],warnings:[],totals:{total_ht:'100',total_tva:'18',total_ttc:'118'},line_totals:{total_ht:'100',total_tva:'18',total_ttc:'118'},lines:Array.from({length:lines},(_,i)=>({source_id:`${id}${String(i).padStart(4,'0')}`,designation:`Prestation ${id}-${i}`,type:'service',quantity:'1',price:'100',discount:'0',vat:'18',unit_suggestion:'',source_unit:'0',issues:[],totals:{total_ht:'100',total_tva:'18',total_ttc:'118'}}))}
}
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1100}}),errors=[],writes=[]
  let rows=[row(1),row(2,{code:'1'}),row(3,{blocked:true})]
  page.on('pageerror',e=>errors.push(e.message))
  const report={id:'11111111-1111-4111-8111-111111111111',database_name:'demo.sql',blockers:[],warnings:[],modules:[{key:'propal',rows:3}],coverage:{groups:[],excluded:[],review:[]}}
  await page.route('**/api/**',route=>{
   const req=route.request(),path=new URL(req.url()).pathname
   if(path==='/api/data-imports')return route.fulfill({json:{reports:[],limits:{database:104857600,documents:104857600,total:209715200}}})
   if(path.endsWith('/analyze'))return route.fulfill({status:201,json:report})
   if(path.endsWith('/runs'))return route.fulfill({json:{runs:[]}})
   if(path.endsWith('/quotes/preview'))return route.fulfill({json:{execution_available:true,preview_token:'token',blockers:[],warnings:[],summary:{ready:rows.filter(r=>r.status==='ready').length,review:0,blocked:rows.filter(r=>r.status==='blocked').length},status_options:{'1':['brouillon','envoye'],'2':['accepte']},rows}})
   if(path.endsWith('/quotes/execute')){
    assert(req.headers()['content-type'].startsWith('multipart/form-data'))
    const body=req.postData(),decisions=JSON.parse(body.match(/name="decisions_json"\r\n\r\n([^\r]+)/)[1]);writes.push(decisions)
    assert(body.includes('name="payment_days"\r\n\r\n30'))
    assert.deepEqual(decisions.map(d=>d.source_id),['1','2'])
    assert.deepEqual(decisions.map(d=>d.status),['accepte','envoye'])
    assert(decisions.every(d=>Object.values(d.units).every(unit=>unit==='service')))
    return route.fulfill({json:{run_id:1,created:2,lines_created:2,already_processed:0}})
   }
   return route.fulfill({json:path.includes('/pilotage/')||/\/(stats|badges|summary)$/.test(path)?{}:[]})
  })
  await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html')
  await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor()
  await page.evaluate(async()=>{const {installInputMasks}=await import('/src/utils/inputMasks.js');installInputMasks()})
  await page.evaluate(()=>window.testNavigate('/importation'))
  await page.getByRole('button',{name:'Migrer depuis Dolibarr',exact:true}).click()
  await page.locator('#import-database').setInputFiles({name:'demo.sql',mimeType:'application/sql',buffer:Buffer.from('SQL test')})
  await page.getByRole('button',{name:'Analyser les fichiers'}).click()
  await page.getByLabel('Pays des tiers').fill('Sénégal');await page.getByLabel('Devise de la sauvegarde').fill('XOF')
  await page.getByRole('button',{name:'Continuer vers les données'}).click()
  await page.getByRole('button',{name:'Devis (3)',exact:true}).click()
  const check=page.getByRole('button',{name:'Contrôler les devis',exact:true})
  await check.click()
  const first=page.getByRole('checkbox',{name:'PR-1 · Client test · 118 XOF',exact:true})
  await page.getByText('PR-1 · Client test · 118 XOF',{exact:true}).click()
  await expect(first).toBeChecked()
  await first.dispatchEvent('change');await expect(first).toBeChecked()
  await first.focus();await page.keyboard.press('Space');await expect(first).not.toBeChecked()
  await page.keyboard.press('Space');await expect(first).toBeChecked()
  await page.getByRole('button',{name:'Sélectionner cette page',exact:true}).click()
  await expect(page.getByText(/2 devis \/ 50 maximum/)).toBeVisible()
  await expect(page.getByRole('checkbox',{name:/PR-3/})).toHaveCount(0)
  await expect(page.getByLabel('Statut Saytu (source : Accepté)')).toHaveValue('accepte')
  await expect(page.getByText('Choisissez le statut Saytu du devis PR-2.',{exact:true})).toBeVisible()
  await page.getByLabel('Statut Saytu (source : Validé)').selectOption('envoye')
  await page.getByLabel('Délai de paiement à appliquer à ce lot (jours)').fill('30')
  await page.getByRole('checkbox',{name:/J’accepte cette reprise partielle/}).check()
  await expect(page.getByRole('button',{name:'Importer les devis sélectionnés',exact:true})).toBeDisabled()
  await page.getByRole('checkbox',{name:/Je confirme les montants/}).check()
  await expect(page.getByRole('button',{name:'Importer les devis sélectionnés',exact:true})).toBeEnabled()
  await page.screenshot({path:`output/quote-import-selection/ready-${width}.png`,fullPage:true})
  await page.getByRole('button',{name:'Importer les devis sélectionnés',exact:true}).click()
  await expect(page.getByText('Lot n° 1 enregistré',{exact:true})).toBeVisible();assert.equal(writes.length,1)
  rows=Array.from({length:61},(_,i)=>row(i+1));await check.click()
  const nav=page.getByRole('navigation',{name:'Pages de l’aperçu devis'})
  for(let i=0;i<3;i++){
   await page.getByRole('button',{name:'Sélectionner cette page',exact:true}).click()
   if(i<2)await nav.getByRole('button',{name:'Suivant',exact:true}).click()
  }
  await expect(page.getByText(/50 devis \/ 50 maximum/)).toBeVisible()
  await expect(page.getByRole('checkbox',{name:'PR-51 · Client test · 118 XOF',exact:true})).not.toBeChecked()
  await expect(page.getByRole('alert')).toContainText('limité à 50 devis')
  rows=[row(1,{lines:1001})];await check.click()
  await page.getByRole('button',{name:'Sélectionner cette page',exact:true}).click()
  await expect(page.getByText(/0 devis \/ 50 maximum/)).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('1 000 lignes')
  assert.equal(writes.length,1);assert.deepEqual(errors,[])
  console.log(`PASS ${width}px: label, keyboard, repeated change, bulk selection, explicit requirements, successful simulated import and batch limits`)
  await page.close()
 }
}finally{await browser.close()}
