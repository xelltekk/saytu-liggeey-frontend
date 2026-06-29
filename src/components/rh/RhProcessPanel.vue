<template>
  <div class="space-y-4">
    <form v-if="canManage" class="panel" @submit.prevent="createProcess">
      <div class="flex flex-col gap-1">
        <h3 class="title">Demarrer un parcours employe</h3>
        <p class="text-sm text-slate-500">Checklist d'integration ou de depart avec taches automatiques et suivi de progression.</p>
      </div>
      <div class="mt-3 grid gap-2 md:grid-cols-5">
        <select v-model.number="form.employe_id" class="input" required><option :value="null">Employe</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
        <select v-model="form.type" class="input"><option value="integration">Integration</option><option value="depart">Depart</option></select>
        <input v-model="form.date_effet" type="date" class="input" required />
        <input v-model="form.note" class="input" placeholder="Note" />
        <button class="btn-primary">Creer la checklist</button>
      </div>
    </form>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <button v-for="card in processCards" :key="card.key" type="button" class="panel p-3 text-left transition hover:border-blue-300 hover:bg-blue-50" @click="applyProcessFilter(card.key)">
        <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
        <strong class="mt-1 block text-2xl" :class="card.color">{{ card.value }}</strong>
      </button>
    </div>

    <section class="panel">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap gap-2"><button v-for="f in filtres" :key="f.value" class="rounded-md px-3 py-2 text-sm" :class="typeFiltre === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'" @click="typeFiltre = f.value; load()">{{ f.label }}</button></div>
        <div class="flex flex-wrap gap-2"><select v-model="statutFiltre" class="input" @change="load"><option value="">Tous statuts</option><option value="a_faire">A faire</option><option value="en_cours">En cours</option><option value="termine">Termine</option><option value="annule">Annule</option></select><input v-model="search" class="input lg:w-80" placeholder="Rechercher employe, service, tache..." /></div>
      </div>
    </section>

    <div class="space-y-3">
      <article v-for="p in filteredProcessus" :key="p.id" class="panel">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2"><h3 class="font-bold text-slate-900">{{ nom(p.employe) }}</h3><span class="badge" :class="p.type === 'integration' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'">{{ typeLabel(p.type) }}</span><span class="badge" :class="statusClass(p.statut)">{{ statusLabel(p.statut) }}</span></div>
            <p class="mt-1 text-sm text-slate-500">{{ p.employe?.departement?.libelle || 'Sans service' }} - Date effet : {{ date(p.date_effet) }}</p>
            <p v-if="p.note" class="mt-1 text-xs text-slate-500">{{ p.note }}</p>
          </div>
          <div class="text-right"><strong class="text-sm text-slate-700">{{ terminees(p) }} / {{ p.taches.length }} taches</strong><p class="text-xs text-slate-500">{{ progression(p) }}%</p></div>
        </div>
        <div class="my-3 h-3 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full" :class="progressClass(p)" :style="{ width: progression(p) + '%' }"></div></div>
        <div v-if="canManage" class="mb-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
          <select v-model="p.statut" class="input" @change="updateProcess(p)"><option value="a_faire">A faire</option><option value="en_cours">En cours</option><option value="termine">Termine</option><option value="annule">Annule</option></select>
          <input v-model="p.note" class="input" placeholder="Note parcours" @change="updateProcess(p)" />
          <button class="btn-secondary" @click="updateProcess(p)">Mettre a jour</button>
        </div>
        <div class="grid gap-2 lg:grid-cols-2">
          <label v-for="t in p.taches" :key="t.id" class="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm" :class="t.est_terminee ? 'bg-green-50 text-green-800' : 'text-slate-700'">
            <input type="checkbox" :checked="t.est_terminee" :disabled="!canManage" @change="toggle(t)" /><span class="flex-1">{{ t.libelle }}</span><small class="text-slate-500">{{ categoryLabel(t.categorie) }}</small><button v-if="canManage" type="button" class="text-red-700" @click.prevent="deleteTask(t)">Suppr.</button>
          </label>
        </div>
        <form v-if="canManage" class="mt-3 grid gap-2 sm:grid-cols-[180px_1fr_160px]" @submit.prevent="addTask(p)"><select v-model="newTaskCategories[p.id]" class="input"><option value="administratif">Administratif</option><option value="documents">Documents</option><option value="materiel">Materiel</option><option value="acces">Acces</option><option value="autre">Autre</option></select><input v-model="newTasks[p.id]" class="input" placeholder="Ajouter une tache specifique..." required /><button class="btn-secondary">+ Ajouter</button></form>
      </article>
      <p v-if="!filteredProcessus.length" class="panel empty">Aucun parcours employe pour ce filtre.</p>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
const props = defineProps({ canManage: Boolean, employes: { type: Array, default: () => [] } })
const toast = useToast(), processus = ref([]), typeFiltre = ref(''), statutFiltre = ref(''), search = ref(''), newTasks = reactive({}), newTaskCategories = reactive({})
const filtres = [{ label: 'Tous', value: '' }, { label: 'Integrations', value: 'integration' }, { label: 'Departs', value: 'depart' }]
const form = reactive({ employe_id: null, type: 'integration', date_effet: new Date().toISOString().slice(0, 10), note: '' })
const processCards = computed(() => [
  { key: 'total', label: 'Parcours', value: processus.value.length, color: 'text-slate-900' },
  { key: 'integration', label: 'Integrations', value: processus.value.filter(p => p.type === 'integration').length, color: 'text-blue-700' },
  { key: 'depart', label: 'Departs', value: processus.value.filter(p => p.type === 'depart').length, color: 'text-orange-700' },
  { key: 'termine', label: 'Termines', value: processus.value.filter(p => p.statut === 'termine').length, color: 'text-green-700' },
])
const filteredProcessus = computed(() => { const term = search.value.trim().toLowerCase(); return processus.value.filter(p => !term || [p.employe?.prenom, p.employe?.nom, p.employe?.departement?.libelle, p.note, ...(p.taches || []).map(t => t.libelle)].some(v => String(v || '').toLowerCase().includes(term))) })
function nom(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : '-' } function date(v) { return v ? new Date(v).toLocaleDateString('fr-FR') : '-' } function terminees(p) { return p.taches.filter(t => t.est_terminee).length } function progression(p) { return p.taches.length ? Math.round(terminees(p) * 100 / p.taches.length) : 0 }
function typeLabel(v) { return v === 'integration' ? 'Integration' : 'Depart' } function statusLabel(v) { return { a_faire: 'A faire', en_cours: 'En cours', termine: 'Termine', annule: 'Annule' }[v] || v }
function statusClass(v) { return { a_faire: 'bg-slate-100 text-slate-700', en_cours: 'bg-blue-100 text-blue-700', termine: 'bg-green-100 text-green-700', annule: 'bg-red-100 text-red-700' }[v] || 'bg-slate-100 text-slate-700' }
function progressClass(p) { if (p.statut === 'termine' || progression(p) >= 100) return 'bg-green-600'; if (p.statut === 'annule') return 'bg-red-500'; return 'bg-blue-600' }
function categoryLabel(v) { return { administratif: 'Administratif', documents: 'Documents', materiel: 'Materiel', acces: 'Acces', autre: 'Autre' }[v] || v }
function applyProcessFilter(key) { if (key === 'total') { typeFiltre.value = ''; statutFiltre.value = '' } else if (['integration', 'depart'].includes(key)) typeFiltre.value = key; else statutFiltre.value = key; load() }
async function load() { processus.value = (await api.get('/rh/processus', { params: { type: typeFiltre.value || undefined, statut: statutFiltre.value || undefined } })).data }
async function createProcess() { try { await api.post('/rh/processus', form); toast.success('Checklist creee.'); Object.assign(form, { employe_id: null, type: 'integration', date_effet: new Date().toISOString().slice(0, 10), note: '' }); await load() } catch (e) { toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Creation impossible.') } }
async function updateProcess(p) { try { await api.put(`/rh/processus/${p.id}`, { statut: p.statut, note: p.note || '', date_effet: p.date_effet }); toast.success('Parcours mis a jour.'); await load() } catch { toast.error('Mise a jour impossible.') } }
async function toggle(t) { try { await api.put(`/rh/processus/taches/${t.id}/basculer`); await load() } catch { toast.error('Mise a jour impossible.') } }
async function addTask(p) { try { await api.post(`/rh/processus/${p.id}/taches`, { libelle: newTasks[p.id], categorie: newTaskCategories[p.id] || 'autre' }); newTasks[p.id] = ''; newTaskCategories[p.id] = 'autre'; toast.success('Tache ajoutee.'); await load() } catch { toast.error('Ajout impossible.') } }
async function deleteTask(t) { try { await api.delete(`/rh/processus/taches/${t.id}`); toast.success('Tache supprimee.'); await load() } catch { toast.error('Suppression impossible.') } }
onMounted(load)
</script>
<style scoped>.panel{@apply rounded-lg border border-slate-200 bg-white p-4}.title{@apply font-bold text-slate-900}.badge{@apply rounded px-2 py-1 text-xs font-semibold}.empty{@apply py-10 text-center text-sm text-slate-400}</style>
