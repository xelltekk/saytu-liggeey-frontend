<template>
  <form class="space-y-4" @submit.prevent="saveCategory">
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-semibold text-slate-700">Libellé *</label>
        <input v-model="form.libelle" class="input" required placeholder="Ex : Imprimantes" @input="syncCodeFromLabel" />
        <p v-if="errors.libelle" class="mt-1 text-xs text-red-600">{{ errors.libelle }}</p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-semibold text-slate-700">Code *</label>
        <input v-model="form.code" class="input font-mono uppercase" required placeholder="EX : IMPRIMANTES" @input="codeTouched = true" />
        <p v-if="errors.code" class="mt-1 text-xs text-red-600">{{ errors.code }}</p>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-semibold text-slate-700">Catégorie parent</label>
        <select v-model="form.parent_id" class="input">
          <option value="">Aucun parent</option>
          <option
            v-for="category in parentOptions"
            :key="category.id"
            :value="category.id"
          >
            {{ '— '.repeat(category.level) }}{{ category.libelle }}
          </option>
        </select>
        <p v-if="errors.parent_id" class="mt-1 text-xs text-red-600">{{ errors.parent_id }}</p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-semibold text-slate-700">Statut</label>
        <select v-model="form.is_active" class="input">
          <option :value="true">Actif</option>
          <option :value="false">Inactif</option>
        </select>
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-semibold text-slate-700">Description</label>
      <textarea v-model="form.description" class="input min-h-[120px]" placeholder="Description optionnelle"></textarea>
    </div>

    <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Annuler</button>
      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  category: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['saved', 'cancel'])
const toast = useToast()

const saving = ref(false)
const categories = ref([])
const codeTouched = ref(false)
const errors = reactive({})
const form = reactive(emptyForm())

const flatCategories = computed(() => flattenCategories(categories.value))
const parentOptions = computed(() => flatCategories.value.filter((category) => category.id !== form.id))

watch(() => props.category, fillForm, { immediate: true })

function emptyForm() {
  return {
    id: null,
    code: '',
    libelle: '',
    parent_id: '',
    description: '',
    is_active: true,
  }
}

function fillForm(category) {
  Object.assign(form, {
    id: category?.id || null,
    code: category?.code || '',
    libelle: category?.libelle || '',
    parent_id: category?.parent_id || '',
    description: category?.description || '',
    is_active: category?.is_active !== false,
  })
  codeTouched.value = Boolean(category?.id)
  clearErrors()
}

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

async function loadCategories() {
  try {
    const { data } = await api.get('/categories-produits')
    categories.value = Array.isArray(data) ? data : []
  } catch (error) {
    categories.value = []
  }
}

function flattenCategories(items, level = 0, parent = null) {
  return (items || []).flatMap((category) => {
    const normalized = {
      ...category,
      level,
      parent_label: parent?.libelle || '',
    }

    return [
      normalized,
      ...flattenCategories(category.enfants || [], level + 1, category),
    ]
  })
}

async function saveCategory() {
  clearErrors()
  saving.value = true

  const payload = {
    code: normalizeCode(form.code || form.libelle),
    libelle: String(form.libelle || '').trim(),
    parent_id: form.parent_id || null,
    description: String(form.description || '').trim() || null,
    is_active: Boolean(form.is_active),
  }

  try {
    const { data } = form.id
      ? await api.put(`/categories-produits/${form.id}`, payload)
      : await api.post('/categories-produits', payload)

    toast.success(form.id ? 'Catégorie modifiée.' : 'Catégorie créée.')
    emit('saved', data)
  } catch (error) {
    const responseErrors = error.response?.data?.errors || {}
    Object.entries(responseErrors).forEach(([key, messages]) => {
      errors[key] = Array.isArray(messages) ? messages[0] : messages
    })
    toast.error(error.response?.data?.message || 'Enregistrement impossible.')
  } finally {
    saving.value = false
  }
}

function syncCodeFromLabel() {
  if (codeTouched.value || form.code) return
  form.code = normalizeCode(form.libelle)
}

function normalizeCode(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)
    .toUpperCase()
}

onMounted(loadCategories)
</script>
