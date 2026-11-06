import {createRequire} from 'node:module';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(join(runtime,'playwright'));
const {expect}=require(join(runtime,'playwright/test'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const out=process.env.SAYTU_TEST_OUTPUT||'output/application-theme';await mkdir(out,{recursive:true});
const client={id:1,code:'CLI-001',nom:'Société de démonstration',type:'client',statut:'actif',email:'demo@example.test',tags:[],commercial_summary:{ca_total:150000,reste_a_payer:50000,factures_count:2,factures_retard_count:1}};
const product={id:1,reference:'PR-001',libelle:'Ordinateur portable',type:'produit',prix_vente_ht:250000,taux_tva:18,is_active:true};
const doc={id:1,numero:'DOC-2026-001',client,type:'standard',statut:'impayee',date_facture:'2026-10-01',date_echeance:'2026-10-31',date_devis:'2026-10-01',date_validite:'2026-12-31',total_ttc:295000,reste_a_payer:195000};
const account={id:1,code:'BANQUE',libelle:'Banque principale',type:'banque',is_active:true,is_default:true,solde_actuel:6148353,total_debit:7000000,total_credit:851647,solde_initial:0};
const paginate=data=>({data,current_page:1,last_page:1,total:data.length,from:1,to:data.length});
try{
for(const width of [1440,360]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>{
  assert.equal(route.request().method(),'GET','No server writes during theme tests');
  const path=new URL(route.request().url()).pathname.replace(/^\/api/,'');
  const json=path==='/clients'?paginate([client]):path==='/produits'?paginate([product]):path==='/factures'?paginate([doc]):path==='/devis'?paginate([{...doc,statut:'envoye'}]):path==='/tresorerie-comptes'?paginate([account]):path==='/tresorerie-comptes/types'?{banque:'Banque'}:path.endsWith('/stats')||path==='/stocks/summary'?{}:[];
  return route.fulfill({json});
 });
 for(const kind of ['clients','produits','factures','devis','stock','tresorerie']){
  await page.goto(`http://127.0.0.1:5187/tests/application-theme-harness.html?page=${kind}`);
  if(kind!=='stock') await page.locator('tbody tr').first().waitFor(); else await page.getByText('Chargement...', {exact:true}).waitFor({state:'hidden'});
  assert.equal(await page.locator('.app-surface').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(241, 245, 249)');
  if(kind!=='stock') assert.equal(await page.locator('tbody').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  const primary=page.locator('.btn-primary').first();if(await primary.count()){
   assert.equal(await primary.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(37, 99, 235)');
   assert.equal(await primary.evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)');
  }
  if(kind==='factures') {
   const late=page.locator('tbody .text-red-600').first();
   const color=await late.evaluate(e=>getComputedStyle(e).color);
   assert.equal(color,'rgb(220, 38, 38)','late invoices remain red');
  }
  if(kind==='clients') {
   assert.equal(await page.getByText('actif',{exact:true}).evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(220, 252, 231)','active status remains green');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:join(out,`${kind}-${width}.png`),fullPage:true});
  console.log(`PASS ${kind} ${width}px: white tables, neutral surface, primary action, no page overflow`);
 }
 for(const kind of ['produit','facture','devis']){
  await page.goto(`http://127.0.0.1:5187/tests/application-theme-harness.html?page=form&kind=${kind}&mode=edit`);
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  const input=dialog.locator('.input').first();assert.equal(await input.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  assert.equal(await dialog.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  await input.focus();
  if(kind==='produit') {
   await page.locator('[data-validation-field="libelle"]').fill('   ');
   await page.locator('button[type=submit]').click();
   await page.getByRole('alert').waitFor();
   await expect(page.locator('[data-validation-field="libelle"]')).toHaveCSS('border-color','rgb(185, 28, 28)');
  }
  await page.screenshot({path:join(out,`form-${kind}-${width}.png`)});
  await page.getByRole('button',{name:'Fermer la fenêtre',exact:true}).click();
  await dialog.waitFor({state:'hidden'});
  console.log(`PASS ${kind} form ${width}px: teleported dialog, white inputs, close`);
 }
 assert.deepEqual(errors,[]);await page.close();
}
}finally{await browser.close()}
