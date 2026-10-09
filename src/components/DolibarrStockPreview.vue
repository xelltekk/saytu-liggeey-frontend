<script setup>
import { computed, onMounted, ref, watch } from 'vue'
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
const selected = ref({})
const costs = ref({})
const openingDate = ref('')
const confirmed = ref(false)
const stopped = ref(false)
const outcome = ref(null)
const requestId = ref(null)
const runs = ref([])
const historyError = ref('')
const decisions = computed(() => Object.keys(selected.value).filter(line => selected.value[line]).map(line => ({ line: Number(line), cost: costs.value[line] || '' })))
const canExecute = computed(() => !busy.value && !stale.value && !outcome.value && result.value?.execution_available && !result.value?.blockers?.length && confirmed.value && stopped.value && openingDate.value && decisions.value.length > 0 && decisions.value.length <= 200 && decisions.value.every(d => /^\d{1,13}(?:\.\d{1,2})?$/.test(d.cost)))
watch([selected, costs, openingDate], () => { confirmed.value = false; requestId.value = null }, { deep: true })
const labels = { ready: 'Sans conflit détecté', blocked: 'À résoudre', zero: 'Solde nul' }
watch(busy, value => emit('busy', value))
watch(mapping, () => { stale.value = true; confirmed.value = false; requestId.value = null }, { deep: true })
watch(sourceKey, () => { result.value = null })
watch([search, filter], () => { page.value = 1 })
const filtered = computed(() => (result.value?.rows || []).filter(row => (!filter.value || row.status === filter.value) && `${row.reference} ${row.label} ${row.warehouse}`.toLowerCase().includes(search.value.toLowerCase().trim())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 25)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 25, page.value * 25))
async function preview() {
  error.value = ''
  outcome.value = null; selected.value = {}; costs.value = {}; confirmed.value = false; stopped.value = false; requestId.value = null
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
async function loadRuns() {
  historyError.value = ''
  try { runs.value = (await api.get(`/data-imports/${props.report.id}/stock/runs`)).data.runs }
  catch { historyError.value = 'Historique indisponible. Vérifiez-le avant de relancer un import interrompu.' }
}
async function execute() {
  if (!canExecute.value) return
  busy.value = true; error.value = ''
  requestId.value ||= crypto.randomUUID()
  const data = new FormData()
  data.append('database', file.value)
  data.append('source_key', sourceKey.value)
  data.append('preview_token', result.value.preview_token)
  data.append('request_id', requestId.value)
  data.append('opening_date', openingDate.value)
  data.append('confirmed', '1'); data.append('operations_stopped', '1')
  Object.entries(mapping.value).forEach(([id, value]) => { if (value) data.append(`warehouses[${id}]`, value) })
  decisions.value.forEach((decision, i) => { data.append(`decisions[${i}][line]`, decision.line); data.append(`decisions[${i}][cost]`, decision.cost) })
  try { outcome.value = (await api.post(`/data-imports/${props.report.id}/stock/execute`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data }
  catch (e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Réponse interrompue : consultez l’historique avant de réessayer.' }
  finally { await loadRuns(); busy.value = false }
}
onMounted(loadRuns)
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-cyan-200 bg-white p-5 text-slate-900">
    <h2 class="text-lg font-bold">Entrepôts et stocks — Préparation de la reprise</h2>
    <p class="rounded-xl bg-cyan-50 p-4 text-sm">L’aperçu ne modifie rien. Après contrôle, vous pouvez importer les soldes sélectionnés dans des positions encore absentes de Saytu. Importez d’abord le catalogue. Aucun entrepôt n’est créé automatiquement.</p>
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
        <fieldset v-if="!outcome" :disabled="busy" class="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <h3 class="font-bold">Sélection et valorisation — lignes de cette page</h3>
          <p class="text-sm">Aucune ligne sélectionnée par défaut. Le coût unitaire HT servira de PMP initial. Saisissez un point pour les décimales, dans la devise de Saytu ; zéro uniquement si vous confirmez une valorisation nulle.</p>
          <div v-for="row in visible.filter(r => r.status === 'ready')" :key="row.line" class="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3">
            <label class="flex min-w-0 flex-1 gap-2 text-sm"><input v-model="selected[row.line]" type="checkbox">{{ row.reference }} · {{ row.warehouse }} · {{ row.quantity }}</label>
            <label class="text-sm">Coût unitaire HT<input v-model="costs[row.line]" inputmode="decimal" :disabled="!selected[row.line]" placeholder="À renseigner" maxlength="16" class="ml-2 w-36 rounded-lg border border-cyan-200 p-2"></label>
          </div>
          <p v-if="!visible.some(r => r.status === 'ready')" class="text-sm">Aucune ligne importable sur cette page.</p>
          <p class="text-sm font-semibold">{{ decisions.length }} ligne(s) sélectionnée(s), toutes pages confondues · 200 maximum.</p>
          <button type="button" class="text-sm underline" @click="selected = {}">Tout désélectionner</button>
          <label class="block text-sm font-semibold">Date de reprise<input v-model="openingDate" type="date" class="ml-2 rounded-lg border border-cyan-200 p-2"></label>
          <label class="flex items-start gap-2 text-sm"><input v-model="stopped" type="checkbox" class="mt-1">J’ai arrêté les mouvements de stock dans Dolibarr et Saytu pendant la reprise, et cette sauvegarde correspond à la date de bascule.</label>
          <label class="flex items-start gap-2 text-sm"><input v-model="confirmed" type="checkbox" class="mt-1">Je confirme les quantités, les entrepôts, la devise, les coûts unitaires et la date. Un solde initial et un mouvement d’entrée seront créés pour chaque ligne sélectionnée, sans écriture comptable ni paiement.</label>
          <p v-if="!result.execution_available" class="text-sm text-red-800">Mise à jour du serveur nécessaire avant l’enregistrement.</p>
          <button type="button" :disabled="!canExecute" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white disabled:opacity-40" @click="execute">Enregistrer les soldes sélectionnés</button>
        </fieldset>
        <div v-else role="status" class="rounded-xl bg-cyan-50 p-4"><strong>Lot n° {{ outcome.run_id }} enregistré</strong><p>{{ outcome.created }} position(s) créée(s), {{ outcome.already_processed }} déjà traitée(s).</p><p class="text-sm">Consultez les mouvements de stock. Actualisez l’aperçu avant le lot suivant.</p></div>
        <nav aria-label="Pages de l’aperçu stock" class="flex flex-wrap justify-between gap-3 text-sm"><span>{{ filtered.length }} position(s) · Page {{ page }} / {{ pages }}</span><div class="flex gap-3"><button type="button" :disabled="page <= 1" class="rounded-lg border p-2 disabled:opacity-40" @click="page--">Précédent</button><button type="button" :disabled="page >= pages" class="rounded-lg border p-2 disabled:opacity-40" @click="page++">Suivant</button></div></nav>
      </template>
    </template>
    <section class="border-t border-cyan-200 pt-4"><div class="flex justify-between gap-3"><h3 class="font-bold">Historique des reprises de stock</h3><button type="button" class="text-sm underline" @click="loadRuns">Actualiser</button></div><p v-if="historyError" class="text-red-800">{{ historyError }}</p><p v-else-if="!runs.length" class="text-sm">Aucun lot enregistré.</p><div class="max-h-64 overflow-auto"><details v-for="run in runs" :key="run.id" class="mt-2 rounded-xl bg-cyan-50 p-3 text-sm"><summary>Lot {{ run.id }} · {{ run.created_at }} · {{ run.source_key }} — {{ run.result.created }} créée(s), {{ run.result.already_processed }} déjà traitée(s)</summary><p>Date de reprise : {{ run.result.opening_date }}</p><p v-for="item in run.result.items" :key="item.line">Ligne {{ item.line }} · quantité {{ item.quantity }} · coût HT {{ item.cost }} · mouvement #{{ item.mouvement_id }}</p></details></div></section>
  </section>
</template>
