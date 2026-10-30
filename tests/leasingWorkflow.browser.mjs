import { createRequire } from 'node:module'
import { join } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const runtime = process.env.SAYTU_TEST_RUNTIME || join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const { chromium } = require(join(runtime, 'playwright'))
const { expect } = require(join(runtime, 'playwright/test'))
const output = process.env.SAYTU_TEST_OUTPUT || join(tmpdir(), 'codex-leasing-workflow')
await mkdir(output, {recursive:true})
const contracts = Array.from({length:101}, (_,i)=>({id:i+1,numero:`LC-${i+1}`,client_id:i+1,imprimante_id:i+1001,
  client:{id:i+1,nom:`Client fictif ${i+1}`,code:`CLI-${i+1}`},
  imprimante:{id:i+1001,designation:`Machine fictive ${i+1}`,reference:`PRN-${i+1}`},
  statut:i===1?'brouillon':'actif',date_debut:'2026-01-01',loyer_mensuel_ht:1000,forfait_pages_noir:100}))
const printers = contracts.map(c=>({id:c.imprimante_id,reference:c.imprimante.reference,designation:c.imprimante.designation,statut:'disponible'}))
const readings = Array.from({length:51}, (_,i)=>({id:i+1,periode:'2026-01',date_releve:'2026-01-31',contrat:contracts[0],ancien_compteur_noir:10000,
  compteur_noir:10150,copies_noir:150,montant_supp_ht:500,echeance_facturation:'2026-03-31'}))
const interventions = Array.from({length:101},(_,i)=>({id:i+1,reference:`INT-${i+1}`,date_intervention:'2026-01-10',type:'maintenance',statut:'planifiee',cout_ht:10,imprimante:printers[0],client:contracts[0].client}))
const browser = await chromium.launch({channel:process.env.SAYTU_TEST_BROWSER || 'msedge',headless:true})
try {
  for (const width of [360,768,1440]) {
    const context = await browser.newContext({viewport:{width,height:900}})
    await context.addInitScript(()=>localStorage.setItem('xelltekk_user',JSON.stringify({role:'admin'})))
    const page = await context.newPage(), errors=[], unexpected=[], writes=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.route('https://**/*',route=>route.abort())
    await page.route('**/api/**',async route=>{
      const request=route.request(), url=new URL(request.url()), path=url.pathname, params=url.searchParams
      const paginate=rows=>{
        const page=Number(params.get('page')||1),per=Number(params.get('per_page')||100),start=(page-1)*per
        return {data:rows.slice(start,start+per),current_page:page,last_page:Math.ceil(rows.length/per),total:rows.length,from:start+1,to:Math.min(rows.length,start+per)}
      }
      if(request.method()!=='GET') {
        writes.push({path,data:request.postDataJSON()})
        return route.fulfill({status:201,json:{id:900}})
      }
      if(path.endsWith('/referentiels')) return route.fulfill({json:{clients:[],produits:[],imprimantes_disponibles:[],statuts_contrats:[],statuts_imprimantes:[]}})
      if(path.endsWith('/stats')) return route.fulfill({json:{contrats_actifs:100,imprimantes_disponibles:101,loyer_mensuel_ht:100000}})
      if(path.endsWith('/comparaisons')) return route.fulfill({json:{data:[],current_page:1,last_page:1,total:0}})
      if(path.endsWith('/contrats')) return route.fulfill({json:paginate(contracts)})
      const contractId=path.match(/\/contrats\/(\d+)$/)?.[1]
      if(contractId) return route.fulfill({json:contracts.find(contract=>contract.id===Number(contractId))})
      if(path.endsWith('/imprimantes')) return route.fulfill({json:paginate(printers)})
      if(path.endsWith('/releves')) return route.fulfill({json:paginate(readings)})
      if(path.endsWith('/interventions')) return route.fulfill({json:{...paginate(interventions),summary:{ouvertes:101,terminees:0,cout_ht:1010,techniciens:1}}})
      if(path.endsWith('/interventions/900')) return route.fulfill({json:{...interventions[0],id:900,contrat_id:1,imprimante_id:1001}})
      unexpected.push(path)
      return route.fulfill({status:500,json:{message:'Unexpected fixture request'}})
    })
    const base='http://127.0.0.1:5179/tests/browser/leasing-workflow.html'
    await page.goto(base+'#/leasing')
    let section=page.getByRole('region',{name:'Contrats de leasing',exact:true})
    await expect(section.getByText('LC-1',{exact:true})).toBeVisible()
    await section.getByRole('button',{name:'Afficher la page suivante',exact:true}).click()
    await expect(section.getByText('LC-51',{exact:true})).toBeVisible()
    await section.getByRole('button',{name:'Afficher la page suivante',exact:true}).click()
    await expect(section.getByText('LC-101',{exact:true})).toBeVisible()
    await expect(section.getByText('Page 3 / 3',{exact:true})).toBeVisible()
    for (const [tab,region,last] of [['Parc imprimantes','Parc imprimantes','Machine fictive 101'],['Relevés compteur','Releves compteur','Page 2 / 2'],['Interventions','Interventions leasing','INT-101']]) {
      await page.getByRole('button',{name:tab,exact:true}).click()
      section=page.getByRole('region',{name:region,exact:true})
      if(tab==='Relevés compteur') await section.getByText('Anciens relevés mensuels',{exact:true}).click()
      await section.getByRole('button',{name:'Afficher la page suivante',exact:true}).click()
      await expect(section.getByText(last,{exact:true})).toBeVisible()
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await page.screenshot({path:join(output,`lists-${width}.png`)})
    await expect(page.getByRole('link',{name:'Comparer deux relevés',exact:true})).toHaveCount(0)
    await page.goto(base+'#/leasing/comparaison?contrat=1')
    await expect(page.getByRole('button',{name:'Comparaison',exact:true})).toHaveAttribute('aria-pressed','true')
    await expect(page.getByRole('button',{name:'Calculer la consommation',exact:true})).toBeVisible()
    await expect(page.getByText('LC-1 · Client fictif 1',{exact:true})).toBeVisible()
    assert.match(page.url(),/tab=releves/)
    assert.match(page.url(),/vue=comparaison/)
    const serial=page.getByLabel('Numéro de série précédent',{exact:true})
    await serial.fill('UNEXPORTED')
    await page.getByRole('button',{name:'Historique',exact:true}).click()
    await expect(page.getByText('Quitter la comparaison ? Les données non exportées seront perdues.',{exact:true})).toBeVisible()
    await page.getByRole('button',{name:'Annuler',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Confirmation',exact:true})).toHaveCount(0)
    await expect(serial).toHaveValue('UNEXPORTED')
    await expect(page.getByRole('button',{name:'Comparaison',exact:true})).toHaveAttribute('aria-pressed','true')
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await page.getByRole('heading',{name:'Relevés compteur',exact:true}).evaluate(element=>element.scrollIntoView({block:'start'}))
    await page.screenshot({path:join(output,`comparison-tab-${width}.png`)})
    await page.getByRole('button',{name:'Historique',exact:true}).click()
    await page.getByRole('button',{name:'OK',exact:true}).click()
    await expect(page.getByRole('button',{name:'Historique',exact:true})).toHaveAttribute('aria-pressed','true')
    await expect(page.getByRole('region',{name:'Comparaisons facturées',exact:true})).toBeVisible()
    await page.getByRole('button',{name:'Comparaison',exact:true}).click()
    await expect(page.getByLabel('Numéro de série précédent',{exact:true})).toHaveValue('')
    await page.getByRole('button',{name:'Contrats',exact:true}).click()
    await expect(page.getByRole('region',{name:'Contrats de leasing',exact:true})).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('button',{name:'Comparaison',exact:true})).toHaveAttribute('aria-pressed','true')
    await page.goto(base+'#/leasing/releves/nouveau?contrat_id=1')
    await expect(page.getByRole('button',{name:'Calculer la consommation',exact:true})).toBeVisible()
    await expect(page.getByText('LC-1 · Client fictif 1',{exact:true})).toBeVisible()
    await expect(page.getByRole('heading',{name:'Nouveau relevé compteur',exact:true})).toHaveCount(0)
    await expect(page.getByLabel('Ancien comptage noir',{exact:true})).toHaveCount(0)
    assert.match(page.url(),/contrat=1/)
    assert.doesNotMatch(page.url(),/contrat_id=/)
    await page.getByRole('button',{name:'Contrats',exact:true}).click()
    await page.getByRole('button',{name:'+ Relevé',exact:true}).click()
    await expect(page.getByRole('button',{name:'Comparaison',exact:true})).toHaveAttribute('aria-pressed','true')
    await expect(page.locator('input[type=file]')).toHaveCount(2)
    await page.getByRole('button',{name:'Contrats',exact:true}).click()
    const contractSection=page.getByRole('region',{name:'Contrats de leasing',exact:true})
    await expect(contractSection.getByRole('link',{name:'Comparer',exact:true})).toHaveCount(0)
    await contractSection.getByRole('button',{name:'Relevé',exact:true}).first().click()
    await expect(page.getByText(/Tarifs du contrat préremplis/)).toBeVisible()
    await expect(page.getByRole('button',{name:'Calculer la consommation',exact:true})).toBeVisible()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await page.screenshot({path:join(output,`reading-${width}.png`)})
    await page.goto(base+'#/leasing/interventions/900')
    await expect(page.getByRole('combobox',{name:'Contrat lié',exact:true})).toHaveValue('1')
    await page.getByRole('combobox',{name:'Contrat lié',exact:true}).selectOption('101')
    await expect(page.getByRole('combobox',{name:'Imprimante',exact:true})).toHaveValue('1101')
    await expect(page.getByRole('combobox',{name:'Imprimante',exact:true})).toBeDisabled()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await page.screenshot({path:join(output,`intervention-${width}.png`)})
    await page.getByRole('button',{name:'Mettre à jour',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Location, contrats et relevés compteur',exact:true})).toBeVisible()
    assert.equal(writes.length,1)
    assert.equal(writes[0].data.imprimante_id,1101)
    assert.deepEqual(unexpected,[])
    assert.deepEqual(errors,[])
    console.log(`PASS ${width}px: paginated history, replacement reading workflow, legacy links, contract context and intervention synchronization; no real API writes`)
    await context.close()
  }
} finally {await browser.close()}
