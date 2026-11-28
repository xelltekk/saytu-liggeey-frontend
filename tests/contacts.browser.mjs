import { createRequire } from 'node:module'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url), runtime = join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const { chromium } = require(join(runtime, 'playwright')), { expect } = require(join(runtime, 'playwright/test'))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } })
const errors = [], leaks = []
const contacts = [7, 8, 9].map(id => ({ id, reference: `CO-${id}`, titre: id === 9 ? 'Contact indépendant' : `Contact ${id}`, client_id: id === 9 ? null : 1, client_label: id === 9 ? null : 'Tiers fictif', statut: 'actif', version: 1, fonction: 'Direction', email: `contact${id}@example.invalid`, telephone: '000000000', mobile: '', events: [] }))
const saved = { id: 1, reference: 'SAV-1', titre: 'Ticket conservé', client_id: 1, contact_id: 7, description: 'Description stable', resolution: 'Solution initiale', statut: 'resolu', version: 1, messages: [], events: [] }
const report = { id: '11111111-1111-4111-8111-111111111111', database_name: 'contacts-demo.sql', created_at: '2026-11-27 10:00:00', table_count: 4, blockers: [], warnings: [], modules: [{ key: 'socpeople', label: 'Contacts', rows: 3, present: true }, { key: 'societe', label: 'Tiers', rows: 1, present: true }], coverage: { notice: 'Inventaire fictif complet.', groups: [{ key: 'contacts', label: 'Contacts', rows: 3, target: 'existing', adapter: 'available', tables: [{ key: 'socpeople', rows: 3 }] }], excluded: [], review: [] }, unmapped_table_count: 0 }
const state = { enabled: true, role: 'admin', revision: 1, requests: [], writes: [], pendingImport: null }
// Le seul nouveau domaine migré dans cette fixture est Contacts ; les tiers restent distincts.
function context() {
  return { configured: true, contract_version: 1, tenant_id: 7, revision: state.revision, modules: [
    { key: 'core', name: 'Noyau', core: true, aliases: ['notifications', 'access_control', 'parametres'], activation_ready: true, enabled: true, licensed: true, manageable: false },
    ...['sav', 'clients', 'importation'].map(key => ({ key, core: false, activation_ready: false, enabled: true, licensed: true })),
    { key: 'contacts', name: 'Contacts', core: false, activation_ready: true, enabled: state.enabled, licensed: true, manageable: state.role === 'admin', permissions: ['contacts.view'], dependencies: ['core'] },
    { key: 'connaissances', name: 'Base de connaissances', core: false, activation_ready: true, enabled: true, licensed: true, permissions: ['connaissances.view'] },
  ], declared_menus: [{ module_key: 'connaissances', path: '/metier/connaissances', activation_ready: true }, ...(state.enabled ? [{ module_key: 'contacts', path: '/metier/contacts', label: 'Contacts', activation_ready: true }] : [])] }
}
function user() { return { id: 7001, name: 'Utilisateur fictif', email: 'demo@example.invalid', role: state.role, base_role: state.role, tenant: { id: 7, is_platform: false }, licence: { configured: false }, permissions: { flat: ['sav.view', 'sav.update', 'clients.view', 'connaissances.view', ...(state.enabled ? ['contacts.view'] : [])] }, modules_context: context() } }
function definitions() {
  return [
    { key: 'sav', label: 'Tickets clients / SAV', statuses: ['resolu', 'ferme'], fields: [['client_id', 'Tiers', 'relation', 'clients'], ...(state.enabled ? [['contact_id', 'Contact', 'relation', 'contacts']] : []), ['description', 'Description', 'textarea'], ['resolution', 'Solution', 'textarea']], permissions: { view: true, update: true, create: true } },
    ...(state.enabled ? [{ key: 'contacts', label: 'Contacts', statuses: ['actif', 'inactif'], fields: [['client_id', 'Tiers', 'relation', 'clients'], ['fonction', 'Fonction', 'text'], ['email', 'Email', 'email'], ['telephone', 'Téléphone', 'tel'], ['mobile', 'Mobile', 'tel']], permissions: { view: true, create: state.role === 'admin', update: state.role === 'admin' } }] : []),
    { key: 'connaissances', label: 'Base de connaissances', statuses: ['publie'], fields: [['contenu', 'Contenu', 'textarea']], permissions: { view: true } },
  ]
}
// Toutes les réponses sont fabriquées ici ; aucune requête HTTP API n'est autorisée.
await page.exposeFunction('__knowledgeMock', request => {
  state.requests.push(request)
  const url = request.url, body = typeof request.data === 'string' ? JSON.parse(request.data) : request.data || {}
  const response = (data, status = 200) => ({ data: structuredClone(data), status, headers: { 'x-saytu-modules-revision': String(state.revision), 'x-saytu-tenant-id': '7' } })
  if (url === '/modules/context') return response(context())
  if (url === '/auth/me') return response(user())
  if (url === '/societe/identite') return response({ nom: 'Entreprise fictive', logo: '', devise_defaut: 'XOF' })
  if (url === '/metier') return response({ modules: definitions() })
  if (url === '/metier/sav/1') {
    if (request.method === 'put') { assert.equal(Object.hasOwn(body, 'contact_id'), state.enabled); state.writes.push(body); Object.assign(saved, body); saved.version++; }
    const dto = { ...saved, relation_labels: { client_id: 'Tiers fictif' }, relation_links: { client_id: '/clients/1' } }
    if (state.enabled) { dto.relation_labels.contact_id = `Contact ${saved.contact_id}`; dto.relation_links.contact_id = `/metier/contacts/${saved.contact_id}` } else delete dto.contact_id
    return response(dto)
  }
  if (url.includes('/options/contacts')) return state.enabled ? response({ options: contacts.map(row => ({ id: row.id, label: row.titre })) }) : response({ code: 'MODULE_DISABLED', module: 'contacts' }, 403)
  if (url.includes('/options/clients')) return response({ options: [{ id: 1, label: 'Tiers fictif' }] })
  if (url === '/metier/contacts') return state.enabled ? response({ data: contacts, current_page: 1, last_page: 1, total: 3 }) : response({ code: 'MODULE_DISABLED', module: 'contacts' }, 403)
  if (/^\/metier\/contacts\/\d+$/.test(url)) return state.enabled ? response(contacts.find(row => row.id === Number(url.split('/').at(-1)))) : response({ code: 'MODULE_DISABLED', module: 'contacts' }, 403)
  if (url === '/metier/connaissances/101') return response({ id: 101, reference: 'KB-101', titre: 'Guide indépendant', contenu: 'Connaissances reste disponible.', statut: 'publie', version: 1, events: [] })
  if (url === '/clients/1') return response({ id: 1, nom: 'Tiers fictif', code: 'CL-1', type: 'client', statut: 'actif' })
  if (url === '/data-imports') return response({ reports: [report], limits: { database: 104857600, documents: 104857600, total: 209715200 } })
  if (url.endsWith('/runs')) return response({ runs: [] })
  if (url.endsWith('/contacts/execute')) return new Promise(resolve => { state.pendingImport = () => resolve(response({ created: 1, already_processed: 0 })) })
  if (url.endsWith('/contacts/preview')) return state.enabled ? response({ execution_available: true, preview_token: 'fictif', blockers: [], rows: [{ line: 1, source_id: '10', status: 'new', name: 'Contact à reprendre', client: 'Tiers fictif', issues: [] }], notice: 'Contacts fictifs.' }) : response({ code: 'MODULE_DISABLED', module: 'contacts' }, 403)
  return response({})
})
page.on('pageerror', error => errors.push(error.message))
await page.route('**/api/**', route => { leaks.push(route.request().url()); return route.abort() })
await mkdir('output', { recursive: true })
async function navigate(path) { await page.evaluate(path => window.__knowledgeHarness.router.push(path), path) }
async function toggle(enabled) { state.enabled = enabled; state.revision++; await page.evaluate(revision => window.dispatchEvent(new CustomEvent('saytu:modules-revision', { detail: { tenant_id: 7, revision } })), state.revision) }
try {
  await page.goto('http://127.0.0.1:5187/tests/contacts-harness.html')
  const contact = page.getByRole('combobox', { name: 'Contact', exact: true })
  await expect(contact).toHaveValue('7')
  await contact.selectOption('8')
  await page.getByLabel('Solution', { exact: true }).fill('Brouillon SAV conservé')
  await toggle(false)
  await expect(contact).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Ouvrir Contact 7', exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Solution', { exact: true })).toHaveValue('Brouillon SAV conservé')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  assert.equal(Object.hasOwn(state.writes[0], 'contact_id'), false)
  assert.equal(saved.contact_id, 7)
  await navigate('/clients/1')
  await toggle(true)
  await navigate('/metier/sav/1')
  await expect(contact).toHaveValue('8')
  await expect(page.getByLabel('Solution', { exact: true })).toHaveValue('Brouillon SAV conservé')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(2)
  assert.equal(saved.contact_id, 8)
  console.log('PASS SAV : contact latent conservé, champ/liens masqués OFF, payload omis puis sélection restaurée ON')

  await navigate('/metier/contacts/9')
  await expect(page.getByRole('heading', { name: 'CO-9', exact: true })).toBeVisible()
  await expect(page.getByLabel(/Nom complet/)).toHaveValue('Contact indépendant')
  await navigate('/clients/1')
  await expect(page.locator('main').getByRole('link', { name: 'Contacts', exact: true })).toBeVisible()
  await toggle(false)
  await expect(page.locator('main').getByRole('link', { name: 'Contacts', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Tiers fictif', exact: true }).first()).toBeVisible()
  await navigate('/metier/contacts/7')
  await expect(page).toHaveURL(/\/module-indisponible$/)
  assert.equal(contacts.length, 3)
  console.log('PASS Contacts indépendants/tiers distincts, liens client masqués et accès direct bloqué sans suppression')

  await navigate('/importation')
  await page.getByRole('button', { name: 'Consulter', exact: true }).click()
  await page.getByLabel('Sauvegarde SQL analysée').setInputFiles({ name: 'contacts-demo.sql', mimeType: 'application/sql', buffer: Buffer.from('-- exemple fictif sans données') })
  await page.getByLabel('Pays des tiers').fill('Sénégal')
  await page.getByLabel('Devise de la sauvegarde').fill('XOF')
  await page.getByRole('button', { name: 'Continuer vers les données', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Contacts \(3\)$/ })).toHaveCount(0)
  await expect(page.getByText('Le module Contacts est désactivé', { exact: false })).toBeVisible()
  await page.getByText('Rapport détaillé de la sauvegarde', { exact: true }).click()
  await expect(page.getByText('Module désactivé — import indisponible', { exact: true })).toBeVisible()
  assert.equal(report.modules.find(row => row.key === 'socpeople').rows, 3)
  const marker = state.requests.length
  await toggle(true)
  await page.getByRole('button', { name: /^Contacts \(3\)$/ }).click()
  await expect(page.getByRole('button', { name: 'Vérifier contacts', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Vérifier contacts', exact: true }).click()
  await page.getByRole('checkbox', { name: /Je confirme l’import/ }).check()
  await page.getByRole('button', { name: 'Importer les nouvelles fiches', exact: true }).click()
  await expect.poll(() => !!state.pendingImport).toBe(true)
  await toggle(false)
  await expect(page.getByRole('button', { name: 'Vérifier contacts', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Vérifier le bilan', exact: true })).toBeEnabled()
  const offMarker = state.requests.length
  state.pendingImport(); state.pendingImport = null
  await page.getByRole('button', { name: 'Vérifier le bilan', exact: true }).click()
  assert.equal(state.requests.slice(marker).filter(request => request.url.endsWith('/contacts/execute')).length, 1)
  assert.equal(state.requests.slice(offMarker).some(request => request.url.endsWith('/contacts/execute')), false)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.app-shell')).toHaveAttribute('data-device', 'mobile')
  const menuToggle = page.getByRole('button', { name: 'Ouvrir ou réduire le menu principal' })
  await menuToggle.click()
  const importLink = page.locator('#main-sidebar a[href="/importation"]')
  if (!await importLink.isVisible()) await page.locator('#main-sidebar').getByRole('button', { name: 'Administration', exact: true }).click()
  await importLink.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(async () => { const box = await page.locator('#main-sidebar').boundingBox(); return Math.round(box.x + box.width) }).toBeLessThanOrEqual(0)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.screenshot({ path: 'output/contacts-pilot-import-mobile.png', fullPage: true })
  console.log('PASS import : cible masquée/expliquée OFF et restaurée ON, inventaire SQL conservé')

  await navigate('/metier/connaissances/101')
  await page.getByRole('button', { name: 'Lire la procédure', exact: true }).click()
  await expect(page.getByText('Connaissances reste disponible.', { exact: true }).last()).toBeVisible()
  state.role = 'commercial'
  await page.evaluate(payload => window.__knowledgeHarness.auth.acceptSessionUser(payload), user())
  await navigate('/metier/sav/1')
  await toggle(true)
  await expect(contact).toHaveValue('8')
  assert.equal(await page.evaluate(() => window.__knowledgeHarness.auth.user.permissions.flat.includes('contacts.create')), false)
  await navigate('/metier/contacts/9')
  await expect(page.getByRole('heading', { name: 'CO-9', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 1040 })
  await expect(page.locator('.app-shell')).toHaveAttribute('data-device', 'desktop')
  await page.screenshot({ path: 'output/contacts-pilot-independent.png', fullPage: true })
  console.log('PASS droits non-admin restaurés sans contacts.create ; Knowledge indépendant ; aucun appel réel')
  assert.deepEqual(errors, [])
  assert.deepEqual(leaks, [])
} catch (cause) { console.error('Erreurs JS', errors); await page.screenshot({ path: 'output/contacts-pilot-failure.png', fullPage: true }); throw cause }
finally { await browser.close() }
