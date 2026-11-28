import { createRequire } from 'node:module'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const runtime = join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const { chromium } = require(join(runtime, 'playwright'))
const { expect } = require(join(runtime, 'playwright/test'))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } })
const errors = [], networkLeaks = []
const article = { id: 101, reference: 'KB-101', titre: 'Procédure conservée', contenu: 'Redémarrez le routeur.\n<strong>Ce contenu reste du texte.</strong>', categorie: 'Réseau', audience: 'clients', statut: 'publie', version: 1, events: [], created_at: '2026-11-27 10:00:00', updated_at: '2026-11-27 10:00:00' }
const state = { enabled: true, licensed: true, revision: 1, events: [], requests: [], publisherAvailable: true, failAuthOnce: false, authFailures: 0, role: 'admin', articles: [structuredClone(article)] }
const baseUser = { id: 7001, name: 'Utilisateur fictif', email: 'demo@example.invalid', tenant: { id: 7, is_platform: false, has_subscription_account: true }, licence: { configured: false } }
// Produit uniquement le catalogue fictif du pilote et de ses intégrations.
function context() {
  return { configured: true, contract_version: 1, tenant_id: 7, revision: state.revision, modules: [
    { key: 'core', name: 'Noyau', aliases: ['notifications', 'activites', 'utilisateurs', 'access_control', 'parametres', 'licence', 'securite'], core: true, enabled: true, licensed: true, activation_ready: true, manageable: false, dependencies: [], family: 'Configuration' },
    { key: 'sav', name: 'Tickets clients / SAV', core: false, enabled: true, licensed: true, activation_ready: false, manageable: false, dependencies: ['core'], integrations: ['connaissances'], family: 'Services' },
    { key: 'connaissances', name: 'Base de connaissances', description: 'Guides et procédures réutilisables.', author: 'Saytu', version: '1.0.0', core: false, enabled: state.enabled, licensed: state.licensed, activation_ready: true, manageable: state.role === 'admin', dependencies: ['core'], integrations: ['sav', 'portail_clients'], family: 'Services' },
  ], declared_menus: state.enabled && state.licensed ? [{ key: 'connaissances.main', module_key: 'connaissances', path: '/metier/connaissances', label: 'Base de connaissances', activation_ready: true }] : [] }
}
// Simule les droits dormants masqués dans le payload lorsque le module est OFF.
function user() { return { ...baseUser, role: state.role, base_role: state.role, permissions: { flat: ['sav.view', 'sav.update', ...(state.enabled && state.licensed ? ['connaissances.view'] : [])] }, modules_context: context() } }
// Les schémas métier restent fournis par le serveur fictif et ne changent pas les autres écrans.
function definitions() {
  return [
    { key: 'sav', label: 'Tickets clients / SAV', statuses: ['resolu', 'ferme'], fields: [['description', 'Description', 'textarea'], ['resolution', 'Solution', 'textarea']], permissions: { view: true, create: true, update: true, delete: false } },
    ...(state.enabled ? [{ key: 'connaissances', label: 'Base de connaissances', statuses: ['brouillon', 'publie', 'retire'], fields: [['categorie', 'Catégorie', 'text'], ['contenu', 'Contenu', 'textarea'], ['audience', 'Audience', 'select', ['interne', 'clients']]], permissions: { view: true, create: state.role === 'admin', update: state.role === 'admin', delete: false } }] : []),
  ]
}
// Répond au navigateur via son binding Playwright, sans aucune requête HTTP API.
async function mock(request) {
  state.requests.push(request)
  const url = request.url, body = typeof request.data === 'string' ? JSON.parse(request.data) : request.data || {}
  const response = (data, status = 200) => ({ data: structuredClone(data), status, headers: { 'x-saytu-modules-revision': String(state.revision), 'x-saytu-tenant-id': '7' } })
  if (request.baseURL === '/api/client-portal') {
    if (url === '/me') return response({ name: 'Contact portail fictif', client: 'Client de démonstration', entreprise: 'Entreprise fictive', capabilities: { connaissances: state.enabled }, modules_revision: state.revision })
    if (url === '/notifications') return response({ unread: 0, items: [] })
    if (url === '/connaissances') return state.enabled ? response({ data: state.articles, current_page: 1, last_page: 1, total: 1 }) : response({ code: 'MODULE_DISABLED', module: 'connaissances', message: 'Rubrique désactivée.' }, 403)
    return response({ data: [], current_page: 1, last_page: 1, total: 0 })
  }
  if (url === '/modules/context') return response(context())
  if (url === '/configuration/modules') return response({ ...context(), events: state.events })
  if (url === '/configuration/modules/preview') return response({ key: body.key, enabled: body.enabled, revision: state.revision, can_apply: body.key === 'connaissances', dependencies_to_enable: [], blocking_dependents: [], message: 'Les données sont conservées.' })
  if (url === '/configuration/modules/apply') {
    assert.equal(body.expected_revision, state.revision)
    state.enabled = body.enabled; state.revision++
    state.events.unshift({ id: state.events.length + 1, module_key: 'connaissances', action: body.enabled ? 'enable' : 'disable', actor_id: 7001, occurred_at: new Date().toISOString() })
    return response(context())
  }
  if (url === '/societe/identite') return response({ nom: 'Entreprise fictive', logo: '', devise_defaut: 'XOF' })
  if (url === '/auth/me') {
    if (state.failAuthOnce) { state.failAuthOnce = false; state.authFailures++; return response({ message: 'Service momentanément indisponible.' }, 503) }
    return response(user())
  }
  if (url === '/espace-client/connaissances') return response({ available: state.publisherAvailable, data: state.publisherAvailable ? [{ id: 501, titre: 'Guide Saytu indépendant', categorie: 'Premiers pas', contenu: 'Cette aide appartient à la plateforme éditrice.' }] : [], current_page: 1, last_page: 1, total: state.publisherAvailable ? 1 : 0 })
  if (url === '/metier') return response({ modules: definitions() })
  if (/^\/metier\/sav\/\d+$/.test(url)) {
    const id = Number(url.split('/').at(-1))
    return response({ id, reference: `SAV-${id}`, titre: id === 1 ? 'Ticket sans procédure' : 'Ticket avec procédure', statut: 'resolu', description: 'Connexion instable.', resolution: 'Redémarrez le routeur.', article_id: id === 2 ? 101 : null, can_create_article: id === 1 && state.enabled, version: 1, messages: [], events: [] })
  }
  if (/^\/metier\/connaissances/.test(url)) {
    if (!state.enabled) return response({ code: 'MODULE_DISABLED', module: 'connaissances', message: 'Rubrique désactivée.' }, 403)
    const id = Number(url.split('/').at(-1))
    return response(Number.isNaN(id) ? { data: state.articles, current_page: 1, last_page: 1, total: 1 } : state.articles.find(row => row.id === id))
  }
  return response({})
}
await page.exposeFunction('__knowledgeMock', mock)
await page.route('**/api/**', route => { networkLeaks.push(route.request().url()); return route.abort() })
page.on('pageerror', error => errors.push(error.message))
await mkdir('output', { recursive: true })
// Utilise le vrai routeur livré avec l'application.
async function navigate(path) { await page.evaluate(path => window.__knowledgeHarness.router.push(path), path) }
// Change uniquement le serveur fictif puis annonce sa révision.
async function remoteChange(enabled) {
  state.enabled = enabled; state.revision++
  await page.evaluate(revision => { window.dispatchEvent(new CustomEvent('saytu:modules-revision', { detail: { tenant_id: 7, revision } })); window.dispatchEvent(new Event('focus')) }, state.revision)
}
try {
  await page.goto('http://127.0.0.1:5187/tests/knowledge-harness.html')
  await expect(page.getByRole('button', { name: 'Créer une procédure depuis la solution', exact: true })).toBeVisible()
  await navigate('/metier/sav/2')
  await expect(page.getByRole('link', { name: 'Voir la procédure issue de ce ticket', exact: true })).toBeVisible()
  await navigate('/configuration/modules')
  await page.getByRole('switch', { name: 'Désactiver Base de connaissances', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmer', exact: true }).click()
  await expect(page.getByRole('switch', { name: 'Activer Base de connaissances', exact: true })).not.toBeChecked()
  await expect(page.locator('#main-sidebar').getByRole('link', { name: 'Base de connaissances', exact: true })).toHaveCount(0)
  await navigate('/metier')
  await expect(page.getByRole('link', { name: 'Base de connaissances →', exact: true })).toHaveCount(0)
  await navigate('/metier/sav/1')
  await expect(page.getByRole('heading', { name: 'SAV-1', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Créer une procédure depuis la solution', exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Solution', { exact: true })).toHaveValue('Redémarrez le routeur.')
  await navigate('/metier/sav/2')
  await expect(page.getByRole('link', { name: 'Voir la procédure issue de ce ticket', exact: true })).toHaveCount(0)
  await navigate('/metier/connaissances/101')
  await expect(page).toHaveURL(/\/module-indisponible$/)
  assert.deepEqual(state.articles, [article])
  console.log('PASS OFF : menu, catalogue, liens et actions SAV retirés ; accès direct bloqué ; données conservées')

  await navigate('/configuration/modules')
  await page.getByRole('switch', { name: 'Activer Base de connaissances', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmer', exact: true }).click()
  await navigate('/metier/connaissances/101')
  await page.getByRole('button', { name: 'Lire la procédure', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Procédure conservée', exact: true })).toBeVisible()
  await expect(page.getByText('Réseau · Publié · Clients de l’entreprise', { exact: true })).toBeVisible()
  await expect(page.getByText('<strong>Ce contenu reste du texte.</strong>', { exact: false })).toBeVisible()
  await expect(page.locator('article strong')).toHaveCount(0)
  await page.screenshot({ path: 'output/knowledge-pilot-article.png', fullPage: true })
  assert.deepEqual(state.articles, [article])
  await navigate('/metier/sav/1')
  await expect(page.getByRole('button', { name: 'Créer une procédure depuis la solution', exact: true })).toBeVisible()
  console.log('PASS ON : même article et mêmes données retrouvés ; lecteur extrait sûr et action SAV restaurée')

  await navigate('/portail-clients')
  await expect(page.getByRole('button', { name: 'Base de connaissances', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Base de connaissances', exact: true }).click()
  await expect(page.locator('summary').filter({ hasText: 'Procédure conservée' })).toBeVisible()
  const requestMarker = state.requests.length
  const privateCallsBefore = state.requests.filter(request => request.baseURL !== '/api/client-portal').length
  await remoteChange(false)
  await expect(page.getByRole('button', { name: 'Base de connaissances', exact: true })).toHaveCount(0)
  await expect(page.locator('summary').filter({ hasText: 'Procédure conservée' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mes tickets', exact: true })).toBeEnabled()
  await expect(page.getByText('Bonjour Contact portail fictif', { exact: false })).toBeVisible()
  assert.equal(state.requests.filter(request => request.baseURL !== '/api/client-portal').length, privateCallsBefore, JSON.stringify(state.requests.slice(requestMarker)))
  await remoteChange(true)
  await page.getByRole('button', { name: 'Base de connaissances', exact: true }).click()
  await expect(page.locator('summary').filter({ hasText: 'Procédure conservée' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.screenshot({ path: 'output/knowledge-pilot-client-mobile.png', fullPage: true })
  console.log('PASS portail client : retrait à distance sans déconnexion ni contexte privé ; réapparition à ON et rendu mobile')

  await remoteChange(false)
  await navigate('/espace-client/connaissances')
  await expect(page.locator('summary').filter({ hasText: 'Guide Saytu indépendant' })).toBeVisible()
  state.publisherAvailable = false
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByText('La documentation Saytu est momentanément indisponible.')).toBeVisible()
  await expect(page.locator('summary').filter({ hasText: 'Guide Saytu indépendant' })).toHaveCount(0)
  state.publisherAvailable = true
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.locator('summary').filter({ hasText: 'Guide Saytu indépendant' })).toBeVisible()
  console.log('PASS documentation Saytu indépendante du module client et filtrée selon la société éditrice')

  state.role = 'commercial'
  await page.evaluate(payload => window.__knowledgeHarness.auth.acceptSessionUser(payload), user())
  await navigate('/metier/sav/1')
  assert.equal(await page.evaluate(() => window.__knowledgeHarness.auth.user.permissions.flat.includes('connaissances.view')), false)
  await remoteChange(true)
  await expect.poll(() => page.evaluate(() => window.__knowledgeHarness.auth.user.permissions.flat.includes('connaissances.view'))).toBe(true)
  await expect(page.locator('#main-sidebar').getByRole('link', { name: 'Base de connaissances', exact: true })).toHaveCount(1)
  await navigate('/metier/connaissances/101')
  await expect(page.getByRole('button', { name: 'Lire la procédure', exact: true })).toBeVisible()
  console.log('PASS réactivation restaure les droits dormants du non-administrateur via auth/me')
  const stableRevision = state.revision
  state.licensed = false
  await page.evaluate(() => window.__knowledgeHarness.modules.fetchContext({ force: true }))
  await expect.poll(() => page.evaluate(() => window.__knowledgeHarness.auth.user.permissions.flat.includes('connaissances.view'))).toBe(false)
  state.licensed = true
  await page.evaluate(() => window.__knowledgeHarness.modules.fetchContext({ force: true }))
  await expect.poll(() => page.evaluate(() => window.__knowledgeHarness.auth.user.permissions.flat.includes('connaissances.view'))).toBe(true)
  await navigate('/metier/connaissances/101')
  await expect(page.getByRole('button', { name: 'Lire la procédure', exact: true })).toBeVisible()
  assert.equal(state.revision, stableRevision)
  console.log('PASS renouvellement de licence à révision constante restaure aussi les droits sans reconnexion')

  await remoteChange(false)
  await expect.poll(() => page.evaluate(() => window.__knowledgeHarness.auth.user.permissions.flat.includes('connaissances.view'))).toBe(false)
  const preservedUserId = await page.evaluate(() => { window.__knowledgeHarness.sessionMarker = 'aucun-rechargement'; return window.__knowledgeHarness.auth.user.id })
  state.failAuthOnce = true
  await remoteChange(true)
  await expect.poll(() => state.authFailures).toBe(1)
  await expect.poll(() => page.evaluate(() => !!window.__knowledgeHarness.auth.user && window.__knowledgeHarness.modules.allows('connaissances'))).toBe(true)
  assert.equal(await page.evaluate(() => window.__knowledgeHarness.auth.user.id), preservedUserId)
  assert.equal(await page.evaluate(() => window.__knowledgeHarness.auth.user.permissions.flat.includes('connaissances.view')), false)
  assert.equal(await page.evaluate(() => !!localStorage.getItem('xelltekk_user')), true)
  const authCallsBeforeRetry = state.requests.filter(request => request.url === '/auth/me').length
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect.poll(() => page.evaluate(() => window.__knowledgeHarness.auth.user.permissions.flat.includes('connaissances.view'))).toBe(true)
  assert.equal(state.requests.filter(request => request.url === '/auth/me').length, authCallsBeforeRetry + 1)
  assert.equal(await page.evaluate(() => window.__knowledgeHarness.auth.user.id), preservedUserId)
  assert.equal(await page.evaluate(() => window.__knowledgeHarness.sessionMarker), 'aucun-rechargement')
  console.log('PASS auth/me 503 conserve profil et catalogue ; focus rétablit les droits avec une seule reprise, sans rechargement')


  assert.deepEqual(state.articles, [article])
  assert.deepEqual(networkLeaks, [])
  assert.deepEqual(errors, [])
  console.log('PASS aucun appel API réel, aucune erreur JavaScript, aucune donnée détruite')
} catch (cause) {
  console.error('Erreurs JavaScript', errors)
  await page.screenshot({ path: 'output/knowledge-pilot-failure.png', fullPage: true })
  throw cause
} finally { await browser.close() }
