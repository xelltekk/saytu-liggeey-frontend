<template>
  <form @submit.prevent="submit" class="space-y-4">
    <FormErrorSummary :errors="errors" :messages="errorMessages" :labels="errorLabels" />

    <div>
      <label class="label">Photo de l'utilisateur</label>
      <div class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center">
        <div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-bold text-slate-500">
          <img v-if="photoPreviewUrl" :src="photoPreviewUrl" alt="Photo utilisateur" class="h-full w-full object-cover" />
          <span v-else>{{ initiales(form.name) || 'U' }}</span>
        </div>

        <div class="min-w-0 flex-1 space-y-2">
          <input ref="photoInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onPhotoSelected" />
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary text-sm" @click="photoInput.click()">
              Choisir une photo
            </button>
            <button v-if="photoPreviewUrl" type="button" class="btn-secondary text-sm" @click="retirerPhoto">
              Retirer
            </button>
          </div>
          <p class="text-xs text-gray-500">PNG, JPG ou WEBP. Taille maximale : 2 Mo.</p>
        </div>
      </div>
    </div>

    <div>
      <label class="label">Nom complet <span class="text-red-500">*</span></label>
      <input v-model="form.name" type="text" class="input" required placeholder="Ex: Aminata DIOP" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="label">Email <span class="text-red-500">*</span></label>
        <input v-model="form.email" type="email" class="input" required placeholder="prenom.nom@xelltekk.com" />
      </div>
      <div>
        <label class="label">Téléphone</label>
        <input v-model="form.phone" type="text" class="input" placeholder="+221 77 ..." />
      </div>
    </div>

    <div>
      <label class="label">Rôle <span class="text-red-500">*</span></label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label v-for="r in roles" :key="r.value" class="cursor-pointer">
          <input type="radio" v-model="form.role" :value="r.value" class="sr-only peer" />
          <div class="border-2 border-gray-200 rounded-lg p-3 peer-checked:border-xelltekk-500 peer-checked:bg-xelltekk-50 transition-colors">
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ r.emoji }}</span>
              <div>
                <div class="font-semibold text-sm">{{ r.label }}</div>
                <div class="text-xs text-gray-600">{{ r.description }}</div>
              </div>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Mot de passe (uniquement en création) -->
    <div v-if="!user">
      <label class="label">Mot de passe</label>
      <div class="space-y-2">
        <label class="flex items-center gap-2">
          <input type="radio" v-model="passwordMode" value="generate" />
          <span class="text-sm">🎲 Générer automatiquement (recommandé)</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="radio" v-model="passwordMode" value="custom" />
          <span class="text-sm">✍️ Définir un mot de passe</span>
        </label>
        <input v-if="passwordMode === 'custom'" v-model="form.password" type="text" class="input" placeholder="Min. 6 caractères" />
      </div>
    </div>

    <div>
      <label class="flex items-center gap-2">
        <input v-model="form.is_active" type="checkbox" class="h-4 w-4" />
        <span class="text-sm">Utilisateur actif (peut se connecter)</span>
      </label>
    </div>

    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Annuler</button>
      <button type="submit" :disabled="saving" class="btn-primary">
        <span v-if="saving">⏳ Enregistrement...</span>
        <span v-else>{{ user ? 'Modifier' : 'Créer' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import FormErrorSummary from '@/components/FormErrorSummary.vue'
import { errorMessagesFromResponse, validationErrors } from '@/utils/formErrors'

const props = defineProps({ user: Object })
const emit = defineEmits(['saved', 'cancel'])
const toast = useToast()

const roles = [
  { value: 'admin', label: 'Administrateur', emoji: '🔴', description: 'Accès total' },
  { value: 'gerant', label: 'Gérant', emoji: '🟣', description: 'Pilotage métier' },
  { value: 'commercial', label: 'Commercial', emoji: '🟢', description: 'Ventes' },
  { value: 'magasinier', label: 'Gestionnaire de stock', emoji: '🔵', description: 'Stock, produits et entrepots' },
  { value: 'comptable', label: 'Comptable', emoji: '🟡', description: 'Comptabilité' },
  { value: 'caissier', label: 'Caissier', emoji: '', description: 'Caisse boutique' },
]

const form = reactive({
  name: '', email: '', phone: '', role: 'commercial',
  password: '', is_active: true, photo: '',
})
const passwordMode = ref('generate')
const saving = ref(false)
const errors = ref({})
const errorMessages = ref([])
const photoInput = ref(null)
const selectedPhoto = ref(null)
const selectedPhotoPreview = ref('')
const removePhoto = ref(false)
const errorLabels = {
  name: 'Nom complet',
  email: 'Email',
  phone: 'Téléphone',
  role: 'Rôle',
  password: 'Mot de passe',
  photo: 'Photo',
}

const photoPreviewUrl = computed(() => {
  if (selectedPhotoPreview.value) return selectedPhotoPreview.value
  if (!form.photo || removePhoto.value) return ''
  if (form.photo.startsWith('http')) return form.photo
  return form.photo
})

onMounted(() => {
  if (props.user) {
    Object.assign(form, {
      name: props.user.name, email: props.user.email, phone: props.user.phone || '',
      role: props.user.role, is_active: props.user.is_active !== false, photo: props.user.photo || '',
    })
  }
})

function onPhotoSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    errorMessages.value = ['La photo dépasse 2 Mo.']
    if (photoInput.value) photoInput.value.value = ''
    return
  }

  selectedPhoto.value = file
  removePhoto.value = false
  if (selectedPhotoPreview.value) URL.revokeObjectURL(selectedPhotoPreview.value)
  selectedPhotoPreview.value = URL.createObjectURL(file)
}

function retirerPhoto() {
  selectedPhoto.value = null
  removePhoto.value = true
  form.photo = ''
  if (selectedPhotoPreview.value) {
    URL.revokeObjectURL(selectedPhotoPreview.value)
    selectedPhotoPreview.value = ''
  }
  if (photoInput.value) photoInput.value.value = ''
}

function initiales(name) {
  return (name || '')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function syncPhoto(userId, payload) {
  let nextPayload = payload

  if (removePhoto.value && props.user.photo && !selectedPhoto.value) {
    const { data } = await api.delete(`/users/${userId}/photo`)
    nextPayload = { ...nextPayload, user: data.user }
  }

  if (selectedPhoto.value) {
    const formData = new FormData()
    formData.append('photo', selectedPhoto.value)
    const { data } = await api.post(`/users/${userId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    nextPayload = { ...nextPayload, user: data.user }
  }

  return nextPayload
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessages.value = []
  try {
    if (props.user) {
      const { data } = await api.put(`/users/${props.user.id}`, {
        name: form.name, email: form.email, phone: form.phone,
        role: form.role, is_active: form.is_active,
      })
      const payload = await syncPhoto(props.user.id, data)
      emit('saved', payload)
    } else {
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        role: form.role, is_active: form.is_active,
      }
      if (passwordMode.value === 'custom') {
        payload.password = form.password
      } else {
        payload.generate_password = true
      }
      const { data } = await api.post('/users', payload)
      const savedPayload = await syncPhoto(data.user.id, data)
      emit('saved', savedPayload)
    }
  } catch (err) {
    errors.value = validationErrors(err)
    if (!Object.keys(errors.value).length) {
      errorMessages.value = errorMessagesFromResponse(err, errorLabels)
    }
    toast.error(errorMessages.value.length ? errorMessages.value : errorMessagesFromResponse(err, errorLabels))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.label { @apply block text-sm font-medium text-gray-700 mb-1; }
</style>
