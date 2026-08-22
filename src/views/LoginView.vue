<template>
  <div class="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#14384a] px-4 py-8 sm:px-6 lg:px-8">
    <div class="pointer-events-none absolute inset-0 opacity-95">
      <div class="absolute -left-32 top-20 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl"></div>
      <div class="absolute -right-24 bottom-16 h-96 w-96 rounded-full bg-blue-600/35 blur-3xl"></div>
      <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-400/25 via-blue-600/15 to-transparent"></div>
    </div>

    <section class="relative w-full max-w-[430px] overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/30">
      <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-br from-blue-600 via-cyan-400 to-teal-300"></div>
      <div class="absolute inset-x-0 bottom-0 h-28 rounded-t-[55%] bg-white"></div>

      <div class="relative px-7 pb-10 pt-9 sm:px-9">
        <div class="mb-7 flex flex-col items-center text-center">
          <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-cyan-100 bg-white shadow-lg shadow-cyan-100">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              :alt="identity.nom || 'Saytu Ligg&eacute;ey 2.0'"
              class="max-h-14 max-w-16 object-contain"
            />
            <UserCircle v-else class="h-12 w-12 text-blue-600" />
          </div>
          <p class="text-sm font-bold uppercase tracking-[0.22em] text-cyan-600">Xelltekk ERP</p>
          <h1 class="mt-2 text-2xl font-black text-slate-900">Connexion</h1>
          <p class="mt-1 text-sm text-slate-500">Acc&eacute;dez &agrave; votre espace Saytu Ligg&eacute;ey 2.0</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
            <div class="login-input-shell">
              <div class="flex h-full min-h-11 w-full items-center rounded-full bg-white px-4">
                <Mail class="mr-3 h-5 w-5 text-blue-600" />
                <input
                  v-model="form.email"
                  type="email"
                  class="login-input"
                  placeholder="votre@email.com"
                  autocomplete="username"
                  required
                  autofocus
                />
              </div>
            </div>
          </label>

          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mot de passe</span>
            <div class="login-input-shell">
              <div class="flex h-full min-h-11 w-full items-center rounded-full bg-white px-4">
                <LockKeyhole class="mr-3 h-5 w-5 text-blue-600" />
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="login-input"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  :title="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="h-5 w-5" />
                  <Eye v-else class="h-5 w-5" />
                </button>
              </div>
            </div>
          </label>

          <div class="flex items-center justify-between gap-3 text-xs text-slate-500">
            <label class="inline-flex items-center gap-2">
              <input
                v-model="rememberEmail"
                type="checkbox"
                class="rounded-full border-slate-300 text-blue-600 focus:ring-cyan-400"
              />
              Se souvenir de mon email
            </label>
          </div>

          <div v-if="sessionExpired" class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Votre session a expir&eacute; apr&egrave;s 30 minutes d'inactivit&eacute;. Veuillez vous reconnecter.
          </div>

          <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="mt-2 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-6 py-3 text-base font-black text-white shadow-xl shadow-cyan-100 transition hover:-translate-y-0.5 hover:shadow-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="loading">Connexion...</span>
            <span v-else>Se connecter</span>
          </button>
        </form>

        <p class="relative z-10 mt-16 text-center text-xs font-medium text-slate-500">
          &copy; 2026 Saytu Ligg&eacute;ey 2.0 - Dakar, S&eacute;n&eacute;gal
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole, Mail, UserCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const REMEMBER_EMAIL_KEY = 'saytu_login_email'

const form = reactive({
  email: '',
  password: '',
})

const loading = ref(false)
const error = ref(null)
const showPassword = ref(false)
const rememberEmail = ref(false)
const sessionExpired = computed(() => route.query.expired === '1')
const identity = reactive({
  nom: 'Saytu Liggéey 2.0',
  logo: '',
})

const logoUrl = computed(() => {
  if (!identity.logo) return ''
  if (identity.logo.startsWith('http')) return identity.logo

  return identity.logo
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
    if (rememberEmail.value) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, form.email)
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY)
    }
    if (data.user?.role === 'caissier') {
      await entrerPleinEcran()
    }
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.response.data.message
      || err.response.data.errors.email?.[0]
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
    // Certains navigateurs bloquent le plein écran automatique.
  }
}

onMounted(() => {
  loadIdentity()
  const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
  if (savedEmail) {
    form.email = savedEmail
    rememberEmail.value = true
  }
})
</script>

<style scoped>
.login-input-shell {
  display: flex;
  min-height: 3rem;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgb(226 232 240);
  background: #ffffff;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.05);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.login-input-shell:focus-within {
  border-color: rgb(203 213 225);
  box-shadow: 0 10px 24px rgb(15 23 42 / 0.08);
}

.login-input {
  min-width: 0;
  flex: 1;
  border: 0;
  background: #ffffff !important;
  color: rgb(15 23 42);
  font-size: 0.875rem;
  font-weight: 500;
  outline: none;
  box-shadow: none !important;
}

.login-input::placeholder {
  color: rgb(148 163 184);
}

.login-input:focus {
  outline: none;
  box-shadow: none !important;
}

.login-input:-webkit-autofill,
.login-input:-webkit-autofill:hover,
.login-input:-webkit-autofill:focus,
.login-input:-webkit-autofill:active {
  -webkit-text-fill-color: rgb(15 23 42);
  caret-color: rgb(15 23 42);
  box-shadow: 0 0 0 1000px #ffffff inset !important;
  transition: background-color 9999s ease-out 0s;
}
</style>
