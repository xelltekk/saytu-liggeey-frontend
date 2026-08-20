<template>
  <div ref="root" class="relative">
    <input
      :value="modelValue"
      type="text"
      class="input text-sm"
      :placeholder="placeholder"
      :required="required"
      autocomplete="off"
      @click="openSearch"
      @focus="openSearch"
      @input="onInput"
      @keydown.down.prevent="moveHighlight(1)"
      @keydown.up.prevent="moveHighlight(-1)"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.esc.stop="closeSearch"
    />

    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-full z-[120] mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
    >
      <div class="border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
        Rechercher par référence ou libellé.
      </div>

      <div v-if="loading" class="px-3 py-3 text-sm text-gray-500">
        Recherche...
      </div>

      <div v-else-if="results.length" class="max-h-72 overflow-y-auto py-1">
        <button
          v-for="(product, index) in results"
          :key="product.id"
          type="button"
          class="flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-xelltekk-50"
          :class="index === highlightedIndex ? 'bg-xelltekk-50' : ''"
          @mousedown.prevent="selectProduct(product)"
        >
          <span class="mt-0.5 shrink-0 rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
            {{ product.reference || 'REF' }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-medium text-gray-900">{{ product.libelle }}</span>
            <span class="block truncate text-xs text-gray-500">
              {{ product.type || 'produit' }} · {{ formatPrice(product.prix_vente_ht) }} HT · TVA {{ Number(product.taux_tva || 0) }}%
            </span>
          </span>
        </button>
      </div>

      <div v-else class="px-3 py-3 text-sm text-gray-500">
        Aucun produit trouvé.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import api from '@/services/api'

const props = defineProps({
  modelValue: { type: String, default: '' },
  products: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Rechercher un produit ou saisir une désignation...' },
  required: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const root = ref(null)
const isOpen = ref(false)
const loading = ref(false)
const remoteResults = ref([])
const highlightedIndex = ref(0)

let searchTimer = null
let searchSequence = 0

const results = computed(() => {
  const term = normalize(props.modelValue)
  const source = remoteResults.value.length ? remoteResults.value : props.products
  const filtered = term.length < 2
    ? source
    : source.filter(product => normalize(`${product.reference || ''} ${product.libelle || ''} ${product.marque || ''} ${product.modele || ''}`).includes(term))

  return filtered.slice(0, 25)
})

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function onInput(event) {
  emit('update:modelValue', event.target.value)
  isOpen.value = true
  remoteResults.value = []
  highlightedIndex.value = 0
  scheduleSearch(event.target.value)
}

function openSearch() {
  isOpen.value = true
  highlightedIndex.value = 0
  scheduleSearch(props.modelValue, 0)
}

function closeSearch() {
  isOpen.value = false
}

function scheduleSearch(term, delay = 250) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => searchProducts(term), delay)
}

async function searchProducts(term) {
  const normalizedTerm = normalize(term)
  if (normalizedTerm.length < 2 && props.products.length) {
    remoteResults.value = []
    loading.value = false
    return
  }

  const sequence = ++searchSequence
  loading.value = true

  try {
    const { data } = await api.get('/produits', {
      params: {
        search: normalizedTerm.length >= 2 ? term : undefined,
        actifs_seulement: 1,
        per_page: 25,
      },
    })

    if (sequence === searchSequence) {
      remoteResults.value = data.data || []
      highlightedIndex.value = 0
    }
  } catch (e) {
    if (sequence === searchSequence) {
      remoteResults.value = []
    }
  } finally {
    if (sequence === searchSequence) {
      loading.value = false
    }
  }
}

function moveHighlight(direction) {
  if (!isOpen.value) {
    openSearch()
    return
  }
  if (!results.value.length) return
  highlightedIndex.value = (highlightedIndex.value + direction + results.value.length) % results.value.length
}

function selectHighlighted(event) {
  if (!isOpen.value || !results.value.length) return
  event.preventDefault()
  selectProduct(results.value[highlightedIndex.value])
}

function selectProduct(product) {
  emit('select', product)
  emit('update:modelValue', product.libelle || '')
  closeSearch()
}

function onDocumentMouseDown(event) {
  if (root.value && !root.value.contains(event.target)) {
    closeSearch()
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(value || 0)))
}

watch(() => props.products, () => {
  if (!remoteResults.value.length) highlightedIndex.value = 0
})

onMounted(() => document.addEventListener('mousedown', onDocumentMouseDown))
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown)
  clearTimeout(searchTimer)
})
</script>
