import { defineStore } from 'pinia'
import api from '@/services/api'

const BADGES_CACHE_MS = 20000
const DETAILS_CACHE_MS = 20000

function emptyDetails() {
  return {
    factures_retard: [],
    devis_attente: [],
    stock_alerte: [],
    demandes_validation: [],
    rh_alertes: [],
    achats: [],
    alertes_intelligentes: [],
  }
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    badges: {
      factures_retard: 0,
      devis_attente: 0,
      stock_alerte: 0,
      demandes_validation: 0,
      rh_alertes: 0,
      achats: 0,
      alertes_intelligentes: 0,
    },
    details: emptyDetails(),
    loading: false,
    loadingBadges: false,
    loadingDetails: false,
    lastFetch: null,
    lastBadgesFetch: null,
    lastDetailsFetch: null,
  }),
  actions: {
    async fetchBadges({ force = false } = {}) {
      if (this.loadingBadges) return
      if (!force && this.lastBadgesFetch && Date.now() - this.lastBadgesFetch < BADGES_CACHE_MS) return

      this.loadingBadges = true
      try {
        const { data } = await api.get('/notifications/badges')
        this.badges = { ...this.badges, ...data }
        this.lastFetch = new Date()
        this.lastBadgesFetch = Date.now()
      } catch (e) {
        console.error('Erreur badges notifications', e)
      } finally {
        this.loadingBadges = false
      }
    },
    async fetchDetails({ force = false } = {}) {
      if (this.loadingDetails) return
      if (!force && this.lastDetailsFetch && Date.now() - this.lastDetailsFetch < DETAILS_CACHE_MS) return

      this.loading = true
      this.loadingDetails = true
      try {
        const { data } = await api.get('/notifications/details')
        this.details = { ...emptyDetails(), ...data }
        this.lastDetailsFetch = Date.now()
      } catch (e) {
        console.error('Erreur détails notifications', e)
      } finally {
        this.loading = false
        this.loadingDetails = false
      }
    },
    async markRead(key) {
      if (!key) return
      try {
        await api.post('/notifications/read', { key })
        await Promise.all([
          this.fetchBadges({ force: true }),
          this.fetchDetails({ force: true }),
        ])
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
      state.badges.achats +
      state.badges.alertes_intelligentes,
  },
})
