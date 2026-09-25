<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button
        type="button"
        class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900"
        @click="goBack"
      >
        ← Retour liste
      </button>

      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Compte utilisateur</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">
        {{ isCreate ? 'Nouvel utilisateur' : user?.name || 'Utilisateur' }}
      </h1>
      <p class="mt-1 text-sm text-cyan-800">
        Saisie en page complète, sans fenêtre flottante.
      </p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div class="mb-4 border-b border-cyan-100">
        <button
          type="button"
          class="-mb-px rounded-t-2xl border border-cyan-200 border-b-white bg-white px-5 py-3 text-sm font-black text-cyan-700"
        >
          Informations utilisateur
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>
      <UserForm v-else :key="user?.id || 'create'" :user="isCreate ? null : user" @saved="onSaved" @cancel="goBack" />
    </section>

    <AppModal v-model="showPasswordModal" title="🔑 Mot de passe généré" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-gray-700">Voici le mot de passe pour <strong>{{ passwordUserName }}</strong> :</p>
        <div class="rounded-lg border-2 border-blue-300 bg-blue-50 p-4 text-center">
          <div class="select-all font-mono text-2xl font-bold text-blue-900">{{ generatedPassword }}</div>
        </div>
        <p class="text-xs text-orange-600">⚠️ Notez-le maintenant ! Il ne sera plus affiché.</p>
        <button type="button" class="btn-secondary w-full" @click="copierMotDePasse">📋 Copier dans le presse-papier</button>
      </div>
      <template #footer>
        <button type="button" class="btn-primary w-full" @click="confirmPasswordSeen">
          J'ai bien noté le mot de passe
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/InlinePanelModal.vue'
import UserForm from '@/components/UserForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const user = ref(null)
const loading = ref(true)
const showPasswordModal = ref(false)
const generatedPassword = ref('')
const passwordUserName = ref('')

const isCreate = computed(() => route.name === 'utilisateur-create')

onMounted(loadUser)
watch(() => route.params.id, loadUser)

async function loadUser() {
  if (isCreate.value) {
    user.value = null
    loading.value = false
    return
  }

  if (!route.params.id) return

  loading.value = true
  try {
    const { data } = await api.get(`/users/${route.params.id}`)
    user.value = data
  } catch (error) {
    toast.error(error.response?.data?.message || 'Utilisateur introuvable.')
    router.replace({ name: 'utilisateurs' })
  } finally {
    loading.value = false
  }
}

function onSaved(payload) {
  if (payload.user?.id === auth.user?.id) {
    auth.user = payload.user
    localStorage.setItem('xelltekk_user', JSON.stringify(payload.user))
  }

  if (payload.password_genere) {
    passwordUserName.value = payload.user?.name || ''
    generatedPassword.value = payload.password_genere
    showPasswordModal.value = true
    return
  }

  goBack()
}

function confirmPasswordSeen() {
  showPasswordModal.value = false
  goBack()
}

function goBack() {
  router.push({ name: 'utilisateurs' })
}

function copierMotDePasse() {
  navigator.clipboard.writeText(generatedPassword.value)
  toast.success('Mot de passe copié !')
}
</script>
