<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-end">
        <label class="label">Du<input v-model="filters.date_from" type="date" class="input" /></label>
        <label class="label">Au<input v-model="filters.date_to" type="date" class="input" /></label>
        <button class="btn-secondary" @click="load">Actualiser</button>
        <button class="btn-primary md:ml-auto" @click="downloadPdf">Télécharger l’état PDF</button>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div v-for="card in cards" :key="card.label" class="rounded-lg border border-slate-200 bg-white p-4"><p class="text-xs uppercase text-slate-500">{{ card.label }}</p><strong class="mt-1 block text-xl text-slate-900">{{ card.value }}</strong></div>
    </div>

    <div class="grid gap-4 xl:grid-cols-[360px_1fr]">
      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h3 class="font-bold text-slate-900">Effectifs par service</h3>
        <div class="mt-4 space-y-3"><div v-for="d in data.repartition_departements" :key="d.id"><div class="mb-1 flex justify-between text-sm"><span>{{ d.libelle }}</span><strong>{{ d.employes_count }}</strong></div><div class="h-2 overflow-hidden rounded bg-slate-100"><div class="h-full rounded bg-blue-600" :style="{ width: serviceWidth(d.employes_count) }"></div></div></div><p v-if="!data.repartition_departements.length" class="text-sm text-slate-400">Aucun service configuré.</p></div>
      </section>
      <section class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="w-full"><thead><tr><th>Employé</th><th>Service</th><th>Pointages</th><th>Temps travaillé</th><th>Retards</th><th>Durée retards</th><th>Congés</th></tr></thead><tbody><tr v-for="l in data.lignes" :key="l.employe?.id || l.id"><td><strong>{{ nom(l.employe) }}</strong><p class="text-xs text-slate-500">{{ l.employe?.matricule || '-' }}</p></td><td>{{ l.employe?.departement?.libelle || '-' }}</td><td>{{ l.jours_pointes }}</td><td>{{ duree(l.minutes_travaillees) }}</td><td :class="l.retards ? 'font-semibold text-red-600' : ''">{{ l.retards }}</td><td>{{ duree(l.minutes_retard) }}</td><td>{{ l.jours_conges }}</td></tr><tr v-if="!data.lignes.length"><td colspan="7" class="py-10 text-center text-sm text-slate-400">Aucun employé actif.</td></tr></tbody></table>
      </section>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
const toast = useToast(), today = new Date(), first = new Date(today.getFullYear(), today.getMonth(), 1)
const filters = reactive({ date_from: first.toISOString().slice(0, 10), date_to: today.toISOString().slice(0, 10) })
const data = reactive({ stats: {}, repartition_departements: [], lignes: [] })
const cards = computed(() => [{ label: 'Employés actifs', value: data.stats.employes_actifs || 0 }, { label: 'Jours pointés', value: data.stats.jours_pointes || 0 }, { label: 'Retards', value: data.stats.retards || 0 }, { label: 'Temps cumulé', value: duree(data.stats.minutes_travaillees) }, { label: 'Congés approuvés', value: data.stats.conges_approuves || 0 }, { label: 'Parcours ouverts', value: data.stats.processus_en_cours || 0 }, { label: 'Formations ouvertes', value: data.stats.formations_ouvertes || 0 }, { label: 'Inscriptions', value: data.stats.inscriptions_formations || 0 }])
function nom(e) { return `${e.prenom || ''} ${e.nom || ''}`.trim() } function duree(v) { const n = Number(v || 0); return `${Math.floor(n / 60)}h ${String(n % 60).padStart(2, '0')}` } function serviceWidth(n) { return `${Math.min(100, Number(n || 0) * 100 / Math.max(1, data.stats.employes_actifs || 1))}%` }
async function load() { try { Object.assign(data, (await api.get('/rh/rapports/synthese', { params: filters })).data) } catch (e) { toast.error(e.response.data.message || 'Impossible de charger le rapport RH.') } }
async function downloadPdf() { try { const r = await api.get('/rh/rapports/synthese.pdf', { params: filters, responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = `Etat-RH-${filters.date_from}-${filters.date_to}.pdf`; a.click(); URL.revokeObjectURL(a.href) } catch { toast.error('Impossible de générer le PDF.') } }
onMounted(load)
</script>
<style scoped>.label{@apply space-y-1 text-sm font-medium text-slate-700}th{@apply whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs uppercase text-slate-500}td{@apply whitespace-nowrap border-t border-slate-100 px-3 py-3 text-sm text-slate-700}</style>
