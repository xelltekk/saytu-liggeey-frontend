import { defineStore } from 'pinia'
import api from '@/services/api'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    badges: {
      factures_retard: 0,
      devis_attente: 0,
      stock_alerte: 0,
      demandes_validation: 0,
      rh_alertes: 0,
      achats: 0,
    },
    details: null,
    loading: false,
    lastFetch: null,
  }),
  actions: {
    async fetchBadges() {
      try {
        const { data } = await api.get('/notifications/badges')
        this.badges = data
        this.lastFetch = new Date()
      } catch (e) {
        console.error('Erreur badges notifications', e)
      }
    },
    async fetchDetails() {
      this.loading = true
      try {
        const { data } = await api.get('/notifications/details')
        this.details = data
      } catch (e) {
        console.error('Erreur détails notifications', e)
      } finally {
        this.loading = false
      }
    },
    async markRead(key) {
      if (!key) return
      try {
        await api.post('/notifications/read', { key })
        await Promise.all([this.fetchBadges(), this.fetchDetails()])
      } catch (e) {
        console.error('Erreur lecture notification', e)
      }
    },
  },
  getters: {
    total: (state) =>
      state.badges.factures_retard +
      state.badges.devis_attente +
      state.badges.stock_alerte +
      state.badges.demandes_validation +
      state.badges.rh_alertes +
      state.badges.achats,
  },
})
