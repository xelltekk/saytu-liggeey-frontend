import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('xelltekk_user') || 'null'),
    token: localStorage.getItem('xelltekk_token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isManager: (state) => ['admin', 'gerant'].includes(state.user?.role),
    userRole: (state) => state.user?.role || null,
  },

  actions: {
    async login(email, password) {
      const { data } = await api.post('/auth/login', {
        email: String(email || '').trim(),
        password,
        device_name: 'web',
      })

      this.user = data.user
      this.token = data.token

      localStorage.setItem('xelltekk_token', data.token)
      localStorage.setItem('xelltekk_user', JSON.stringify(data.user))

      return data
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (e) {
        // Même si l'API échoue, on déconnecte localement
      }
      this.user = null
      this.token = null
      localStorage.removeItem('xelltekk_token')
      localStorage.removeItem('xelltekk_user')
    },

    async fetchMe() {
      const { data } = await api.get('/auth/me')
      this.user = data
      localStorage.setItem('xelltekk_user', JSON.stringify(data))
      return data
    },
  },
})
