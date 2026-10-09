<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/services/api'

const props = defineProps({ report: { type: Object, required: true }, limits: { type: Object, required: true } })
const file = ref(null)
const busy = ref(false)
const error = ref('')
const result = ref(null)
const mapping = ref({ nom: 'nom', code: 'code_client', email: 'email', telephone: 'phone', adresse: 'address', code_postal: 'zip', ville: 'town' })
const labels = { nom: 'Nom', code: 'Code', email: 'Email', telephone: 'Téléphone', adresse: 'Adresse', code_postal: 'Code postal', ville: 'Ville' }
const columns = ['nom', 'name_alias', 'code_client', 'code_fournisseur', 'ref_ext', 'email', 'phone', 'fax', 'address', 'zip', 'town']
const statusLabels = { new: 'Sans correspondance détectée', existing: 'Correspondance Saytu', source_duplicate: 'Doublon dans la sauvegarde', invalid: 'À corriger' }
const typeLabels = { client: 'Client', fournisseur: 'Fournisseur', client_fournisseur: 'Client et fournisseur', prospect: 'Prospect' }
const filter = ref('')
const query = ref('')
const page = ref(1)
const filtered = computed(() => (result.value?.rows || []).filter(row => (!filter.value || row.status === filter.value) && `${row.source_id} ${row.data.nom} ${row.data.code} ${row.data.email} ${row.data.telephone}`.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 25)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 25, page.value * 25))
watch([filter, query], () => { page.value = 1 })
watch(mapping, () => { result.value = null }, { deep: true })

async function check() {
  error.value = ''
  result.value = null
  if (!file.value) { error.value = 'Sélectionnez à nouveau la base utilisée pour cette analyse.'; return }
  if (file.value.size > props.limits.database || file.value.size > props.limits.total) { error.value = 'Le fichier dépasse la limite du serveur.'; return }
  busy.value = true
  const data = new FormData()
  data.append('database', file.value)
  Object.entries(mapping.value).forEach(([key, value]) => data.append(`mapping[${key}]`, value))
  try {
    result.value = (await api.post(`/data-imports/${props.report.id}/preview`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    page.value = 1
  } catch (e) {
    error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Impossible de préparer l’aperçu. Réessayez.'
  } finally { busy.value = false }
}
</script>

<template>
  <section class="rounded-2xl border border-cyan-200 bg-white p-5">
    <h2 class="text-lg font-bold text-slate-900">2. Correspondances et doublons — Clients / Fournisseurs</h2>
    <p class="mt-2 text-sm text-slate-700">Vérifiez les champs et les fiches avant le transfert. Cette simulation ne crée ni ne modifie aucun tiers. L’aperçu n’est pas conservé après avoir quitté cette page.</p>
    <p v-if="!report.database_sha256" class="mt-4 rounded-xl bg-cyan-50 p-4 text-slate-800">Cette ancienne analyse ne permet pas de vérifier le fichier. Retournez à la liste et lancez une nouvelle analyse.</p>
    <form v-else class="mt-4 space-y-4" @submit.prevent="check">
      <fieldset :disabled="busy" class="space-y-4">
        <label class="block text-sm font-semibold text-slate-900">Sauvegarde SQL déjà analysée
          <input type="file" accept=".sql,.gz" required class="mt-2 block w-full rounded-xl border border-cyan-200 p-3" @change="file = $event.target.files[0] || null; result = null">
        </label>
        <p class="text-sm text-slate-600">Le contenu doit correspondre exactement à l’analyse. Les archives précédentes n’ont pas été conservées.</p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label v-for="(label, key) in labels" :key="key" class="text-sm font-semibold text-slate-800">{{ label }} dans Saytu
            <select v-model="mapping[key]" class="mt-1 w-full rounded-xl border border-cyan-200 bg-cyan-50 p-2">
              <option v-if="key !== 'nom'" value="">Ne pas reprendre ce champ</option>
              <option v-for="column in columns" :key="column" :value="column">{{ column }} (Dolibarr)</option>
            </select>
          </label>
        </div>
        <p class="text-xs text-slate-600">Le type vient des indicateurs client / fournisseur et le statut du champ status. Sans code retenu, le code fournisseur puis DOL-identifiant seront proposés. Aucun pays ou identifiant fiscal n’est deviné.</p>
        <button type="submit" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{{ busy ? 'Comparaison en cours…' : 'Prévisualiser et rechercher les doublons' }}</button>
      </fieldset>
    </form>
    <p v-if="busy" role="status" class="mt-3 text-cyan-900">Lecture des tiers et comparaison avec la société active…</p>
    <p v-if="error" role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{{ error }}</p>
    <template v-if="result">
      <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div v-for="(label, key) in statusLabels" :key="key" class="rounded-xl bg-cyan-50 p-3"><p class="text-sm text-slate-700">{{ label }}</p><strong class="text-xl text-slate-900">{{ result.summary[key] }}</strong></div></div>
      <p v-for="warning in result.warnings" :key="warning" class="mt-3 text-sm text-slate-700">{{ warning }}</p>
      <p v-for="blocker in result.blockers" :key="blocker" class="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">{{ blocker }}</p>
      <div class="my-4 flex flex-wrap gap-3">
        <input v-model="query" type="search" aria-label="Rechercher dans l’aperçu" placeholder="Nom, code, email, téléphone…" class="min-w-0 flex-1 rounded-xl border border-cyan-200 p-3">
        <select v-model="filter" aria-label="Filtrer le résultat du contrôle" class="max-w-full rounded-xl border border-cyan-200 p-3"><option value="">Tous les résultats</option><option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option></select>
      </div>
      <div class="max-h-[540px] overflow-auto rounded-xl border border-cyan-200">
        <table class="w-full text-left text-sm"><thead class="sticky top-0 bg-cyan-50"><tr><th class="p-3">Tiers proposé</th><th class="p-3">Coordonnées</th><th class="p-3">Contrôles et correspondances</th></tr></thead>
          <tbody><tr v-for="row in visible" :key="row.line" class="border-t border-cyan-100 align-top">
            <td class="min-w-48 p-3"><strong>{{ row.data.nom || 'Nom absent' }}</strong><p>{{ row.data.code }}</p><p>{{ typeLabels[row.data.type] }} · {{ row.data.statut }}</p><p class="text-xs">Dolibarr #{{ row.source_id }} · Ligne {{ row.line }}</p></td>
            <td class="max-w-xs break-words p-3"><p>{{ row.data.email || 'Email non renseigné' }}</p><p>{{ row.data.telephone || 'Téléphone non renseigné' }}</p><p>{{ row.data.adresse }}</p><p>{{ row.data.code_postal }} {{ row.data.ville }}</p></td>
            <td class="min-w-64 p-3"><strong>{{ statusLabels[row.status] }}</strong>
              <p v-for="issue in row.issues" :key="issue" class="mt-1 text-red-800">{{ issue }}</p>
              <p v-for="duplicate in row.source_duplicates" :key="duplicate.line" class="mt-1">Doublon possible : ligne {{ duplicate.line }} (Dolibarr #{{ duplicate.source_id }}).</p>
              <div v-for="candidate in row.matches" :key="candidate.id" class="mt-2 rounded-lg bg-cyan-50 p-2"><p class="font-semibold">{{ candidate.nom }} · {{ candidate.code }} <span v-if="candidate.deleted">(dans la corbeille)</span></p><p>{{ candidate.reasons.join(' · ') }}</p><p v-if="candidate.different_fields.length" class="text-xs">Champs différents : {{ candidate.different_fields.join(', ') }}</p></div>
              <p v-if="row.more_matches" class="mt-1 text-xs">D’autres correspondances existent. Seules les premières sont affichées.</p>
            </td>
          </tr><tr v-if="!visible.length"><td colspan="3" class="p-5 text-center">Aucune fiche pour ce filtre.</td></tr></tbody>
        </table>
      </div>
      <nav aria-label="Pagination de l’aperçu" class="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><span>{{ filtered.length }} fiche(s) · Page {{ page }} / {{ pages }}</span><div class="flex gap-3"><button type="button" :disabled="page <= 1" class="rounded-lg border border-cyan-200 p-2 disabled:opacity-40" @click="page--">Précédent</button><button type="button" :disabled="page >= pages" class="rounded-lg border border-cyan-200 p-2 disabled:opacity-40" @click="page++">Suivant</button></div></nav>
      <p class="mt-4 font-semibold text-cyan-900">Contrôle terminé : {{ result.total }} fiche(s) examinée(s), aucune donnée importée.</p>
    </template>
  </section>
</template>
