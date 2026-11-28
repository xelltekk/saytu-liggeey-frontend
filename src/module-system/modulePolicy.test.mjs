import test from 'node:test'
import assert from 'node:assert/strict'
import { knowledgeAudienceLabel } from '../modules/connaissances/ui.js'
import { projectDeclaredMenus, manifestManagedModuleKeys } from './menuRegistry.mjs'
import { moduleKeysForPath, moduleIsAvailable, moduleRouteIsAvailable, mayManageModules, configurationTarget, moduleSessionIdentity, userWithoutModuleContext, moduleContextMatchesUser, moduleAvailabilitySignature, managedPermissionModuleKeys } from './modulePolicy.mjs'

const context = { configured: true, contract_version: 1, tenant_id: 7, revision: 2, modules: [
  { key: 'core', aliases: ['notifications', 'utilisateurs', 'activites'], core: true, enabled: true, licensed: true },
  { key: 'connaissances', activation_ready: true, enabled: false, licensed: true },
  { key: 'contacts', activation_ready: true, enabled: true, licensed: false },
  { key: 'factures', activation_ready: false, enabled: true, licensed: false },
  { key: 'stock', activation_ready: false, enabled: false, licensed: true },
  { key: 'agenda', activation_ready: false, enabled: true, licensed: true },
  { key: 'leasing', activation_ready: false, enabled: true, licensed: true },
  { key: 'interventions_leasing', activation_ready: false, enabled: true, licensed: true },
] }

test('un ancien serveur ou un noyau non installé conserve les parcours existants', () => {
  assert.equal(moduleRouteIsAvailable(null, '/factures/42'), true)
  assert.equal(moduleRouteIsAvailable({ configured: false, modules: [] }, '/metier/connaissances'), true)
})
test('les fonctions du noyau restent accessibles par leur alias', () => {
  assert.equal(moduleIsAvailable(context, 'notifications'), true)
  assert.equal(moduleRouteIsAvailable(context, '/notifications'), true)
  assert.equal(moduleRouteIsAvailable(context, '/utilisateurs/9'), true)
  assert.deepEqual(moduleKeysForPath('/activites'), ['core'])
})
test('un module validé exige activation et abonnement même pour une route directe', () => {
  assert.equal(moduleRouteIsAvailable(context, '/metier/connaissances/42'), false)
  assert.equal(moduleRouteIsAvailable(context, '/metier/contacts?vue=tous'), false)
})
test('un module historique conserve son contrôle de licence existant mais respecte OFF', () => {
  assert.equal(moduleRouteIsAvailable(context, '/factures/42'), true)
  assert.equal(moduleRouteIsAvailable(context, '/stock'), false)
})
test('la route métier utilise le paramètre exact et refuse une clé absente du catalogue', () => {
  assert.deepEqual(moduleKeysForPath('/metier/connaissances/42'), ['connaissances'])
  assert.equal(moduleRouteIsAvailable(context, '/metier/inconnu'), false)
  assert.equal(moduleRouteIsAvailable(context, '/metier/%E0'), false)
})
test('les dépenses récurrentes appartiennent à Agenda et ne dépendent pas des dépenses payées', () => {
  assert.deepEqual(moduleKeysForPath('/agenda/depenses'), ['agenda'])
  assert.equal(moduleRouteIsAvailable(context, '/agenda/depenses'), true)
})
test('les interventions restent rattachées au leasing sans imposer une nouvelle route', () => {
  assert.deepEqual(moduleKeysForPath('/leasing/interventions/3'), ['leasing', 'interventions_leasing'])
  assert.equal(moduleRouteIsAvailable(context, '/leasing/interventions/3'), true)
})
test('les portails client et abonné gardent des périmètres distincts', () => {
  assert.deepEqual(moduleKeysForPath('/portail-clients'), ['portail_clients'])
  assert.deepEqual(moduleKeysForPath('/espace-client/connaissances'), ['core'])
})
test('les réglages ne peuvent pas injecter une URL ou créer une configuration fictive', () => {
  assert.equal(configurationTarget({ key: 'rh', configuration_path: '/rh?tab=administration' }), '/rh?tab=administration')
  assert.equal(configurationTarget({ key: 'rh', configuration_path: 'https://example.com' }), null)
  assert.equal(configurationTarget({ key: 'connaissances', configuration_path: '/metier/connaissances' }), null)
})
test('seul un administrateur peut gérer les modules, y compris avec un rôle personnalisé', () => {
  assert.equal(mayManageModules({ role: 'gerant' }), false)
  assert.equal(mayManageModules({ role: 'commercial', permissions: { flat: ['modules.manage'] } }), false)
  assert.equal(mayManageModules({ role: 'direction', base_role: 'admin' }), true)
})
test('les sociétés et utilisateurs ont des identités de session distinctes', () => {
  assert.notEqual(moduleSessionIdentity({ id: 1, tenant: { id: 7 } }), moduleSessionIdentity({ id: 1, tenant: { id: 8 } }))
  assert.notEqual(moduleSessionIdentity({ id: 1, tenant: { id: 7 } }), moduleSessionIdentity({ id: 2, tenant: { id: 7 } }))
})


test('un manifeste ne peut pas injecter une route, un composant ou un module propriétaire différent', () => {
  const menus = projectDeclaredMenus([
    { path: 'https://example.com', module_key: 'connaissances', activation_ready: true },
    { path: '/metier/connaissances', module_key: 'contacts', activation_ready: true },
    { path: '/metier/connaissances', module_key: 'connaissances', activation_ready: false },
    { path: '/metier/connaissances', module_key: 'connaissances', activation_ready: true, permission: 'core.manage', component: '/evil.js' },
    { path: '/metier/connaissances', module_key: 'connaissances', activation_ready: true },
  ])
  assert.equal(menus.length, 1)
  assert.equal(menus[0].to, '/metier/connaissances')
  assert.equal(menus[0].permission, 'connaissances.view')
  assert.equal(menus[0].component, undefined)
})


test('le profil persistant exclut le contexte des modules sans altérer la réponse reçue', () => {
  const payload = { id: 1, tenant: { id: 7 }, modules_context: context }
  assert.equal(userWithoutModuleContext(payload).modules_context, undefined)
  assert.equal(payload.modules_context, context)
  assert.equal(moduleContextMatchesUser(context, payload), true)
  assert.equal(moduleContextMatchesUser(context, { id: 1, tenant: { id: 8 } }), false)
})


test('les modules UI migrés prennent leur menu du manifeste en conservant le repli historique', () => {
  assert.deepEqual(manifestManagedModuleKeys(context), [])
  assert.deepEqual(manifestManagedModuleKeys({ ...context, declared_menus: [] }), ['connaissances', 'contacts'])
  assert.deepEqual(manifestManagedModuleKeys({ ...context, declared_menus: [], modules: context.modules.map(module => ({ ...module, activation_ready: false })) }), [])
})


test('knowledge reader audience labels follow the stored value with an internal default', () => {
  assert.equal(knowledgeAudienceLabel('clients'), 'Clients de l’entreprise')
  assert.equal(knowledgeAudienceLabel('abonnes'), 'Abonnés Saytu')
  assert.equal(knowledgeAudienceLabel('interne'), 'Interne')
  assert.equal(knowledgeAudienceLabel(undefined), 'Interne')
})


test('la signature générique est stable par clé et suit les licences des seuls modules migrés', () => {
  const modules = [
    { key: 'projets', activation_ready: true, core: false, enabled: false, licensed: true },
    { key: 'contacts', activation_ready: true, core: false, enabled: true, licensed: true },
    { key: 'stock', activation_ready: false, core: false, enabled: true, licensed: true },
    { key: 'core', activation_ready: true, core: true, enabled: true, licensed: true },
  ]
  const value = { configured: true, modules }
  const signature = moduleAvailabilitySignature(value)
  assert.equal(moduleAvailabilitySignature({ ...value, modules: [...modules].reverse() }), signature)
  assert.equal(moduleAvailabilitySignature({ ...value, modules: modules.map(module => module.key === 'stock' ? { ...module, enabled: false } : module) }), signature)
  assert.notEqual(moduleAvailabilitySignature({ ...value, modules: modules.map(module => module.key === 'contacts' ? { ...module, licensed: false } : module) }), signature)
})

test('un manifeste ne possède que sa clé canonique et ne peut projeter un préfixe core ou étranger', () => {
  assert.deepEqual(managedPermissionModuleKeys({ configured: true, modules: [
    { key: 'contacts', activation_ready: true, core: false, aliases: ['core'], permissions: ['core.manage', 'projets.delete'] },
    { key: 'projets', activation_ready: true, core: false },
    { key: 'core', activation_ready: true, core: true, permissions: ['core.manage'] },
    { key: 'stock', activation_ready: false, core: false, permissions: ['stock.view'] },
  ] }), ['contacts', 'projets'])
  assert.deepEqual(managedPermissionModuleKeys({ configured: false, modules: [] }), [])
})
