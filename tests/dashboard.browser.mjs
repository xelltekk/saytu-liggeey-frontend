import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/BAMBA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let scope='business';
const comptes=['Banque principale','Caisse principale','Compte YAS','Compte Orange Money','Compte Wave','Caisse boutique Sandaga'].map((libelle,i)=>({id:i+1,libelle,mode_paiement:['virement','especes','yas','orange_money','wave','especes'][i],solde_actuel:[6148353,10388954,24000,1070463,3171200,12500][i]}));
await page.route('**/api/**',route=>route.fulfill({json:route.request().url().includes('/dashboard')?{scope,kpi:{ca_mois:307000,ca_annee:21608886,paiements_mois:250000,encours_total:1991507,factures_impayees:10,factures_en_retard:8,clients_actifs:12,devis_en_cours:3,produits_stockes:20,stock_alertes:2,ruptures_stock:1,valeur_stock:450000},soldes_tresorerie:{comptes},ca_mensuel:{labels:['Déc','Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov'],data:[0,0,0,0,0,3800000,2500000,0,7800000,6600000,700000,307000],boutique:[0,0,0,0,0,1400000,1300000,0,1700000,6300000,0,130000],facturation:[0,0,0,0,0,2400000,1200000,0,6100000,300000,700000,177000]}}:[]}));
await mkdir('output/dashboard',{recursive:true});
for(const width of [1440,360]){
 await page.setViewportSize({width,height:1050});
 await page.goto('http://127.0.0.1:5187/tests/dashboard-harness.html');
 await page.getByText('Solde total disponible',{exact:true}).waitFor();
 assert.equal(await page.locator('.stat-grid .dashboard-kpi-card').count(),4);
 assert.equal(await page.locator('.dashboard-account-row').count(),6);
 assert.match(await page.locator('.stat-grid').innerText(),/307\s*000/);
 assert.match(await page.locator('.stat-grid').innerText(),/250\s*000/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
 assert.equal(await page.locator('.dashboard-kpi-value').first().evaluate(e=>getComputedStyle(e).color),'rgb(15, 23, 42)');
 const datasets=await page.evaluate(()=>window.testChart());assert.equal(datasets.length,3);assert.equal(new Set(datasets.map(d=>d.color)).size,3);
 await page.evaluate(()=>document.documentElement.setAttribute('data-theme','classic-blue'));
 assert.deepEqual(await page.evaluate(()=>window.testChart()),datasets);
 await page.screenshot({path:`output/dashboard/dashboard-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Personnaliser',exact:true}).click();
 await page.getByRole('button',{name:'Terminer',exact:true}).click();
 console.log(`${width}px: metrics, accounts, chart, theme, customize, no overflow OK`);
}
for(const role of ['commercial','magasinier']){
 scope=role==='commercial'?'commercial':'stock';
 await page.goto(`http://127.0.0.1:5187/tests/dashboard-harness.html?role=${role}`);
 await page.locator('.stat-grid').waitFor();
 assert.equal(await page.getByText('Solde total disponible',{exact:true}).count(),0);
 assert.equal(await page.getByText('Encaissements',{exact:true}).count(),0);
 console.log(`${role}: financial metrics hidden OK`);
}
assert.deepEqual(errors,[]);await browser.close();
