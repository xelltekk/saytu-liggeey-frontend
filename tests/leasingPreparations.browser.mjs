import { createRequire } from 'node:module'
import { join } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const runtime = process.env.SAYTU_TEST_RUNTIME || join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const { chromium } = require(join(runtime, 'playwright'))
const { expect } = require(join(runtime, 'playwright/test'))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    await context.addInitScript(() => localStorage.setItem('xelltekk_user', JSON.stringify({ role: 'admin' })))
    const page = await context.newPage(), errors = [], unexpected = [], writes = []
    page.on('pageerror', e => errors.push(e.message))
    const contract = { id: 1, numero: 'LC-DEMO', statut: 'actif', client_id: 3, client: { id: 3, nom: 'Client démonstration' }, imprimante_id: 4, imprimante: { id: 4, designation: 'Canon', numero_serie: 'TEST12345' }, loyer_mensuel_ht: 25000, taux_tva: 18, prix_page_noir_ht: 20, prix_page_couleur_ht: 60, forfait_pages_noir: 0, forfait_pages_couleur: 0 }
    const previous = { date: '2026-08-24', serial: 'TEST12345', counters: { 102: 405666, 409: 139696, 112: 5 } }
    let preparation = null
    await page.route('**/api/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname, method = req.method()
      if (method === 'POST' && path.endsWith('/preparations')) {
        const payload = req.postDataJSON(); writes.push({ path, payload })
        preparation = { id: 12, version: 1, payload, contrat: contract, client: contract.client, imprimante: contract.imprimante, serial: 'TEST12345', date_debut: payload.reports[0].date, date_fin: payload.reports[1].date }
        return route.fulfill({ json: preparation })
      }
      if (method === 'POST' && path.endsWith('/comparaison/facture')) {
        const payload = req.postDataJSON(); writes.push({ path, payload }); assert.equal(payload.preparation_id, 12); assert.equal(payload.expected_version, 1); assert.equal(payload.rentalFee, 25000)
        preparation.facture_id = 7
        return route.fulfill({ status: 201, json: { facture: { id: 7, numero: 'FA-DEMO' }, suivi: { id: 8 }, already_exists: false } })
      }
      if (method === 'PUT' && path.endsWith('/tarifs')) {
        const payload = req.postDataJSON(); writes.push({ path, payload }); Object.assign(contract, payload); return route.fulfill({ json: contract })
      }
      if (method !== 'GET') { unexpected.push(method + path); return route.fulfill({ status: 500, json: {} }) }
      if (path.endsWith('/contexte/1')) return route.fulfill({ json: { contract, previous_report: previous } })
      if (path.endsWith('/preparations/12')) return route.fulfill({ json: preparation })
      const paginate = data => ({ data, current_page: 1, last_page: 1, total: data.length })
      if (path.endsWith('/preparations')) return route.fulfill({ json: paginate(preparation && !preparation.facture_id ? [preparation] : []) })
      if (path.endsWith('/contrats')) return route.fulfill({ json: paginate([contract]) })
      if (path.endsWith('/referentiels')) return route.fulfill({ json: { clients: [], produits: [], imprimantes_disponibles: [] } })
      if (path.endsWith('/stats')) return route.fulfill({ json: {} })
      if (/\/(comparaisons|imprimantes|releves|interventions)$/.test(path)) return route.fulfill({ json: paginate([]) })
      unexpected.push(path); return route.fulfill({ status: 500, json: {} })
    })
    await page.goto('http://127.0.0.1:5179/tests/browser/leasing-workflow.html#/leasing?tab=releves&vue=comparaison')
    await page.getByLabel('Rechercher un contrat', { exact: true }).fill('DEMO')
    await page.getByRole('button', { name: 'Rechercher', exact: true }).click()
    await page.getByRole('link', { name: /LC-DEMO · Client démonstration/ }).click()
    await expect(page.getByLabel('102 · Total 2 · précédent', { exact: true })).toHaveValue('405666')
    await page.getByText('Tarifs mémorisés dans le contrat', { exact: true }).click()
    await page.getByLabel('Forfait mensuel de location HT', { exact: true }).fill('30000')
    await page.getByRole('button', { name: 'Mémoriser les tarifs du contrat' }).click()
    await expect(page.getByText(/Tarifs mémorisés pour les prochaines/)).toBeVisible()
    await page.getByText('Tarifs mémorisés dans le contrat', { exact: true }).click()
    await page.getByLabel('Date du relevé récent', { exact: true }).fill('2026-10-27')
    for (const [label, value] of [['102 · Total 2', '408785'], ['409 · Couleur / 2', '141377'], ['112 · Noir grand format', '6']]) await page.getByLabel(label + ' · récent', { exact: true }).fill(value)
    await page.getByLabel('Faces couleur grand format sur la période', { exact: true }).fill('0')
    const calculate = async () => {
      await page.getByRole('checkbox').nth(0).check(); await page.getByRole('checkbox').nth(1).check()
      await page.getByRole('button', { name: 'Calculer la consommation', exact: true }).click()
      await expect(page.getByLabel('Forfait de location HT (FCFA)', { exact: true })).toHaveValue('25000')
      await page.getByRole('checkbox').last().check()
    }
    await calculate()
    await page.getByRole('button', { name: 'Enregistrer sans facturer', exact: true }).click()
    await expect(page.getByText(/Comparaison enregistrée sans facture/)).toBeVisible()
    assert.equal(writes.filter(w => w.path.endsWith('/facture')).length, 0)
    await page.getByRole('button', { name: 'Historique', exact: true }).click()
    await page.getByRole('link', { name: 'Reprendre', exact: true }).click()
    await expect(page.getByLabel('102 · Total 2 · récent', { exact: true })).toHaveValue('408785')
    await calculate()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await page.screenshot({ path: join(tmpdir(), `saytu-preparations-${width}.png`), fullPage: true })
    await page.getByRole('button', { name: 'Créer la facture brouillon', exact: true }).click()
    await expect(page.getByText('Facture créée : FA-DEMO', { exact: true })).toBeVisible()
    assert.deepEqual(errors, []); assert.deepEqual(unexpected, [])
    await context.close()
  }
  console.log('PASS: contract search, automatic counters, future rates, rental, save/resume, versioned invoice, mobile and desktop')
} finally { await browser.close() }
