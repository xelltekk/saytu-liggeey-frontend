<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/services/api'
const props = defineProps({ report: { type: Object, required: true }, limits: { type: Object, required: true } })
const emit = defineEmits(['busy'])
const file = ref(null)
const sourceKey = ref('dolibarr-principal')
const currency = ref('')
const result = ref(null)
const busy = ref(false)
const error = ref('')
const search = ref('')
const filter = ref('')
const page = ref(1)
const selected = ref({})
const statuses = ref({})
const units = ref({})
const paymentDays = ref('')
const confirmed = ref(false)
const limitations = ref(false)
const outcome = ref(null)
const requestId = ref(null)
const runs = ref([])
const historyError = ref('')
const statusLabels = { brouillon: 'Brouillon', envoye: 'Envoyé (envoi déjà effectué)', accepte: 'Accepté', refuse: 'Refusé', expire: 'Expiré', facture: 'Facturé / traité (liens à reprendre)' }
const decisions = computed(() => (result.value?.rows || []).filter(r => selected.value[r.source_id]).map(r => ({ source_id: r.source_id, status: statuses.value[r.source_id] || '', units: Object.fromEntries(r.lines.map(l => [l.source_id, units.value[l.source_id] || ''])) })))
const lineCount = computed(() => decisions.value.reduce((sum, d) => sum + Object.keys(d.units).length, 0))
const canExecute = computed(() => !busy.value && !outcome.value && result.value?.execution_available && !result.value?.blockers.length && confirmed.value && limitations.value && /^\d{1,4}$/.test(String(paymentDays.value)) && Number(paymentDays.value) <= 3650 && decisions.value.length > 0 && decisions.value.length <= 50 && lineCount.value <= 1000 && decisions.value.every(d => d.status && Object.values(d.units).every(u => u.trim().length > 0 && u.trim().length <= 20)))
watch([selected, statuses, units, paymentDays], () => { confirmed.value = false; requestId.value = null }, { deep: true })
const labels = { ready: 'Sans conflit détecté', review: 'À confirmer', blocked: 'À corriger' }
watch(busy, value => emit('busy', value))
watch([sourceKey, currency, file], () => { result.value = null })
watch([search, filter], () => { page.value = 1 })
const filtered = computed(() => (result.value?.rows || []).filter(r => (!filter.value || r.status === filter.value) && `${r.reference} ${r.client}`.toLowerCase().includes(search.value.trim().toLowerCase())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 20)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20))
async function preview() {
  error.value = ''; result.value = null
  selected.value = {}; statuses.value = {}; units.value = {}; outcome.value = null; confirmed.value = false; limitations.value = false; requestId.value = null
  if (!file.value || !/\.sql(?:\.gz)?$/i.test(file.value.name)) { error.value = 'Sélectionnez la base SQL déjà analysée.'; return }
  if (file.value.size > Math.min(props.limits.database, props.limits.total)) { error.value = 'Le fichier dépasse la limite serveur.'; return }
  const data = new FormData()
  data.append('database', file.value); data.append('source_key', sourceKey.value); data.append('currency', currency.value)
  busy.value = true
  try { result.value = (await api.post(`/data-imports/${props.report.id}/quotes/preview`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data; page.value = 1 }
  catch (e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Impossible de charger l’aperçu des devis.' }
  finally { busy.value = false }
}
function toggle(row) {
  selected.value[row.source_id] = !selected.value[row.source_id]
  if (selected.value[row.source_id]) row.lines.forEach(line => { units.value[line.source_id] ??= line.unit_suggestion || '' })
}
async function loadRuns() {
  historyError.value = ''
  try { runs.value = (await api.get(`/data-imports/${props.report.id}/quotes/runs`)).data.runs }
  catch { historyError.value = 'Historique indisponible. Consultez-le avant de relancer un import interrompu.' }
}
async function execute() {
  if (!canExecute.value) return
  error.value = ''; busy.value = true; requestId.value ||= crypto.randomUUID()
  const data = new FormData()
  data.append('database', file.value); data.append('source_key', sourceKey.value); data.append('currency', currency.value)
  data.append('preview_token', result.value.preview_token); data.append('request_id', requestId.value)
  data.append('confirmed', '1'); data.append('limitations_confirmed', '1'); data.append('payment_days', paymentDays.value)
  data.append('decisions_json', JSON.stringify(decisions.value))
  try { outcome.value = (await api.post(`/data-imports/${props.report.id}/quotes/execute`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data }
  catch (e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Réponse interrompue : consultez l’historique avant de réessayer sans modifier la sélection.' }
  finally { await loadRuns(); busy.value = false }
}
onMounted(loadRuns)
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-cyan-200 bg-white p-5 text-slate-900">
    <h2 class="text-lg font-bold">Devis — Contrôle avant transfert</h2>
    <p class="rounded-xl bg-cyan-50 p-4 text-sm">L’aperçu ne modifie rien. L’enregistrement exige votre sélection et une confirmation séparée. Aucun stock réservé, facture créée ou email envoyé, même pour un devis accepté.</p>
    <form @submit.prevent="preview"><fieldset :disabled="busy" class="space-y-3">
      <label class="block text-sm font-semibold">Base SQL déjà analysée<input type="file" accept=".sql,.gz" required class="mt-1 w-full rounded-xl border border-cyan-200 p-3" @change="file = $event.target.files[0] || null"></label>
      <div class="grid gap-3 sm:grid-cols-2"><label class="block text-sm font-semibold">Même nom de source que pour les tiers et produits<input v-model="sourceKey" required pattern="[a-z0-9][a-z0-9_-]{2,63}" maxlength="64" class="mt-1 w-full rounded-xl border border-cyan-200 p-3"></label><label class="block text-sm font-semibold">Devise principale de Dolibarr (ex. XOF)<input v-model="currency" required pattern="[A-Z]{3}" maxlength="3" placeholder="À confirmer" class="mt-1 w-full rounded-xl border border-cyan-200 p-3"></label></div>
      <p class="text-sm">Vérifiez la devise dans Dolibarr. Les montants ne seront pas convertis. Les lignes libres sont distinguées des produits du catalogue.</p>
      <button type="submit" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white">Contrôler les devis</button>
    </fieldset></form>
    <p v-if="busy" role="status">Lecture des devis et vérification des lignes…</p>
    <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-red-900">{{ error }}</p>
    <template v-if="result">
      <p v-for="warning in result.warnings" :key="warning" class="text-sm text-slate-700">{{ warning }}</p>
      <p v-for="blocker in result.blockers" :key="blocker" class="rounded-xl bg-red-50 p-3 text-red-900">{{ blocker }}</p>
      <div class="grid gap-3 sm:grid-cols-3"><div v-for="(label, key) in labels" :key="key" class="rounded-xl bg-cyan-50 p-3"><p class="text-sm">{{ label }}</p><strong class="text-xl">{{ result.summary[key] }}</strong></div></div>
      <div class="flex flex-wrap gap-3"><input v-model="search" type="search" placeholder="Référence ou client…" aria-label="Rechercher un devis" class="min-w-0 flex-1 rounded-xl border border-cyan-200 p-3"><select v-model="filter" aria-label="Filtrer les contrôles devis" class="rounded-xl border border-cyan-200 p-3"><option value="">Tous</option><option v-for="(label, key) in labels" :key="key" :value="key">{{ label }}</option></select></div>
      <div class="max-h-[600px] overflow-auto rounded-xl border border-cyan-200"><table class="w-full text-left text-sm"><thead class="sticky top-0 bg-cyan-50"><tr><th class="p-3">Devis / client</th><th class="p-3">Dates / statut source</th><th class="p-3">Montants source</th><th class="p-3">Contrôles et lignes</th></tr></thead><tbody>
        <tr v-for="row in visible" :key="row.source_id" class="border-t border-cyan-100 align-top"><td class="min-w-40 p-3"><strong>{{ row.reference }}</strong><p>{{ row.client }}</p></td><td class="min-w-40 p-3"><p>{{ row.date || 'Date invalide' }}</p><p>Validité : {{ row.validity || 'À vérifier' }}</p><p>{{ row.source_status }}</p></td><td class="min-w-36 p-3"><p>HT : {{ row.totals.total_ht ?? 'Invalide' }}</p><p>TVA : {{ row.totals.total_tva ?? 'Invalide' }}</p><p>TTC : {{ row.totals.total_ttc ?? 'Invalide' }} {{ row.currency }}</p></td><td class="min-w-80 p-3"><strong>{{ labels[row.status] }}</strong><div class="max-h-48 overflow-auto"><p v-for="issue in row.issues" :key="issue" class="mt-1 text-red-800">{{ issue }}</p><p v-for="warning in row.warnings" :key="warning" class="mt-1 text-slate-700">{{ warning }}</p></div><details class="mt-3"><summary class="cursor-pointer font-semibold text-cyan-800">Voir les {{ row.lines.length }} ligne(s)</summary><div class="mt-2 max-h-80 space-y-2 overflow-auto"><div v-for="line in row.lines" :key="line.source_id" class="rounded-lg bg-cyan-50 p-3"><strong>{{ line.designation }}</strong><p>{{ line.product }}</p><p>Qté : {{ line.quantity }} · PU HT : {{ line.price }} · Remise : {{ line.discount }} % · TVA : {{ line.vat }} %</p><p>HT : {{ line.totals.total_ht }} · TVA : {{ line.totals.total_tva }} · TTC : {{ line.totals.total_ttc }}</p><p v-for="issue in line.issues" :key="issue" class="text-red-800">{{ issue }}</p></div></div><p class="mt-2">Somme des lignes HT / TVA / TTC : {{ row.line_totals.total_ht }} / {{ row.line_totals.total_tva }} / {{ row.line_totals.total_ttc }}</p></details></td></tr>
        <tr v-if="!visible.length"><td colspan="4" class="p-4 text-center">Aucun devis pour ce filtre.</td></tr>
      </tbody></table></div>
      <nav aria-label="Pages de l’aperçu devis" class="flex flex-wrap justify-between gap-3 text-sm"><span>{{ filtered.length }} devis · Page {{ page }} / {{ pages }}</span><div class="flex gap-3"><button type="button" :disabled="page <= 1" class="rounded-lg border p-2 disabled:opacity-40" @click="page--">Précédent</button><button type="button" :disabled="page >= pages" class="rounded-lg border p-2 disabled:opacity-40" @click="page++">Suivant</button></div></nav>
      <fieldset v-if="!outcome" :disabled="busy" class="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
        <h3 class="font-bold">Sélection et confirmation — devis de cette page</h3>
        <div v-for="row in visible.filter(r => r.status !== 'blocked')" :key="row.source_id" class="rounded-xl bg-white p-3">
          <label class="flex items-start gap-2 font-semibold"><input type="checkbox" :checked="!!selected[row.source_id]" @change="toggle(row)">{{ row.reference }} · {{ row.client }} · {{ row.totals.total_ttc }} {{ row.currency }}</label>
          <template v-if="selected[row.source_id]">
            <label class="mt-3 block text-sm">Statut Saytu (source : {{ row.source_status }})<select v-model="statuses[row.source_id]" class="mt-1 w-full rounded-lg border border-cyan-200 p-2"><option :value="undefined">À confirmer</option><option v-for="status in result.status_options?.[row.source_status_code] || []" :key="status" :value="status">{{ statusLabels[status] }}</option></select></label>
            <div class="mt-3 max-h-64 space-y-2 overflow-auto"><label v-for="line in row.lines" :key="line.source_id" class="flex flex-wrap items-center gap-3 text-sm"><span class="min-w-0 flex-1">{{ line.designation }} · {{ line.quantity }} · unité Dolibarr : {{ !line.source_unit || line.source_unit === '0' ? 'non précisée' : '#' + line.source_unit }}</span><input v-model="units[line.source_id]" :aria-label="`Unité pour la ligne ${line.source_id}`" maxlength="20" placeholder="Unité à confirmer" class="w-40 rounded-lg border border-cyan-200 p-2"></label></div>
          </template>
        </div>
        <p class="text-sm">{{ decisions.length }} devis / 50 maximum · {{ lineCount }} lignes / 1 000 maximum, toutes pages confondues. Rien n’est sélectionné par défaut.</p>
        <button type="button" class="text-sm underline" @click="selected = {}">Tout désélectionner</button>
        <label class="block text-sm font-semibold">Délai de paiement à appliquer à ce lot (jours)<input v-model="paymentDays" type="number" min="0" max="3650" step="1" placeholder="À confirmer" class="ml-2 w-36 rounded-lg border border-cyan-200 p-2"></label>
        <label class="flex items-start gap-2 text-sm"><input v-model="limitations" type="checkbox" class="mt-1">J’accepte cette reprise partielle : conditions de règlement, notes source, contacts, pièces jointes et liens vers les factures non repris. Aucun commercial n’est affecté. Les dates de décision ne sont pas inventées. Les descriptions sont reprises en texte brut.</label>
        <label class="flex items-start gap-2 text-sm"><input v-model="confirmed" type="checkbox" class="mt-1">Je confirme les montants, la devise, les statuts, les unités et le délai de paiement pour tous les devis sélectionnés.</label>
        <p v-if="!result.execution_available" class="text-sm text-red-800">Mise à jour du serveur nécessaire avant l’enregistrement.</p>
        <button type="button" :disabled="!canExecute" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white disabled:opacity-40" @click="execute">Importer les devis sélectionnés</button>
      </fieldset>
      <div v-else role="status" class="rounded-xl bg-cyan-50 p-4"><strong>Lot n° {{ outcome.run_id }} enregistré</strong><p>{{ outcome.created }} devis créé(s), {{ outcome.lines_created }} ligne(s), {{ outcome.already_processed }} déjà traité(s).</p><p class="text-sm">Aucun stock ni facture modifié. Actualisez l’aperçu avant le lot suivant.</p></div>
    </template>
    <section class="border-t border-cyan-200 pt-4"><div class="flex justify-between gap-3"><h3 class="font-bold">Historique des imports devis</h3><button type="button" class="text-sm underline" @click="loadRuns">Actualiser</button></div><p v-if="historyError" class="text-red-800">{{ historyError }}</p><p v-else-if="!runs.length" class="text-sm">Aucun lot enregistré.</p><div class="max-h-64 overflow-auto"><details v-for="run in runs" :key="run.id" class="mt-2 rounded-xl bg-cyan-50 p-3 text-sm"><summary>Lot {{ run.id }} · {{ run.created_at }} · {{ run.source_key }} — {{ run.result.created }} créé(s), {{ run.result.already_processed }} déjà traité(s)</summary><p v-for="item in run.result.items" :key="item.source_id">{{ item.reference }} · fiche #{{ item.devis_id }} · {{ item.action === 'created' ? statusLabels[item.status] : 'Déjà traité' }}</p></details></div></section>
  </section>
</template>
