import { defineStore } from 'pinia'
import api from '@/services/api'
import { moduleIsAvailable, moduleRouteIsAvailable } from '@/module-system/modulePolicy.mjs'
import { resetModuleTransport } from '@/module-system/moduleTransport'

const requests = new WeakMap()
const runtimes = new WeakMap()
const CONTEXT_TTL_MS = 30000

// Vérifie le contrat avant de remplacer un contexte déjà fiable.
function validContext(payload) {
  return payload?.contract_version === 1
    && Number.isInteger(payload.revision) && payload.revision >= 0
    && Array.isArray(payload.modules)
    && (payload.configured === false || (payload.tenant_id !== undefined && payload.modules.every(module =>
      typeof module.key === 'string' && typeof module.enabled === 'boolean' && typeof module.licensed === 'boolean'
    )))
}

export const useModulesStore = defineStore('modules', {
  state: () => ({
    context: null,
    adminModules: [],
    events: [],
    checkedAt: 0,
    loading: false,
    error: '',
    generation: 0,
  }),
  getters: {
    initialized: state => !!state.context && state.context.configured !== false,
    tenantId: state => state.context?.tenant_id ?? null,
    revision: state => state.context?.revision ?? 0,
    catalogue: state => state.adminModules.map(module => ({
      ...module,
      ...(state.context?.modules.find(item => item.key === module.key) || {}),
    })),
  },
  actions: {
    // Applique une révision serveur en rejetant les réponses arrivées dans le désordre.
    acceptContext(payload) {
      if (!validContext(payload)) throw new Error('Le catalogue des modules reçu est incomplet.')
      if (this.initialized && payload.configured !== false && String(this.tenantId) !== String(payload.tenant_id)) throw new Error('Le contexte des modules ne correspond pas à cette société.')
      if (this.context && String(this.tenantId) === String(payload.tenant_id) && payload.revision < this.revision) return
      this.context = { ...payload, configured: payload.configured !== false, modules: payload.modules }
      this.checkedAt = Date.now()
      this.error = ''
    },

    // Recharge au besoin sans rendre les anciennes rubriques indisponibles en cas de panne initiale.
    async fetchContext({ force = false } = {}) {
      if (!force && Date.now() - this.checkedAt < CONTEXT_TTL_MS) return this.context
      if (requests.has(this)) return requests.get(this)
      const generation = this.generation
      this.loading = true
      const request = (async () => {
        try {
          const { data } = await api.get('/modules/context', { suppressModuleRevision: true, timeout: 8000 })
          if (generation === this.generation) this.acceptContext(data)
          return this.context
        } catch (error) {
          if (generation === this.generation) {
            this.checkedAt = Date.now()
            this.error = 'Le catalogue des modules est momentanément indisponible.'
          }
          return this.context
        } finally {
          if (generation === this.generation) this.loading = false
          if (requests.get(this) === request) requests.delete(this)
        }
      })()
      requests.set(this, request)
      return request
    },

    // Lit le catalogue détaillé et le journal uniquement depuis l'API administrateur.
    async fetchAdministration() {
      const generation = this.generation
      const { data } = await api.get('/configuration/modules', { suppressModuleRevision: true })
      if (generation !== this.generation) return null
      this.acceptContext(data)
      this.adminModules = data.modules
      this.events = Array.isArray(data.events) ? data.events : []
      return data
    },

    // Délègue le calcul des dépendances au serveur, sans décision d'activation locale.
    async previewChange(key, enabled) {
      const { data } = await api.post('/configuration/modules/preview', {
        key, enabled, expected_revision: this.revision,
      })
      return data
    },

    // Une même demande conserve son UUID pour permettre la reprise après une coupure réseau.
    async applyChange(payload) {
      const generation = this.generation
      const { data, headers } = await api.post('/configuration/modules/apply', payload, { suppressModuleRevision: true })
      if (generation !== this.generation) return null
      this.acceptContext(data)
      // Un rejeu idempotent peut contenir un ancien état alors que l'en-tête annonce le plus récent.
      if (Number(headers?.['x-saytu-modules-revision']) > data.revision) await this.fetchContext({ force: true })
      runtimes.get(this)?.channel?.postMessage({ tenant_id: this.tenantId, revision: this.revision })
      return data
    },

    // Vérifie un module sans contourner son état pour les utilisateurs administrateurs.
    allows(key) { return moduleIsAvailable(this.context, key) },

    // Contrôle toutes les rubriques participant à une URL transversale.
    allowsPath(path) { return moduleRouteIsAvailable(this.context, path) },

    // Efface les données de société sans les écrire dans le stockage persistant du navigateur.
    reset() {
      this.stopSynchronization()
      this.generation += 1
      requests.delete(this)
      this.context = null
      this.adminModules = []
      this.events = []
      this.checkedAt = 0
      this.loading = false
      this.error = ''
      resetModuleTransport()
    },

    // Écoute les changements de révision sans accepter d'état provenant d'un autre onglet.
    startSynchronization({ isActive = () => true } = {}) {
      if (runtimes.has(this) || typeof window === 'undefined') return
      const refresh = () => { if (isActive() && !document.hidden) void this.fetchContext({ force: true }) }
      const revisionChanged = event => {
        const detail = event.detail || event.data || {}
        if (this.tenantId === null || (String(detail.tenant_id) === String(this.tenantId) && Number(detail.revision) !== this.revision)) refresh()
      }
      let channel = null
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          channel = new BroadcastChannel('saytu:modules')
          channel.onmessage = revisionChanged
        }
      } catch { /* Le rechargement périodique suffit si le navigateur refuse ce canal. */ }
      window.addEventListener('focus', refresh)
      window.addEventListener('saytu:modules-revision', revisionChanged)
      document.addEventListener('visibilitychange', refresh)
      const timer = window.setInterval(refresh, 60000)
      runtimes.set(this, { channel, timer, refresh, revisionChanged })
    },

    // Libère les écouteurs à la fermeture de session ou de la coque de l'application.
    stopSynchronization() {
      const runtime = runtimes.get(this)
      if (!runtime) return
      window.clearInterval(runtime.timer)
      window.removeEventListener('focus', runtime.refresh)
      window.removeEventListener('saytu:modules-revision', runtime.revisionChanged)
      document.removeEventListener('visibilitychange', runtime.refresh)
      runtime.channel?.close()
      runtimes.delete(this)
    },
  },
})
