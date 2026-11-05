import {createRequire} from 'node:module'
import {join} from 'node:path'
import {homedir} from 'node:os'
import {mkdir} from 'node:fs/promises'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'))
const out=process.env.SAYTU_TEST_OUTPUT;await mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true})
try{for(const width of [360,1440]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[],writes=[]
 let rows=[{id:1,client_nom:'Essai inutilisé',numero:'ESSAI-1',plan:'pro',plan_label:'Pro',statut:'essai',montant_mensuel:25000,devise:'XOF',date_fin:'2026-10-05',modules_autorises:[],modules_count:18}],archived=[],fail=true
 const payload=()=>({licences:rows,archived_licences:archived,clients:[],upcoming_renewals:[]})
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',route=>{
  const req=route.request()
  if(req.method()==='POST'){
   writes.push(req.url())
   if(fail){fail=false;return route.fulfill({status:409,json:{message:'Archivage impossible pour ce test.'}})}
   if(req.url().endsWith('/archiver')){archived=[{...rows[0],archived_at:'2026-11-05 12:00:00',statut:'suspendue'}];rows=[]}
   else if(req.url().endsWith('/restaurer')){rows=[{...archived[0],archived_at:null}];archived=[]}
  }
  return route.fulfill({json:payload()})
 })
 await page.goto('http://127.0.0.1:5187/tests/renewal-harness.html?admin')
 const filter=page.getByRole('combobox',{name:'Liste des licences'}), row=page.locator('.xell-licence-row')
 await expect(row).toHaveCount(1)
 await row.getByRole('button',{name:'Archiver',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Son accès sera suspendu')
 await page.getByRole('dialog').getByRole('button',{name:'Annuler',exact:true}).click();assert.equal(writes.length,0)
 await row.getByRole('button',{name:'Archiver',exact:true}).click()
 await page.getByRole('dialog').getByRole('button',{name:'Archiver',exact:true}).click()
 await expect.poll(()=>writes.length).toBe(1);await expect(row).toHaveCount(1)
 await expect(row.getByRole('button',{name:'Archiver',exact:true})).toBeEnabled()
 await row.getByRole('button',{name:'Archiver',exact:true}).click()
 await page.getByRole('dialog').getByRole('button',{name:'Archiver',exact:true}).click()
 await expect(row).toHaveCount(0)
 await filter.selectOption('archived');await expect(row).toHaveCount(1)
 await expect(row.getByRole('button',{name:'Réactiver',exact:true})).toHaveCount(0)
 await expect(row).toContainText('accès suspendu');await expect(row).toContainText('05/11/2026');await expect(row).not.toContainText('Invalid Date')
 await row.scrollIntoViewIfNeeded();await page.screenshot({path:join(out,`archive-${width}.png`)})
 await row.getByRole('button',{name:'Restaurer',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('restera suspendue')
 await page.getByRole('dialog').getByRole('button',{name:'Restaurer',exact:true}).click();await expect(row).toHaveCount(0)
 await filter.selectOption('current');await expect(row).toHaveCount(1)
 await expect(row.getByRole('button',{name:'Réactiver',exact:true})).toBeVisible()
 assert.equal(writes.length,3);assert.deepEqual(errors,[])
 console.log(`PASS ${width}px: cancel, failed archive preserves row, archive filter, restore remains suspended`)
 await page.close()
}}finally{await browser.close()}
