<template>
  <div class="auth-shell flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <div class="auth-card relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] lg:grid-cols-[1.08fr_0.92fr]">
      <section class="auth-hero hidden flex-col justify-between p-8 text-white lg:flex xl:p-10">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            ERP Xelltekk
          </div>

          <div class="mt-10 max-w-xl">
            <h1 class="text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              Une expérience plus claire, plus rapide, plus agréable.
            </h1>
            <p class="mt-4 max-w-lg text-base leading-7 text-slate-200 xl:text-lg">
              Retrouvez vos ventes, achats, stock, caisse et facturation dans un espace plus lisible,
              avec une navigation plus fluide et un meilleur confort d’utilisation.
            </p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p class="text-xs font-semibold uppercase tracking-wide text-cyan-100">Pilotage</p>
            <p class="mt-2 text-sm text-white/90">Vue plus lisible pour les indicateurs clés.</p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p class="text-xs font-semibold uppercase tracking-wide text-cyan-100">Rapidité</p>
            <p class="mt-2 text-sm text-white/90">Actions plus accessibles et moins de friction.</p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p class="text-xs font-semibold uppercase tracking-wide text-cyan-100">Confort</p>
            <p class="mt-2 text-sm text-white/90">Interface adaptée au bureau comme au mobile.</p>
          </div>
        </div>
      </section>

      <section class="flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-12 dark:bg-slate-950">
        <div class="w-full max-w-md">
          <div class="mb-8 text-center">
            <div v-if="logoUrl" class="mb-5 flex justify-center">
              <img
                :src="logoUrl"
                :alt="identity.nom || 'Saytu Liggéey 2.0'"
                class="max-h-20 max-w-52 object-contain"
              />
            </div>
            <div v-else class="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-xelltekk-600 to-xelltekk-700 shadow-lg">
              <span class="text-3xl font-black text-white">X</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Saytu Liggéey 2.0</h1>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Connectez-vous à votre espace de travail.</p>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
              <input
                v-model="form.email"
                type="email"
                class="input"
                placeholder="votre@email.com"
                autocomplete="username"
                required
                autofocus
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">Mot de passe</label>
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="input pr-12"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  :title="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="h-5 w-5" />
                  <Eye v-else class="h-5 w-5" />
                </button>
              </div>
            </div>

            <label class="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                v-model="rememberEmail"
                type="checkbox"
                class="rounded border-slate-300 text-xelltekk-600 focus:ring-xelltekk-500"
              />
              Se souvenir de mon email sur ce navigateur
            </label>

            <div v-if="sessionExpired" class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-200">
              Votre session a expiré après 30 minutes d'inactivité. Veuillez vous reconnecter.
            </div>

            <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200">
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span v-if="loading">Connexion...</span>
              <span v-else>Se connecter</span>
            </button>
          </form>

          <div class="mt-6 text-center text-xs text-slate-400">
            © 2026 Saytu Liggéey 2.0 – Dakar, Sénégal
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
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
