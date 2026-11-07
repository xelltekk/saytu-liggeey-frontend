import {createRequire} from 'node:module';
import {join} from 'node:path';
import {homedir} from 'node:os';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const paginate=data=>({data,current_page:1,last_page:1,total:data.length,from:data.length?1:0,to:data.length});
try {
 for(const kind of ['client','prospect','produit']) {
  const page=await browser.newPage(),rows=[],errors=[];let reads=0,writes=0,rejectSave=true;
  page.on('pageerror',e=>errors.push(e.message));
  const base=kind==='produit'?'/produits':'/clients', list=kind==='prospect'?'/prospection':base,endpoint=kind==='prospect'?'/prospection/prospects':base;
  await page.route('**/api/**',route=>{
   const req=route.request(),path=new URL(req.url()).pathname.replace(/^\/api/,'');
   if(req.method()==='POST'&&path===base){if(rejectSave){rejectSave=false;return route.fulfill({status:422,json:{message:'Enregistrement refusé pour ce test',errors:{nom:['Valeur à corriger']}}});}writes++;const row={...req.postDataJSON(),id:101,code:'TEST-101',reference:'TEST-101',is_active:true,tags:[]};rows.push(row);return route.fulfill({json:row});}
   assert.equal(req.method(),'GET');
   if(path===endpoint)reads++;
   const json=path===base+'/101'?rows[0]:path===base||path===endpoint?paginate(rows):/\/(stats|dashboard|badges|summary)$/.test(path)||path.includes('/pilotage/')?{}:path.includes('/societe')?{nom:'Société test'}:path==='/prospection/actions'||path==='/prospection/activites'?paginate([]):[];
   return route.fulfill({json});
  });
  await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html');
  await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor();
  await page.evaluate(path=>window.testNavigate(path),list);
  const label=kind==='client'?'+ Nouveau client':kind==='prospect'?'+ Prospect':'+ Produit';
  await page.getByRole('button',{name:label,exact:true}).waitFor();
  await expect.poll(()=>reads).toBeGreaterThan(0);
  await page.getByRole('button',{name:label,exact:true}).click();
  const name='Enregistrement '+kind;
  const field=kind==='produit'?page.locator('[data-validation-field="libelle"]'):page.locator('form input[type="text"]').first();
  await field.fill(name);
  const createPath=new URL(page.url()).pathname;
  await page.locator('main form button[type="submit"]').first().click();
  await expect(page.getByText('Valeur à corriger').first()).toBeVisible();
  assert.equal(new URL(page.url()).pathname,createPath);
  await expect(field).toHaveValue(name);
  const before=reads;
  await page.locator('main form button[type="submit"]').first().click();
  await expect.poll(()=>writes).toBe(1);
  await expect.poll(()=>new URL(page.url()).pathname).toBe(list);
  await expect(page.locator('tbody').getByText(name,{exact:true})).toBeVisible();
  assert(reads>before);assert.equal(writes,1);
  await page.getByRole('button',{name:label,exact:true}).click();
  await expect(field).toHaveValue('');
  console.log('PASS '+kind+': error preserves input; success returns to refreshed list; next creation is blank');
  assert.deepEqual(errors,[]);await page.close();
 }
} finally {await browser.close()}
