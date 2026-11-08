import {createRequire} from 'node:module';import {join} from 'node:path';import {homedir} from 'node:os';import {mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'));
const browser=await chromium.launch({channel:'msedge',headless:true});await mkdir('output/recurring-expenses',{recursive:true});
try{for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];let items=[],paid=false,postCount=0,payCount=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>{const req=route.request(),p=new URL(req.url()).pathname.replace(/^\/api/,'');
  if(p==='/agenda/depenses-recurrentes'){
   if(req.method()==='POST'){postCount++;items=[{...req.postDataJSON(),id:1,payments_count:0,next_due_date:'2026-11-10'}];return route.fulfill({status:201,json:items[0]});}
   return route.fulfill({json:{items,occurrences:items.length?[{expense_id:1,title:items[0].title,supplier:'Opérateur',date:'2026-11-10',amount:25000,paid,paid_on:paid?'2026-11-08':null,status:paid?'payee':'a_payer'}]:[]}});
  }
  if(p.endsWith('/1/paiement')){payCount++;paid=true;items[0].next_due_date='2027-01-10';return route.fulfill({json:{id:1}});}
  assert.equal(req.method(),'GET');
  return route.fulfill({json:p==='/societe/identite'?{devise_defaut:'XOF'}:{}});
 });
 await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html');await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor();
 await page.evaluate(()=>window.testNavigate('/agenda/depenses?month=2026-11'));
 await page.getByRole('button',{name:'+ Dépense récurrente',exact:true}).click();
 await page.getByLabel('Libellé *',{exact:true}).fill('Connexion internet');await page.getByLabel('Première échéance *',{exact:true}).fill('2026-11-10');
 await page.getByLabel('Périodicité *',{exact:false}).selectOption('2');await page.getByLabel('Rappel avant l’échéance (jours) *',{exact:false}).fill('5');
 await page.getByLabel('Montant indicatif (XOF)',{exact:true}).fill('25000');await page.getByRole('button',{name:'Enregistrer',exact:true}).click();
 await expect.poll(()=>postCount).toBe(1);assert.equal(items[0].interval_months,2);assert.equal(items[0].reminder_days,5);
 await page.getByRole('button',{name:'Marquer payée',exact:true}).click();await page.getByLabel('Date du paiement',{exact:false}).fill('2026-11-08');
 await page.getByRole('button',{name:'Confirmer le paiement',exact:true}).click();await expect.poll(()=>payCount).toBe(1);
 await expect(page.getByText('Payée le 08/11/2026',{exact:true})).toBeVisible();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 await expect(page.getByRole('dialog')).toHaveCount(0);await page.screenshot({path:`output/recurring-expenses/${width}.png`,fullPage:true});console.log('PASS '+width+': create, custom recurrence/reminder, mark paid, no overflow');await page.close();
}}finally{await browser.close()}
