<template>
  <form class="space-y-4" @submit.prevent="saveDepense">
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Date dépense</label>
        <input v-model="form.date_depense" type="date" class="input" required />
        <p v-if="errors.date_depense" class="mt-1 text-xs text-red-600">{{ errors.date_depense }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
        <select v-model="form.categorie" class="input" required>
          <option v-for="(label, key) in categories" :key="key" :value="key">{{ label }}</option>
        </select>
        <p v-if="errors.categorie" class="mt-1 text-xs text-red-600">{{ errors.categorie }}</p>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
        <input v-model="form.libelle" class="input" required placeholder="Ex: carburant livraison client" />
        <p v-if="errors.libelle" class="mt-1 text-xs text-red-600">{{ errors.libelle }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire / fournisseur</label>
        <input v-model="form.beneficiaire" class="input" placeholder="Nom du bénéficiaire" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Montant</label>
        <input v-model.number="form.montant" type="number" min="0" step="1" class="input" required />
        <p v-if="errors.montant" class="mt-1 text-xs text-red-600">{{ errors.montant }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Mode paiement</label>
        <select v-model="form.mode_paiement" class="input" required @change="selectCompteParDefaut">
          <option value="especes">Espèces</option>
          <option value="virement">Virement</option>
          <option value="cheque">Chèque</option>
          <option value="carte_bancaire">Carte bancaire</option>
          <option value="wave">Wave</option>
          <option value="orange_money">Orange Money</option>
          <option value="free_money">Free Money</option>
          <option value="mobile_money">Mobile money</option>
          <option value="autre">Autre</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Référence paiement</label>
        <input v-model="form.reference_paiement" class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Compte à débiter</label>
        <select v-model="form.tresorerie_compte_id" class="input">
          <option value="">Compte par défaut du mode</option>
          <option v-for="compte in comptesTresorerieFiltres" :key="compte.id" :value="compte.id">
            {{ compte.code }} - {{ compte.libelle }}{{ compte.is_default ? ' (par défaut)' : '' }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">Banque, caisse principale, Wave, Orange Money, etc.</p>
      </div>
      <div v-if="form.mode_paiement === 'especes' && canValidate">
        <label class="block text-sm font-medium text-gray-700 mb-1">Session caisse POS (optionnel)</label>
        <select v-model="form.caisse_session_id" class="input">
          <option value="">Ne pas impacter une session POS</option>
          <option v-for="session in sessionsOuvertes" :key="session.id" :value="session.id">
            {{ session.reference }} - {{ session.user?.name || 'Utilisateur' }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Justificatif</label>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" class="input" @change="onFileChange" />
        <p v-if="errors.justificatif" class="mt-1 text-xs text-red-600">{{ errors.justificatif }}</p>
      </div>
      <div v-if="canValidate" class="md:col-span-2">
        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input v-model="form.valider_directement" type="checkbox" class="rounded border-gray-300" />
          Valider directement cette dépense
        </label>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea v-model="form.notes" class="input min-h-24"></textarea>
      </div>
    </div>

    <div class="flex justify-end gap-2 border-t pt-4">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Annuler</button>
      <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
    </div>
  </form>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { hasAnyRole } from '@/utils/access'

const emit = defineEmits(['saved', 'cancel'])

const toast = useToast()
const auth = useAuthStore()
const notifications = useNotificationsStore()
const canValidate = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))

const categories = ref({})
const sessionsOuvertes = ref([])
const comptesTresorerie = ref([])
const saving = ref(false)
const errors = reactive({})
const form = reactive(defaultForm())

const comptesTresorerieFiltres = computed(() => {
  const actifs = comptesTresorerie.value.filter((compte) => compte.is_active !== false)
  const memeMode = actifs.filter((compte) => compte.mode_paiement === form.mode_paiement)
  return memeMode.length ? memeMode : actifs
})

function defaultForm() {
  return {
    date_depense: new Date().toISOString().slice(0, 10),
    categorie: 'autre',
    libelle: '',
    beneficiaire: '',
    montant: null,
    mode_paiement: 'especes',
    reference_paiement: '',
    tresorerie_compte_id: '',
    caisse_session_id: '',
    justificatif: null,
    notes: '',
    valider_directement: false,
  }
}

async function loadCategories() {
  const { data } = await api.get('/depenses/categories')
  categories.value = data
}

async function loadComptesTresorerie() {
  try {
    const { data } = await api.get('/tresorerie-comptes', { params: { is_active: 1, per_page: 100 } })
    comptesTresorerie.value = data.data || []
    selectCompteParDefaut()
  } catch (e) {
    comptesTresorerie.value = []
  }
}

async function loadSessionsOuvertes() {
  if (!canValidate.value) return
  try {
    const { data } = await api.get('/caisse/sessions', { params: { statut: 'ouverte', per_page: 100 } })
    sessionsOuvertes.value = data.data || []
  } catch (e) {}
}

function onFileChange(event) {
  form.justificatif = event.target.files?.[0] || null
}

function selectCompteParDefaut() {
  const compte = comptesTresorerie.value.find((item) => item.mode_paiement === form.mode_paiement && item.is_default)
    || comptesTresorerie.value.find((item) => item.mode_paiement === form.mode_paiement)
  form.tresorerie_compte_id = compte?.id || ''
}

async function saveDepense() {
  saving.value = true
  Object.keys(errors).forEach((key) => delete errors[key])
  try {
    const payload = new FormData()
    payload.append('date_depense', form.date_depense)
    payload.append('categorie', form.categorie)
    payload.append('libelle', form.libelle)
    payload.append('montant', form.montant)
    payload.append('mode_paiement', form.mode_paiement)
    if (form.beneficiaire) payload.append('beneficiaire', form.beneficiaire)
    if (form.reference_paiement) payload.append('reference_paiement', form.reference_paiement)
    if (form.tresorerie_compte_id) payload.append('tresorerie_compte_id', form.tresorerie_compte_id)
    if (form.caisse_session_id) payload.append('caisse_session_id', form.caisse_session_id)
    if (form.notes) payload.append('notes', form.notes)
    if (form.justificatif) payload.append('justificatif', form.justificatif)
    if (form.valider_directement) payload.append('statut', 'validee')

    const { data } = await api.post('/depenses', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    toast.success('Dépense enregistrée')
    notifications.fetchBadges()
    emit('saved', data)
  } catch (err) {
    const data = err?.response?.data || {}
    if (data.errors) {
      Object.entries(data.errors).forEach(([key, value]) => { errors[key] = Array.isArray(value) ? value[0] : value })
    }
    toast.error(data.message || 'Erreur lors de l’enregistrement')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadComptesTresorerie()
  loadSessionsOuvertes()
})
</script>
