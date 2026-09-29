<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-4 sm:px-4 sm:pt-[10vh]">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <div
          class="relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Recherche globale"
        >
          <div class="flex items-center border-b border-cyan-100 bg-cyan-50/60 px-4">
            <span class="text-xl text-cyan-700">🔍</span>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Client, téléphone, facture, devis, produit, BC, fournisseur..."
              class="flex-1 bg-transparent px-3 py-4 text-sm outline-none placeholder:text-slate-400"
              autocomplete="off"
              aria-label="Rechercher dans l'application"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.enter.prevent="ouvrirSelection"
              @keydown.esc.prevent="close"
            />
            <kbd class="rounded border border-cyan-200 bg-white px-2 py-0.5 text-xs text-cyan-700">ESC</kbd>
          </div>

          <div class="max-h-[62vh] overflow-y-auto">
            <div v-if="query.length < 2" class="p-4 sm:p-5">
              <div class="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                <p class="font-bold text-slate-900">Recherche rapide</p>
                <p class="mt-1 text-sm text-slate-500">Tapez au moins 2 caractères ou utilisez un raccourci.</p>
              </div>

              <div v-if="recentItems.length" class="mt-4 rounded-2xl border border-slate-200 bg-white">
                <div class="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                  <p class="text-[11px] font-black uppercase tracking-wider text-slate-500">🕘 Derniers éléments consultés</p>
                  <button type="button" class="text-[11px] font-bold text-cyan-700 hover:underline" @click="clearRecentItems">
                    Effacer
                  </button>
                </div>

                <button
                  v-for="(item, index) in recentItems"
                  :key="item.key"
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                  :class="selection === index ? 'border-l-2 border-cyan-500 bg-cyan-50' : 'hover:bg-slate-50'"
                  @click="ouvrirRecentItem(item)"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base">{{ item.icon || '↗️' }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-bold text-slate-900">{{ item.title }}</span>
                    <span class="block truncate text-xs text-slate-500">{{ item.subtitle }}</span>
                  </span>
                  <span class="hidden text-[10px] font-semibold text-cyan-700 sm:inline">Ouvrir</span>
                </button>
              </div>

              <div class="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  v-for="(action, index) in quickActions"
                  :key="action.key"
                  type="button"
                  class="flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition"
                  :class="selection === recentItems.length + index ? 'border-cyan-400 bg-cyan-50 shadow-sm' : 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/50'"
                  @click="ouvrirQuickAction(action)"
                >
                  <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-lg">{{ action.icon }}</span>
                  <span class="min-w-0">
                    <span class="block font-bold text-slate-900">{{ action.label }}</span>
                    <span class="block truncate text-xs text-slate-500">{{ action.description }}</span>
                  </span>
                </button>
              </div>

              <div class="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-slate-500">
                <span><kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5">↑</kbd> <kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5">↓</kbd> Naviguer</span>
                <span><kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5">⏎</kbd> Ouvrir</span>
                <span><kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5">ESC</kbd> Fermer</span>
              </div>
            </div>

            <div v-else-if="loading" class="p-8 text-center text-sm text-slate-500" role="status" aria-live="polite">
              Recherche en cours...
            </div>

            <div v-else-if="totalResultats === 0" class="p-8 text-center text-sm text-slate-400">
              <p class="mb-2 text-4xl">🤷</p>
              <p>Aucun résultat pour <strong class="text-slate-700">"{{ query }}"</strong></p>
              <p class="mt-2 text-xs">Essayez un téléphone, une référence produit, FA, DE, BC ou le nom du client.</p>
            </div>

            <div v-else class="divide-y divide-slate-100">
              <section v-for="section in sectionsWithResults" :key="section.key" class="py-2">
                <div class="flex items-center justify-between px-4 pb-1">
                  <p class="text-[11px] font-black uppercase tracking-wider text-slate-500">{{ section.icon }} {{ section.label }}</p>
                  <span class="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">{{ section.items.length }}</span>
                </div>

                <button
                  v-for="entry in section.items"
                  :key="`${section.key}-${entry.item.id}-${entry.localIndex}`"
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                  :class="entry.globalIndex === selection ? 'border-l-2 border-cyan-500 bg-cyan-50' : 'hover:bg-slate-50'"
                  @click="ouvrirResultat(entry)"
                >
                  <span class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base sm:flex">{{ section.icon }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-bold text-slate-900">{{ resultTitle(section.key, entry.item) }}</span>
                      <span v-if="entry.item.type" class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{{ typeLabel(entry.item.type) }}</span>
                      <span v-if="entry.item.statut" class="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">{{ entry.item.statut }}</span>
                    </div>
                    <p class="mt-0.5 truncate text-xs text-slate-500">{{ resultSubtitle(section.key, entry.item) }}</p>
                  </div>
                  <div class="hidden shrink-0 text-right sm:block">
                    <p v-if="resultAmount(section.key, entry.item) !== null" class="font-mono text-sm font-black text-slate-900">{{ formatPrice(resultAmount(section.key, entry.item)) }}</p>
                    <p class="text-[10px] font-semibold text-cyan-700">Ouvrir</p>
                  </div>
                </button>
              </section>
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
            <span>{{ query.length < 2 ? `${recentItems.length} récent(s) · ${quickActions.length} raccourci(s)` : `${totalResultats} résultat(s)` }}</span>
            <span>
              <kbd class="rounded border border-slate-300 bg-white px-1.5 py-0.5">↑↓</kbd>
              <kbd class="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5">⏎</kbd>
              <kbd class="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5">ESC</kbd>
            </span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const auth = useAuthStore()
const inputRef = ref(null)
const query = ref('')
const loading = ref(false)
const selection = ref(0)
const resultats = ref(emptyResults())
const recentItems = ref([])

const recentStorageKey = computed(() => {
  const userId = auth.user?.id || auth.user?.email || 'default'
  return `saytu:command-palette:recent:${userId}`
})

const quickActionsAll = [
  { key: 'client-create', icon: '👥', label: 'Nouveau client', description: 'Créer une fiche client/prospect', roles: ['admin', 'gerant', 'commercial'], route: { name: 'client-create' } },
  { key: 'devis-create', icon: '📋', label: 'Nouveau devis', description: 'Préparer une proposition commerciale', roles: ['admin', 'gerant', 'commercial', 'comptable'], route: { name: 'devis-create' } },
  { key: 'facture-create', icon: '🧾', label: 'Nouvelle facture', description: 'Créer une facture client', roles: ['admin', 'gerant', 'commercial', 'comptable'], route: { name: 'facture-create' } },
  { key: 'caisse', icon: '💳', label: 'Ouvrir la caisse', description: 'Vente rapide et encaissement', roles: ['admin', 'gerant', 'comptable', 'caissier'], route: { name: 'caisse' } },
  { key: 'produit-create', icon: '📦', label: 'Nouveau produit', description: 'Créer un produit, service ou pack', roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable'], route: { name: 'produit-create' } },
  { key: 'stock', icon: '🏷️', label: 'Stock', description: 'Consulter stocks, lots, alertes', roles: ['admin', 'gerant', 'magasinier', 'comptable'], route: { name: 'stock' } },
  { key: 'achat-commande-create', icon: '🛒', label: 'Bon de commande', description: 'Créer un achat fournisseur', roles: ['admin', 'gerant', 'magasinier', 'comptable'], route: { name: 'achat-commande-create' } },
  { key: 'pilotage', icon: '✨', label: 'Pilotage', description: 'Vue gérant et actions prioritaires', roles: ['admin', 'gerant'], route: { name: 'pilotage', query: { tab: 'gerant' } } },
]

const quickActions = computed(() => {
  const role = auth.user?.base_role || auth.user?.role
  return quickActionsAll.filter((action) => !action.roles || action.roles.includes(role))
})

const sectionDefs = [
  { key: 'clients', label: 'Clients', icon: '👥' },
  { key: 'fournisseurs', label: 'Fournisseurs', icon: '🏢' },
  { key: 'factures', label: 'Factures', icon: '🧾' },
  { key: 'devis', label: 'Devis', icon: '📋' },
  { key: 'produits', label: 'Produits', icon: '📦' },
  { key: 'achats', label: 'Achats fournisseurs', icon: '🛒' },
  { key: 'paiements', label: 'Paiements', icon: '💰' },
]

const totalResultats = computed(() => sectionDefs.reduce((total, section) => total + (resultats.value[section.key]?.length || 0), 0))

const sectionsWithResults = computed(() => {
  let offset = 0

  return sectionDefs
    .map((section) => {
      const rows = resultats.value[section.key] || []
      const items = rows.map((item, localIndex) => ({
        section,
        item,
        localIndex,
        globalIndex: offset + localIndex,
      }))
      offset += rows.length

      return { ...section, items }
    })
    .filter((section) => section.items.length > 0)
})

const itemsFlat = computed(() => {
  if (query.value.length < 2) {
    return [
      ...recentItems.value.map((recent, index) => ({ kind: 'recent', recent, globalIndex: index })),
      ...quickActions.value.map((action, index) => ({ kind: 'quick', action, globalIndex: recentItems.value.length + index })),
    ]
  }

  return sectionsWithResults.value.flatMap((section) => section.items.map((entry) => ({ kind: 'result', entry, globalIndex: entry.globalIndex })))
})

let searchTimer = null
watch(query, (value) => {
  selection.value = 0
  clearTimeout(searchTimer)

  if (value.trim().length < 2) {
    resultats.value = emptyResults()
    loading.value = false
    return
  }

  searchTimer = setTimeout(() => rechercher(value.trim()), 250)
})

watch(() => props.modelValue, (value) => {
  if (value) {
    loadRecentItems()
    nextTick(() => inputRef.value?.focus())
  }
})

async function rechercher(search) {
  loading.value = true
  try {
    const { data } = await api.get('/recherche-globale', { params: { q: search } })
    resultats.value = { ...emptyResults(), ...data }
  } catch (error) {
    console.error('Erreur recherche', error)
    resultats.value = emptyResults()
  } finally {
    loading.value = false
  }
}

function moveSelection(delta) {
  const total = itemsFlat.value.length
  if (total === 0) return

  selection.value = (selection.value + delta + total) % total
  nextTick(() => {
    document.querySelector('.bg-cyan-50')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

function ouvrirSelection() {
  const selected = itemsFlat.value[selection.value]
  if (!selected) return

  if (selected.kind === 'quick') {
    ouvrirQuickAction(selected.action)
    return
  }

  if (selected.kind === 'recent') {
    ouvrirRecentItem(selected.recent)
    return
  }

  ouvrirResultat(selected.entry)
}

function ouvrirQuickAction(action) {
  close(false)
  router.push(action.route)
}

function ouvrirResultat(entry) {
  const { section, item } = entry
  const destination = resultRoute(section.key, item)

  saveRecentItem({
    key: `${section.key}:${item.type || 'item'}:${item.id}`,
    icon: section.icon,
    title: resultTitle(section.key, item),
    subtitle: resultSubtitle(section.key, item),
    route: destination,
  })

  close(false)
  router.push(destination)
}

function resultRoute(section, item) {
  if (item.route) {
    return { path: item.route, query: item.query || {} }
  }

  const routes = {
    clients: { name: 'client-detail', params: { id: item.id } },
    fournisseurs: { name: 'achat-fournisseur-360', params: { id: item.id } },
    factures: { name: 'facture-detail', params: { id: item.id } },
    devis: { name: 'devis-detail', params: { id: item.id } },
    produits: { name: 'produit-detail', params: { id: item.id } },
    paiements: { name: 'paiements', query: { search: item.reference } },
  }

  return routes[section] || { name: 'dashboard' }
}

function ouvrirRecentItem(item) {
  if (!item?.route) return
  close(false)
  router.push(item.route)
}

function loadRecentItems() {
  try {
    const raw = window.localStorage.getItem(recentStorageKey.value)
    const parsed = raw ? JSON.parse(raw) : []
    recentItems.value = Array.isArray(parsed) ? parsed.filter((item) => item?.route && item?.title).slice(0, 6) : []
  } catch {
    recentItems.value = []
  }
}

function saveRecentItem(item) {
  if (!item?.key || !item?.route || !item?.title) return

  const normalized = {
    key: item.key,
    icon: item.icon || '↗️',
    title: item.title,
    subtitle: item.subtitle || '',
    route: item.route,
    viewedAt: new Date().toISOString(),
  }

  const nextItems = [
    normalized,
    ...recentItems.value.filter((recent) => recent.key !== normalized.key),
  ].slice(0, 6)

  recentItems.value = nextItems

  try {
    window.localStorage.setItem(recentStorageKey.value, JSON.stringify(nextItems))
  } catch {
    // Historique local optionnel : on ignore si le navigateur bloque le stockage.
  }
}

function clearRecentItems() {
  recentItems.value = []
  try {
    window.localStorage.removeItem(recentStorageKey.value)
  } catch {
    // Ignore stockage indisponible.
  }
  selection.value = 0
}

function close(reset = true) {
  emit('update:modelValue', false)
  if (!reset) {
    setTimeout(resetState, 150)
    return
  }
  resetState()
}

function resetState() {
  query.value = ''
  resultats.value = emptyResults()
  selection.value = 0
  loading.value = false
}

function resultTitle(section, item) {
  if (section === 'clients' || section === 'fournisseurs') return item.nom || 'Tiers'
  if (section === 'produits') return item.libelle || 'Produit'
  if (section === 'achats') return item.numero || item.title || 'Achat'
  if (section === 'paiements') return item.reference || 'Paiement'
  return item.numero || 'Document'
}

function resultSubtitle(section, item) {
  if (section === 'clients' || section === 'fournisseurs') {
    return [item.code, item.email, item.telephone || item.mobile, item.ville].filter(Boolean).join(' · ')
  }
  if (section === 'produits') {
    return [item.reference, typeLabel(item.type), item.is_active ? 'Actif' : 'Inactif'].filter(Boolean).join(' · ')
  }
  if (section === 'achats') {
    return [item.title, item.tiers?.nom, formatDate(item.date)].filter(Boolean).join(' · ')
  }
  if (section === 'paiements') {
    return [item.client?.nom, formatDate(item.date_paiement), item.mode_paiement].filter(Boolean).join(' · ')
  }
  return [item.client?.nom, item.objet, formatDate(item.date_facture || item.date_devis)].filter(Boolean).join(' · ')
}

function resultAmount(section, item) {
  if (section === 'produits') return Number(item.prix_vente_ht || 0)
  if (section === 'achats') return Number(item.montant || 0)
  if (section === 'paiements') return Number(item.montant || 0)
  if (section === 'factures' || section === 'devis') return Number(item.total_ttc || 0)
  return null
}

function typeLabel(value) {
  return {
    commande: 'BC',
    demande: 'Demande',
    facture_fournisseur: 'Facture fournisseur',
    avoir: 'Avoir',
    service: 'Service',
    produit: 'Produit',
    pack: 'Pack',
  }[value] || value || ''
}

function emptyResults() {
  return {
    clients: [],
    fournisseurs: [],
    factures: [],
    devis: [],
    produits: [],
    achats: [],
    paiements: [],
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(value || 0)))
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : ''
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
