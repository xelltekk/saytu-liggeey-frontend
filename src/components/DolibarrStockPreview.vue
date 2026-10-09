<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/services/api'
const props = defineProps({ report: { type: Object, required: true }, limits: { type: Object, required: true } })
const emit = defineEmits(['busy'])
const file = ref(null)
const sourceKey = ref('dolibarr-principal')
const mapping = ref({})
const result = ref(null)
const busy = ref(false)
const error = ref('')
const stale = ref(false)
const search = ref('')
const filter = ref('')
const page = ref(1)
const labels = { ready: 'Sans conflit détecté', blocked: 'À résoudre', zero: 'Solde nul' }
watch(busy, value => emit('busy', value))
watch(mapping, () => { stale.value = true }, { deep: true })
watch(sourceKey, () => { result.value = null })
watch([search, filter], () => { page.value = 1 })
const filtered = computed(() => (result.value?.rows || []).filter(row => (!filter.value || row.status === filter.value) && `${row.reference} ${row.label} ${row.warehouse}`.toLowerCase().includes(search.value.toLowerCase().trim())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 25)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 25, page.value * 25))
async function preview() {
  error.value = ''
  if (!file.value || !/\.sql(?:\.gz)?$/i.test(file.value.name)) { error.value = 'Sélectionnez le SQL déjà analysé.'; return }
  if (file.value.size > Math.min(props.limits.database, props.limits.total)) { error.value = 'Le fichier dépasse la limite serveur.'; return }
  const data = new FormData()
  data.append('database', file.value)
  data.append('source_key', sourceKey.value)
  Object.entries(mapping.value).forEach(([id, value]) => { if (value) data.append(`warehouses[${id}]`, value) })
  busy.value = true
  stale.value = true
  try {
    result.value = (await api.post(`/data-imports/${props.report.id}/stock/preview`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    stale.value = false
    page.value = 1
  } catch (e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Impossible de charger l’aperçu.' }
  finally { busy.value = false }
}
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-cyan-200 bg-white p-5 text-slate-900">
    <h2 class="text-lg font-bold">Entrepôts et stocks — Préparation de la reprise</h2>
    <p class="rounded-xl bg-cyan-50 p-4 text-sm">Lecture seule : aucun stock ni entrepôt ne sera créé ou modifié. Importez d’abord les produits dans le bloc catalogue. L’enregistrement des soldes sera une étape distincte.</p>
    <form @submit.prevent="preview"><fieldset :disabled="busy" class="space-y-3">
      <label class="block text-sm font-semibold">Base SQL déjà analysée<input type="file" accept=".sql,.gz" required class="mt-1 w-full rounded-xl border border-cyan-200 p-3" @change="file = $event.target.files[0] || null; result = null; mapping = {}"></label>
      <label class="block text-sm font-semibold">Même nom de source que pour le catalogue<input v-model="sourceKey" required pattern="[a-z0-9][a-z0-9_-]{2,63}" maxlength="64" class="mt-1 w-full rounded-xl border border-cyan-200 p-3"></label>
      <button type="submit" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white">{{ result ? 'Actualiser les contrôles' : 'Analyser les stocks' }}</button>
    </fieldset></form>
    <p v-if="busy" role="status">Analyse en cours…</p>
    <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-red-900">{{ error }}</p>
    <template v-if="result">
      <p v-for="warning in result.warnings" :key="warning" class="text-sm text-slate-700">{{ warning }}</p>
      <p v-for="blocker in result.blockers" :key="blocker" class="rounded-xl bg-red-50 p-3 text-red-900">{{ blocker }}</p>
      <h3 class="font-bold">Correspondances des entrepôts</h3>
      <p class="text-sm">Aucun rapprochement automatique. Si l’entrepôt n’existe pas dans Saytu, créez-le dans la rubrique Entrepôts, puis actualisez cet aperçu.</p>
      <div class="max-h-80 space-y-3 overflow-auto">
        <div v-for="warehouse in result.warehouses" :key="warehouse.source_id" class="rounded-xl border border-cyan-200 p-3">
          <label class="block text-sm font-semibold">{{ warehouse.reference }} · {{ warehouse.label }} {{ warehouse.active ? '' : '(fermé ou statut absent)' }}
            <select v-model="mapping[warehouse.source_id]" :disabled="busy" class="mt-2 w-full rounded-lg border border-cyan-200 p-2"><option :value="undefined">À choisir</option><option v-for="target in result.targets.filter(t => t.is_active)" :key="target.id" :value="target.id">{{ target.code }} · {{ target.libelle }}</option></select>
          </label>
          <p v-if="warehouse.candidates.length" class="mt-1 text-xs">Correspondances possibles à vérifier : {{ warehouse.candidates.map(t => t.code + ' · ' + t.libelle).join(', ') }}</p>
        </div>
        <p v-if="!result.warehouses.length">Aucun entrepôt source.</p>
      </div>
      <p v-if="stale" role="status" class="rounded-xl bg-amber-50 p-3 text-amber-950">Contrôles non actualisés : cliquez sur « Actualiser les contrôles » après vos choix.</p>
      <template v-else>
        <div class="grid gap-3 sm:grid-cols-3"><div v-for="(label, key) in labels" :key="key" class="rounded-xl bg-cyan-50 p-3"><p class="text-sm">{{ label }}</p><strong class="text-xl">{{ result.summary[key] }}</strong></div></div>
        <div class="flex flex-wrap gap-3"><input v-model="search" type="search" aria-label="Rechercher une position de stock" placeholder="Produit, référence, entrepôt…" class="min-w-0 flex-1 rounded-xl border border-cyan-200 p-3"><select v-model="filter" aria-label="Filtrer les contrôles stock" class="rounded-xl border border-cyan-200 p-3"><option value="">Tous</option><option v-for="(label, key) in labels" :key="key" :value="key">{{ label }}</option></select></div>
        <div class="max-h-[500px] overflow-auto rounded-xl border border-cyan-200"><table class="w-full text-left text-sm"><thead class="sticky top-0 bg-cyan-50"><tr><th class="p-3">Produit source / Saytu</th><th class="p-3">Entrepôt source / Saytu</th><th class="p-3">Solde Dolibarr</th><th class="p-3">Positions Saytu existantes</th><th class="p-3">Contrôles</th></tr></thead><tbody><tr v-for="row in visible" :key="row.line" class="border-t border-cyan-100 align-top"><td class="min-w-44 p-3"><strong>{{ row.reference }}</strong><p>{{ row.label }}</p><p>→ {{ row.target_product || 'Non rattaché' }}</p></td><td class="min-w-40 p-3">{{ row.warehouse }}<p>→ {{ row.target_warehouse || 'Non choisi' }}</p></td><td class="p-3">{{ row.quantity ?? 'Invalide' }}</td><td class="min-w-40 p-3"><p v-if="!row.current_positions.length">Aucune position détectée</p><p v-for="(position, i) in row.current_positions" :key="i">{{ position.quantity }} · réservé : {{ position.reserved }} · emplacement : {{ position.location_id ?? 'sans' }}</p></td><td class="min-w-64 p-3"><strong>{{ labels[row.status] }}</strong><p v-for="issue in row.issues" :key="issue" class="mt-1 text-red-800">{{ issue }}</p></td></tr><tr v-if="!visible.length"><td colspan="5" class="p-4 text-center">Aucune position pour ce filtre.</td></tr></tbody></table></div>
        <nav aria-label="Pages de l’aperçu stock" class="flex flex-wrap justify-between gap-3 text-sm"><span>{{ filtered.length }} position(s) · Page {{ page }} / {{ pages }}</span><div class="flex gap-3"><button type="button" :disabled="page <= 1" class="rounded-lg border p-2 disabled:opacity-40" @click="page--">Précédent</button><button type="button" :disabled="page >= pages" class="rounded-lg border p-2 disabled:opacity-40" @click="page++">Suivant</button></div></nav>
      </template>
    </template>
  </section>
</template>
