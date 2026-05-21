<template>
  <div ref="containerRef" class="relative">
    <button @click="togglePanel" class="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
      <span class="text-xl">🔔</span>
      <span v-if="store.total > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
        {{ store.total > 99 ? '99+' : store.total }}
      </span>
    </button>

    <!-- Panneau dropdown -->
    <transition name="fade-down">
      <div v-if="showPanel"
           class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-y-auto">
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">🔔 Notifications</h3>
            <span class="text-xs text-gray-500">{{ store.total }} alerte(s)</span>
          </div>
        </div>

        <div v-if="store.loading" class="p-6 text-center text-gray-500 text-sm">
          Chargement...
        </div>

        <div v-else-if="store.total === 0" class="p-8 text-center text-gray-400">
          <div class="text-4xl mb-2">✨</div>
          <p class="text-sm">Tout est sous contrôle !</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <!-- Factures en retard -->
          <div v-if="store.details?.factures_retard?.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-red-700 uppercase">⚠️ Factures en retard</h4>
              <router-link to="/factures" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
            </div>
            <div class="space-y-1">
              <button
                v-for="f in store.details.factures_retard"
                :key="f.id"
                type="button"
                @click="ouvrirFacture(f.id)"
                class="block w-full text-left p-2 rounded hover:bg-red-50 transition-colors cursor-pointer"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-mono text-gray-600">{{ f.numero }}</div>
                    <div class="text-sm font-medium text-gray-900 truncate">{{ f.client?.nom }}</div>
                    <div class="text-xs text-red-600">
                      Échue le {{ formatDate(f.date_echeance) }}
                      <span v-if="f.client?.telephone" class="ml-1">📞 {{ f.client.telephone }}</span>
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
          <div v-if="store.details?.devis_attente?.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-yellow-700 uppercase">📋 Devis en attente</h4>
              <router-link to="/devis" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
            </div>
            <div class="space-y-1">
              <button
                v-for="d in store.details.devis_attente"
                :key="d.id"
                type="button"
                @click="ouvrirDevis(d.id)"
                class="block w-full text-left p-2 rounded hover:bg-yellow-50 transition-colors cursor-pointer"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-mono text-gray-600">{{ d.numero }}</div>
                    <div class="text-sm font-medium text-gray-900 truncate">{{ d.client?.nom }}</div>
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
          <div v-if="store.details?.stock_alerte?.length" class="p-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-orange-700 uppercase">📦 Stock en alerte</h4>
              <router-link to="/stock" @click="closePanel" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
            </div>
            <div class="space-y-1">
              <router-link
                v-for="p in store.details.stock_alerte"
                :key="p.id"
                to="/stock"
                @click="closePanel"
                class="block p-2 rounded hover:bg-orange-50 transition-colors"
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
              </router-link>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-3 py-2 border-t border-gray-200 bg-gray-50 text-center sticky bottom-0">
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
function ouvrirFacture(id) {
  closePanel()
  router.push({ path: '/factures', query: { open: id } })
}

// Ouvrir un devis spécifique via query string
function ouvrirDevis(id) {
  closePanel()
  router.push({ path: '/devis', query: { open: id } })
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
  refreshTimer = setInterval(() => store.fetchBadges(), 60000)
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