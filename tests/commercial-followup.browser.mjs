import {createRequire} from 'node:module';import {join} from 'node:path';import {homedir} from 'node:os';import {mkdir,readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtime=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(join(runtime,'playwright')),{expect}=require(join(runtime,'playwright/test'));
const browser=await chromium.launch({channel:'msedge',headless:true});await mkdir('output/commercial-followup',{recursive:true});
try{for(const role of ['gerant','commercial'])for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];let puts=0,summaryGets=0,taskGets=0,lastQuery;
 let action={id:51,client_id:7,commercial_id:2,objet:'Relancer le devis du client',type_action:'appel',statut:'planifiee',priorite:'haute',date_action:'2026-11-10T10:00:00Z',date_relance:null,resultat:'aucun',montant_potentiel:100000,compte_rendu:'',prochaine_etape:'',note_gerant:'Préparer la proposition avant vendredi',blocage:'',client:{id:7,nom:'Client de démonstration',code:'PR-007'},commercial:{id:2,name:'Awa Commerciale'}};
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>{const req=route.request(),url=new URL(req.url()),p=url.pathname.replace(/^\/api/,'');
  if(p==='/prospection/suivi-equipe'){summaryGets++;return route.fulfill({json:{items:[{id:2,name:'Awa Commerciale',active:true,a_faire:1,en_cours:0,bloquees:action.statut==='bloquee'?1:0,retard:1,terminees:0,prospects:4,devis_attente:2,ca:350000}],non_affectees:role==='gerant'?1:0}})}
  if(p==='/prospection/actions'){taskGets++;lastQuery=url.searchParams;return route.fulfill({json:{data:[action],total:1,current_page:1,last_page:1}})}
  if(p==='/prospection/actions/51'){if(req.method()==='PUT'){puts++;const payload=req.postDataJSON();assert.equal(payload.statut,'bloquee');assert.equal(payload.blocage,'Validation du prix attendue');assert.equal(payload.priorite,'urgente');action={...action,...payload};}return route.fulfill({json:action})}
  if(p==='/prospection/commerciaux')return route.fulfill({json:[{id:2,name:'Awa Commerciale'}]});
  if(p==='/clients/7')return route.fulfill({json:action.client});
  if(p==='/clients')return route.fulfill({json:{data:[action.client]}});
  assert.equal(req.method(),'GET');return route.fulfill({json:p==='/societe/identite'?{nom:'Entreprise de démonstration',devise_defaut:'XOF'}:{}})
 });
 await page.goto(`http://127.0.0.1:5187/tests/commercial-followup-harness.html?role=${role}`);
 await page.getByRole('heading',{name:role==='gerant'?'Suivi des commerciaux':'Mon activité commerciale',exact:true}).waitFor();
 await expect(page.getByRole('heading',{name:'Awa Commerciale',exact:true})).toBeVisible();
 if(role==='commercial')await expect(page.getByLabel('Commercial',{exact:false})).toHaveCount(0);
 await page.getByLabel('État',{exact:false}).selectOption('overdue');await expect.poll(()=>lastQuery?.get('overdue')).toBe('1');
 await page.getByRole('link',{name:'Ouvrir / traiter',exact:true}).click();
 await page.getByLabel('Statut',{exact:false}).selectOption('bloquee');
 await page.getByLabel('Motif du blocage *',{exact:false}).fill('Validation du prix attendue');
 await page.getByLabel('Priorité',{exact:false}).selectOption('urgente');
 await page.getByLabel('Compte rendu',{exact:false}).fill('Client contacté, attend notre accord.');
 if(role==='commercial')await expect(page.locator('textarea').filter({hasText:'Préparer la proposition avant vendredi'})).toHaveCount(0);
 else await page.getByLabel('Réponse / consigne du gérant',{exact:false}).fill('Je vérifie le tarif.');
 await page.getByRole('button',{name:'Mettre à jour',exact:true}).click();
 await expect.poll(()=>puts).toBe(1);await page.getByRole('heading',{name:role==='gerant'?'Suivi des commerciaux':'Mon activité commerciale',exact:true}).waitFor();
 await expect(page.getByText('Blocage : Validation du prix attendue',{exact:true})).toBeVisible();
 assert(summaryGets>=2);assert(taskGets>=3);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 await page.screenshot({path:`output/commercial-followup/${role}-${width}.png`,fullPage:true});console.log(`PASS ${role} ${width}: own/team view, overdue filter, blocked status, priority, report, return and refresh`);await page.close();
}}finally{await browser.close()}
