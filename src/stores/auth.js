import { defineStore } from 'pinia'
import api, { clearSessionToken, setSessionToken } from '@/services/api'
import { effectiveRole, hasAnyRole } from '@/utils/access'

localStorage.removeItem('xelltekk_token')

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('xelltekk_user') || 'null'),
    sessionChecked: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => hasAnyRole(state.user, 'admin'),
    isManager: (state) => hasAnyRole(state.user, ['admin', 'gerant']),
    userRole: (state) => effectiveRole(state.user),
  },

  actions: {
    async login(email, password) {
      const { data } = await api.post('/auth/login', {
        email: String(email || '').trim(),
        password,
        device_name: 'web',
      })

      this.user = data.user
      this.sessionChecked = true

      localStorage.removeItem('xelltekk_token')
      setSessionToken(data.token)
      localStorage.setItem('xelltekk_user', JSON.stringify(data.user))

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

    async fetchMe() {
      try {
        const { data } = await api.get('/auth/me')
        this.user = data
        this.sessionChecked = true
        localStorage.setItem('xelltekk_user', JSON.stringify(data))
        return data
      } catch (error) {
        this.clearLocalSession()
        this.sessionChecked = true
        throw error
      }
    },

    clearLocalSession() {
      this.user = null
      localStorage.removeItem('xelltekk_token')
      localStorage.removeItem('xelltekk_user')
      clearSessionToken()
    },
  },
})
