import { createRequire } from 'node:module'
import { join } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url)
const runtime=process.env.SAYTU_TEST_RUNTIME||join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright'))
const {expect}=require(join(runtime,'playwright/test'))
const output=join(tmpdir(),'codex-leasing-history');await mkdir(output,{recursive:true})
const base='http://127.0.0.1:5179/tests/browser/leasing-workflow.html'
const browser=await chromium.launch({channel:'msedge',headless:true})
try{
 for(const width of [360,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900}})
  await context.addInitScript(()=>localStorage.setItem('xelltekk_user',JSON.stringify({role:'admin'})))
  const page=await context.newPage(),errors=[],writes=[],unexpected=[]
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',route=>route.abort())
  const payload={client_id:1,tva:18,rentalFee:25000,blackPrice:20,colorPrice:60,largeColor:0,a4:true,verified:true,reports:[
   {date:'2026-08-24',serial:'TEST12345',counters:{102:405666,409:139696,112:5}},
   {date:'2026-10-27',serial:'TEST12345',counters:{102:408785,409:141377,112:6}},
  ]}
  const detail={id:9,serial:'TEST12345',date_debut:'2026-08-24',date_fin:'2026-10-27',client:{id:1,nom:'Client fictif'},
   facture:{id:77,numero:'FA-FICTIVE-77',statut:'brouillon',total_ht:154580,total_tva:27824.4,total_ttc:182404.4},
   payload,revision:1,invoice_token:'f'.repeat(64),modifiable:true,blocage:null,revisions:[{id:1,numero:1,auteur:'Utilisateur fictif',motif:'Création initiale',created_at:'2026-10-30T12:00:00Z',payload:structuredClone(payload),facture_snapshot:{statut:'brouillon',total_ht:154580,total_tva:27824.4,total_ttc:182404.4}}]}
  const paid={...structuredClone(detail),id:10,modifiable:false,blocage:'Facture payée : régularisation comptable nécessaire.',facture:{...detail.facture,id:78,numero:'FA-FICTIVE-78',statut:'payee'}}
  await page.route('**/api/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname
   if(path==='/api/leasing/comparaisons/9'&&request.method()==='PUT'){
    const data=request.postDataJSON();writes.push({path,data})
    assert.equal(data.expected_revision,1);assert.equal(data.invoice_token,'f'.repeat(64));assert.equal(data.reports[1].counters[102],408795)
    detail.payload=data;detail.revision=2;detail.facture.total_ht=154780;detail.facture.total_ttc=182640.4
    detail.revisions.unshift({id:2,numero:2,auteur:'Utilisateur fictif',motif:data.motif,created_at:'2026-10-30T13:00:00Z',payload:structuredClone(data),facture_snapshot:{...detail.facture}})
    return route.fulfill({json:{facture:detail.facture,suivi:{id:9,revision:2}}})
   }
   if(request.method()!=='GET'){unexpected.push(request.method()+' '+path);return route.fulfill({status:500,json:{message:'Unexpected test write'}})}
   if(path==='/api/leasing/comparaisons')return route.fulfill({json:{data:[detail,paid],total:2,current_page:1,last_page:1,from:1,to:2}})
   if(path==='/api/leasing/comparaisons/9')return route.fulfill({json:detail})
   if(path==='/api/leasing/comparaisons/10')return route.fulfill({json:paid})
   if(path.endsWith('/referentiels'))return route.fulfill({json:{clients:[],produits:[],imprimantes_disponibles:[]}})
   if(path.endsWith('/stats'))return route.fulfill({json:{}})
   if(/\/leasing\/(contrats|imprimantes|releves|interventions)$/.test(path))return route.fulfill({json:{data:[],current_page:1,last_page:1,total:0}})
   unexpected.push(path);return route.fulfill({status:500,json:{message:'Unexpected fixture'}})
  })
  await page.goto(base+'#/leasing?tab=releves')
  const history=page.getByRole('region',{name:'Comparaisons facturées',exact:true})
  await history.getByRole('button',{name:/Voir le suivi/}).first().click()
  await expect(history.getByRole('heading',{name:'Suivi du relevé · FA-FICTIVE-77',exact:true})).toBeVisible()
  await history.getByRole('link',{name:'Corriger le relevé',exact:true}).click()
  await expect(page.getByLabel('102 · Total 2 · récent',{exact:true})).toHaveValue('408785')
  await page.getByLabel('102 · Total 2 · récent',{exact:true}).fill('408795')
  await page.getByRole('checkbox').nth(0).check();await page.getByRole('checkbox').nth(1).check()
  await page.getByRole('button',{name:'Calculer la consommation',exact:true}).click()
  await expect(page.getByLabel('Forfait de location HT (FCFA)',{exact:true})).toHaveValue('25000')
  await page.getByLabel('Motif de correction',{exact:true}).fill('Correction vérifiée avec le PDF original')
  await page.getByRole('checkbox').last().check()
  await page.getByRole('button',{name:'Enregistrer la correction',exact:true}).click()
  await page.getByRole('link',{name:'Voir le relevé et son suivi',exact:true}).click()
  await expect(history.getByRole('heading',{name:'Suivi du relevé · FA-FICTIVE-77',exact:true})).toBeVisible()
  await expect(history.getByText(/Version 2/).first()).toBeVisible()
  await history.getByText(/Version 1 ·/).click()
  await expect(history.getByText('408 785',{exact:true})).toBeVisible()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  const currentValue=await history.getByText('408 795',{exact:true}).first().boundingBox()
  assert.ok(currentValue.x>=0&&currentValue.x+currentValue.width<=width,'Both counters must fit on mobile without scrolling')
  await history.getByRole('heading',{name:'Suivi du relevé · FA-FICTIVE-77',exact:true}).evaluate(e=>e.scrollIntoView({block:'start'}))
  await page.screenshot({path:join(output,`history-${width}.png`)})
  await history.getByRole('button',{name:'Historique',exact:true}).click()
  await history.getByRole('button',{name:/Voir le suivi/}).last().click()
  await expect(history.getByText('Facture payée : régularisation comptable nécessaire.',{exact:true})).toBeVisible()
  await expect(history.getByRole('link',{name:'Corriger le relevé',exact:true})).toHaveCount(0)
  await page.goto(base+'#/leasing?tab=releves&vue=comparaison&correction=10')
  await expect(page.getByRole('alert')).toContainText('Facture payée')
  await expect(page.getByRole('button',{name:'Calculer la consommation',exact:true})).toBeDisabled()
  assert.equal(writes.length,1);assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[])
  console.log('PASS '+width+'px: archived values, draft correction with reason, same invoice, preserved version, locked paid invoice; no real writes')
  await context.close()
 }
}finally{await browser.close()}
