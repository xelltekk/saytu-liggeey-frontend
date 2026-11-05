import {createRequire} from 'node:module'
import {join} from 'node:path'
import {homedir} from 'node:os'
import {mkdir} from 'node:fs/promises'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'))
const out=process.env.SAYTU_TEST_OUTPUT;await mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true})
const renewal={due_date:'2026-11-12',days_remaining:7,stage:'j7',monthly_amount:12000,amount:36000,months:3,currency:'XOF',message:'Votre abonnement arrive à échéance dans 7 jours.'}
const licence={id:1,configured:true,client_nom:'Client exemple',plan:'business',plan_label:'Business',statut:'actif',etat:'active',etat_label:'Active',date_fin:'2026-11-12',montant_mensuel:12000,devise:'XOF',modules_autorises:[],is_active:true,is_blocking:false,signature_valid:true}
try{
 for(const width of [360,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[],posts=[];let tickets=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/api/**',route=>{
   const req=route.request(),url=req.url()
   if(req.method()==='POST'){posts.push(req.postDataJSON());tickets=[{id:9,numero:'TEST-9',categorie:'renouvellement',statut:'ouvert',sujet:'Demande de renouvellement',messages:[]}];return route.fulfill({json:{ticket:tickets[0]}})}
   if(url.includes('/support/tickets'))return route.fulfill({json:{tickets}})
   if(url.includes('/admin/xelltekk'))return route.fulfill({json:{licences:[],clients:[],upcoming_renewals:[{...licence,renewal},{...licence,id:2,client_nom:'Client gratuit',renewal:{...renewal,days_remaining:1,monthly_amount:0,amount:0}},{...licence,id:3,client_nom:'Client mensuel',renewal:{...renewal,days_remaining:25}}]}})
   return route.fulfill({json:{licence,portal:{workspace:{tenant_id:1,client_id:1},subscription:{renewal,monthly_amount:12000,currency:'XOF',invoices:[],payment_requests:[]},support:{tickets}}}})
  })
  await page.goto('http://127.0.0.1:5187/tests/renewal-harness.html')
  const section=page.locator('#licence-renouvellement')
  await expect(section).toContainText('36 000 XOF')
  const button=section.getByRole('button',{name:'Renouveler mon abonnement',exact:true})
  await button.click()
  await expect(page.getByRole('dialog')).toContainText('36 000 XOF')
  await page.getByRole('button',{name:'Annuler',exact:true}).click();assert.equal(posts.length,0)
  await button.click();await page.getByRole('button',{name:'Créer la demande',exact:true}).click()
  await expect(section.getByRole('button',{name:'Demande en cours',exact:true})).toBeDisabled()
  assert.equal(posts.length,1);assert.equal(posts[0].categorie,'renouvellement');assert.match(posts[0].description,/36\s000 XOF/)
  await page.reload();await expect(section.getByRole('button',{name:'Demande en cours',exact:true})).toBeDisabled()
  await section.scrollIntoViewIfNeeded();await page.screenshot({path:join(out,`renewal-client-${width}.png`)})
  await page.goto('http://127.0.0.1:5187/tests/renewal-harness.html?admin')
  const table=page.locator('#echeances-abonnements')
  await expect(table.locator('tbody tr')).toHaveCount(3)
  await table.getByRole('combobox').selectOption('1')
  await expect(table.locator('tbody tr')).toHaveCount(1)
  await expect(table).toContainText('Client gratuit');await expect(table).toContainText('0 XOF')
  await table.scrollIntoViewIfNeeded();await page.screenshot({path:join(out,`renewal-admin-${width}.png`)})
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'page overflow')
  assert.deepEqual(errors,[]);console.log(`PASS ${width}px: negotiated price, confirmation/cancel, request, pending/reload, admin filter, free plan`)
  await page.close()
 }
}finally{await browser.close()}
