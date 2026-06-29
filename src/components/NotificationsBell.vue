<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      @click="togglePanel"
      class="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Afficher les notifications"
      aria-controls="notifications-panel"
      :aria-expanded="showPanel"
    >
      <span class="text-xl">🔔</span>
      <span v-if="store.total > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
        {{ store.total > 99 ? '99+' : store.total }}
      </span>
    </button>

    <!-- Panneau dropdown -->
    <transition name="fade-down">
      <div v-if="showPanel"
           id="notifications-panel"
           role="dialog"
           aria-label="Notifications"
           class="fixed inset-x-3 top-16 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 sm:max-h-[600px]">
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">🔔 Notifications</h3>
            <span class="text-xs text-gray-500">{{ store.total }} alerte(s)</span>
          </div>
        </div>

        <div v-if="store.loading" class="p-6 text-center text-gray-500 text-sm" role="status" aria-live="polite">
          Chargement...
        </div>

        <div v-else-if="store.total === 0" class="p-8 text-center text-gray-400">
          <div class="text-4xl mb-2">✨</div>
          <p class="text-sm">Tout est sous contrôle !</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <!-- Alertes achats -->
          <div v-if="store.details.achats.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-violet-700 uppercase">Achats</h4>
              <router-link to="/achats" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir les achats →</router-link>
            </div>
            <div class="space-y-1">
              <button
                v-for="alerte in store.details.achats"
                :key="alerte.key"
                type="button"
                @click="ouvrirAchatNotification(alerte)"
                class="block w-full text-left p-2 rounded hover:bg-violet-50 transition-colors cursor-pointer"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold text-violet-700">{{ alerte.label }}</div>
                    <div class="truncate text-sm font-medium text-gray-900">{{ alerte.title }}</div>
                    <div class="truncate text-xs text-gray-500">{{ alerte.message }}</div>
                  </div>
                  <span class="shrink-0 text-[10px] text-gray-500">{{ formatDateTime(alerte.date) }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Demandes à valider -->
          <div v-if="store.details.demandes_validation.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-blue-700 uppercase">📝 Demandes à valider</h4>
              <router-link to="/depensesstatut=en_attente" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
            </div>
            <div class="space-y-1">
              <button
                v-for="demande in store.details.demandes_validation"
                :key="`${demande.type}-${demande.id}`"
                type="button"
                @click="ouvrirDemande(demande)"
                class="block w-full text-left p-2 rounded hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-blue-700">{{ demande.label }}</span>
                      <span class="text-xs font-mono text-gray-500">{{ demande.reference }}</span>
                    </div>
                    <div class="text-sm font-medium text-gray-900 truncate">{{ demande.title }}</div>
                    <div class="text-xs text-gray-500 truncate">
                      {{ demande.user_name || 'Utilisateur' }}
                      <span v-if="demande.user_role">- {{ roleLabel(demande.user_role) }}</span>
                      <span v-if="demande.date"> · {{ formatDateTime(demande.date) }}</span>
                    </div>
                  </div>
                  <div class="text-right font-mono text-sm font-bold text-blue-700 whitespace-nowrap">
                    {{ formatPrice(demande.amount) }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Factures en retard -->
          <div v-if="store.details.rh_alertes.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-emerald-700 uppercase">Alertes RH</h4>
              <router-link to="/rh" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir RH</router-link>
            </div>
            <div class="space-y-1">
              <button
                v-for="alerte in store.details.rh_alertes"
                :key="`${alerte.type}-${alerte.title}-${alerte.date}`"
                type="button"
                @click="ouvrirRhAlerte(alerte)"
                class="block w-full text-left p-2 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-emerald-700">{{ alerte.label }}</span>
                      <span class="text-xs text-gray-500">{{ formatDate(alerte.date) }}</span>
                    </div>
                    <div class="text-sm font-medium text-gray-900 truncate">{{ alerte.title }}</div>
                    <div class="text-xs text-gray-500 truncate">{{ alerte.message }}</div>
                  </div>
                  <span class="text-[10px] uppercase font-bold text-emerald-700">{{ alerte.level }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Factures en retard -->
          <div v-if="store.details.factures_retard.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-red-700 uppercase">⚠️ Factures en retard</h4>
              <router-link to="/factures" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
            </div>
            <div class="space-y-1">
              <button
                v-for="f in store.details.factures_retard"
                :key="f.id"
                type="button"
                @click="ouvrirFacture(f)"
                class="block w-full text-left p-2 rounded hover:bg-red-50 transition-colors cursor-pointer"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-mono text-gray-600">{{ f.numero }}</div>
                    <div class="text-sm font-medium text-gray-900 truncate">{{ f.client?.nom || 'Client' }}</div>
                    <div class="text-xs text-red-600">
                      Échue le {{ formatDate(f.date_echeance) }}
                      <span v-if="f.client?.telephone" class="ml-1">📞 {{ f.client?.telephone }}</span>
                    </div>
                  </div>
                  <div class="text-right font-mono text-sm font-bold text-red-700 whitespace-nowrap">
                    {{ formatPrice(f.reste_a_payer) }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Devis en attente -->
          <div v-if="store.details.devis_attente.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-yellow-700 uppercase">📋 Devis en attente</h4>
              <router-link to="/devis" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
            </div>
            <div class="space-y-1">
              <button
                v-for="d in store.details.devis_attente"
                :key="d.id"
                type="button"
                @click="ouvrirDevis(d)"
                class="block w-full text-left p-2 rounded hover:bg-yellow-50 transition-colors cursor-pointer"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-mono text-gray-600">{{ d.numero }}</div>
                    <div class="text-sm font-medium text-gray-900 truncate">{{ d.client?.nom || 'Client' }}</div>
                    <div class="text-xs text-yellow-700">Valide jusqu'au {{ formatDate(d.date_validite) }}</div>
                  </div>
                  <div class="text-right font-mono text-sm font-bold text-gray-700 whitespace-nowrap">
                    {{ formatPrice(d.total_ttc) }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Stock en alerte -->
          <div v-if="store.details.stock_alerte.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-orange-700 uppercase">📦 Stock en alerte</h4>
              <router-link to="/stock" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
            </div>
            <div class="space-y-1">
              <button
                v-for="p in store.details.stock_alerte"
                :key="p.id"
                type="button"
                @click="ouvrirStock(p)"
                class="block w-full p-2 rounded hover:bg-orange-50 transition-colors text-left"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-mono text-gray-600">{{ p.reference }}</div>
                    <div class="text-sm font-medium text-gray-900 truncate">{{ p.libelle }}</div>
                  </div>
                  <div class="text-right whitespace-nowrap">
                    <div class="text-sm font-bold text-orange-700">{{ p.quantite_actuelle }} / {{ p.stock_alerte }}</div>
                    <div class="text-[10px] text-gray-500">qté / seuil</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-3 py-2 border-t border-gray-200 bg-gray-50 text-center sticky bottom-0">
          <router-link to="/notifications" @click="closePanel" class="mr-3 text-xs font-semibold text-xelltekk-600 hover:underline">
            Centre complet
          </router-link>
          <button @click="rafraichir" class="text-xs text-xelltekk-600 hover:underline">
            🔄 Rafraîchir
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'

const router = useRouter()
const store = useNotificationsStore()
const showPanel = ref(false)
const containerRef = ref(null)
let refreshTimer = null

async function togglePanel() {
  if (! showPanel.value) {
    await store.fetchDetails()
  }
  showPanel.value = ! showPanel.value
}

function closePanel() {
  showPanel.value = false
}

async function rafraichir() {
  await store.fetchBadges()
  await store.fetchDetails()
}

// Ouvrir une facture spécifique via query string
async function ouvrirFacture(facture) {
  await store.markRead(facture.key)
  closePanel()
  router.push({ path: '/factures', query: { open: facture.id } })
}

// Ouvrir un devis spécifique via query string
async function ouvrirDevis(devis) {
  await store.markRead(devis.key)
  closePanel()
  router.push({ path: '/devis', query: { open: devis.id } })
}

async function ouvrirDemande(demande) {
  await store.markRead(demande.key)
  closePanel()
  router.push({
    path: demande.route || '/depenses',
    query: demande.query || {},
  })
}

async function ouvrirRhAlerte(alerte) {
  await store.markRead(alerte.key)
  closePanel()
  router.push({
    path: alerte.route || '/rh',
    query: alerte.query || {},
  })
}

async function ouvrirAchatNotification(alerte) {
  const key = alerte.key
  const destination = {
    path: alerte.route || '/achats',
    query: { ...(alerte.query || {}) },
  }
  closePanel()
  await router.push(destination)
  await store.markRead(key)
}

async function ouvrirStock(produit) {
  await store.markRead(produit.key)
  closePanel()
  router.push('/stock')
}

// Click-outside handler
function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    closePanel()
  }
}

// Escape key handler
function handleEscape(event) {
  if (event.key === 'Escape') {
    closePanel()
  }
}

onMounted(async () => {
  await store.fetchBadges()
  refreshTimer = setInterval(() => store.fetchBadges(), 30000)
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '–'
}
function formatDateTime(d) {
  return d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '–'
}
function roleLabel(role) {
  return {
    admin: 'Administrateur',
    gerant: 'Gérant',
    commercial: 'Commercial',
    magasinier: 'Gestionnaire de stock',
    comptable: 'Comptable',
    caissier: 'Caissier',
  }[role] || role || ''
}
</script>

<style scoped>
.fade-down-enter-active, .fade-down-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.fade-down-enter-from, .fade-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
