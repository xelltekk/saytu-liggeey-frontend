<template>
  <div class="space-y-4">
    <div v-if="canManage" class="grid gap-4 xl:grid-cols-[1fr_420px]">
      <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveEquipment">
        <h3 class="title sm:col-span-2">{{ equipmentForm.id ? 'Modifier un materiel' : 'Ajouter un materiel' }}</h3>
        <label class="field-label">Reference<input v-model="equipmentForm.reference" class="input" placeholder="Reference interne" required /></label>
        <label class="field-label">Libelle<input v-model="equipmentForm.libelle" class="input" placeholder="Libelle" required /></label>
        <select v-model="equipmentForm.categorie" class="input"><option v-for="c in categories" :key="c" :value="c">{{ categoryLabel(c) }}</option></select>
        <input v-model="equipmentForm.numero_serie" class="input" placeholder="Numero de serie" />
        <input v-model="equipmentForm.marque" class="input" placeholder="Marque" />
        <input v-model="equipmentForm.modele" class="input" placeholder="Modele" />
        <select v-model="equipmentForm.etat" class="input"><option v-for="e in etats" :key="e" :value="e">{{ stateLabel(e) }}</option></select>
        <select v-model="equipmentForm.statut" class="input"><option v-for="s in statuts" :key="s" :value="s">{{ statusLabel(s) }}</option></select>
        <textarea v-model="equipmentForm.note" rows="2" class="input sm:col-span-2" placeholder="Note"></textarea>
        <div class="flex gap-2 sm:col-span-2"><button class="btn-primary">Enregistrer</button><button v-if="equipmentForm.id" type="button" class="btn-secondary" @click="resetEquipment">Annuler</button></div>
      </form>

      <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="assign">
        <h3 class="title sm:col-span-2">Attribuer un materiel</h3>
        <select v-model.number="assignForm.materiel_id" class="input" required><option :value="null">Materiel disponible</option><option v-for="m in availableEquipments" :key="m.id" :value="m.id">{{ m.reference }} - {{ m.libelle }}</option></select>
        <select v-model.number="assignForm.employe_id" class="input" required><option :value="null">Employe</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
        <input v-model="assignForm.date_attribution" type="date" class="input" required />
        <input v-model="assignForm.date_restitution_prevue" type="date" class="input" />
        <select v-model="assignForm.etat_attribution" class="input"><option v-for="e in etats" :key="e" :value="e">{{ stateLabel(e) }}</option></select>
        <input v-model="assignForm.note" class="input" placeholder="Note attribution" />
        <button class="btn-primary sm:col-span-2">Attribuer</button>
      </form>
    </div>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <button v-for="card in equipmentCards" :key="card.key" type="button" class="panel p-3 text-left transition hover:border-blue-300 hover:bg-blue-50" @click="equipmentFilter = card.key === 'total' ? '' : card.key">
        <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
        <strong class="mt-1 block text-2xl" :class="card.color">{{ card.value }}</strong>
      </button>
    </div>

    <section v-if="canManage" class="panel">
      <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div><h3 class="title">Inventaire du materiel</h3><p class="text-sm text-slate-500">Parc RH, disponibilites et affectations en cours.</p></div>
        <input v-model="equipmentSearch" class="input lg:w-80" placeholder="Rechercher reference, libelle, serie..." />
      </div>
      <div class="grid gap-3 xl:grid-cols-2">
        <article v-for="m in filteredEquipments" :key="m.id" class="rounded-lg border border-slate-200 p-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div><strong class="text-slate-900">{{ m.reference }} - {{ m.libelle }}</strong><p class="mt-1 text-xs text-slate-500">{{ [m.marque, m.modele, m.numero_serie].filter(Boolean).join(' / ') || 'Sans detail' }}</p></div>
            <span class="badge" :class="statusClass(m.statut)">{{ statusLabel(m.statut) }}</span>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div><span class="block uppercase text-slate-400">Categorie</span><strong>{{ categoryLabel(m.categorie) }}</strong></div>
            <div><span class="block uppercase text-slate-400">Etat</span><strong>{{ stateLabel(m.etat) }}</strong></div>
            <div><span class="block uppercase text-slate-400">Attribue a</span><strong>{{ nom(m.attributions?.[0]?.employe) }}</strong></div>
          </div>
          <div class="mt-3 flex justify-end"><button class="btn-secondary" @click="editEquipment(m)">Modifier</button></div>
        </article>
        <p v-if="!filteredEquipments.length" class="empty xl:col-span-2">Aucun materiel.</p>
      </div>
    </section>

    <section class="panel overflow-x-auto">
      <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div><h3 class="title">{{ canManage ? 'Historique des attributions' : 'Mon materiel attribue' }}</h3><p class="text-sm text-slate-500">Attributions en cours, retours prevus et restitutions.</p></div>
        <label class="inline-flex items-center gap-2 text-sm text-slate-700"><input v-model="activeOnly" type="checkbox" @change="load" /> Actives seulement</label>
      </div>
      <table class="w-full"><thead><tr><th>Materiel</th><th>Employe</th><th>Attribution</th><th>Retour prevu</th><th>Restitution</th><th>Etat</th><th v-if="canManage"></th></tr></thead><tbody>
        <tr v-for="a in assignments" :key="a.id"><td><strong>{{ a.materiel?.reference || '-' }} - {{ a.materiel?.libelle || 'Materiel' }}</strong><p class="text-xs text-slate-500">{{ categoryLabel(a.materiel?.categorie) }}</p></td><td>{{ nom(a.employe) }}</td><td>{{ date(a.date_attribution) }}</td><td>{{ date(a.date_restitution_prevue) }}</td><td>{{ date(a.date_restitution) }}</td><td>{{ stateLabel(a.etat_restitution || a.etat_attribution) }}</td><td v-if="canManage"><button v-if="!a.date_restitution" class="btn-secondary" @click="openReturn(a)">Restituer</button></td></tr>
        <tr v-if="!assignments.length"><td :colspan="canManage ? 7 : 6" class="empty">Aucune attribution.</td></tr>
      </tbody></table>
    </section>

    <AppModal v-model="showReturn" title="Restituer le materiel" size="sm"><form class="space-y-3" @submit.prevent="returnEquipment"><input v-model="returnForm.date_restitution" type="date" class="input" required /><select v-model="returnForm.etat_restitution" class="input"><option v-for="e in etats" :key="e" :value="e">{{ stateLabel(e) }}</option></select><textarea v-model="returnForm.note" class="input" placeholder="Observation"></textarea><div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showReturn = false">Annuler</button><button class="btn-primary">Confirmer</button></div></form></AppModal>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useToast } from '@/composables/useToast'
const props = defineProps({ canManage: Boolean, employes: { type: Array, default: () => [] } }), toast = useToast(), equipments = ref([]), assignments = ref([]), showReturn = ref(false), activeAssignment = ref(null)
const categories = ['ordinateur', 'telephone', 'badge', 'mobilier', 'accessoire', 'autre'], etats = ['neuf', 'bon', 'moyen', 'a_reparer', 'hors_service'], statuts = ['disponible', 'attribue', 'maintenance', 'reforme']
const emptyEquipment = () => ({ id: null, reference: '', libelle: '', categorie: 'ordinateur', marque: '', modele: '', numero_serie: '', etat: 'bon', statut: 'disponible', note: '' })
const equipmentForm = reactive(emptyEquipment()), assignForm = reactive({ materiel_id: null, employe_id: null, date_attribution: new Date().toISOString().slice(0, 10), date_restitution_prevue: '', etat_attribution: 'bon', note: '' }), returnForm = reactive({ date_restitution: new Date().toISOString().slice(0, 10), etat_restitution: 'bon', note: '' })
const equipmentSearch = ref(''), equipmentFilter = ref(''), activeOnly = ref(false)
const availableEquipments = computed(() => equipments.value.filter(m => m.statut === 'disponible'))
const equipmentCards = computed(() => [
  { key: 'total', label: 'Materiels', value: equipments.value.length || assignments.value.length, color: 'text-slate-900' },
  { key: 'disponible', label: 'Disponibles', value: equipments.value.filter(m => m.statut === 'disponible').length, color: 'text-green-700' },
  { key: 'attribue', label: 'Attribues', value: assignments.value.filter(a => !a.date_restitution).length, color: 'text-blue-700' },
  { key: 'maintenance', label: 'Maintenance', value: equipments.value.filter(m => m.statut === 'maintenance').length, color: 'text-orange-700' },
])
const filteredEquipments = computed(() => {
  const term = equipmentSearch.value.trim().toLowerCase()
  return equipments.value.filter(m => {
    if (equipmentFilter.value && m.statut !== equipmentFilter.value) return false
    if (!term) return true
    return [m.reference, m.libelle, m.numero_serie, m.marque, m.modele, m.categorie].some(v => String(v || '').toLowerCase().includes(term))
  })
})
function nom(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : '-' } function date(v) { return v ? new Date(v).toLocaleDateString('fr-FR') : '-' }
function categoryLabel(v) { return { ordinateur: 'Ordinateur', telephone: 'Telephone', badge: 'Badge', mobilier: 'Mobilier', accessoire: 'Accessoire', autre: 'Autre' }[v] || v || '-' }
function stateLabel(v) { return { neuf: 'Neuf', bon: 'Bon', moyen: 'Moyen', a_reparer: 'A reparer', hors_service: 'Hors service' }[v] || v || '-' }
function statusLabel(v) { return { disponible: 'Disponible', attribue: 'Attribue', maintenance: 'Maintenance', reforme: 'Reforme' }[v] || v || '-' }
function statusClass(v) { return { disponible: 'bg-green-100 text-green-800', attribue: 'bg-blue-100 text-blue-800', maintenance: 'bg-orange-100 text-orange-800', reforme: 'bg-slate-100 text-slate-600' }[v] || 'bg-slate-100 text-slate-600' }
async function load() { assignments.value = (await api.get('/rh/materiels/attributions/liste', { params: { actives: activeOnly.value ? 1 : undefined } })).data; if (props.canManage) equipments.value = (await api.get('/rh/materiels')).data }
async function act(fn, message) { try { await fn(); toast.success(message); await load() } catch (e) { toast.error(Object.values(e.response.data.errors || {})[0]?.[0] || e.response.data.message || 'Action impossible.') } }
function resetEquipment() { Object.assign(equipmentForm, emptyEquipment()) }
function editEquipment(m) { Object.assign(equipmentForm, { ...m }) }
const saveEquipment = () => act(() => { const payload = { ...equipmentForm }; delete payload.id; delete payload.attributions; return equipmentForm.id ? api.put(`/rh/materiels/${equipmentForm.id}`, payload) : api.post('/rh/materiels', payload) }, 'Materiel enregistre.').then(resetEquipment)
const assign = () => act(() => { const payload = { ...assignForm }; if (!payload.date_restitution_prevue) delete payload.date_restitution_prevue; return api.post('/rh/materiels/attribuer', payload).then(() => Object.assign(assignForm, { materiel_id: null, employe_id: null, date_attribution: new Date().toISOString().slice(0, 10), date_restitution_prevue: '', etat_attribution: 'bon', note: '' })) }, 'Materiel attribue.')
function openReturn(a) { activeAssignment.value = a; showReturn.value = true }
async function returnEquipment() { await act(() => api.put(`/rh/materiels/attributions/${activeAssignment.value.id}/restituer`, returnForm), 'Materiel restitue.'); showReturn.value = false }
onMounted(load)
</script>
<style scoped>.panel{@apply rounded-lg border border-slate-200 bg-white p-4}.title{@apply font-bold text-slate-900}.field-label{@apply space-y-1 text-sm font-medium text-slate-700}.badge{@apply rounded px-2 py-1 text-xs font-semibold}.empty{@apply py-10 text-center text-sm text-slate-400}th{@apply whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs uppercase text-slate-500}td{@apply whitespace-nowrap border-t border-slate-100 px-3 py-3 text-sm text-slate-700}</style>
