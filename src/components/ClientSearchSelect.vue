<template>
  <div class="relative">
    <input
      v-model="search"
      type="search"
      class="input"
      :required="required && !modelValue"
      :placeholder="placeholder"
      @focus="openDropdown"
      @keydown.escape="open = false"
    />

    <div v-if="selectedClient" class="mt-2 flex items-center justify-between gap-3 rounded-lg border border-xelltekk-100 bg-xelltekk-50 px-3 py-2 text-sm">
      <div class="min-w-0">
        <p class="truncate font-semibold text-gray-900">{{ selectedClient.nom }}</p>
        <p class="truncate text-xs text-gray-500">
          {{ selectedClient.code }}<span v-if="selectedClient.telephone"> - {{ selectedClient.telephone }}</span>
        </p>
      </div>
      <button type="button" class="text-xs font-semibold text-xelltekk-700 hover:text-xelltekk-900" @click="clearSelection">
        Changer
      </button>
    </div>

    <div v-if="open" class="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
      <button
        v-for="client in results"
        :key="client.id"
        type="button"
        class="block w-full border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
        @mousedown.prevent="selectClient(client)"
      >
        <p class="font-medium text-gray-900">{{ client.nom }}</p>
        <p class="text-xs text-gray-500">
          {{ client.code }}
          <span v-if="client.telephone"> - {{ client.telephone }}</span>
          <span v-if="client.email"> - {{ client.email }}</span>
        </p>
      </button>

      <div v-if="loading" class="px-3 py-3 text-sm text-gray-500">Recherche...</div>
      <div v-else-if="results.length === 0" class="px-3 py-3 text-sm text-gray-500">Aucun client trouve</div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import api from '@/services/api'

const props = defineProps({
  modelValue: { type: Number, default: null },
  clients: { type: Array, default: () => [] },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Rechercher un client...' },
})

const emit = defineEmits(['update:modelValue'])

const search = ref('')
const open = ref(false)
const loading = ref(false)
const results = ref([])
const selectedClient = ref(null)
let timer = null

watch(() => props.clients, syncSelectedFromOptions, { immediate: true })
watch(() => props.modelValue, syncSelectedFromOptions, { immediate: true })

watch(search, (value) => {
  if (selectedClient.value && value === clientLabel(selectedClient.value)) return
  if (selectedClient.value) {
    selectedClient.value = null
    emit('update:modelValue', null)
  }
  open.value = true
  clearTimeout(timer)
  timer = setTimeout(() => loadClients(value), 250)
})

async function syncSelectedFromOptions() {
  if (!props.modelValue) {
    selectedClient.value = null
    return
  }

  const current = props.clients.find(client => Number(client.id) === Number(props.modelValue))
  if (current) {
    selectedClient.value = current
    search.value = clientLabel(current)
    return
  }

  if (!selectedClient.value || Number(selectedClient.value.id) !== Number(props.modelValue)) {
    try {
      const { data } = await api.get(`/clients/${props.modelValue}`)
      selectedClient.value = data
      search.value = clientLabel(data)
    } catch {
      selectedClient.value = null
    }
  }
}

function clientLabel(client) {
  return `${client.code || ''} - ${client.nom || ''}`.trim()
}

async function openDropdown() {
  open.value = true
  if (results.value.length === 0) {
    await loadClients(selectedClient.value ? '' : search.value)
  }
}

async function loadClients(value = '') {
  loading.value = true
  try {
    const { data } = await api.get('/clients', {
      params: {
        search: value.trim() || undefined,
        per_page: 12,
      },
    })
    results.value = data.data || []
  } finally {
    loading.value = false
  }
}

function selectClient(client) {
  selectedClient.value = client
  search.value = clientLabel(client)
  open.value = false
  emit('update:modelValue', Number(client.id))
}

function clearSelection() {
  selectedClient.value = null
  search.value = ''
  results.value = []
  open.value = true
  emit('update:modelValue', null)
  loadClients()
}

onBeforeUnmount(() => clearTimeout(timer))
</script>
