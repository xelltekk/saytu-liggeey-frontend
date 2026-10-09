<script setup>
import { computed, ref, watch } from 'vue'
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
const labels = { ready: 'Sans conflit détecté', review: 'À confirmer', blocked: 'À corriger' }
watch(busy, value => emit('busy', value))
watch([sourceKey, currency, file], () => { result.value = null })
watch([search, filter], () => { page.value = 1 })
const filtered = computed(() => (result.value?.rows || []).filter(r => (!filter.value || r.status === filter.value) && `${r.reference} ${r.client}`.toLowerCase().includes(search.value.trim().toLowerCase())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 20)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20))
async function preview() {
  error.value = ''; result.value = null
  if (!file.value || !/\.sql(?:\.gz)?$/i.test(file.value.name)) { error.value = 'Sélectionnez la base SQL déjà analysée.'; return }
  if (file.value.size > Math.min(props.limits.database, props.limits.total)) { error.value = 'Le fichier dépasse la limite serveur.'; return }
  const data = new FormData()
  data.append('database', file.value); data.append('source_key', sourceKey.value); data.append('currency', currency.value)
  busy.value = true
  try { result.value = (await api.post(`/data-imports/${props.report.id}/quotes/preview`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data; page.value = 1 }
  catch (e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Impossible de charger l’aperçu des devis.' }
  finally { busy.value = false }
}
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-cyan-200 bg-white p-5 text-slate-900">
    <h2 class="text-lg font-bold">Devis — Contrôle avant transfert</h2>
    <p class="rounded-xl bg-cyan-50 p-4 text-sm">Aperçu en lecture seule. Aucun devis ni ligne ne sera enregistré. Aucun stock réservé, facture créée ou email envoyé.</p>
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
      <p class="text-sm">L’enregistrement des devis sera une étape distincte, après validation des statuts, correspondances et écarts de calcul.</p>
    </template>
  </section>
</template>
