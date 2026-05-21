<template>
  <form @submit.prevent="submit" class="space-y-4">
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

    <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded text-sm text-red-700 p-3">
      {{ errorMessage }}
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
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps({ user: Object })
const emit = defineEmits(['saved', 'cancel'])

const roles = [
  { value: 'admin', label: 'Administrateur', emoji: '🔴', description: 'Accès total' },
  { value: 'commercial', label: 'Commercial', emoji: '🟢', description: 'Ventes' },
  { value: 'magasinier', label: 'Magasinier', emoji: '🔵', description: 'Stock' },
  { value: 'comptable', label: 'Comptable', emoji: '🟡', description: 'Comptabilité' },
  { value: 'caissier', label: 'Caissier', emoji: '', description: 'Caisse boutique' },
]

const form = reactive({
  name: '', email: '', phone: '', role: 'commercial',
  password: '', is_active: true,
})
const passwordMode = ref('generate')
const saving = ref(false)
const errorMessage = ref('')

onMounted(() => {
  if (props.user) {
    Object.assign(form, {
      name: props.user.name, email: props.user.email, phone: props.user.phone || '',
      role: props.user.role, is_active: props.user.is_active !== false,
    })
  }
})

async function submit() {
  saving.value = true
  errorMessage.value = ''
  try {
    if (props.user) {
      const { data } = await api.put(`/users/${props.user.id}`, {
        name: form.name, email: form.email, phone: form.phone,
        role: form.role, is_active: form.is_active,
      })
      emit('saved', data)
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
      emit('saved', data)
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement'
    if (err.response?.data?.errors) {
      const errs = Object.values(err.response.data.errors).flat()
      errorMessage.value = errs.join(' • ')
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.label { @apply block text-sm font-medium text-gray-700 mb-1; }
</style>
