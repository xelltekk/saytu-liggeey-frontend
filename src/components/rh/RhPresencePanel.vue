<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div><h3 class="font-bold text-slate-900">Pointage du jour</h3><p class="text-sm text-slate-500">{{ todayLabel }}</p></div>
        <div class="flex flex-wrap gap-2 text-sm"><span class="badge bg-blue-100 text-blue-800">Arrivée {{ heure(monPointage.arrivee_at) }}</span><span class="badge bg-orange-100 text-orange-800">Pause {{ heure(monPointage.pause_debut_at) }}</span><span class="badge bg-green-100 text-green-800">Reprise {{ heure(monPointage.pause_fin_at) }}</span><span class="badge bg-slate-100 text-slate-700">Départ {{ heure(monPointage.depart_at) }}</span></div>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button class="touch-action bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-500" :disabled="!!monPointage.arrivee_at" @click="pointer('arrivee')">Pointer l'arrivée</button>
        <button class="touch-action bg-orange-500 text-white disabled:bg-slate-200 disabled:text-slate-500" :disabled="!monPointage.arrivee_at || !!monPointage.pause_debut_at || !!monPointage.depart_at" @click="pointer('pause_debut')">Début de pause</button>
        <button class="touch-action bg-green-600 text-white disabled:bg-slate-200 disabled:text-slate-500" :disabled="!monPointage.pause_debut_at || !!monPointage.pause_fin_at || !!monPointage.depart_at" @click="pointer('pause_fin')">Reprendre</button>
        <button class="touch-action bg-slate-800 text-white disabled:bg-slate-200 disabled:text-slate-500" :disabled="!monPointage.arrivee_at || !!monPointage.depart_at || (!!monPointage.pause_debut_at && !monPointage.pause_fin_at)" @click="pointer('depart')">Pointer le départ</button>
      </div>
    </section>

    <section v-if="canManage" class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-2 md:flex-row md:items-end">
        <label class="text-sm text-slate-600">Vue mensuelle<input v-model="filters.mois" type="month" class="input mt-1" @change="loadListe" /></label>
        <label class="text-sm text-slate-600">Journée précise<input v-model="filters.date" type="date" class="input mt-1" @change="loadListe" /></label>
        <label class="text-sm text-slate-600">Employé<select v-model="filters.employe_id" class="input mt-1" @change="loadListe"><option value="">Tous les employés</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select></label>
        <button class="btn-secondary md:ml-auto" @click="resetFilters">Réinitialiser</button><button class="btn-primary" @click="openCorrection()">+ Ajouter manuellement</button>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <div v-for="card in cards" :key="card.label" class="rounded-lg border border-slate-200 bg-white p-3"><p class="text-xs uppercase text-slate-500">{{ card.label }}</p><strong class="mt-1 block text-xl text-slate-900">{{ card.value }}</strong></div>
    </div>

    <section class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full"><thead><tr><th>Date</th><th>Employé</th><th>Arrivée</th><th>Pause</th><th>Reprise</th><th>Départ</th><th>Temps</th><th>Retard</th><th>Statut</th><th v-if="canManage"></th></tr></thead>
        <tbody><tr v-for="p in presences" :key="p.id"><td>{{ date(p.date) }}</td><td>{{ nom(p.employe) }}</td><td>{{ heure(p.arrivee_at) }}</td><td>{{ heure(p.pause_debut_at) }}</td><td>{{ heure(p.pause_fin_at) }}</td><td>{{ heure(p.depart_at) }}</td><td>{{ duree(p.minutes_travaillees) }}</td><td :class="p.minutes_retard ? 'font-semibold text-red-600' : ''">{{ duree(p.minutes_retard) }}</td><td><span class="badge bg-slate-100 text-slate-700">{{ p.statut }}</span></td><td v-if="canManage"><button class="text-blue-700" @click="openCorrection(p)">Corriger</button></td></tr><tr v-if="!presences.length"><td :colspan="canManage ? 10 : 9" class="py-10 text-center text-sm text-slate-400">Aucun pointage sur cette période.</td></tr></tbody>
      </table>
    </section>

    <AppModal v-model="showCorrection" title="Corriger un pointage" size="md">
      <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="saveCorrection">
        <label class="label">Employé<select v-model.number="correction.employe_id" class="input" required><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select></label><label class="label">Date<input v-model="correction.date" type="date" class="input" required /></label>
        <label class="label">Arrivée<input v-model="correction.arrivee_at" type="datetime-local" class="input" /></label><label class="label">Début pause<input v-model="correction.pause_debut_at" type="datetime-local" class="input" /></label>
        <label class="label">Reprise<input v-model="correction.pause_fin_at" type="datetime-local" class="input" /></label><label class="label">Départ<input v-model="correction.depart_at" type="datetime-local" class="input" /></label>
        <label class="label sm:col-span-2">Note<textarea v-model="correction.note" rows="2" class="input"></textarea></label>
        <div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" @click="showCorrection = false">Annuler</button><button class="btn-primary">Enregistrer</button></div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useToast } from '@/composables/useToast'
const props = defineProps({ canManage: Boolean, employes: { type: Array, default: () => [] } }), toast = useToast()
const monPointage = reactive({}), presences = ref([]), stats = reactive({}), showCorrection = ref(false)
const filters = reactive({ mois: new Date().toISOString().slice(0, 7), date: '', employe_id: '' })
const correction = reactive({ id: null, employe_id: null, date: '', arrivee_at: '', pause_debut_at: '', pause_fin_at: '', depart_at: '', note: '' })
const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const cards = computed(() => [{ label: 'Pointages', value: stats.pointages || 0 }, { label: 'Journées terminées', value: stats.termines || 0 }, { label: 'En cours', value: stats.en_cours || 0 }, { label: 'Retards', value: stats.retards || 0 }, { label: 'Temps cumulé', value: duree(stats.minutes_travaillees) }])
function nom(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : 'Moi' } function date(v) { return v ? new Date(v).toLocaleDateString('fr-FR') : '-' } function heure(v) { return v ? new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-' } function duree(v) { const n = Number(v || 0); return `${Math.floor(n / 60)}h ${String(n % 60).padStart(2, '0')}` }
function inputDate(v) { return v ? new Date(v).toISOString().slice(0, 16) : '' }
async function loadMonPointage() { try { Object.assign(monPointage, (await api.get('/rh/presences/mon-pointage')).data) } catch (e) { if (e.response.status !== 422) toast.error('Impossible de charger votre pointage.') } }
async function loadListe() { const { data } = await api.get('/rh/presences', { params: { ...filters, date: filters.date || undefined, mois: filters.date ? undefined : filters.mois, employe_id: filters.employe_id || undefined } }); presences.value = data.presences; Object.assign(stats, data.stats) }
async function pointer(action) { try { Object.assign(monPointage, (await api.post('/rh/presences/pointer', { action })).data); toast.success('Pointage enregistré.'); await loadListe() } catch (e) { toast.error(e.response.data.message || 'Pointage impossible.') } }
function resetFilters() { Object.assign(filters, { mois: new Date().toISOString().slice(0, 7), date: '', employe_id: '' }); loadListe() }
function openCorrection(p = {}) { Object.assign(correction, { id: p.id || null, employe_id: p.employe_id || null, date: p.date.slice(0, 10) || new Date().toISOString().slice(0, 10), arrivee_at: inputDate(p.arrivee_at), pause_debut_at: inputDate(p.pause_debut_at), pause_fin_at: inputDate(p.pause_fin_at), depart_at: inputDate(p.depart_at), note: p.note || '' }); showCorrection.value = true }
async function saveCorrection() { try { const payload = Object.fromEntries(Object.entries(correction).filter(([k, v]) => k !== 'id' && v !== '')); correction.id ? await api.put(`/rh/presences/${correction.id}`, payload) : await api.post('/rh/presences', payload); toast.success('Pointage corrigé.'); showCorrection.value = false; await loadListe() } catch (e) { toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Correction impossible.') } }
onMounted(() => Promise.all([loadMonPointage(), loadListe()]))
</script>
<style scoped>
.touch-action{@apply min-h-20 rounded-lg px-4 py-3 text-base font-bold transition active:scale-95}.label{@apply space-y-1 text-sm font-medium text-slate-700}th{@apply whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs uppercase text-slate-500}td{@apply whitespace-nowrap border-t border-slate-100 px-3 py-3 text-sm text-slate-700}
</style>
