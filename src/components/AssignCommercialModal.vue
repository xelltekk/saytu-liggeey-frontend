<template>
  <AppModal v-model="visible" :title="title" size="md">
    <form class="space-y-4" @submit.prevent="submit">
      <div class="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
        {{ itemLabel }}
      </div>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-700">Nouveau commercial</span>
        <select v-model.number="commercialId" required class="input">
          <option :value="null">Choisir un commercial...</option>
          <option v-for="commercial in commerciaux" :key="commercial.id" :value="commercial.id">
            {{ commercial.name }}
          </option>
        </select>
      </label>

      <div class="flex justify-end gap-2 border-t border-gray-200 pt-3">
        <button type="button" @click="visible = false" class="btn-secondary">Annuler</button>
        <button type="submit" :disabled="saving || !commercialId" class="btn-primary">
          {{ saving ? 'Affectation...' : 'Affecter' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Affecter à un commercial' },
  itemLabel: { type: String, default: '' },
  currentCommercialId: { type: [Number, String], default: null },
  endpoint: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue', 'assigned'])
const toast = useToast()

const commerciaux = ref([])
const commercialId = ref(null)
const saving = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

watch(() => props.modelValue, async (isOpen) => {
  if (!isOpen) return
  commercialId.value = props.currentCommercialId ? Number(props.currentCommercialId) : null
  if (!commerciaux.value.length) {
    const { data } = await api.get('/prospection/commerciaux')
    commerciaux.value = data || []
  }
})

async function submit() {
  saving.value = true
  try {
    const { data } = await api.put(props.endpoint, { commercial_id: commercialId.value })
    toast.success('Affectation mise à jour')
    emit('assigned', data)
    visible.value = false
  } catch (e) {
    toast.error(e.response.data.message || 'Erreur affectation')
  } finally {
    saving.value = false
  }
}
</script>
