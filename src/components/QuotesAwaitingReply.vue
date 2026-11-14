<template>
  <section class="rounded-xl border bg-white p-5" aria-labelledby="awaiting-quotes-title">
    <h2 id="awaiting-quotes-title" class="text-lg font-bold">Devis envoyés sans réponse</h2>
    <p class="mt-1 text-sm text-slate-600">Devis au statut Envoyé. Le délai est calculé depuis la date du devis.</p>
    <div class="my-4 flex flex-wrap items-end gap-3">
      <label class="text-sm">Âge minimum (jours)
        <input v-model.number="days" type="number" min="0" max="365" class="input mt-1" @change="load(1)" />
      </label>
      <label class="text-sm">Commercial responsable
        <select v-model="commercial" class="input mt-1" @change="load(1)">
          <option value="">Tous les commerciaux</option>
          <option v-for="user in commercials" :key="user.id" :value="String(user.id)">{{ user.name }}</option>
        </select>
      </label>
    </div>
    <p v-if="loading" role="status">Chargement…</p>
    <p v-else-if="error" role="alert" class="text-red-700">{{ error }}
      <button v-if="validDays()" type="button" class="underline" @click="load(1)">Réessayer</button>
    </p>
    <p v-else-if="!results.data.length" class="text-sm text-slate-600">Aucun devis en attente pour ces filtres.</p>
    <template v-else>
      <ul class="divide-y divide-slate-200">
        <li v-for="quote in results.data" :key="quote.id" class="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <RouterLink :to="{ name: 'devis-detail', params: { id: quote.id } }" class="font-semibold text-blue-700 underline">{{ quote.numero }} · {{ quote.client?.nom || 'Client' }}</RouterLink>
            <p class="text-sm text-slate-600">{{ quote.commercial?.name || 'Sans commercial' }} · {{ money(quote) }} · Daté du {{ date(quote.date_devis) }}</p>
            <p class="text-sm text-slate-600">Relance du client : {{ quote.prochaine_relance_client ? date(quote.prochaine_relance_client) : 'aucune prévue' }}</p>
          </div>
          <RouterLink v-if="quote.client" :to="followup(quote)" class="btn-secondary">Planifier une relance</RouterLink>
        </li>
      </ul>
      <AppPagination :meta="results" label="devis" @page="load" />
    </template>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AppPagination from '@/components/AppPagination.vue'
import api from '@/services/api'

defineProps({ commercials: { type: Array, required: true } })
const days = ref(7)
const commercial = ref('')
const results = ref({ data: [], total: 0 })
const loading = ref(true)
const error = ref('')
let requestId = 0

function validDays() {
  return Number.isInteger(days.value) && days.value >= 0 && days.value <= 365
}

async function load(page = 1) {
  const current = ++requestId
  if (!validDays()) {
    error.value = 'Saisissez un délai de 0 à 365 jours.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/devis', {
      params: { attente_reponse_jours: days.value, commercial_id: commercial.value || undefined, page, per_page: 15 },
    })
    if (current === requestId) results.value = data
  } catch {
    if (current === requestId) error.value = 'Impossible de charger les devis.'
  } finally {
    if (current === requestId) loading.value = false
  }
}

function date(value) {
  return value ? new Date(value.slice(0, 10) + 'T00:00:00').toLocaleDateString('fr-FR') : '—'
}

function money(quote) {
  return new Intl.NumberFormat('fr-FR').format(Number(quote.total_ttc)) + ' ' + (quote.devise || 'XOF')
}

function followup(quote) {
  return {
    name: 'prospection-action-create',
    query: {
      from: 'devis-sans-reponse',
      client_id: quote.client.id,
      commercial_id: quote.commercial_id || undefined,
      devis: quote.numero,
    },
  }
}

onMounted(() => load())
defineExpose({ refresh: () => load() })
</script>
