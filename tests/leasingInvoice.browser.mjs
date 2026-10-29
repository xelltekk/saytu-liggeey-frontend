import { createRequire } from 'node:module'
import { join } from 'node:path'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url)
const {chromium}=require(join(process.env.SAYTU_TEST_RUNTIME,'playwright'))
const browser=await chromium.launch({headless:true,channel:'msedge'})
try {
  const page=await browser.newPage()
  await page.addInitScript(()=>localStorage.setItem('xelltekk_user',JSON.stringify({role:'admin'})))
  let posts=0,payload
  await page.route('**/api/**',async route=>{
    if(route.request().method()==='GET' && route.request().url().includes('/clients')) return route.fulfill({json:{data:[{id:3,nom:'Client démo',code:'TEST',type:'client'}]}})
    if(route.request().url().endsWith('/leasing/comparaison/facture')) {
      posts++;payload=route.request().postDataJSON()
      if(posts===1) return route.fulfill({status:503,json:{message:'Test indisponibilité temporaire'}})
      return route.fulfill({status:201,json:{facture:{id:7,numero:'FA-TEST'},already_exists:false}})
    }
    throw Error('Unexpected API request: '+route.request().url())
  })
  await page.goto('http://127.0.0.1:5179/tests/browser/leasing.html')
  for(const [i,suffix] of ['précédent','récent'].entries()) {
    await page.getByLabel('Date du relevé '+suffix,{exact:true}).fill(i?'2026-10-27':'2026-08-24')
    await page.getByLabel('Numéro de série '+suffix,{exact:true}).fill('TEST12345')
    for(const [label,value] of [['102 · Total 2',i?'408785':'405666'],['409 · Couleur / 2',i?'141377':'139696'],['112 · Noir grand format',i?'6':'5']]) await page.getByLabel(label+' · '+suffix,{exact:true}).fill(value)
  }
  await page.getByLabel('Faces couleur grand format sur la période',{exact:true}).fill('0')
  await page.getByRole('checkbox').nth(0).check();await page.getByRole('checkbox').nth(1).check()
  await page.getByRole('button',{name:'Calculer la consommation',exact:true}).click()
  await page.getByPlaceholder('Rechercher un client...').fill('Client')
  await page.getByRole('button').filter({hasText:'Client démo'}).click()
  await page.getByRole('checkbox').nth(2).check()
  await page.getByRole('button',{name:'Créer la facture brouillon',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'Test indisponibilité'}).waitFor()
  await page.getByRole('button',{name:'Créer la facture brouillon',exact:true}).click()
  await page.getByRole('link',{name:'Ouvrir la facture'}).waitFor()
  assert.equal(posts,2);assert.equal(payload.client_id,3);assert.equal(payload.tva,18)
  assert.equal(await page.getByRole('button',{name:'Créer la facture brouillon',exact:true}).isDisabled(),true)
  console.log('PASS: manual calculation → client → failed request → retry → draft invoice link; no real API writes')
} finally {await browser.close()}
