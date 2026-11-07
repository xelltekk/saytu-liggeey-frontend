import {createRequire} from 'node:module';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'));
const browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir('output/pdf-themes',{recursive:true});
try {for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];let saved='classique',writes=0,preview='';
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>{
  const req=route.request(),u=new URL(req.url()),p=u.pathname;
  if(p.endsWith('/parametres/societe/apercu')){preview=u.searchParams.get('theme_pdf');return route.fulfill({contentType:'application/pdf',body:'%PDF-1.4\n%%EOF'});}
  if(p.endsWith('/parametres/societe')){
   if(req.method()==='PUT'){saved=req.postDataJSON().theme_pdf;writes++;return route.fulfill({json:{societe:{id:1,nom:'Société test',theme_pdf:saved}}});}
   return route.fulfill({json:{id:1,nom:'Société test',theme_pdf:saved,couleur_principale:'#126789'}});
  }
  return route.fulfill({json:/stats|dashboard|pilotage|societe|badges/.test(p)?{}:[]});
 });
 await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html');
 await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor();
 await page.evaluate(()=>window.testNavigate('/parametres'));
 const cards=page.locator('section[aria-labelledby="pdf-theme-heading"]');
 await expect(cards.getByRole('radio',{name:/^Classique/})).toBeChecked();
 await cards.getByRole('radio',{name:/^Moderne/}).check();
 await cards.getByRole('button',{name:'Voir la facture PDF'}).click();
 await expect.poll(()=>preview).toBe('moderne');assert.equal(writes,0);
 await page.getByRole('button',{name:'💾 Enregistrer les paramètres',exact:true}).click();
 await expect.poll(()=>saved).toBe('moderne');
 await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html');await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor();await page.evaluate(()=>window.testNavigate('/parametres'));await expect(cards.getByRole('radio',{name:/^Moderne/})).toBeChecked();
 await cards.getByRole('radio',{name:/^Compact/}).check();
 await cards.scrollIntoViewIfNeeded();await page.screenshot({path:`output/pdf-themes/settings-${width}.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS '+width+': theme selection, preview without save, persistence, responsive layout');
 await page.close();
}}finally{await browser.close()}
