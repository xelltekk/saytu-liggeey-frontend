<template>
  <section class="space-y-3 rounded-xl border border-cyan-200 bg-white p-4 text-slate-900">
    <h3 class="font-bold">Comparaisons enregistrées · À facturer</h3>
    <form class="flex flex-wrap gap-2" @submit.prevent="load(1)"><input v-model="search" class="input" aria-label="Rechercher une préparation" placeholder="Client ou numéro de série" maxlength="100" /><button class="btn-secondary" :disabled="loading">Rechercher</button></form>
    <p v-if="error" class="text-red-800" role="alert">{{ error }}</p>
    <div class="max-h-80 overflow-auto"><table class="w-full text-left text-sm"><thead><tr><th class="p-2">Client / Contrat</th><th class="p-2">Machine / Période</th><th class="p-2">Action</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id" class="border-t"><td class="p-2">{{ row.client?.nom }}<br />{{ row.contrat?.numero }}</td><td class="p-2">{{ row.serial }}<br />{{ row.date_debut }} → {{ row.date_fin }}</td><td class="p-2"><RouterLink class="font-semibold text-cyan-800 underline" :to="leasingComparisonLocation({ preparation: row.id })">Reprendre</RouterLink></td></tr></tbody></table></div>
    <p v-if="!loading && !error && !rows.length">Aucune comparaison en attente.</p>
    <div class="flex items-center gap-3"><button class="btn-secondary" :disabled="loading || page <= 1" @click="load(page - 1)">Précédent</button><span>{{ page }} / {{ pages }}</span><button class="btn-secondary" :disabled="loading || page >= pages" @click="load(page + 1)">Suivant</button></div>
  </section>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import { leasingComparisonLocation } from '@/services/leasingNavigation.mjs'
const rows = ref([]), search = ref(''), loading = ref(false), error = ref(''), page = ref(1), pages = ref(1)
let sequence = 0
async function load(target = 1) {
  const token = ++sequence; loading.value = true; error.value = ''
  try { const { data } = await api.get('/leasing/preparations', { params: { search: search.value, page: target } }); if (token === sequence) { rows.value = data.data; page.value = data.current_page; pages.value = data.last_page } }
  catch (e) { if (token === sequence) error.value = e.response?.data?.message || 'Chargement impossible. Réessayez.' }
  finally { if (token === sequence) loading.value = false }
}
onMounted(() => load()); onBeforeUnmount(() => sequence++)
</script>
