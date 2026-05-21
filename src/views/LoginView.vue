<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-xelltekk-800 via-xelltekk-700 to-xelltekk-900 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <!-- Logo / Titre -->
      <div class="text-center mb-8">
        <div v-if="logoUrl" class="mb-4 flex justify-center">
          <img
            :src="logoUrl"
            :alt="identity.nom || 'Saytu Liggéey 2.0'"
            class="max-h-20 max-w-48 object-contain"
          />
        </div>
        <div v-else class="inline-flex items-center justify-center w-16 h-16 bg-xelltekk-600 rounded-2xl mb-4">
          <span class="text-white text-3xl font-bold">X</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Saytu Liggéey 2.0</h1>
        <p class="text-sm text-gray-500 mt-1">Connectez-vous à votre espace</p>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="input"
            placeholder="admin@xelltekk.sn"
            required
            autofocus
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input
            v-model="form.password"
            type="password"
            class="input"
            placeholder="••••••••"
            required
          />
        </div>

        <!-- Erreur -->
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Connexion...</span>
          <span v-else>Se connecter</span>
        </button>
      </form>

      <div class="mt-6 text-center text-xs text-gray-400">
        © 2026 Saytu Liggéey 2.0 – Dakar, Sénégal
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  email: 'admin@xelltekk.sn',
  password: 'xelltekk2026',
})

const loading = ref(false)
const error = ref(null)
const identity = reactive({
  nom: 'Saytu Liggéey 2.0',
  logo: '',
})

const logoUrl = computed(() => {
  if (!identity.logo) return ''
  if (identity.logo.startsWith('http')) return identity.logo

  return `http://localhost:8000${identity.logo}`
})

async function loadIdentity() {
  try {
    const { data } = await api.get('/societe/identite')
    Object.assign(identity, data)
  } catch (err) {
    identity.logo = ''
  }
}

async function handleLogin() {
  loading.value = true
  error.value = null
  try {
    const data = await auth.login(form.email, form.password)
    if (data.user?.role === 'caissier') {
      await entrerPleinEcran()
    }
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.response?.data?.message
      || err.response?.data?.errors?.email?.[0]
      || 'Erreur de connexion. Vérifiez vos identifiants.'
  } finally {
    loading.value = false
  }
}

async function entrerPleinEcran() {
  if (typeof document === 'undefined' || document.fullscreenElement) return
  try {
    await document.documentElement.requestFullscreen()
  } catch (e) {
    // Certains navigateurs bloquent le plein ecran automatique.
  }
}

onMounted(() => {
  loadIdentity()
})
</script>
