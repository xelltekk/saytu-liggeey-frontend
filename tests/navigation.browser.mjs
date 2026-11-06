import {createRequire} from 'node:module';
import {join} from 'node:path';
import {homedir} from 'node:os';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/**',route=>{
 const req=route.request();requests.push(new URL(req.url()).pathname);assert.equal(req.method(),'GET');
 const path=new URL(req.url()).pathname.replace(/^\/api/,'');
 const list={data:[],current_page:1,last_page:1,total:0};
 const detail=path.match(/^\/(produits|clients)\/(\d+)$/);
 const json=detail?(detail[1]==='produits'?{id:Number(detail[2]),libelle:'Produit '+detail[2],reference:'PR-'+detail[2],type:'service',prix_vente_ht:1000,taux_tva:18,is_active:true}:{id:Number(detail[2]),nom:'Prospect '+detail[2],code:'P-'+detail[2],type:'prospect',statut:'actif'}):/\/(stats|dashboard|badges|summary)$/.test(path)||path.includes('/pilotage/')?{}:path.includes('/societe')?{nom:'Société test'}:/^\/(clients|produits|factures|devis|prospection\/(prospects|actions|activites))$/.test(path)?list:[];
 return route.fulfill({json});
});
try{
 await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html');
 await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor();
 await page.evaluate(()=>window.testNavigate('/prospection'));
 await page.getByRole('button',{name:'+ Prospect',exact:true}).click();
 if(process.env.REPRO_BASELINE){
  await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor();
  console.log('REPRODUCED: + Prospect redirected to '+new URL(page.url()).pathname);
  console.log(await page.evaluate(()=>window.navigationLog));
 }else{
  await expect(page).toHaveURL(/\/prospection\/nouveau\?tab=saisie$/);
  await expect(page.getByRole('heading',{name:'Nouveau prospect',exact:true})).toBeVisible();
  console.log('PASS Pilotage → Prospection → + Prospect remains on prospect form');
  const draft=page.locator('form input[type="text"]').first();
  await draft.fill('Brouillon conservé');
  // Navigate through real list pages and click their real creation buttons.
  for(const [path,label,target] of [
   ['/clients','+ Nouveau client','/clients/nouveau'],
   ['/produits','+ Produit','/produits/nouveau'],
   ['/devis','+ Nouveau devis','/devis/nouveau'],
   ['/factures','+ Nouvelle facture','/factures/nouveau'],
   ['/prospection','+ Action','/prospection/actions/nouveau'],
   ['/prospection','+ Objectif','/prospection/objectifs/nouveau'],
  ]) {
   await page.evaluate(path=>window.testNavigate(path),path);
   if(label==='+ Action') await page.getByRole('button',{name:'Actions & relances',exact:true}).click();
   if(label==='+ Objectif') await page.getByRole('button',{name:'Objectifs',exact:true}).click();
   await page.getByRole('button',{name:label,exact:true}).click();
   await expect.poll(()=>new URL(page.url()).pathname).toBe(target);
   await expect(page.locator('main form').first()).toBeVisible();
   console.log('PASS '+label+' → '+target);
  }
  await page.evaluate(()=>window.testNavigate('/prospection'));
  await page.getByRole('button',{name:'+ Prospect',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Nouveau prospect',exact:true})).toBeVisible();
  await expect(draft).toHaveValue('Brouillon conservé');
  console.log('PASS returning to prospect keeps draft without cross-page redirects');

  // Same route name, different records: each must display its own record.
  for(const id of [41,42,41]) {
   await page.evaluate(id=>window.testNavigate('/produits/'+id+'?tab=fiche'),id);
   await expect(page.getByRole('heading',{name:'Produit '+id,exact:true})).toBeVisible();
  }
  await page.getByRole('button',{name:'Saisie produit',exact:true}).click();
  await expect(page).toHaveURL(/\/produits\/41\?tab=saisie$/);
  await expect(page.locator('[data-validation-field="libelle"]')).toHaveValue('Produit 41');
  const requestStart=requests.length;
  await page.evaluate(()=>window.testNavigate('/prospection/77?tab=fiche'));
  await expect(page.getByRole('heading',{name:'Prospect 77',exact:true,level:2})).toBeVisible();
  assert(!requests.slice(requestStart).includes('/api/produits/77'),'inactive product page must not fetch a prospect ID');
  await page.evaluate(()=>window.testNavigate('/produits/41?tab=fiche'));
  await expect(page.getByRole('heading',{name:'Produit 41',exact:true})).toBeVisible();
  console.log('PASS record identity, tab updates, no cross-module detail requests');

  // Cached list route watchers must not consume another list's legacy open link.
  await page.evaluate(()=>window.testNavigate('/clients?open=88'));
  await expect.poll(()=>new URL(page.url()).pathname).toBe('/clients/88');
  await expect(page.getByRole('heading',{name:'Prospect 88',exact:true,level:1})).toBeVisible();
  assert(!requests.includes('/api/produits/88'),'product list must ignore client open query');
  console.log('PASS legacy open query remains in clients');

  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.testNavigate('/pilotage?tab=activites'));
  await expect(page.getByRole('heading',{name:'Centre de pilotage',exact:true})).toBeVisible();
  await page.evaluate(()=>window.testNavigate('/prospection'));
  await page.getByRole('button',{name:'+ Prospect',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Nouveau prospect',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button',{name:'+ Prospect',exact:true})).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading',{name:'Nouveau prospect',exact:true})).toBeVisible();
  console.log('PASS mobile, back and forward after cached visits');

 }
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
