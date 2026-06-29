<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormErrorSummary :errors="errors" :labels="errorLabels" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Code <span class="text-red-500">*</span>
        </label>
        <input v-model="form.code" type="text" class="input" required placeholder="PRINCIPAL, SAV..." />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Libellé <span class="text-red-500">*</span>
        </label>
        <input v-model="form.libelle" type="text" class="input" required />
      </div>

      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea v-model="form.description" rows="2" class="input"></textarea>
      </div>

      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <input v-model="form.adresse" type="text" class="input" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Ville</label>
        <input v-model="form.ville" type="text" class="input" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Pays</label>
        <input v-model="form.pays" type="text" class="input" />
      </div>

      <div class="md:col-span-2 flex items-center">
        <input v-model="form.is_active" type="checkbox" id="is_active" class="mr-2 h-4 w-4" />
        <label for="is_active" class="text-sm">Entrepôt actif</label>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Annuler</button>
      <button type="submit" :disabled="saving" class="btn-primary">
        <span v-if="saving">...</span><span v-else>{{ entrepot ? 'Modifier' : 'Créer' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import FormErrorSummary from '@/components/FormErrorSummary.vue'
import { errorMessagesFromResponse, validationErrors } from '@/utils/formErrors'

const props = defineProps({ entrepot: { type: Object, default: null } })
const emit = defineEmits(['saved', 'cancel'])
const toast = useToast()

const form = reactive({
  code: '', libelle: '', description: '',
  adresse: '', ville: '', pays: 'Sénégal',
  is_active: true,
})
const saving = ref(false)
const errors = ref({})
const errorLabels = {
  code: 'Code',
  libelle: 'Libellé',
  description: 'Description',
  adresse: 'Adresse',
  ville: 'Ville',
  pays: 'Pays',
}

watch(() => props.entrepot, (val) => {
  if (val) Object.assign(form, val)
  else Object.assign(form, { code: '', libelle: '', description: '', adresse: '', ville: '', pays: 'Sénégal', is_active: true })
  errors.value = {}
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  errors.value = {}
  try {
    let response
    if (props.entrepot?.id) {
      response = await api.put(`/entrepots/${props.entrepot.id}`, form)
      toast.success('Entrepôt mis à jour')
    } else {
      response = await api.post('/entrepots', form)
      toast.success('Entrepôt créé')
    }
    emit('saved', response.data)
  } catch (err) {
    if (err.response.status === 422) {
      errors.value = validationErrors(err)
      toast.error(errorMessagesFromResponse(err, errorLabels))
    } else {
      toast.error(err.response.data.message || 'Erreur')
    }
  } finally {
    saving.value = false
  }
}
</script>
