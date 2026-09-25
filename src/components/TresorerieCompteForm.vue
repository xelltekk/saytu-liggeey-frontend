<template>
  <form class="space-y-4" @submit.prevent="saveCompte">
    <div v-if="loading" class="rounded-2xl border border-cyan-100 bg-cyan-50 p-6 text-center text-sm text-cyan-800">
      Chargement du compte...
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Code</label>
        <input v-model="form.code" class="input" required placeholder="Ex: ORABANK, CAISSE01, WAVE01" />
        <p v-if="errors.code" class="mt-1 text-xs text-red-600">{{ errors.code }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select v-model="form.type" class="input" required @change="syncModeFromType">
          <option v-for="(label, key) in types" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
        <input v-model="form.libelle" class="input" required placeholder="Ex: Compte Orabank principal" />
        <p v-if="errors.libelle" class="mt-1 text-xs text-red-600">{{ errors.libelle }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Mode de paiement lié</label>
        <select v-model="form.mode_paiement" class="input" required>
          <option value="virement">Virement</option>
          <option value="cheque">Chèque</option>
          <option value="especes">Espèces</option>
          <option value="carte_bancaire">Carte bancaire</option>
          <option value="wave">Wave</option>
          <option value="orange_money">Orange Money</option>
          <option value="free_money">Free Money</option>
          <option value="mobile_money">Mobile money</option>
          <option value="autre">Autre</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Solde initial</label>
        <input v-model.number="form.solde_initial" type="number" step="1" class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Banque / Opérateur</label>
        <input v-model="form.banque_nom" class="input" placeholder="Ex: Orabank, Wave" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Numéro compte / wallet</label>
        <input v-model="form.numero_compte" class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Titulaire</label>
        <input v-model="form.titulaire" class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
        <input v-model="form.telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
        <input v-model="form.iban" class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">BIC / SWIFT</label>
        <input v-model="form.bic_swift" class="input" />
      </div>
      <div class="md:col-span-2 flex flex-wrap gap-4">
        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input v-model="form.is_default" type="checkbox" class="rounded border-gray-300" />
          Compte par défaut pour ce mode de paiement
        </label>
        <label class="inline-flex items-center gap-2 text-sm text-gray-700">
          <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300" />
          Actif
        </label>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea v-model="form.notes" class="input min-h-24"></textarea>
      </div>
    </div>

    <div class="flex justify-end gap-2 border-t pt-4">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Annuler</button>
      <button type="submit" class="btn-primary" :disabled="saving || loading">
        {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  compteId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['saved', 'cancel'])
const toast = useToast()

const types = ref({})
const errors = reactive({})
const saving = ref(false)
const loading = ref(false)
const form = reactive(defaultForm())

function defaultForm() {
  return {
    code: '',
    libelle: '',
    type: 'banque',
    mode_paiement: 'virement',
    solde_initial: 0,
    devise: 'XOF',
    banque_nom: '',
    numero_compte: '',
    iban: '',
    bic_swift: '',
    titulaire: '',
    telephone: '',
    is_default: false,
    is_active: true,
    notes: '',
  }
}

function hydrateForm(compte) {
  Object.assign(form, {
    code: compte.code || '',
    libelle: compte.libelle || '',
    type: compte.type || 'banque',
    mode_paiement: compte.mode_paiement || 'virement',
    solde_initial: parseFloat(compte.solde_initial || 0),
    devise: compte.devise || 'XOF',
    banque_nom: compte.banque_nom || '',
    numero_compte: compte.numero_compte || '',
    iban: compte.iban || '',
    bic_swift: compte.bic_swift || '',
    titulaire: compte.titulaire || '',
    telephone: compte.telephone || '',
    is_default: !!compte.is_default,
    is_active: !!compte.is_active,
    notes: compte.notes || '',
  })
}

async function loadTypes() {
  const { data } = await api.get('/tresorerie-comptes/types')
  types.value = data
}

async function loadCompte() {
  if (!props.compteId) return
  loading.value = true
  try {
    const { data } = await api.get(`/tresorerie-comptes/${props.compteId}`)
    hydrateForm(data)
  } catch (e) {
    toast.error('Compte de trésorerie introuvable')
  } finally {
    loading.value = false
  }
}

async function saveCompte() {
  saving.value = true
  Object.keys(errors).forEach((key) => delete errors[key])
  try {
    const payload = { ...form }
    const { data } = props.compteId
      ? await api.put(`/tresorerie-comptes/${props.compteId}`, payload)
      : await api.post('/tresorerie-comptes', payload)

    toast.success(props.compteId ? 'Compte mis à jour' : 'Compte créé')
    emit('saved', data)
  } catch (err) {
    const data = err.response?.data || {}
    if (data.errors) {
      Object.entries(data.errors).forEach(([key, value]) => { errors[key] = Array.isArray(value) ? value[0] : value })
    }
    toast.error(data.message || "Erreur lors de l'enregistrement")
  } finally {
    saving.value = false
  }
}

function syncModeFromType() {
  const map = {
    banque: 'virement',
    caisse: 'especes',
    wave: 'wave',
    orange_money: 'orange_money',
    free_money: 'free_money',
    mobile_money: 'mobile_money',
    carte_bancaire: 'carte_bancaire',
    autre: 'autre',
  }
  form.mode_paiement = map[form.type] || 'virement'
}

onMounted(async () => {
  await loadTypes()
  await loadCompte()
})
</script>
