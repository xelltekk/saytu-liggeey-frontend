<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormErrorSummary :errors="errors" :labels="errorLabels" />

    <!-- Identité -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Identité</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nom / Raison sociale <span class="text-red-500">*</span>
          </label>
          <input v-model="form.nom" type="text" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Type <span class="text-red-500">*</span>
          </label>
          <select v-model="form.type" class="input" required>
            <option value="client">Client</option>
            <option value="prospect">Prospect</option>
            <option value="fournisseur">Fournisseur</option>
            <option value="client_fournisseur">Client & Fournisseur</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select v-model="form.statut" class="input">
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="archive">Archivé</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Forme juridique</label>
          <select v-model="form.forme_juridique" class="input">
            <option value="Autre">Autre</option>
            <option value="SA">SA</option>
            <option value="SARL">SARL</option>
            <option value="SAS">SAS</option>
            <option value="SUARL">SUARL</option>
            <option value="GIE">GIE</option>
            <option value="EI">EI</option>
            <option value="ONG">ONG</option>
            <option value="Particulier">Particulier</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
          <input v-model="form.secteur_activite" type="text" class="input" placeholder="Ex: Télécommunications" />
        </div>
      </div>
    </fieldset>

    <!-- Tags -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">🏷️ Catégorisation</legend>
      <TagSelector v-model="form.tag_ids" />
    </fieldset>

    <!-- Coordonnées -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Coordonnées</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input v-model="form.adresse" type="text" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ville</label>
          <input v-model="form.ville" type="text" class="input" placeholder="Dakar" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pays</label>
          <input v-model="form.pays" type="text" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input v-model="form.telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
          <input v-model="form.mobile" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="form.email" type="email" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Site web</label>
          <input v-model="form.site_web" type="text" class="input" />
        </div>
      </div>
    </fieldset>

    <!-- Fiscalité Sénégal -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Identité fiscale (Sénégal)</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">NINEA</label>
          <input v-model="form.ninea" type="text" class="input" placeholder="Numéro NINEA" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">RCCM</label>
          <input v-model="form.rccm" type="text" class="input" placeholder="Registre Commerce" />
        </div>
      </div>
    </fieldset>

    <!-- Commercial -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Conditions commerciales</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Plafond de crédit</label>
          <input v-model.number="form.plafond_credit" type="number" class="input" step="0.01" min="0" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Délai de paiement (jours)</label>
          <input v-model.number="form.delai_paiement_jours" type="number" class="input" min="0" max="365" />
        </div>
      </div>
    </fieldset>

    <!-- Notes -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Notes</legend>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes publiques (visibles sur les documents)</label>
          <textarea v-model="form.notes_publiques" rows="2" class="input"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes privées (internes)</label>
          <textarea v-model="form.notes_privees" rows="2" class="input"></textarea>
        </div>
      </div>
    </fieldset>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">
        Annuler
      </button>
      <button type="submit" :disabled="saving" class="btn-primary">
        <span v-if="saving">Enregistrement...</span>
        <span v-else>{{ client ? 'Modifier' : 'Créer le client' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import FormErrorSummary from '@/components/FormErrorSummary.vue'
import TagSelector from '@/components/TagSelector.vue'
import { errorMessagesFromResponse, validationErrors } from '@/utils/formErrors'

const props = defineProps({
  client: { type: Object, default: null }, // null = création, objet = édition
})

const emit = defineEmits(['saved', 'cancel'])

const toast = useToast()

const defaultForm = () => ({
  nom: '',
  type: 'client',
  statut: 'actif',
  forme_juridique: 'Autre',
  secteur_activite: '',
  adresse: '',
  ville: '',
  pays: 'Sénégal',
  telephone: '',
  mobile: '',
  email: '',
  site_web: '',
  ninea: '',
  rccm: '',
  plafond_credit: 0,
  delai_paiement_jours: 30,
  notes_publiques: '',
  notes_privees: '',
  tag_ids: [],
})

const form = reactive(defaultForm())
const saving = ref(false)
const errors = ref({})
const errorLabels = {
  nom: 'Nom / raison sociale',
  type: 'Type',
  statut: 'Statut',
  forme_juridique: 'Forme juridique',
  secteur_activite: "Secteur d'activité",
  plafond_credit: 'Plafond de crédit',
  delai_paiement_jours: 'Délai de paiement',
  tag_ids: 'Catégories',
}

// Charger les valeurs du client en édition
watch(() => props.client, (newClient) => {
  if (newClient) {
    // Extraire les tag_ids depuis les objets tags du client
    const tagIds = (newClient.tags || []).map(t => t.id)
    // Assigner toutes les valeurs sauf 'tags' (on garde tag_ids à la place)
    const { tags, ...clientData } = newClient
    Object.assign(form, defaultForm(), clientData, { tag_ids: tagIds })
  } else {
    Object.assign(form, defaultForm())
  }
  errors.value = {}
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  errors.value = {}

  try {
    const payload = { ...form }

    // Nettoyer les chaînes vides (mais préserver tag_ids qui est un tableau)
    Object.keys(payload).forEach(k => {
      if (k !== 'tag_ids' && payload[k] === '') payload[k] = null
    })

    // S'assurer que tag_ids est bien un tableau
    if (! Array.isArray(payload.tag_ids)) {
      payload.tag_ids = []
    }

    let response
    if (props.client?.id) {
      response = await api.put(`/clients/${props.client.id}`, payload)
      toast.success(`Client "${response.data.nom}" mis à jour`)
    } else {
      response = await api.post('/clients', payload)
      toast.success(`Client "${response.data.nom}" créé (${response.data.code})`)
    }

    emit('saved', response.data)
  } catch (err) {
    if (err.response.status === 422) {
      errors.value = validationErrors(err)
      toast.error(errorMessagesFromResponse(err, errorLabels))
    } else {
      toast.error(err.response.data.message || 'Erreur lors de l\'enregistrement')
    }
  } finally {
    saving.value = false
  }
}
</script>
