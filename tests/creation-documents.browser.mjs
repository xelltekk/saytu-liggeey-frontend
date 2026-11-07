import {createRequire} from 'node:module';
import {join} from 'node:path';
import {homedir} from 'node:os';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const paginate=data=>({data,current_page:1,last_page:1,total:data.length});
const client={id:1,nom:'Client test',code:'CL-1',type:'client',is_active:true};
const product={id:1,libelle:'Produit test',reference:'PR-1',prix_achat_ht:100,taux_tva:18};
try {
for(const kind of ['factures','devis','commandes']){
 const page=await browser.newPage(),rows=[],errors=[];let writes=0;
 page.on('pageerror',e=>errors.push(e.message));
 const endpoint=kind==='commandes'?'/achats/commandes':'/'+kind,list=kind==='commandes'?'/achats':endpoint;
 await page.route('**/api/**',route=>{
  const req=route.request(),p=new URL(req.url()).pathname.replace(/^\/api/,'');
  if(req.method()==='POST'&&p===endpoint){writes++;const row={...req.postDataJSON(),id:101,numero:'TEST-101',client,fournisseur:client,statut:'brouillon',total_ttc:118};rows.push(row);return route.fulfill({json:row});}
  assert.equal(req.method(),'GET');
  const json=p===endpoint?paginate(rows):p==='/clients'?paginate([client]):p==='/produits'?paginate([product]):p==='/achats/referentiels'?{fournisseurs:[client],produits:[product],entrepots:[]}:p.includes('/societe')?{nom:'Test'}:/stats|dashboard|pilotage|badges|summary/.test(p)?{}:[];
  return route.fulfill({json});
 });
 await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html');
 await page.getByRole('heading',{name:'Centre de pilotage',exact:true}).waitFor();
 await page.evaluate(p=>window.testNavigate(p),list);
 await page.evaluate(p=>window.testNavigate(p),endpoint+'/nouveau?tab=saisie');
 const form=page.locator('main form').first();await form.waitFor();
 if(kind==='commandes'){
  await form.locator('select').first().selectOption('1');
  await form.locator('.document-line-card select').first().selectOption('1');
 }else{
  await form.locator('input[type=search]').first().fill('Client test');
  await form.getByRole('button',{name:/Client test/}).click();
  await form.locator('[contenteditable=true]').first().fill('Prestation test');
  await form.locator('[data-validation-field="lignes.0.prix_unitaire_ht"]').fill('100');
 }
 await form.locator('button[type=submit], button:not([type])').last().click();
 await expect.poll(()=>writes).toBe(1);
 await expect.poll(()=>new URL(page.url()).pathname).toBe(list);
 await expect(page.locator('tbody').getByText('TEST-101',{exact:true})).toBeVisible();
 assert.deepEqual(errors,[]);
 console.log('PASS '+kind+': save returns directly to list with created row');
 await page.close();
}
}finally{await browser.close()}
