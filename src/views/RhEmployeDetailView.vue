<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">← Retour liste</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Fiche employé</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">{{ isEdit ? 'Modifier la fiche employé' : 'Nouvel employé' }}</h1>
      <p class="mt-1 text-sm text-slate-600">Informations RH et liaison éventuelle avec un compte Saytu.</p>
    </div>

    <form class="grid grid-cols-1 gap-4 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:grid-cols-2" @submit.prevent="saveEmploye">
      <input v-model="form.matricule" class="input" placeholder="Matricule *" required />
      <select v-model.number="form.user_id" class="input">
        <option :value="null">Lier un compte existant (optionnel)</option>
        <option v-for="user in referentiels.utilisateurs" :key="user.id" :value="user.id">{{ user.name }} - {{ user.email }}</option>
      </select>
      <input v-model="form.prenom" class="input" placeholder="Prénom *" required />
      <input v-model="form.nom" class="input" placeholder="Nom *" required />
      <input v-model="form.email" type="email" class="input" placeholder="Email" />
      <input v-model="form.telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
      <input v-model="form.date_embauche" type="date" class="input" required />
      <select v-model="form.type_contrat" class="input">
        <option value="cdi">CDI</option>
        <option value="cdd">CDD</option>
        <option value="stage">Stage</option>
        <option value="prestation">Prestation</option>
        <option value="journalier">Journalier</option>
      </select>
      <select v-model.number="form.departement_id" class="input">
        <option :value="null">Service</option>
        <option v-for="departement in referentiels.departements" :key="departement.id" :value="departement.id">{{ departement.libelle }}</option>
      </select>
      <select v-model.number="form.poste_id" class="input">
        <option :value="null">Poste</option>
        <option v-for="poste in referentiels.postes" :key="poste.id" :value="poste.id">{{ poste.libelle }}</option>
      </select>
      <select v-model="form.statut" class="input">
        <option value="actif">Actif</option>
        <option value="conge">En congé</option>
        <option value="suspendu">Suspendu</option>
        <option value="sorti">Sorti</option>
      </select>
      <input v-model="form.contact_urgence" class="input" placeholder="Contact d’urgence" />
      <textarea v-model="form.notes" class="input sm:col-span-2" rows="3" placeholder="Notes internes"></textarea>

      <section class="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
        <label class="flex items-start gap-3 text-sm font-medium text-slate-700">
          <input v-model="form.creer_utilisateur" type="checkbox" class="mt-1" :disabled="!!form.user_id" />
          <span>
            Créer aussi un compte utilisateur Saytu
            <small class="mt-1 block font-normal text-slate-500">L’employé pourra se connecter à Saytu avec le rôle choisi. Laissez décoché pour une fiche RH simple.</small>
          </span>
        </label>
        <div v-if="form.creer_utilisateur && !form.user_id" class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select v-model="form.user_role" class="input">
            <option v-for="role in userRoleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
          </select>
          <input v-model="form.user_password" type="text" class="input" placeholder="Mot de passe (vide = automatique)" />
          <label class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input v-model="form.user_is_active" type="checkbox" />
            Compte actif
          </label>
        </div>
      </section>

      <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4 sm:col-span-2">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const saving = ref(false)
const isEdit = computed(() => !!route.params.id)
const referentiels = reactive({ departements: [], postes: [], utilisateurs: [] })
const form = reactive(emptyEmploye())
const userRoleOptions = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'caissier', label: 'Caissier' },
  { value: 'magasinier', label: 'Gestionnaire de stock' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'gerant', label: 'Gérant' },
  { value: 'admin', label: 'Administrateur' },
]

watch(() => form.user_id, value => { if (value) form.creer_utilisateur = false })

function emptyEmploye() {
  return {
    user_id: null,
    matricule: '',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    date_embauche: new Date().toISOString().slice(0, 10),
    type_contrat: 'cdi',
    statut: 'actif',
    departement_id: null,
    poste_id: null,
    contact_urgence: '',
    notes: '',
    creer_utilisateur: false,
    user_role: 'commercial',
    user_password: '',
    user_is_active: true,
  }
}

async function loadReferentiels() {
  const { data } = await api.get('/rh/referentiels')
  Object.assign(referentiels, data)
}

async function loadEmploye() {
  if (!isEdit.value) return
  const { data } = await api.get(`/rh/employes/${route.params.id}`)
  Object.assign(form, emptyEmploye(), {
    ...data,
    user_id: data.user_id || null,
    departement_id: data.departement_id || null,
    poste_id: data.poste_id || null,
    date_embauche: data.date_embauche ? String(data.date_embauche).slice(0, 10) : new Date().toISOString().slice(0, 10),
    creer_utilisateur: false,
    user_role: data.user?.role || 'commercial',
    user_password: '',
    user_is_active: data.user?.is_active ?? true,
  })
}

function payload() {
  const data = { ...form }
  delete data.user
  delete data.departement
  delete data.poste
  delete data.manager
  if (data.user_id) data.creer_utilisateur = false
  if (!data.creer_utilisateur) {
    delete data.user_role
    delete data.user_password
    delete data.user_is_active
  } else if (!data.user_password) {
    delete data.user_password
  }
  return data
}

async function saveEmploye() {
  saving.value = true
  try {
    let response
    if (isEdit.value) {
      response = await api.put(`/rh/employes/${route.params.id}`, payload())
    } else {
      response = await api.post('/rh/employes', payload())
    }
    toast.success(response?.data?.password_genere ? `Fiche employé enregistrée. Mot de passe généré : ${response.data.password_genere}` : 'Fiche employé enregistrée.')
    goBack()
  } catch (error) {
    toast.error(error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || 'Enregistrement impossible.')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'rh', query: { tab: 'employes' } })
}

onMounted(async () => {
  await Promise.all([loadReferentiels(), loadEmploye()])
})
</script>
