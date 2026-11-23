import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const runtime = join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const { chromium } = require(join(runtime, 'playwright'))
const { expect } = require(join(runtime, 'playwright/test'))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
await mkdir('output/migration-assistant', { recursive: true })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    await page.clock.install()
    const errors = []
    const requestIds = []
    let saved = []
    let attempts = 0
    let previewRequests = 0
    const report = {
      id: '11111111-1111-4111-8111-111111111111', database_name: 'demo.sql',
      database_sha256: 'sample', blockers: [], warnings: [], modules: [
        { key: 'societe', rows: 202 }, { key: 'product', rows: 5 }, { key: 'facture', rows: 3 },
      ], coverage: { groups: [{ key: 'factures', rows: 3, label: 'Factures clients', adapter: 'preview_only' }], excluded: [], review: [] },
    }
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', route => {
      const request = route.request()
      const path = new URL(request.url()).pathname.replace(/^\/api/, '')
      if (path === '/data-imports') return route.fulfill({ json: { reports: [], limits: { database: 104857600, documents: 104857600, total: 209715200 } } })
      if (path === '/data-imports/analyze') return route.fulfill({ status: 201, json: report })
      if (path.endsWith('/runs')) return route.fulfill({ json: { runs: path.endsWith('/products/runs') || path.endsWith('/stock/runs') || path.endsWith('/quotes/runs') ? [] : [{ source_key: 'dolibarr-principal', result: { items: saved } }] } })
      if (path.endsWith('/preview')) {
        previewRequests++
        assert(request.headers()['content-type'].startsWith('multipart/form-data'))
        assert(request.postData().includes('demo.sql'))
        return route.fulfill({ json: {
          mapping: { nom: 'nom', code: 'code_client' }, execution_available: true, preview_token: 'preview-token',
          blockers: [], rows: [
            ...Array.from({ length: 201 }, (_, index) => ({ line: index + 1, source_id: String(index + 1), status: 'new', issues: [] })),
            { line: 202, source_id: '202', status: 'source_duplicate', issues: [] },
          ],
        } })
      }
      if (path.endsWith('/execute')) {
        attempts++
        const body = request.postData()
        assert(request.headers()['content-type'].startsWith('multipart/form-data'))
        assert(body.includes('demo.sql'))
        assert(body.includes('Sénégal'))
        assert(body.includes('dolibarr-principal'))
        const id = body.match(/name="request_id"\r\n\r\n([^\r]+)/)[1]
        requestIds.push(id)
        if (attempts === 1) return route.fulfill({ status: 503, json: { message: 'Interruption de test' } })
        const lines = [...body.matchAll(/name="decisions\[\d+\]\[line\]"\r\n\r\n(\d+)/g)].map(match => Number(match[1]))
        assert.equal(lines.length, attempts === 2 ? 200 : 1)
        saved.push(...lines.map(line => ({ source_id: String(line), action: 'created' })))
        return route.fulfill({ json: { created: lines.length, already_processed: 0 } })
      }
      return route.fulfill({ json: path.includes('/pilotage/') || /\/(stats|badges|summary)$/.test(path) ? {} : [] })
    })
    await page.goto('http://127.0.0.1:5187/tests/navigation-harness.html')
    await page.getByRole('heading', { name: 'Centre de pilotage', exact: true }).waitFor()
    await page.evaluate(() => window.testNavigate('/importation'))
    await page.getByRole('button', { name: 'Migrer depuis Dolibarr', exact: true }).click()
    await page.locator('#import-database').setInputFiles({ name: 'demo.sql', mimeType: 'application/sql', buffer: Buffer.from('SQL de démonstration') })
    await page.getByRole('button', { name: 'Analyser les fichiers' }).click()
    await page.getByLabel('Pays des tiers').fill('Sénégal')
    await page.getByLabel('Devise de la sauvegarde').fill('XOF')
    await page.getByRole('button', { name: 'Continuer vers les données' }).click()
    await expect(page.locator('input[type=file]:visible')).toHaveCount(0)
    await page.getByRole('button', { name: 'Vérifier clients et fournisseurs' }).click()
    await expect(page.getByText('Nouvelles fiches prêtes')).toBeVisible()
    await page.getByRole('checkbox', { name: /Je confirme l’import/ }).check()
    await page.getByRole('button', { name: 'Importer les nouvelles fiches' }).click()
    await expect(page.getByRole('alert')).toContainText('Interruption de test')
    await page.getByRole('button', { name: 'Reprendre le transfert' }).click()
    await page.clock.fastForward(23000)
    await expect.poll(() => attempts).toBe(2)
    await page.clock.fastForward(23000)
    await expect.poll(() => attempts).toBe(3)
    await expect(page.getByText('201 fiche(s) créée(s), 0 déjà traitée(s). 1 fiche(s) restent à vérifier.')).toBeVisible()
    assert.equal(requestIds[0], requestIds[1])
    assert.notEqual(requestIds[1], requestIds[2])
    assert.equal(previewRequests, 1)
    await page.getByRole('button', { name: 'Vérifier le bilan', exact: true }).click()
    await expect(page.getByText('202 dans la sauvegarde · 201 traités dans les lots enregistrés')).toBeVisible()
    await expect(page.getByText(/La reprise complète reste à terminer/)).toBeVisible()
    assert.deepEqual(errors, [])
    await page.screenshot({ path: `output/migration-assistant/${width}.png`, fullPage: true })
    console.log(`PASS ${width}px: single file, shared settings, 201 records in automatic batches, same-ID retry and honest balance`)
    await page.close()
  }
} finally {
  await browser.close()
}
