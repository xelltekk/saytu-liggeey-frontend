<template>
  <div class="space-y-4">
    <div v-if="canManage" class="grid gap-4 xl:grid-cols-[1fr_420px]">
      <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveCertification">
        <h3 class="title sm:col-span-2">{{ certForm.id ? 'Modifier une certification' : 'Nouvelle certification' }}</h3>
        <label class="field-label">Libelle<input v-model="certForm.libelle" class="input" placeholder="Libelle" required /></label>
        <label class="field-label">Type<select v-model="certForm.type" class="input"><option v-for="t in types" :key="t" :value="t">{{ typeLabel(t) }}</option></select></label>
        <label class="field-label">Organisme<input v-model="certForm.organisme" class="input" placeholder="Organisme" /></label>
        <label class="field-label">Validite mois<input v-model.number="certForm.validite_mois" type="number" min="1" class="input" placeholder="Sans expiration si vide" /></label>
        <textarea v-model="certForm.description" rows="2" class="input sm:col-span-2" placeholder="Description, prerequis ou remarques"></textarea>
        <label class="check"><input v-model="certForm.is_active" type="checkbox" /> Certification active</label>
        <div class="flex gap-2 sm:col-span-2"><button class="btn-primary">Enregistrer</button><button v-if="certForm.id" type="button" class="btn-secondary" @click="resetCertification">Annuler</button></div>
      </form>

      <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="assignCertification">
        <h3 class="title sm:col-span-2">Affecter a un employe</h3>
        <select v-model.number="assignForm.certification_id" class="input" required><option :value="null">Certification</option><option v-for="c in certifications.filter(c => c.is_active)" :key="c.id" :value="c.id">{{ c.libelle }}</option></select>
        <select v-model.number="assignForm.employe_id" class="input" required><option :value="null">Employe</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
        <input v-model="assignForm.numero" class="input" placeholder="Numero" />
        <input v-model="assignForm.date_obtention" type="date" class="input" required />
        <input v-model="assignForm.date_expiration" type="date" class="input" />
        <select v-model="assignForm.statut" class="input"><option value="valide">Valide</option><option value="expiree">Expiree</option><option value="suspendue">Suspendue</option></select>
        <textarea v-model="assignForm.note" rows="2" class="input sm:col-span-2" placeholder="Note interne"></textarea>
        <button class="btn-primary sm:col-span-2">Enregistrer</button>
      </form>
    </div>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <button v-for="card in certificationCards" :key="card.key" type="button" class="panel p-3 text-left transition hover:border-blue-300 hover:bg-blue-50" @click="applyCertificationQuickFilter(card.key)">
        <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
        <strong class="mt-1 block text-2xl" :class="card.color">{{ card.value }}</strong>
      </button>
    </div>

    <section class="panel">
      <div class="mb-3 grid gap-2 lg:grid-cols-[1fr_180px_160px_auto]">
        <input v-model="certFilters.search" class="input" placeholder="Rechercher certification, organisme..." @keyup.enter="load" />
        <select v-model="certFilters.type" class="input" @change="load"><option value="">Tous les types</option><option v-for="t in types" :key="t" :value="t">{{ typeLabel(t) }}</option></select>
        <select v-if="canManage" v-model="certFilters.active" class="input" @change="load"><option value="">Tous etats</option><option value="1">Actives</option><option value="0">Inactives</option></select>
        <button class="btn-secondary" @click="load">Actualiser</button>
      </div>
      <div class="grid gap-3 xl:grid-cols-2">
        <article v-for="c in certifications" :key="c.id" class="rounded-lg border border-slate-200 p-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div><strong class="text-slate-900">{{ c.libelle }}</strong><p class="mt-1 text-xs text-slate-500">{{ typeLabel(c.type) }} - {{ c.organisme || 'Sans organisme' }}</p></div>
            <span class="badge" :class="c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ c.is_active ? 'Active' : 'Inactive' }}</span>
          </div>
          <p v-if="c.description" class="mt-2 text-sm text-slate-500">{{ c.description }}</p>
          <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div><span class="block uppercase text-slate-400">Validite</span><strong>{{ c.validite_mois ? c.validite_mois + ' mois' : 'Sans expiration' }}</strong></div>
            <div><span class="block uppercase text-slate-400">Attributions</span><strong>{{ c.certifications_employes_count || 0 }}</strong></div>
            <div><span class="block uppercase text-slate-400">Etat</span><strong>{{ c.is_active ? 'Active' : 'Inactive' }}</strong></div>
          </div>
          <div v-if="canManage" class="mt-3 flex justify-end"><button class="btn-secondary" @click="editCertification(c)">Modifier</button></div>
        </article>
        <p v-if="!certifications.length" class="empty xl:col-span-2">Aucune certification.</p>
      </div>
    </section>

    <section class="panel overflow-x-auto">
      <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div><h3 class="title">{{ canManage ? 'Certifications des employes' : 'Mes certifications' }}</h3><p class="text-sm text-slate-500">Suivi des dates d'obtention, expirations et renouvellements.</p></div>
      </div>
      <div class="mb-3 grid gap-2 lg:grid-cols-[1fr_190px_190px_160px_160px_auto]">
        <input v-model="employeeFilters.search" class="input" placeholder="Rechercher employe, certification..." @keyup.enter="load" />
        <select v-if="canManage" v-model.number="employeeFilters.employe_id" class="input" @change="load"><option :value="null">Tous les employes</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
        <select v-model.number="employeeFilters.certification_id" class="input" @change="load"><option :value="null">Toutes certifications</option><option v-for="c in certifications" :key="c.id" :value="c.id">{{ c.libelle }}</option></select>
        <select v-model="employeeFilters.statut" class="input" @change="load"><option value="">Tous statuts</option><option value="valide">Valide</option><option value="expiree">Expiree</option><option value="suspendue">Suspendue</option></select>
        <select v-model="employeeFilters.expiration" class="input" @change="load"><option value="">Toutes expirations</option><option value="soon">A renouveler</option><option value="expired">Expirees</option></select>
        <button class="btn-secondary" @click="load">Actualiser</button>
      </div>
      <table class="w-full">
        <thead><tr><th>Employe</th><th>Certification</th><th>Numero</th><th>Obtention</th><th>Expiration</th><th>Etat</th><th>Statut</th><th>Note</th></tr></thead>
        <tbody>
          <tr v-for="c in employeeCertifications" :key="c.id">
            <td>{{ nom(c.employe) }}</td>
            <td><strong class="text-slate-900">{{ c.certification?.libelle || '-' }}</strong><p class="text-xs text-slate-500">{{ typeLabel(c.certification?.type) }}</p></td>
            <td><input v-if="canManage" v-model="c.numero" class="input min-w-36" @change="updateEmployeeCertification(c)" /><span v-else>{{ c.numero || '-' }}</span></td>
            <td><input v-if="canManage" v-model="c.date_obtention" type="date" class="input min-w-36" @change="updateEmployeeCertification(c)" /><span v-else>{{ date(c.date_obtention) }}</span></td>
            <td><input v-if="canManage" v-model="c.date_expiration" type="date" class="input min-w-36" @change="updateEmployeeCertification(c)" /><span v-else>{{ date(c.date_expiration) }}</span></td>
            <td><span class="badge" :class="alertClass(c)">{{ alertLabel(c) }}</span></td>
            <td><select v-if="canManage" v-model="c.statut" class="input min-w-36" @change="updateEmployeeCertification(c)"><option value="valide">Valide</option><option value="expiree">Expiree</option><option value="suspendue">Suspendue</option></select><span v-else>{{ statusLabel(c.statut) }}</span></td>
            <td><input v-if="canManage" v-model="c.note" class="input min-w-48" placeholder="Note" @change="updateEmployeeCertification(c)" /><span v-else>{{ c.note || '-' }}</span></td>
          </tr>
          <tr v-if="!employeeCertifications.length"><td colspan="8" class="empty">Aucune certification attribuee.</td></tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const props = defineProps({ canManage: Boolean, employes: { type: Array, default: () => [] } })
const toast = useToast()
const certifications = ref([])
const employeeCertifications = ref([])
const types = ['diplome', 'habilitation', 'permis', 'licence', 'formation', 'autre']
const emptyCertification = () => ({ id: null, libelle: '', type: 'habilitation', organisme: '', validite_mois: null, description: '', is_active: true })
const certForm = reactive(emptyCertification())
const assignForm = reactive({ certification_id: null, employe_id: null, numero: '', date_obtention: new Date().toISOString().slice(0, 10), date_expiration: '', statut: 'valide', note: '' })
const certFilters = reactive({ search: '', type: '', active: '' })
const employeeFilters = reactive({ search: '', employe_id: null, certification_id: null, statut: '', expiration: '' })

const certificationCards = computed(() => [
  { key: 'all', label: 'Certifications', value: certifications.value.length, color: 'text-slate-900' },
  { key: 'active', label: 'Actives', value: certifications.value.filter(c => c.is_active).length, color: 'text-green-700' },
  { key: 'soon', label: 'A renouveler', value: employeeCertifications.value.filter(c => c.etat_expiration === 'a_renouveler').length, color: 'text-orange-700' },
  { key: 'expired', label: 'Expirees', value: employeeCertifications.value.filter(c => c.etat_expiration === 'expiree').length, color: 'text-red-700' },
])

function nom(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : '-' }
function date(v) { return v ? new Date(v).toLocaleDateString('fr-FR') : 'Sans expiration' }
function normalizeDate(v) { return v ? String(v).slice(0, 10) : null }
function typeLabel(t) { return { diplome: 'Diplome', habilitation: 'Habilitation', permis: 'Permis', licence: 'Licence', formation: 'Formation', autre: 'Autre' }[t] || t || '-' }
function statusLabel(s) { return { valide: 'Valide', expiree: 'Expiree', suspendue: 'Suspendue' }[s] || s }
function alertLabel(c) { if (c.etat_expiration === 'sans_expiration') return statusLabel(c.statut); if (c.etat_expiration === 'expiree') return 'Expiree'; if (c.etat_expiration === 'a_renouveler') return `${c.jours_avant_expiration} j restants`; return statusLabel(c.statut) }
function alertClass(c) { if (c.etat_expiration === 'expiree' || c.statut === 'expiree') return 'bg-red-100 text-red-800'; if (c.etat_expiration === 'a_renouveler') return 'bg-orange-100 text-orange-800'; if (c.statut === 'suspendue') return 'bg-slate-100 text-slate-700'; return 'bg-green-100 text-green-800' }
function applyCertificationQuickFilter(key) {
  if (key === 'all') Object.assign(certFilters, { search: '', type: '', active: '' })
  if (key === 'active') certFilters.active = '1'
  if (key === 'soon') employeeFilters.expiration = 'soon'
  if (key === 'expired') employeeFilters.expiration = 'expired'
  load()
}
async function load() { [certifications.value, employeeCertifications.value] = await Promise.all([api.get('/rh/certifications', { params: certFilters }).then(r => r.data), api.get('/rh/certifications/employes/liste', { params: employeeFilters }).then(r => r.data)]) }
async function act(fn, message) { try { await fn(); toast.success(message); await load() } catch (e) { toast.error(Object.values(e.response.data.errors || {})[0]?.[0] || e.response.data.message || 'Action impossible.') } }
function resetCertification() { Object.assign(certForm, emptyCertification()) }
function editCertification(c) { Object.assign(certForm, { ...c }) }
const saveCertification = () => act(() => { const payload = { ...certForm }; delete payload.id; return certForm.id ? api.put(`/rh/certifications/${certForm.id}`, payload) : api.post('/rh/certifications', payload) }, 'Certification enregistree.').then(resetCertification)
const assignCertification = () => { const payload = { ...assignForm }; if (!payload.date_expiration) delete payload.date_expiration; return act(() => api.post('/rh/certifications/employes', payload).then(() => Object.assign(assignForm, { certification_id: null, employe_id: null, numero: '', date_obtention: new Date().toISOString().slice(0, 10), date_expiration: '', statut: 'valide', note: '' })), 'Certification affectee.') }
const updateEmployeeCertification = item => act(() => api.put(`/rh/certifications/employes/${item.id}`, { numero: item.numero || '', date_obtention: normalizeDate(item.date_obtention), date_expiration: normalizeDate(item.date_expiration), statut: item.statut, note: item.note || '' }), 'Certification mise a jour.')

onMounted(load)
</script>

<style scoped>
.panel { @apply rounded-lg border border-slate-200 bg-white p-4; }
.title { @apply font-bold text-slate-900; }
.field-label { @apply space-y-1 text-sm font-medium text-slate-700; }
.check { @apply flex items-center gap-2 text-sm text-slate-700; }
.badge { @apply rounded px-2 py-1 text-xs font-semibold; }
.empty { @apply py-10 text-center text-sm text-slate-400; }
th { @apply whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs uppercase text-slate-500; }
td { @apply whitespace-nowrap border-t border-slate-100 px-3 py-3 text-sm text-slate-700; }
</style>
