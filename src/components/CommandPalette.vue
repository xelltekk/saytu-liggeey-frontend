<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-4 sm:px-4 sm:pt-[10vh]">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <!-- Palette -->
        <div
          class="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Recherche globale"
        >
          <!-- Input search -->
          <div class="flex items-center px-4 border-b border-gray-200">
            <span class="text-gray-400 text-xl">🔍</span>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Rechercher clients, factures, devis, produits..."
              class="flex-1 px-3 py-4 text-sm bg-transparent outline-none placeholder-gray-400"
              autocomplete="off"
              aria-label="Rechercher dans l'application"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.enter.prevent="ouvrirSelection"
              @keydown.esc.prevent="close"
            />
            <kbd class="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded border border-gray-300">ESC</kbd>
          </div>

          <!-- Résultats -->
          <div class="max-h-[60vh] overflow-y-auto">
            <div v-if="loading" class="p-8 text-center text-sm text-gray-500" role="status" aria-live="polite">
              Recherche en cours...
            </div>

            <div v-else-if="query.length < 2" class="p-8 text-center text-sm text-gray-400">
              <p class="mb-2 text-base">💡 Tapez au moins 2 caractères</p>
              <p class="text-xs">Cherchez par nom, n° facture, NINEA, référence produit...</p>
              <div class="mt-4 flex justify-center gap-3 text-[11px] text-gray-500">
                <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">↑</kbd> <kbd class="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">↓</kbd> Naviguer</span>
                <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">⏎</kbd> Ouvrir</span>
                <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">ESC</kbd> Fermer</span>
              </div>
            </div>

            <div v-else-if="totalResultats === 0" class="p-8 text-center text-sm text-gray-400">
              <p class="text-4xl mb-2">🤷</p>
              <p>Aucun résultat pour <strong class="text-gray-600">"{{ query }}"</strong></p>
            </div>

            <div v-else>
              <!-- Clients -->
              <SectionResultats
                v-if="resultats.clients.length"
                titre="👥 Clients"
                couleur="blue"
                :items="resultats.clients"
                :selection="selection"
                :offset="0"
                @click-item="ouvrirItem"
              >
                <template #default="{ item }">
                  <div class="font-medium text-gray-900">{{ item.nom }}</div>
                  <div class="text-xs text-gray-500">
                    <span class="font-mono">{{ item.code }}</span>
                    <span v-if="item.email" class="ml-2">{{ item.email }}</span>
                    <span v-if="item.telephone" class="ml-2">📞 {{ item.telephone }}</span>
                  </div>
                </template>
              </SectionResultats>

              <!-- Factures -->
              <SectionResultats
                v-if="resultats.factures.length"
                titre="🧾 Factures" ?
                couleur="green"
                :items="resultats.factures"
                :selection="selection"
                :offset="resultats.clients.length || 0"
                @click-item="ouvrirItem"
              >
                <template #default="{ item }">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-gray-900">
                        <span class="font-mono">{{ item.numero }}</span>
                        <span v-if="item.type === 'avoir'" class="ml-1 text-red-600 text-[10px]">AVOIR</span>
                      </div>
                      <div class="text-xs text-gray-500">{{ item.client?.nom || 'Client' }} • {{ formatDate(item.date_facture) }}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-mono font-semibold text-sm">{{ formatPrice(item.total_ttc) }}</div>
                      <div class="text-[10px] text-gray-500 capitalize">{{ item.statut }}</div>
                    </div>
                  </div>
                </template>
              </SectionResultats>

              <!-- Devis -->
              <SectionResultats
                v-if="resultats.devis.length"
                titre="📋 Devis" ?
                couleur="purple"
                :items="resultats.devis"
                :selection="selection"
                :offset="(resultats.clients.length || 0) + (resultats.factures.length || 0)"
                @click-item="ouvrirItem"
              >
                <template #default="{ item }">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-gray-900 font-mono">{{ item.numero }}</div>
                      <div class="text-xs text-gray-500">{{ item.client?.nom || 'Client' }} • {{ item.objet || 'Sans objet' }}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-mono font-semibold text-sm">{{ formatPrice(item.total_ttc) }}</div>
                      <div class="text-[10px] text-gray-500 capitalize">{{ item.statut }}</div>
                    </div>
                  </div>
                </template>
              </SectionResultats>

              <!-- Produits -->
              <SectionResultats
                v-if="resultats.produits.length"
                titre="📦 Produits" ?
                couleur="orange"
                :items="resultats.produits"
                :selection="selection"
                :offset="(resultats.clients.length || 0) + (resultats.factures.length || 0) + (resultats.devis.length || 0)"
                @click-item="ouvrirItem"
              >
                <template #default="{ item }">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-gray-900">{{ item.libelle }}</div>
                      <div class="text-xs text-gray-500 font-mono">{{ item.reference }}</div>
                    </div>
                    <div class="text-right font-mono text-sm font-semibold">{{ formatPrice(item.prix_vente_ht) }}</div>
                  </div>
                </template>
              </SectionResultats>

              <!-- Paiements -->
              <SectionResultats
                v-if="resultats.paiements.length"
                titre="💰 Paiements" ?
                couleur="emerald"
                :items="resultats.paiements"
                :selection="selection"
                :offset="(resultats.clients.length || 0) + (resultats.factures.length || 0) + (resultats.devis.length || 0) + (resultats.produits.length || 0)"
                @click-item="ouvrirItem"
              >
                <template #default="{ item }">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-gray-900 font-mono">{{ item.reference }}</div>
                      <div class="text-xs text-gray-500">{{ item.client?.nom || 'Client' }} • {{ formatDate(item.date_paiement) }}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-mono font-semibold text-sm">{{ formatPrice(item.montant) }}</div>
                      <div class="text-[10px] text-gray-500 capitalize">{{ item.mode_paiement }}</div>
                    </div>
                  </div>
                </template>
              </SectionResultats>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between">
            <span>{{ totalResultats }} résultat(s)</span>
            <span>
              <kbd class="px-1.5 py-0.5 bg-white rounded border border-gray-300">↑↓</kbd>
              <kbd class="px-1.5 py-0.5 ml-1 bg-white rounded border border-gray-300">⏎</kbd>
              <kbd class="px-1.5 py-0.5 ml-1 bg-white rounded border border-gray-300">ESC</kbd>
            </span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, h } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

// SectionResultats : sous-composant inline pour afficher chaque section
const SectionResultats = {
  props: ['titre', 'couleur', 'items', 'selection', 'offset'],
  emits: ['clickItem'],
  setup(props, { emit, slots }) {
    return () => h('div', { class: 'py-2 border-b border-gray-100 last:border-b-0' }, [
      h('div', { class: 'px-4 pb-1 text-[11px] font-semibold uppercase text-gray-500 tracking-wider' }, props.titre),
      ...props.items.map((item, idx) => {
        const globalIdx = props.offset + idx
        const isSelected = globalIdx === props.selection
        return h(
          'button',
          {
            type: 'button',
            class: [
              'w-full text-left px-4 py-2 text-sm transition-colors flex items-center',
              isSelected ? 'bg-cyan-50 border-l-2 border-cyan-500' : 'hover:bg-gray-50',
            ],
            onClick: () => emit('clickItem', { categorie: props.titre, item }),
          },
          h('div', { class: 'flex-1' }, slots.default?.({ item }))
        )
      }),
    ])
  },
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const inputRef = ref(null)
const query = ref('')
const resultats = ref({ clients: [], factures: [], devis: [], produits: [], paiements: [] })
const loading = ref(false)
const selection = ref(0)

const totalResultats = computed(() => {
  return (resultats.value.clients.length || 0)
    + (resultats.value.factures.length || 0)
    + (resultats.value.devis.length || 0)
    + (resultats.value.produits.length || 0)
    + (resultats.value.paiements.length || 0)
})

// Aplatissement des résultats pour navigation clavier
const itemsFlat = computed(() => {
  return [
    ...(resultats.value.clients || []).map(i => ({ type: 'client', item: i })),
    ...(resultats.value.factures || []).map(i => ({ type: 'facture', item: i })),
    ...(resultats.value.devis || []).map(i => ({ type: 'devis', item: i })),
    ...(resultats.value.produits || []).map(i => ({ type: 'produit', item: i })),
    ...(resultats.value.paiements || []).map(i => ({ type: 'paiement', item: i })),
  ]
})

let searchTimer = null
watch(query, (val) => {
  selection.value = 0
  clearTimeout(searchTimer)
  if (val.length < 2) {
    resultats.value = { clients: [], factures: [], devis: [], produits: [], paiements: [] }
    return
  }
  searchTimer = setTimeout(() => rechercher(val), 250)
})

async function rechercher(q) {
  loading.value = true
  try {
    const { data } = await api.get('/recherche-globale', { params: { q } })
    resultats.value = data
  } catch (e) {
    console.error('Erreur recherche', e)
  } finally {
    loading.value = false
  }
}

function moveSelection(delta) {
  const total = itemsFlat.value.length
  if (total === 0) return
  selection.value = (selection.value + delta + total) % total
  nextTick(() => {
    const el = document.querySelector('.bg-cyan-50')
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

function ouvrirSelection() {
  const choisi = itemsFlat.value[selection.value]
  if (! choisi) return
  ouvrirItem({ item: choisi.item, type: choisi.type })
}

function ouvrirItem({ item, type, categorie }) {
  // Type déduit du titre de section si non fourni ?
  const t = type || (categorie.includes('Client') ? 'client'
    : categorie.includes('Facture') ? 'facture'
    : categorie.includes('Devis') ? 'devis'
    : categorie.includes('Paiement') ? 'paiement'
    : 'produit')

  close()

  switch (t) {
    case 'client':
      router.push({ path: '/clients', query: { open: item.id } })
      break
    case 'facture':
      router.push({ path: '/factures', query: { open: item.id } })
      break
    case 'devis':
      router.push({ path: '/devis', query: { open: item.id } })
      break
    case 'produit':
      router.push({ path: '/produits', query: { open: item.id } })
      break
    case 'paiement':
      router.push({ path: '/paiements', query: { search: item.reference } })
      break
  }
}

function close() {
  emit('update:modelValue', false)
  query.value = ''
  resultats.value = { clients: [], factures: [], devis: [], produits: [], paiements: [] }
  selection.value = 0
}

watch(() => props.modelValue, (val) => {
  if (val) {
    nextTick(() => inputRef.value.focus())
  }
})

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
