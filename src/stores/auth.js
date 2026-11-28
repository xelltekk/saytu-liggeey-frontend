import { defineStore } from 'pinia'
import api, { clearSessionToken, setSessionToken } from '@/services/api'
import { effectiveRole, hasAnyRole } from '@/utils/access'
import { useModulesStore } from '@/stores/modules'
import { moduleSessionIdentity, moduleContextMatchesUser, userWithoutModuleContext } from '@/module-system/modulePolicy.mjs'

localStorage.removeItem('xelltekk_token')

// Nettoie aussi les profils conservés par une ancienne version de l'application.
function storedUser() {
  try {
    const cached = JSON.parse(localStorage.getItem('xelltekk_user') || 'null')
    const user = userWithoutModuleContext(cached)
    if (cached && Object.prototype.hasOwnProperty.call(cached, 'modules_context')) localStorage.setItem('xelltekk_user', JSON.stringify(user))
    return user
  } catch { localStorage.removeItem('xelltekk_user'); return null }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: storedUser(),
    sessionChecked: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => hasAnyRole(state.user, 'admin'),
    isManager: (state) => hasAnyRole(state.user, ['admin', 'gerant']),
    userRole: (state) => effectiveRole(state.user),
  },

  actions: {
    // Consomme le contexte serveur en mémoire et ne persiste que le profil utilisateur.
    acceptSessionUser(payload, forceReset = false) {
      const modules = useModulesStore()
      if (forceReset || moduleSessionIdentity(this.user) !== moduleSessionIdentity(payload)) modules.reset()
      this.user = userWithoutModuleContext(payload)
      if (moduleContextMatchesUser(payload?.modules_context, this.user)) {
        try { modules.acceptContext(payload.modules_context) } catch { /* Un ancien contrat sera rechargé par le garde des routes. */ }
      }
      localStorage.setItem('xelltekk_user', JSON.stringify(this.user))
    },

    async login(email, password) {
      const { data } = await api.post('/auth/login', {
        email: String(email || '').trim(),
        password,
        device_name: 'web',
      })

      this.acceptSessionUser(data.user, true)
      this.sessionChecked = true

      localStorage.removeItem('xelltekk_token')
      setSessionToken(data.token)

      return data
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (e) {
        // Même si l'API échoue, on déconnecte localement
      }
      this.clearLocalSession()
      this.sessionChecked = true
    },

    async fetchMe({ preserveSessionOnTransientError = false } = {}) {
      try {
        const { data } = await api.get('/auth/me')
        this.acceptSessionUser(data)
        this.sessionChecked = true
        return this.user
      } catch (error) {
        // Une réponse d'une ancienne session ne doit pas déconnecter le nouvel utilisateur.
        if (error.code === 'ERR_CANCELED') throw error
        const status = error.response?.status
        // Un rafraîchissement de droits en arrière-plan ne ferme pas une session lors d'une panne temporaire.
        if (preserveSessionOnTransientError && (!status || status === 429 || status >= 500)) throw error
        this.clearLocalSession()
        this.sessionChecked = true
        throw error
      }
    },

    clearLocalSession() {
      useModulesStore().reset()
      this.user = null
      localStorage.removeItem('xelltekk_token')
      localStorage.removeItem('xelltekk_user')
      clearSessionToken()
    },
  },
})
