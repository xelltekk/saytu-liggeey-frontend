<template>
  <section class="rounded-xl border bg-white p-5" aria-labelledby="unplanned-prospects-title">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="unplanned-prospects-title" class="text-lg font-bold">Prospects sans prochaine action</h2>
        <p class="mt-1 text-sm text-slate-600">Prospects actifs sans action ouverte, y compris ceux jamais contactés.</p>
      </div>
      <label class="text-sm">
        Commercial responsable
        <select v-model="commercial" class="input mt-1" @change="load(1)">
          <option value="">Tous les commerciaux</option>
          <option value="unassigned">Sans commercial</option>
          <option v-for="user in commercials" :key="user.id" :value="String(user.id)">{{ user.name }}</option>
        </select>
      </label>
    </div>

    <p v-if="loading" class="mt-4 text-sm text-slate-600" role="status">Chargement des prospects…</p>
    <p v-else-if="error" class="mt-4 text-sm text-red-700" role="alert">
      Impossible de charger les prospects.
      <button type="button" class="font-semibold underline" @click="load(1)">Réessayer</button>
    </p>
    <p v-else-if="!results.data.length" class="mt-4 text-sm text-slate-600">Aucun prospect sans prochaine action pour ce filtre.</p>
    <template v-else>
      <ul class="mt-4 divide-y divide-slate-200">
        <li v-for="prospect in results.data" :key="prospect.id" class="flex flex-wrap items-center justify-between gap-3 py-3">
          <div class="min-w-0">
            <RouterLink :to="{ name: 'prospect-detail', params: { id: prospect.id } }" class="break-words font-semibold text-blue-700 hover:underline">{{ prospect.nom }}</RouterLink>
            <p class="mt-1 text-sm text-slate-600">{{ prospect.commercial?.name || 'Sans commercial' }} · {{ lastContact(prospect) }}</p>
          </div>
          <RouterLink :to="followupLocation(prospect)" class="btn-secondary">Planifier une relance</RouterLink>
        </li>
      </ul>
      <AppPagination :meta="results" label="prospects" @page="load" />
    </template>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AppPagination from '@/components/AppPagination.vue'
import api from '@/services/api'

defineProps({ commercials: { type: Array, required: true } })

const commercial = ref('')
const results = ref({ data: [], total: 0, current_page: 1, last_page: 1 })
const loading = ref(true)
const error = ref(false)
let requestId = 0

async function load(page = 1) {
  const current = ++requestId
  loading.value = true
  error.value = false
  try {
    const { data } = await api.get('/prospection/prospects', {
      params: {
        sans_prochaine_action: 1,
        commercial_id: commercial.value && commercial.value !== 'unassigned' ? commercial.value : undefined,
        unassigned: commercial.value === 'unassigned' ? 1 : undefined,
        per_page: 15,
        page,
      },
    })
    if (current === requestId) results.value = data
  } catch {
    if (current === requestId) error.value = true
  } finally {
    if (current === requestId) loading.value = false
  }
}

function lastContact(prospect) {
  if (!prospect.dernier_contact) return 'Aucun contact enregistré'
  const date = new Date(prospect.dernier_contact.replace(' ', 'T').slice(0, 10) + 'T00:00:00')
  return 'Dernier contact le ' + date.toLocaleDateString('fr-FR')
}

function followupLocation(prospect) {
  return {
    name: 'prospection-action-create',
    query: { client_id: prospect.id, commercial_id: prospect.commercial_id || undefined, from: 'sans-prochaine-action' },
  }
}

onMounted(() => load())
defineExpose({ refresh: () => load() })
</script>
