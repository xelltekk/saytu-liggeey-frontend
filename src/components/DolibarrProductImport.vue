<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/services/api'
const props = defineProps({ report: { type: Object, required: true }, limits: { type: Object, required: true } })
const emit = defineEmits(['busy'])
const file = ref(null)
const busy = ref(false)
const result = ref(null)
const outcome = ref(null)
const error = ref('')
const runs = ref([])
const historyError = ref('')
const mapping = ref({ reference: 'ref', libelle: 'label', description: 'description', code_barre: 'barcode', product_unit: 'pièce', service_unit: 'service' })
const choices = ref({})
const acknowledgements = ref({})
const sourceKey = ref('dolibarr-principal')
const confirmed = ref(false)
const requestId = ref(null)
const search = ref('')
const filter = ref('')
const page = ref(1)
const labels = { new: 'Sans correspondance', existing: 'Correspondance Saytu', source_duplicate: 'Doublon source', invalid: 'À corriger' }
const fieldLabels = { reference: 'Référence', libelle: 'Libellé', code_barre: 'Code-barres', description: 'Description' }
const filtered = computed(() => (result.value?.rows || []).filter(row => (!filter.value || row.status === filter.value) && `${row.data.reference} ${row.data.libelle} ${row.data.code_barre || ''}`.toLowerCase().includes(search.value.trim().toLowerCase())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 25)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 25, page.value * 25))
const decisions = computed(() => Object.entries(choices.value).filter(([, value]) => !!value).map(([line, value]) => ({ line: Number(line), action: value === 'create' ? 'create' : 'link', produit_id: value.startsWith('link:') ? Number(value.split(':')[1]) : null, acknowledge_duplicate: !!acknowledgements.value[line] })))
watch(busy, value => emit('busy', value))
watch([search, filter], () => { page.value = 1 })
watch([choices, acknowledgements, sourceKey], () => { confirmed.value = false; requestId.value = null }, { deep: true })
watch(mapping, reset, { deep: true })
function reset() { result.value = null; outcome.value = null; choices.value = {}; confirmed.value = false; requestId.value = null }
function errorMessage(e) { return Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Réponse interrompue. Consultez l’historique avant de réessayer.' }
function formData() {
  const data = new FormData()
  data.append('database', file.value)
  Object.entries(mapping.value).forEach(([key, value]) => data.append(`mapping[${key}]`, value))
  return data
}
async function loadRuns() {
  historyError.value = ''
  try { runs.value = (await api.get(`/data-imports/${props.report.id}/products/runs`)).data.runs }
  catch { historyError.value = 'Impossible de charger l’historique.' }
}
async function preview() {
  reset(); error.value = ''
  if (!file.value || !/\.sql(?:\.gz)?$/i.test(file.value.name)) { error.value = 'Sélectionnez la base .sql ou .sql.gz de cette analyse.'; return }
  if (file.value.size > Math.min(props.limits.database, props.limits.total)) { error.value = 'Le fichier dépasse la limite du serveur.'; return }
  busy.value = true
  try { result.value = (await api.post(`/data-imports/${props.report.id}/products/preview`, formData(), { headers: { 'Content-Type': 'multipart/form-data' } })).data; page.value = 1 }
  catch (e) { error.value = errorMessage(e) }
  finally { busy.value = false }
}
function selectNew() { choices.value = Object.fromEntries((result.value?.rows || []).filter(row => row.status === 'new').slice(0, 200).map(row => [row.line, 'create'])) }
async function execute() {
  error.value = ''
  if (!result.value || !confirmed.value || !decisions.value.length || decisions.value.length > 200) return
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(sourceKey.value)) { error.value = 'Nom de source : 3 à 64 lettres minuscules, chiffres, tirets ou soulignements.'; return }
  busy.value = true
  requestId.value ||= crypto.randomUUID()
  const data = formData()
  data.append('preview_token', result.value.preview_token)
  data.append('request_id', requestId.value)
  data.append('source_key', sourceKey.value)
  data.append('confirmed', '1')
  decisions.value.forEach((decision, i) => Object.entries(decision).forEach(([key, value]) => { if (value !== null) data.append(`decisions[${i}][${key}]`, typeof value === 'boolean' ? (value ? '1' : '0') : String(value)) }))
  try { outcome.value = (await api.post(`/data-imports/${props.report.id}/products/execute`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data }
  catch (e) { error.value = errorMessage(e) }
  finally { await loadRuns(); busy.value = false }
}
onMounted(loadRuns)
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-cyan-200 bg-white p-5">
    <h2 class="text-lg font-bold text-slate-900">Catalogue — Produits et services</h2>
    <p class="text-sm text-slate-700">Importez les fiches et leurs prix. Les services restent sans stock. Aucun stock initial, mouvement, paiement ou document de vente n’est créé.</p>
    <p v-if="!report.database_sha256" class="rounded-xl bg-cyan-50 p-4">Relancez l’analyse pour vérifier l’empreinte de cette sauvegarde.</p>
    <form v-else @submit.prevent="preview"><fieldset :disabled="busy" class="space-y-4">
      <label class="block text-sm font-semibold">Base SQL déjà analysée<input type="file" accept=".sql,.gz" required class="mt-2 w-full rounded-xl border border-cyan-200 p-3" @change="file = $event.target.files[0] || null; reset()"></label>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label v-for="(label, key) in fieldLabels" :key="key" class="text-sm font-semibold">{{ label }} dans Saytu<select v-model="mapping[key]" class="mt-1 w-full rounded-lg border border-cyan-200 p-2"><option v-if="['description', 'code_barre'].includes(key)" value="">Ne pas reprendre</option><option v-for="field in ['ref', 'label', 'barcode', 'description']" :key="field" :value="field">{{ field }} (Dolibarr)</option></select></label></div>
      <div class="grid gap-3 sm:grid-cols-2"><label class="text-sm font-semibold">Unité des produits du lot<input v-model="mapping.product_unit" maxlength="20" required class="mt-1 w-full rounded-lg border border-cyan-200 p-2"></label><label class="text-sm font-semibold">Unité des services du lot<input v-model="mapping.service_unit" maxlength="20" required class="mt-1 w-full rounded-lg border border-cyan-200 p-2"></label></div>
      <p class="text-xs text-slate-700">Vérifiez les unités proposées. Faites des lots séparés si les articles utilisent des unités différentes. Prix HT → price ; achat HT → cost_price ; TVA → tva_tx.</p>
      <button type="submit" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white">Prévisualiser le catalogue</button>
    </fieldset></form>
    <p v-if="busy" role="status" class="text-cyan-900">Traitement en cours…</p><p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{{ error }}</p>
    <template v-if="result">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div v-for="(label, key) in labels" :key="key" class="rounded-xl bg-cyan-50 p-3"><p class="text-sm">{{ label }}</p><strong class="text-xl">{{ result.summary[key] }}</strong></div></div>
      <p v-for="warning in result.warnings" :key="warning" class="text-sm text-slate-700">{{ warning }}</p>
      <p v-for="blocker in result.blockers" :key="blocker" class="rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">{{ blocker }}</p>
      <div class="flex flex-wrap gap-3"><input v-model="search" type="search" placeholder="Référence, libellé, code-barres…" aria-label="Rechercher un article dans l’aperçu" class="min-w-0 flex-1 rounded-xl border border-cyan-200 p-3"><select v-model="filter" aria-label="Filtrer les contrôles catalogue" class="rounded-xl border border-cyan-200 p-3"><option value="">Tous les résultats</option><option v-for="(label, key) in labels" :key="key" :value="key">{{ label }}</option></select></div>
      <div class="max-h-[540px] overflow-auto rounded-xl border border-cyan-200"><table class="w-full text-left text-sm"><thead class="sticky top-0 bg-cyan-50"><tr><th class="p-3">Article</th><th class="p-3">Prix et gestion</th><th class="p-3">Contrôles</th><th class="p-3">Décision</th></tr></thead><tbody>
        <tr v-for="row in visible" :key="row.line" class="border-t border-cyan-100 align-top">
          <td class="min-w-48 p-3"><strong>{{ row.data.libelle }}</strong><p>{{ row.data.reference }}</p><p>{{ row.data.code_barre || 'Sans code-barres' }}</p><details v-if="row.data.description" class="mt-2 max-w-xs"><summary>Description</summary><p class="whitespace-pre-wrap break-words">{{ row.data.description }}</p></details></td>
          <td class="min-w-44 p-3"><p>Vente HT : {{ row.data.prix_vente_ht }}</p><p>Achat HT : {{ row.data.prix_achat_ht }}</p><p>TVA : {{ row.data.taux_tva }} %</p><p>{{ row.data.type === 'service' ? 'Service · sans stock' : 'Produit · stock à reprendre séparément' }}</p><p>Unité : {{ row.data.unite }}</p><p>{{ row.data.is_active ? 'Actif' : 'Inactif' }}</p></td>
          <td class="min-w-64 p-3"><strong>{{ labels[row.status] }}</strong><p v-for="issue in row.issues" :key="issue" class="mt-1 text-red-800">{{ issue }}</p><p v-for="warning in row.warnings" :key="warning" class="mt-1 text-slate-700">{{ warning }}</p><p v-for="duplicate in row.source_duplicates" :key="duplicate.line" class="mt-1">Doublon possible : ligne {{ duplicate.line }}.</p><div v-for="candidate in row.matches" :key="candidate.id" class="mt-2 rounded-lg bg-cyan-50 p-2"><p>{{ candidate.reference }} · {{ candidate.libelle }}</p><p>{{ candidate.reasons.join(' · ') }}</p><p v-if="candidate.deleted">Dans la corbeille</p><p v-if="!candidate.compatible" class="text-red-800">Type ou gestion de stock incompatible</p></div><p v-if="row.more_matches">D’autres correspondances existent.</p></td>
          <td class="min-w-48 p-3"><select v-model="choices[row.line]" :disabled="busy || !!outcome || !!row.issues.length" :aria-label="`Décision pour ${row.data.reference}`" class="w-full rounded-lg border border-cyan-200 p-2"><option :value="undefined">Ignorer</option><option v-if="!row.matches.length" value="create">Créer la fiche</option><option v-for="candidate in row.matches.filter(c => !c.deleted && c.compatible)" :key="candidate.id" :value="`link:${candidate.id}`">Rattacher à {{ candidate.reference }}</option></select><label v-if="choices[row.line] === 'create' && row.source_duplicates.length" class="mt-2 flex gap-2 text-xs"><input v-model="acknowledgements[row.line]" type="checkbox" :disabled="busy || !!outcome">Je garde cette fiche parmi les doublons source.</label></td>
        </tr><tr v-if="!visible.length"><td colspan="4" class="p-4 text-center">Aucun article pour ce filtre.</td></tr>
      </tbody></table></div>
      <nav aria-label="Pages de l’aperçu catalogue" class="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{{ filtered.length }} fiche(s) · Page {{ page }} / {{ pages }}</span><div class="flex gap-3"><button type="button" :disabled="page <= 1" class="rounded-lg border p-2 disabled:opacity-40" @click="page--">Précédent</button><button type="button" :disabled="page >= pages" class="rounded-lg border p-2 disabled:opacity-40" @click="page++">Suivant</button></div></nav>
      <section v-if="!outcome" class="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4"><h3 class="font-bold">Confirmer le lot catalogue</h3><p class="text-sm">{{ decisions.length }} fiche(s) sélectionnée(s), toutes pages confondues. Un rattachement conserve les prix et les informations Saytu existants.</p><p v-if="!result.execution_available" class="text-red-800">Mise à jour du serveur nécessaire avant l’import.</p><fieldset :disabled="busy" class="space-y-3"><div class="flex flex-wrap gap-3"><button type="button" class="rounded-lg border bg-white p-2 text-sm" @click="selectNew">Sélectionner les nouvelles fiches (200 max.)</button><button type="button" class="rounded-lg border bg-white p-2 text-sm" @click="choices = {}">Tout ignorer</button></div><label class="block text-sm font-semibold">Même nom de source que pour vos clients<input v-model="sourceKey" maxlength="64" class="mt-1 w-full rounded-lg border border-cyan-200 p-2"></label><label class="flex items-start gap-2 text-sm"><input v-model="confirmed" type="checkbox" class="mt-1">Je confirme les prix, unités et fiches sélectionnés. Les quantités de stock ne seront pas importées.</label><button type="button" :disabled="busy || !confirmed || !decisions.length || decisions.length > 200 || !result.execution_available || !!result.blockers.length" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white disabled:opacity-40" @click="execute">Importer la sélection</button></fieldset></section>
      <div v-else role="status" class="rounded-xl border border-cyan-300 bg-cyan-50 p-4"><strong>Lot n° {{ outcome.run_id }} enregistré</strong><p>{{ outcome.created }} créée(s) · {{ outcome.linked }} rattachée(s) · {{ outcome.already_processed }} déjà traitée(s) · {{ outcome.ignored }} ignorée(s).</p><p class="mt-2 text-sm">Aucun stock modifié. Relancez l’aperçu pour le lot suivant.</p></div>
    </template>
    <section class="border-t border-cyan-200 pt-4"><div class="flex flex-wrap justify-between gap-3"><h3 class="font-bold">Historique des lots catalogue</h3><button type="button" class="text-cyan-800 underline" @click="loadRuns">Actualiser</button></div><p v-if="historyError" class="text-red-800">{{ historyError }}</p><p v-else-if="!runs.length" class="mt-2 text-sm">Aucun lot catalogue enregistré.</p><div class="max-h-64 overflow-auto"><p v-for="run in runs" :key="run.id" class="mt-2 rounded-lg bg-cyan-50 p-3 text-sm">Lot {{ run.id }} · {{ run.created_at }} · {{ run.source_key }} — {{ run.result.created }} créée(s), {{ run.result.linked }} rattachée(s), {{ run.result.already_processed }} déjà traitée(s).</p></div></section>
  </section>
</template>
