// Harnais local de vérification : aucune requête n'est transmise à un vrai serveur.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { AxiosError } from 'axios'
import App from '../src/App.vue'
import router from '../src/router/index.js'
import api from '../src/services/api.js'
import { useAuthStore } from '../src/stores/auth.js'
import { useModulesStore } from '../src/stores/modules.js'
import '../src/style.css'

const user = { id: 7001, name: 'Administrateur de démonstration', nom: 'Administrateur de démonstration', email: 'demo@example.invalid', role: 'admin', base_role: 'admin', tenant: { id: 7, is_platform: false, has_subscription_account: false }, licence: { configured: false }, permissions: { flat: [] } }
const legacyNames = { dashboard: 'Tableau de bord', pilotage: 'Pilotage', agenda: 'Agenda', clients: 'Tiers', prospection: 'Prospection', devis: 'Devis', factures: 'Facturation', caisse: 'Caisse', produits: 'Produits et services', stock: 'Stock', achats: 'Achats fournisseurs', leasing: 'Leasing', paiements: 'Paiements clients', recouvrement: 'Recouvrement', depenses: 'Dépenses', fournisseurs_reglements: 'Règlements fournisseurs', comptabilite: 'Comptabilité', tresorerie: 'Trésorerie', rh: 'Ressources humaines', importation: 'Importation', projets: 'Projets et tâches', contrats_services: 'Contrats de services', commandes_clients: 'Commandes clients', portail_clients: 'Portail clients', interventions_leasing: 'Interventions leasing' }
const definitions = [
  { key: 'core', name: 'Noyau', family: 'Configuration', description: 'Utilisateurs, rôles, sécurité et paramètres de la société.', icon: 'shield', core: true, aliases: ['notifications', 'utilisateurs', 'access_control', 'licence', 'securite', 'parametres', 'activites', 'exports'], enabled: true, activation_ready: true, manageable: false, licensed: true, dependencies: [], configuration_path: '/parametres' },
  ...Object.entries(legacyNames).map(([key, name]) => ({ key, name, family: ['rh'].includes(key) ? 'Ressources humaines' : ['comptabilite', 'tresorerie', 'depenses', 'paiements', 'recouvrement', 'fournisseurs_reglements'].includes(key) ? 'Finance' : 'Gestion commerciale', description: `Fonctionnalités de ${name.toLowerCase()}.`, icon: 'file-text', enabled: true, activation_ready: false, manageable: false, licensed: true, dependencies: ['core'], configuration_path: key === 'rh' ? '/rh?tab=administration' : null })),
  { key: 'contacts', name: 'Contacts de démonstration', family: 'Modules de test', description: 'Dépendance fictive pour vérifier le récapitulatif et les blocages.', enabled: false, activation_ready: true, manageable: true, licensed: true, dependencies: ['core'], permissions: ['contacts.view'] },
  { key: 'connaissances', name: 'Connaissances de démonstration', family: 'Modules de test', description: 'Module fictivement validé uniquement dans ce harnais local.', enabled: false, activation_ready: true, manageable: true, licensed: true, dependencies: ['core', 'contacts'], permissions: ['connaissances.view'] },
  { key: 'sav', name: 'SAV hors abonnement', family: 'Modules de test', description: 'Le commutateur doit rester indisponible hors abonnement.', enabled: false, activation_ready: true, manageable: true, licensed: false, dependencies: ['core'] },
  { key: 'xelltekk_admin', scope: 'platform', name: 'Administration plateforme', family: 'Configuration', enabled: true, activation_ready: false, manageable: false, licensed: true, dependencies: ['core'] },
].map(module => ({ version: '1.0.0', author: 'Saytu', permissions: [], integrations: [], settings: [], widgets: [], menus: [], core: false, ...module }))
const state = { revision: 1, modules: structuredClone(definitions), events: [], requests: [], failed: false, replays: new Map() }

// Fournit une copie pour que Vue ne modifie jamais la fixture serveur.
function context() { return { tenant_id: 7, contract_version: 1, configured: true, revision: state.revision, modules: structuredClone(state.modules) } }
// Construit une vraie réponse Axios, y compris pour les erreurs attendues.
function reply(config, data, status = 200) {
  const response = { data, status, statusText: String(status), config, headers: { 'x-saytu-modules-revision': String(state.revision), 'x-saytu-tenant-id': '7' }, request: {} }
  if (status >= 400) throw new AxiosError(data.message || 'Erreur fictive', AxiosError.ERR_BAD_RESPONSE, config, {}, response)
  return response
}
// Calcule les changements dans la fixture, sans accéder à des données réelles.
function preview(body) {
  const module = state.modules.find(item => item.key === body.key)
  const blockers = !body.enabled ? state.modules.filter(item => item.enabled && item.dependencies.includes(body.key)).map(item => item.key) : []
  const dependencies = body.enabled ? (module?.dependencies || []).filter(key => !state.modules.find(item => item.key === key)?.enabled) : []
  return { key: body.key, enabled: body.enabled, revision: state.revision, can_apply: !!module && !module.core && module.activation_ready && module.licensed && blockers.length === 0, dependencies_to_enable: dependencies, blocking_dependents: blockers, message: blockers.length ? 'Désactivation bloquée : des modules actifs dépendent de cette rubrique.' : 'Vérifiez les changements proposés pour cette démonstration locale.' }
}

api.defaults.adapter = async config => {
  const url = config.url
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {}
  state.requests.push({ method: config.method, url, body })
  await new Promise(resolve => setTimeout(resolve, 60))
  if (url === '/metier') return reply(config, { modules: state.modules.filter(module => ['connaissances', 'contacts', 'projets'].includes(module.key)).map(module => ({ key: module.key, label: module.name, fields: [['titre', 'Titre', 'text']], statuses: ['brouillon', 'publie'], permissions: { view: true, create: true, update: true }, notice: 'Données fictives locales' })) })
  if (/^\/metier\/[^/]+$/.test(url)) return reply(config, { data: [], last_page: 1, total: 0 })
  if (url === '/auth/me') return reply(config, { ...user, modules_context: context() })
  if (url === '/societe/identite') return reply(config, { nom: 'Société de démonstration', logo: '', devise_defaut: 'XOF' })
  if (url === '/modules/context') return state.failed ? reply(config, { message: 'Catalogue fictivement indisponible.' }, 503) : reply(config, context())
  if (url === '/configuration/modules') return state.failed ? reply(config, { message: 'Catalogue fictivement indisponible.' }, 503) : reply(config, { ...context(), events: structuredClone(state.events) })
  if (/^\/configuration\/modules\/[^/]+\/settings$/.test(url)) return reply(config, { settings: [], values: {}, configuration_path: null })
  if (url === '/configuration/modules/preview') {
    if (body.expected_revision !== state.revision) return reply(config, { message: 'La configuration a changé.' }, 409)
    return reply(config, preview(body))
  }
  if (url === '/configuration/modules/apply') {
    if (state.replays.has(body.request_id)) return reply(config, state.replays.get(body.request_id))
    if (body.expected_revision !== state.revision) return reply(config, { message: 'La configuration a changé.' }, 409)
    const plan = preview(body)
    if (!plan.can_apply || plan.dependencies_to_enable.some(key => !body.confirmed_dependencies?.includes(key))) return reply(config, { message: 'Ce changement est bloqué.' }, 422)
    for (const key of [...plan.dependencies_to_enable, body.key]) state.modules.find(item => item.key === key).enabled = body.enabled
    state.revision += 1
    state.events.unshift({ id: state.events.length + 1, module_key: body.key, action: body.enabled ? 'enable' : 'disable', actor_id: user.id, occurred_at: new Date().toISOString() })
    const result = { ...context(), event_id: state.events.length, replayed: false }
    state.replays.set(body.request_id, result)
    return reply(config, result)
  }
  return reply(config, {})
}

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
const auth = useAuthStore()
auth.user = user
auth.sessionChecked = true
app.use(router)
await router.replace({ name: 'configuration-modules' })
await router.isReady()
app.mount('#app')

// Expose seulement des commandes de fixture pour la vérification locale du navigateur.
window.__modulesHarness = {
  state,
  auth,
  router,
  store: useModulesStore(),
  async reset() { state.modules = structuredClone(definitions); state.events = []; state.failed = false; state.revision += 1; state.replays.clear(); await useModulesStore().fetchAdministration(); await router.replace({ name: 'configuration-modules' }) },
  async remoteDisable(key) { state.modules.find(module => module.key === key).enabled = false; state.revision += 1; window.dispatchEvent(new CustomEvent('saytu:modules-revision', { detail: { tenant_id: 7, revision: state.revision } })) },
}
