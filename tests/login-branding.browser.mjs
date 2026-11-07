import {createRequire} from 'node:module';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'));
const browser=await chromium.launch({channel:'msedge',headless:true});await mkdir('output/login-branding',{recursive:true});
try {for(const scenario of ['logo','none','broken','failure','platform']){
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>{
  assert.equal(route.request().method(),'GET');
  if(route.request().url().includes('/societe/identite'))return route.fulfill(scenario==='failure'?{status:503,json:{message:'Indisponible'}}:{json:{nom:scenario==='platform'?'XELLTEKK':'JAYTECH PRO',logo:scenario==='logo'||scenario==='broken'?'/test-brand.svg':null}});
  return route.fulfill({json:{}});
 });
 await page.route('**/test-brand.svg',route=>route.fulfill(scenario==='broken'?{status:404,body:''}:{contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80"><rect width="300" height="80" fill="#126789"/><text x="25" y="53" font-size="36" fill="white">JAYTECH</text></svg>'}));
 await page.goto('http://127.0.0.1:5187/login');
 await expect(page.getByRole('heading',{name:'Connexion',exact:true})).toBeVisible();
 await expect(page.getByText('Accédez à votre espace Saytu Liggéey 2.0',{exact:true})).toBeVisible();
 await expect(page.getByText(scenario==='failure'?'Saytu Liggéey 2.0':scenario==='platform'?'XELLTEKK':'JAYTECH PRO',{exact:true})).toBeVisible();
 if(scenario==='logo')await expect.poll(()=>page.locator('.login-logo-image').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
 if(scenario==='none'||scenario==='broken')await expect(page.locator('.login-logo-fallback')).toHaveText('JP');
 assert.equal(await page.getByText('Xelltekk ERP',{exact:true}).count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 if(scenario==='logo'||scenario==='none')await page.screenshot({path:`output/login-branding/${scenario}.png`});
 console.log('PASS '+scenario);await page.close();
}}finally{await browser.close()}
