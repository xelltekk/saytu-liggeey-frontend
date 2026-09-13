<template>
  <div class="space-y-4">
    <section class="onboarding-hero rounded-2xl border p-4 shadow-sm sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--saytu-primary,#2563eb)]">
            Assistant de démarrage
          </p>
          <h1 class="mt-1 text-2xl font-black text-slate-950">
            Préparer {{ onboarding.societe?.nom || 'votre espace client' }}
          </h1>
          <p class="mt-1 max-w-3xl text-sm text-slate-600">
            Quelques contrôles rapides pour démarrer proprement : sécurité, identité entreprise, stock, caisse et équipe.
          </p>
        </div>

        <div class="min-w-[220px] rounded-2xl border border-white/70 bg-white/75 p-3">
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold text-slate-700">Progression</span>
            <strong class="text-lg text-[color:var(--saytu-primary,#2563eb)]">{{ onboarding.progress || 0 }}%</strong>
          </div>
          <div class="mt-2 h-2 rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all" :style="{ width: `${onboarding.progress || 0}%` }"></div>
          </div>
          <p v-if="onboarding.completed" class="mt-2 text-xs font-semibold text-emerald-600">Démarrage terminé.</p>
          <p v-else class="mt-2 text-xs text-slate-500">Vous pouvez continuer à utiliser l’application pendant la configuration.</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="grid gap-3 lg:grid-cols-2">
      <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"></div>
    </div>

    <template v-else>
      <section
        v-if="onboarding.must_change_password"
        id="mot-de-passe"
        class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="text-lg font-black">Mot de passe temporaire détecté</h2>
            <p class="mt-1 text-sm">Pour protéger l’espace client, changez ce mot de passe avant de transmettre l’accès à votre équipe.</p>
          </div>
          <button type="button" class="btn-secondary shrink-0" @click="showPasswordForm = !showPasswordForm">
            {{ showPasswordForm ? 'Masquer' : 'Changer le mot de passe' }}
          </button>
        </div>

        <form v-if="showPasswordForm" class="mt-4 grid gap-3 rounded-2xl bg-white/70 p-3 md:grid-cols-3" @submit.prevent="changePassword">
          <label class="field-label">
            Mot de passe actuel
            <input v-model="passwordForm.current_password" type="password" class="input mt-1" autocomplete="current-password" required />
          </label>
          <label class="field-label">
            Nouveau mot de passe
            <input v-model="passwordForm.password" type="password" class="input mt-1" autocomplete="new-password" minlength="8" required />
          </label>
          <label class="field-label">
            Confirmer
            <input v-model="passwordForm.password_confirmation" type="password" class="input mt-1" autocomplete="new-password" minlength="8" required />
          </label>
          <div class="flex justify-end md:col-span-3">
            <button type="submit" class="btn-primary" :disabled="savingPassword">
              {{ savingPassword ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe' }}
            </button>
          </div>
        </form>
      </section>

      <section id="societe" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-black text-slate-950">Identité de l’entreprise</h2>
            <p class="text-sm text-slate-500">Ces informations apparaissent sur les devis, factures et reçus.</p>
          </div>
          <RouterLink to="/parametres" class="btn-secondary inline-flex justify-center">Paramètres complets</RouterLink>
        </div>

        <form class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" @submit.prevent="saveCompany">
          <label class="field-label xl:col-span-2">
            Nom entreprise
            <input v-model="companyForm.nom" class="input mt-1" required />
          </label>
          <label class="field-label">
            Email
            <input v-model="companyForm.email" type="email" class="input mt-1" />
          </label>
          <label class="field-label">
            Téléphone
            <input v-model="companyForm.telephone" type="tel" class="input mt-1" />
          </label>
          <label class="field-label xl:col-span-2">
            Adresse
            <input v-model="companyForm.adresse" class="input mt-1" />
          </label>
          <label class="field-label">
            Ville
            <input v-model="companyForm.ville" class="input mt-1" />
          </label>
          <label class="field-label">
            Devise
            <select v-model="companyForm.devise_defaut" class="input mt-1">
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <div class="flex items-end justify-end xl:col-span-4">
            <button type="submit" class="btn-primary" :disabled="savingCompany">
              {{ savingCompany ? 'Enregistrement...' : 'Enregistrer l’identité' }}
            </button>
          </div>
        </form>
      </section>

      <section class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <article v-for="step in onboarding.steps" :key="step.key" class="onboarding-card rounded-2xl border bg-white p-4 shadow-sm" :class="cardClass(step)">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl" :class="iconClass(step)">
              <CheckCircle2 v-if="step.status === 'done'" class="h-5 w-5" />
              <CircleDashed v-else-if="step.status === 'skipped'" class="h-5 w-5" />
              <Circle v-else class="h-5 w-5" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-black text-slate-950">{{ step.title }}</h3>
                <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="statusClass(step)">
                  {{ statusLabel(step) }}
                </span>
              </div>
              <p class="mt-1 text-sm text-slate-500">{{ step.description }}</p>
              <p v-if="step.key === 'stock'" class="mt-2 text-xs text-slate-500">
                {{ onboarding.counts?.entrepots || 0 }} entrepôt(s), {{ onboarding.counts?.categories || 0 }} catégorie(s)
              </p>
              <p v-if="step.key === 'catalogue'" class="mt-2 text-xs text-slate-500">
                {{ onboarding.counts?.produits || 0 }} produit(s)
              </p>
              <p v-if="step.key === 'users'" class="mt-2 text-xs text-slate-500">
                {{ onboarding.counts?.users || 0 }} utilisateur(s) actif(s)
              </p>
              <p v-if="step.key === 'caisse'" class="mt-2 text-xs text-slate-500">
                {{ onboarding.counts?.comptes_tresorerie || 0 }} compte(s) de trésorerie
              </p>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <RouterLink v-if="step.route && step.key !== 'password' && step.key !== 'societe'" :to="step.route" class="btn-secondary px-3 py-2 text-xs">
              {{ step.action_label || 'Ouvrir' }}
            </RouterLink>
            <button
              v-if="step.manual && step.status !== 'done'"
              type="button"
              class="btn-primary px-3 py-2 text-xs"
              @click="updateStep(step.key, 'done')"
            >
              Marquer fait
            </button>
            <button
              v-if="step.manual && !step.required && step.status !== 'skipped' && step.status !== 'done'"
              type="button"
              class="btn-secondary px-3 py-2 text-xs"
              @click="updateStep(step.key, 'skipped')"
            >
              Plus tard
            </button>
            <button
              v-if="step.manual && ['done', 'skipped'].includes(step.status) && !step.auto_done"
              type="button"
              class="text-xs font-bold text-slate-500 underline-offset-4 hover:underline"
              @click="updateStep(step.key, 'todo')"
            >
              Réouvrir
            </button>
          </div>
        </article>
      </section>

      <section class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="font-black text-slate-950">Prêt à travailler ?</h2>
          <p class="text-sm text-slate-500">Vous pouvez clôturer l’assistant dès que les étapes obligatoires sont terminées.</p>
        </div>
        <div class="flex flex-wrap justify-end gap-2">
          <RouterLink to="/" class="btn-secondary">Continuer vers l’application</RouterLink>
          <button type="button" class="btn-primary" :disabled="completing || hasMissingRequired" @click="completeOnboarding">
            {{ completing ? 'Validation...' : 'Terminer le démarrage' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CheckCircle2, Circle, CircleDashed } from 'lucide-vue-next'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const toast = useToast()

const loading = ref(false)
const savingPassword = ref(false)
const savingCompany = ref(false)
const completing = ref(false)
const showPasswordForm = ref(false)

const onboarding = reactive({
  enabled: false,
  completed: false,
  progress: 0,
  must_change_password: false,
  steps: [],
  counts: {},
  societe: {},
})

const passwordForm = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const companyForm = reactive({
  nom: '',
  email: '',
  telephone: '',
  adresse: '',
  ville: '',
  devise_defaut: 'XOF',
})

const hasMissingRequired = computed(() => onboarding.steps.some((step) => step.required && step.status !== 'done'))

async function loadOnboarding() {
  loading.value = true
  try {
    const { data } = await api.get('/onboarding')
    hydrate(data)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de charger l’assistant de démarrage.')
  } finally {
    loading.value = false
  }
}

function hydrate(data) {
  Object.assign(onboarding, {
    enabled: data.enabled,
    completed: data.completed,
    progress: data.progress,
    must_change_password: data.must_change_password,
    steps: data.steps || [],
    counts: data.counts || {},
    societe: data.societe || {},
  })

  Object.assign(companyForm, {
    nom: data.societe?.nom || '',
    email: data.societe?.email || '',
    telephone: data.societe?.telephone || data.societe?.mobile || '',
    adresse: data.societe?.adresse || '',
    ville: data.societe?.ville || '',
    devise_defaut: data.societe?.devise_defaut || 'XOF',
  })

  showPasswordForm.value = Boolean(data.must_change_password)
}

async function changePassword() {
  if (passwordForm.password !== passwordForm.password_confirmation) {
    toast.error('La confirmation ne correspond pas au nouveau mot de passe.')
    return
  }

  savingPassword.value = true
  try {
    const { data } = await api.put('/auth/password', { ...passwordForm })
    auth.user = data.user
    localStorage.setItem('xelltekk_user', JSON.stringify(data.user))
    passwordForm.current_password = ''
    passwordForm.password = ''
    passwordForm.password_confirmation = ''
    toast.success(data.message || 'Mot de passe mis à jour.')
    await loadOnboarding()
  } catch (error) {
    toast.error(error.response?.data?.errors?.current_password?.[0] || error.response?.data?.message || 'Impossible de changer le mot de passe.')
  } finally {
    savingPassword.value = false
  }
}

async function saveCompany() {
  savingCompany.value = true
  try {
    const payload = {
      ...onboarding.societe,
      ...companyForm,
      mobile: onboarding.societe?.mobile || '',
      pays: onboarding.societe?.pays || 'Sénégal',
    }

    delete payload.id
    delete payload.logo
    delete payload.created_at
    delete payload.updated_at
    delete payload.onboarding_steps
    delete payload.onboarding_completed_at
    delete payload.onboarding_completed_by

    const { data } = await api.put('/parametres/societe', payload)
    toast.success(data.message || 'Identité entreprise enregistrée.')
    window.dispatchEvent(new CustomEvent('societe:updated', { detail: data.societe || payload }))
    await loadOnboarding()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’enregistrer l’identité entreprise.')
  } finally {
    savingCompany.value = false
  }
}

async function updateStep(key, status) {
  try {
    const { data } = await api.put(`/onboarding/steps/${key}`, { status })
    hydrate(data)
    toast.success(data.message || 'Étape mise à jour.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de mettre à jour cette étape.')
  }
}

async function completeOnboarding() {
  completing.value = true
  try {
    const { data } = await api.post('/onboarding/complete')
    hydrate(data)
    await auth.fetchMe()
    toast.success(data.message || 'Assistant terminé.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de terminer le démarrage.')
  } finally {
    completing.value = false
  }
}

function statusLabel(step) {
  if (step.status === 'done') return 'Fait'
  if (step.status === 'skipped') return 'Plus tard'
  return step.required ? 'À faire' : 'Optionnel'
}

function statusClass(step) {
  if (step.status === 'done') return 'bg-emerald-100 text-emerald-700'
  if (step.status === 'skipped') return 'bg-slate-100 text-slate-600'
  if (step.required) return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}

function iconClass(step) {
  if (step.status === 'done') return 'bg-emerald-100 text-emerald-600'
  if (step.status === 'skipped') return 'bg-slate-100 text-slate-500'
  return 'bg-blue-100 text-[color:var(--saytu-primary,#2563eb)]'
}

function cardClass(step) {
  if (step.status === 'done') return 'border-emerald-200'
  if (step.status === 'skipped') return 'border-slate-200'
  if (step.required) return 'border-amber-200'
  return 'border-slate-200'
}

onMounted(loadOnboarding)
</script>

<style scoped>
.onboarding-hero {
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 24%, transparent);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-secondary, #22d3ee) 22%, transparent), transparent 28rem),
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary, #2563eb) 9%, white), white 68%);
}

.onboarding-card {
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.onboarding-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgb(15 23 42 / 0.08);
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: rgb(51 65 85);
}

</style>
