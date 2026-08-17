<template>
  <div class="space-y-4">
    <div v-if="canManage" class="grid gap-4 xl:grid-cols-[1fr_420px]">
      <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveBenefit">
        <h3 class="title sm:col-span-2">{{ benefitForm.id ? 'Modifier un avantage' : 'Nouvel avantage social' }}</h3>
        <label class="field-label">Libelle<input v-model="benefitForm.libelle" class="input" placeholder="Libelle" required /></label>
        <label class="field-label">Type<select v-model="benefitForm.type" class="input"><option v-for="t in types" :key="t" :value="t">{{ label(t) }}</option></select></label>
        <label class="field-label">Prestataire<input v-model="benefitForm.prestataire" class="input" placeholder="Prestataire" /></label>
        <label class="field-label">Part entreprise<input v-model.number="benefitForm.cout_employeur" type="number" min="0" step="1" class="input" required /></label>
        <label class="field-label">Part employe<input v-model.number="benefitForm.cout_employe" type="number" min="0" step="1" class="input" required /></label>
        <label class="check"><input v-model="benefitForm.is_active" type="checkbox" /> Avantage actif</label>
        <textarea v-model="benefitForm.description" rows="2" class="input sm:col-span-2" placeholder="Description"></textarea>
        <div class="flex gap-2 sm:col-span-2"><button class="btn-primary">Enregistrer</button><button v-if="benefitForm.id" type="button" class="btn-secondary" @click="resetBenefit">Annuler</button></div>
      </form>

      <form class="panel grid gap-2 sm:grid-cols-2" @submit.prevent="saveEnrollment">
        <h3 class="title sm:col-span-2">Inscrire un employe</h3>
        <select v-model.number="enrollmentForm.avantage_id" class="input" required><option :value="null">Avantage</option><option v-for="a in benefits.filter(a => a.is_active)" :key="a.id" :value="a.id">{{ a.libelle }}</option></select>
        <select v-model.number="enrollmentForm.employe_id" class="input" required><option :value="null">Employe</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
        <label class="field-label">Debut<input v-model="enrollmentForm.date_debut" type="date" class="input" required /></label>
        <label class="field-label">Fin<input v-model="enrollmentForm.date_fin" type="date" class="input" /></label>
        <select v-model="enrollmentForm.statut" class="input"><option value="active">Active</option><option value="suspendue">Suspendue</option><option value="terminee">Terminee</option></select>
        <input v-model="enrollmentForm.reference" class="input" placeholder="Reference contrat ou adhesion" />
        <textarea v-model="enrollmentForm.note" rows="2" class="input sm:col-span-2" placeholder="Note interne"></textarea>
        <button class="btn-primary sm:col-span-2">Enregistrer l'adhesion</button>
      </form>
    </div>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <button v-for="card in benefitCards" :key="card.key" type="button" class="panel p-3 text-left transition hover:border-blue-300 hover:bg-blue-50" @click="applyBenefitQuickFilter(card.key)">
        <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
        <strong class="mt-1 block text-2xl" :class="card.color">{{ card.value }}</strong>
      </button>
    </div>

    <section class="panel">
      <div class="mb-3 grid gap-2 lg:grid-cols-[1fr_190px_160px_auto]">
        <input v-model="benefitFilters.search" class="input" placeholder="Rechercher avantage, prestataire..." @keyup.enter="load" />
        <select v-model="benefitFilters.type" class="input" @change="load"><option value="">Tous les types</option><option v-for="t in types" :key="t" :value="t">{{ label(t) }}</option></select>
        <select v-if="canManage" v-model="benefitFilters.active" class="input" @change="load"><option value="">Tous etats</option><option value="1">Actifs</option><option value="0">Inactifs</option></select>
        <button class="btn-secondary" @click="load">Actualiser</button>
      </div>

      <div class="grid gap-3 xl:grid-cols-2">
        <article v-for="a in benefits" :key="a.id" class="rounded-lg border border-slate-200 p-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <strong class="text-slate-900">{{ a.libelle }}</strong>
              <p class="mt-1 text-xs text-slate-500">{{ label(a.type) }} - {{ a.prestataire || 'Sans prestataire' }}</p>
            </div>
            <span class="badge" :class="a.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'">{{ a.is_active ? 'Actif' : 'Inactif' }}</span>
          </div>
          <p v-if="a.description" class="mt-2 text-sm text-slate-500">{{ a.description }}</p>
          <div class="mt-3 grid grid-cols-4 gap-2 text-xs text-slate-600">
            <div><span class="block uppercase text-slate-400">Entreprise</span><strong>{{ money(a.cout_employeur) }}</strong></div>
            <div><span class="block uppercase text-slate-400">Employe</span><strong>{{ money(a.cout_employe) }}</strong></div>
            <div><span class="block uppercase text-slate-400">Actives</span><strong>{{ a.adhesions_actives_count || 0 }}</strong></div>
            <div><span class="block uppercase text-slate-400">Total</span><strong>{{ a.adhesions_count || 0 }}</strong></div>
          </div>
          <div v-if="canManage" class="mt-3 flex justify-end"><button class="btn-secondary" @click="editBenefit(a)">Modifier</button></div>
        </article>
        <p v-if="!benefits.length" class="empty xl:col-span-2">Aucun avantage configure.</p>
      </div>
    </section>

    <section class="panel overflow-x-auto">
      <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div><h3 class="title">{{ canManage ? 'Adhesions des employes' : 'Mes avantages sociaux' }}</h3><p class="text-sm text-slate-500">Suivi des avantages attribues, actifs ou termines.</p></div>
      </div>
      <div class="mb-3 grid gap-2 lg:grid-cols-[1fr_190px_190px_160px_auto]">
        <input v-model="enrollmentFilters.search" class="input" placeholder="Rechercher employe, avantage..." @keyup.enter="load" />
        <select v-if="canManage" v-model.number="enrollmentFilters.employe_id" class="input" @change="load"><option :value="null">Tous les employes</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select>
        <select v-model.number="enrollmentFilters.avantage_id" class="input" @change="load"><option :value="null">Tous les avantages</option><option v-for="a in benefits" :key="a.id" :value="a.id">{{ a.libelle }}</option></select>
        <select v-model="enrollmentFilters.statut" class="input" @change="load"><option value="">Tous statuts</option><option value="active">Active</option><option value="suspendue">Suspendue</option><option value="terminee">Terminee</option></select>
        <button class="btn-secondary" @click="load">Actualiser</button>
      </div>
      <table class="w-full">
        <thead><tr><th>Employe</th><th>Avantage</th><th>Debut</th><th>Fin</th><th>Reference</th><th>Statut</th><th>Note</th></tr></thead>
        <tbody>
          <tr v-for="a in enrollments" :key="a.id">
            <td>{{ nom(a.employe) }}</td>
            <td><strong class="text-slate-900">{{ a.avantage?.libelle || '-' }}</strong><p class="text-xs text-slate-500">{{ label(a.avantage?.type) }}</p></td>
            <td><input v-if="canManage" v-model="a.date_debut" type="date" class="input min-w-36" @change="updateEnrollment(a)" /><span v-else>{{ date(a.date_debut) }}</span></td>
            <td><input v-if="canManage" v-model="a.date_fin" type="date" class="input min-w-36" @change="updateEnrollment(a)" /><span v-else>{{ date(a.date_fin) }}</span></td>
            <td><input v-if="canManage" v-model="a.reference" class="input min-w-44" placeholder="Reference" @change="updateEnrollment(a)" /><span v-else>{{ a.reference || '-' }}</span></td>
            <td><select v-if="canManage" v-model="a.statut" class="input min-w-36" @change="updateEnrollment(a)"><option value="active">Active</option><option value="suspendue">Suspendue</option><option value="terminee">Terminee</option></select><span v-else class="badge bg-blue-100 text-blue-800">{{ statusLabel(a.statut) }}</span></td>
            <td><input v-if="canManage" v-model="a.note" class="input min-w-48" placeholder="Note" @change="updateEnrollment(a)" /><span v-else>{{ a.note || '-' }}</span></td>
          </tr>
          <tr v-if="!enrollments.length"><td colspan="7" class="empty">Aucune adhesion.</td></tr>
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
const benefits = ref([])
const enrollments = ref([])
const types = ['assurance_sante', 'retraite', 'transport', 'restauration', 'prime', 'autre']
const emptyBenefit = () => ({ id: null, libelle: '', type: 'assurance_sante', prestataire: '', description: '', cout_employeur: 0, cout_employe: 0, is_active: true })
const benefitForm = reactive(emptyBenefit())
const enrollmentForm = reactive({ avantage_id: null, employe_id: null, date_debut: new Date().toISOString().slice(0, 10), date_fin: '', statut: 'active', reference: '', note: '' })
const benefitFilters = reactive({ search: '', type: '', active: '' })
const enrollmentFilters = reactive({ search: '', employe_id: null, avantage_id: null, statut: '' })

const benefitCards = computed(() => {
  const activeEnrollments = enrollments.value.filter(a => a.statut === 'active')
  const employerCost = activeEnrollments.reduce((sum, row) => sum + Number(row.avantage?.cout_employeur || 0), 0)
  const employeeCost = activeEnrollments.reduce((sum, row) => sum + Number(row.avantage?.cout_employe || 0), 0)
  return [
    { key: 'all', label: 'Avantages', value: benefits.value.length, color: 'text-slate-900' },
    { key: 'active', label: 'Adhesions actives', value: activeEnrollments.length, color: 'text-green-700' },
    { key: 'employer', label: 'Cout entreprise', value: moneyShort(employerCost), color: 'text-blue-700' },
    { key: 'employee', label: 'Part employes', value: moneyShort(employeeCost), color: 'text-violet-700' },
  ]
})

function label(v) { return { assurance_sante: 'Assurance sante', retraite: 'Retraite', transport: 'Transport', restauration: 'Restauration', prime: 'Prime', autre: 'Autre' }[v] || v || '-' }
function statusLabel(v) { return { active: 'Active', suspendue: 'Suspendue', terminee: 'Terminee' }[v] || v }
function nom(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : '-' }
function date(v) { return v ? new Date(v).toLocaleDateString('fr-FR') : '-' }
function money(v) { return new Intl.NumberFormat('fr-FR').format(Number(v || 0))  }
function moneyShort(v) { return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v || 0))  }
function normalizeDate(v) { return v ? String(v).slice(0, 10) : null }
function applyBenefitQuickFilter(key) {
  if (key === 'all') Object.assign(benefitFilters, { search: '', type: '', active: '' })
  if (key === 'active') enrollmentFilters.statut = 'active'
  load()
}
async function load() { [benefits.value, enrollments.value] = await Promise.all([api.get('/rh/avantages', { params: benefitFilters }).then(r => r.data), api.get('/rh/avantages/adhesions/liste', { params: enrollmentFilters }).then(r => r.data)]) }
function resetBenefit() { Object.assign(benefitForm, emptyBenefit()) }
function editBenefit(a) { Object.assign(benefitForm, { ...a }) }
async function saveBenefit() { try { const payload = { ...benefitForm }; delete payload.id; benefitForm.id ? await api.put(`/rh/avantages/${benefitForm.id}`, payload) : await api.post('/rh/avantages', payload); toast.success('Avantage enregistre.'); resetBenefit(); await load() } catch (e) { toast.error(Object.values(e.response.data.errors || {})[0]?.[0] || e.response.data.message || 'Enregistrement impossible.') } }
async function saveEnrollment() { try { const payload = { ...enrollmentForm }; if (!payload.date_fin) delete payload.date_fin; await api.post('/rh/avantages/adhesions', payload); toast.success('Adhesion enregistree.'); Object.assign(enrollmentForm, { avantage_id: null, employe_id: null, date_debut: new Date().toISOString().slice(0, 10), date_fin: '', statut: 'active', reference: '', note: '' }); await load() } catch (e) { toast.error(Object.values(e.response.data.errors || {})[0]?.[0] || e.response.data.message || 'Adhesion impossible.') } }
async function updateEnrollment(item) { try { await api.put(`/rh/avantages/adhesions/${item.id}`, { statut: item.statut, note: item.note || '', reference: item.reference || '', date_debut: normalizeDate(item.date_debut), date_fin: normalizeDate(item.date_fin) }); toast.success('Adhesion mise a jour.'); await load() } catch (e) { toast.error(Object.values(e.response.data.errors || {})[0]?.[0] || e.response.data.message || 'Mise a jour impossible.') } }

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
