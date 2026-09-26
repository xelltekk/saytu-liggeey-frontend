<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">← Retour liste</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Demande de congé</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">Nouvelle demande de congé</h1>
      <p class="mt-1 text-sm text-slate-600">Saisie en page complète, avec contrôle du solde avant envoi.</p>
    </div>

    <form class="space-y-4 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm" @submit.prevent="saveConge">
      <select v-if="canManage" v-model.number="form.employe_id" class="input">
        <option :value="null">Moi-même / employé lié</option>
        <option v-for="employe in employes" :key="employe.id" :value="employe.id">{{ nomEmploye(employe) }}</option>
      </select>
      <select v-model.number="form.type_conge_id" class="input" required>
        <option :value="null">Type de congé</option>
        <option v-for="type in referentiels.types_conges" :key="type.id" :value="type.id">{{ type.libelle }}</option>
      </select>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="field-label">Date début <input v-model="form.date_debut" type="date" class="input mt-1" required /></label>
        <label class="field-label">Date fin <input v-model="form.date_fin" type="date" class="input mt-1" required /></label>
      </div>
      <div v-if="solde.selected" class="rounded-2xl border p-4 text-sm" :class="soldeBoxClass(solde.selected)">
        <div class="flex items-center justify-between gap-3">
          <span>Jours demandés</span>
          <strong>{{ formatJours(solde.jours_demandes) }} jour(s)</strong>
        </div>
        <div class="mt-2 flex items-center justify-between gap-3">
          <span>Solde disponible</span>
          <strong>{{ soldeDisponibleLabel(solde.selected) }}</strong>
        </div>
        <p v-if="solde.selected.depasse" class="mt-2 font-medium">Solde insuffisant pour ce type de congé.</p>
        <p v-else-if="solde.selected.illimite" class="mt-2 text-xs">Ce type de congé n’a pas de plafond annuel configuré.</p>
      </div>
      <textarea v-model="form.motif" class="input min-h-28" placeholder="Motif ou précision"></textarea>
      <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button class="btn-primary" :disabled="solde.loading || !!solde.selected?.depasse">{{ solde.loading ? 'Vérification...' : 'Envoyer' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { hasAnyRole } from '@/utils/access'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const canManage = computed(() => hasAnyRole(auth.user, ['admin', 'gerant']))
const employes = ref([])
const referentiels = reactive({ types_conges: [] })
const form = reactive({ employe_id: null, type_conge_id: null, date_debut: '', date_fin: '', motif: '' })
const solde = reactive({ loading: false, jours_demandes: 0, types: [], selected: null })
let timer

watch(
  () => [form.employe_id, form.type_conge_id, form.date_debut, form.date_fin],
  () => {
    clearTimeout(timer)
    timer = setTimeout(loadSoldeConge, 250)
  }
)

async function loadReferentiels() {
  const { data } = await api.get('/rh/referentiels')
  referentiels.types_conges = data.types_conges || []
}

async function loadEmployes() {
  if (!canManage.value) return
  const { data } = await api.get('/rh/employes', { params: { per_page: 100 } })
  employes.value = data.data || []
}

function resetSolde() {
  Object.assign(solde, { loading: false, jours_demandes: 0, types: [], selected: null })
}

async function loadSoldeConge() {
  if (!form.type_conge_id && !form.date_debut && !form.date_fin) {
    resetSolde()
    return
  }
  solde.loading = true
  try {
    const { data } = await api.get('/rh/conges/solde', {
      params: {
        employe_id: form.employe_id || undefined,
        type_conge_id: form.type_conge_id || undefined,
        date_debut: form.date_debut || undefined,
        date_fin: form.date_fin || undefined,
      },
    })
    solde.jours_demandes = data.jours_demandes || 0
    solde.types = data.types || []
    solde.selected = solde.types.find(type => Number(type.type_conge_id) === Number(form.type_conge_id)) || solde.types[0] || null
  } catch {
    resetSolde()
  } finally {
    solde.loading = false
  }
}

async function saveConge() {
  try {
    await api.post('/rh/conges', form)
    toast.success('Demande de congé envoyée.')
    goBack()
  } catch (error) {
    toast.error(error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || 'Demande impossible.')
  }
}

function goBack() {
  router.push({ name: 'rh', query: { tab: 'conges' } })
}

function nomEmploye(employe) {
  return employe ? `${employe.prenom || ''} ${employe.nom || ''}`.trim() : '-'
}

function formatJours(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value || 0))
}

function soldeDisponibleLabel(item) {
  return item.illimite ? 'Illimité' : `${formatJours(item.disponible)} jour(s)`
}

function soldeBoxClass(item) {
  return item.depasse ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'
}

onMounted(async () => {
  await Promise.all([loadReferentiels(), loadEmployes()])
})
</script>

<style scoped>
.field-label {
  @apply text-sm font-medium text-slate-700;
}
</style>
