<template>
  <div class="space-y-4">
    <section class="theme-hero-card rounded-2xl p-5 text-white">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Administration</p>
          <h1 class="mt-1 text-2xl font-black">Licence & abonnement</h1>
          <p class="mt-1 max-w-3xl text-sm opacity-85">
            Pilotez l’accès client, la formule, les modules inclus et le suivi des paiements de licence.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary bg-white/90" :disabled="loading" @click="loadLicence">
            <RefreshCw class="h-4 w-4" />
            Actualiser
          </button>
          <button type="button" class="btn-primary" :disabled="saving || !form" @click="saveLicence">
            <Save class="h-4 w-4" />
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="licenceMessage"
      class="rounded-2xl border px-4 py-3 text-sm"
      :class="statusAlertClass"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle v-if="licenceIsSensitive" class="mt-0.5 h-4 w-4 shrink-0" />
        <CheckCircle2 v-else class="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p class="font-black">{{ licenceMessage }}</p>
          <p v-if="form?.depasse_limite_utilisateurs" class="mt-1">
            Utilisateurs actifs : {{ form.utilisateurs_actifs }} / {{ form.max_utilisateurs }}.
          </p>
        </div>
      </div>
    </section>

    <section v-if="loading" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-8 text-center text-[color:var(--saytu-muted,#64748b)]">
      Chargement de la licence...
    </section>

    <template v-else-if="form">
      <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in cards" :key="card.label" class="licence-card">
          <div>
            <p class="licence-card-label">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ card.value }}</p>
            <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">{{ card.hint }}</p>
          </div>
          <span class="licence-card-icon">
            <component :is="card.icon" class="h-5 w-5" />
          </span>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article class="licence-panel">
          <div class="licence-panel-header">
            <div>
              <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Informations client</h2>
              <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Identité de l’installation et paramètres commerciaux.</p>
            </div>
          </div>

          <div class="grid gap-3 p-4 md:grid-cols-2">
            <label class="md:col-span-2">
              <span class="label">Client / société <span class="text-red-500">*</span></span>
              <input v-model="form.client_nom" class="input" placeholder="Nom du client" />
            </label>

            <label>
              <span class="label">Email licence</span>
              <input v-model="form.client_email" type="email" class="input" placeholder="client@entreprise.com" />
            </label>

            <label>
              <span class="label">Téléphone Sénégal</span>
              <input v-model="form.client_telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
            </label>

            <label>
              <span class="label">Domaine</span>
              <input v-model="form.domaine" class="input" placeholder="client.saytuliggeey.com" />
            </label>

            <label>
              <span class="label">Formule</span>
              <select v-model="form.plan" class="input" @change="applyPlanModules">
                <option v-for="(plan, key) in plans" :key="key" :value="key">{{ plan.label }}</option>
              </select>
            </label>

            <label>
              <span class="label">Statut</span>
              <select v-model="form.statut" class="input">
                <option v-for="(label, key) in statuts" :key="key" :value="key">{{ label }}</option>
              </select>
            </label>

            <label>
              <span class="label">Utilisateurs max</span>
              <input v-model="form.max_utilisateurs" data-numeric-input min="1" class="input" placeholder="Illimité" />
            </label>

            <label>
              <span class="label">Montant mensuel</span>
              <input v-model="form.montant_mensuel" data-numeric-input data-decimals="2" min="0" class="input" placeholder="0" />
            </label>

            <label>
              <span class="label">Devise</span>
              <select v-model="form.devise" class="input">
                <option value="XOF">XOF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </label>

            <label>
              <span class="label">Début</span>
              <input v-model="form.date_debut" type="date" class="input" />
            </label>

            <label>
              <span class="label">Fin / renouvellement</span>
              <input v-model="form.date_fin" type="date" class="input" />
            </label>

            <label>
              <span class="label">Fin période d’essai</span>
              <input v-model="form.periode_essai_fin" type="date" class="input" />
            </label>

            <label class="md:col-span-2">
              <span class="label">Notes internes</span>
              <textarea v-model="form.notes" class="input min-h-20" placeholder="Conditions, historique commercial, observations..."></textarea>
            </label>

            <label class="md:col-span-2">
              <span class="label">Raison de suspension</span>
              <textarea v-model="form.suspension_reason" class="input min-h-16" placeholder="Ex: abonnement impayé, demande client..."></textarea>
            </label>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
            <div class="text-xs text-[color:var(--saytu-muted,#64748b)]">
              Dernière vérification : {{ formatDateTime(form.last_checked_at) }}
            </div>
            <div class="flex flex-wrap gap-2">
              <button v-if="form.statut !== 'suspendue'" type="button" class="btn-secondary text-red-700" @click="suspendreLicence">
                <PauseCircle class="h-4 w-4" />
                Suspendre
              </button>
              <button v-else type="button" class="btn-secondary text-emerald-700" @click="reactiverLicence">
                <PlayCircle class="h-4 w-4" />
                Réactiver
              </button>
              <button type="button" class="btn-primary" :disabled="saving" @click="saveLicence">Enregistrer</button>
            </div>
          </div>
        </article>

        <article class="licence-panel">
          <div class="licence-panel-header">
            <div>
              <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Modules inclus</h2>
              <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Ces rubriques seront autorisées côté API.</p>
            </div>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="applyPlanModules">
              Modules de la formule
            </button>
          </div>

          <div class="space-y-3 p-4">
            <section v-for="group in groupedModules" :key="group.name" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] p-3">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">{{ group.name }}</h3>
                <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--saytu-primary,#2563eb)]">
                  {{ group.items.filter(item => moduleEnabled(item.key)).length }}/{{ group.items.length }}
                </span>
              </div>

              <div class="grid gap-2 sm:grid-cols-2">
                <button
                  v-for="module in group.items"
                  :key="module.key"
                  type="button"
                  class="licence-module"
                  :class="moduleEnabled(module.key) ? 'licence-module-active' : ''"
                  @click="toggleModule(module.key)"
                >
                  <span class="grid h-8 w-8 place-items-center rounded-xl bg-[color:var(--saytu-primary-soft,#dbeafe)] text-[color:var(--saytu-primary,#2563eb)]">
                    <Boxes class="h-4 w-4" />
                  </span>
                  <span class="min-w-0 text-left">
                    <span class="block truncate text-sm font-bold">{{ module.label }}</span>
                    <span class="block truncate text-[11px] opacity-70">{{ module.key }}</span>
                  </span>
                  <span class="ml-auto h-4 w-4 rounded-full border" :class="moduleEnabled(module.key) ? 'border-[color:var(--saytu-primary,#2563eb)] bg-[color:var(--saytu-primary,#2563eb)]' : 'border-[color:var(--saytu-border,#e2e8f0)]'"></span>
                </button>
              </div>
            </section>
          </div>
        </article>
      </section>

      <section class="licence-panel">
        <div class="licence-panel-header">
          <div>
            <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Paiements de licence</h2>
            <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
              Total enregistré : {{ money(totalPaiements) }} {{ form.devise || 'XOF' }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 p-4 xl:grid-cols-[360px_1fr]">
          <form class="space-y-3 rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3" @submit.prevent="enregistrerPaiement">
            <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Nouveau paiement</h3>
            <label>
              <span class="label">Date</span>
              <input v-model="paiementForm.date_paiement" type="date" class="input" required />
            </label>
            <label>
              <span class="label">Montant</span>
              <input v-model="paiementForm.montant" data-numeric-input data-decimals="2" min="0" class="input" required />
            </label>
            <label>
              <span class="label">Mode</span>
              <select v-model="paiementForm.mode_paiement" class="input">
                <option value="">Non précisé</option>
                <option>Virement bancaire</option>
                <option>Espèces</option>
                <option>Wave</option>
                <option>Orange Money</option>
                <option>Chèque</option>
              </select>
            </label>
            <label>
              <span class="label">Référence</span>
              <input v-model="paiementForm.reference" class="input" placeholder="N° transaction, reçu..." />
            </label>
            <label>
              <span class="label">Notes</span>
              <textarea v-model="paiementForm.notes" class="input min-h-16" placeholder="Observation"></textarea>
            </label>
            <button type="submit" class="btn-primary w-full" :disabled="paiementSaving">
              <CreditCard class="h-4 w-4" />
              {{ paiementSaving ? 'Enregistrement...' : 'Enregistrer le paiement' }}
            </button>
          </form>

          <div class="overflow-x-auto rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)]">
            <table class="min-w-full text-sm">
              <thead class="bg-[color:var(--saytu-shell-bg,#f8fafc)] text-left text-xs uppercase tracking-[0.12em] text-[color:var(--saytu-muted,#64748b)]">
                <tr>
                  <th class="px-4 py-3">Date</th>
                  <th class="px-4 py-3">Montant</th>
                  <th class="px-4 py-3">Mode</th>
                  <th class="px-4 py-3">Référence</th>
                  <th class="px-4 py-3">Saisi par</th>
                  <th class="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[color:var(--saytu-border,#e2e8f0)]">
                <tr v-for="paiement in paiements" :key="paiement.id">
                  <td class="px-4 py-3">{{ formatDate(paiement.date_paiement) }}</td>
                  <td class="px-4 py-3 font-black text-[color:var(--saytu-primary,#2563eb)]">{{ money(paiement.montant) }} {{ form.devise || 'XOF' }}</td>
                  <td class="px-4 py-3">{{ paiement.mode_paiement || '-' }}</td>
                  <td class="px-4 py-3">{{ paiement.reference || '-' }}</td>
                  <td class="px-4 py-3">{{ paiement.user_name || '-' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button type="button" class="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:underline" @click="supprimerPaiement(paiement)">
                      <Trash2 class="h-4 w-4" />
                      Supprimer
                    </button>
                  </td>
                </tr>
                <tr v-if="!paiements.length">
                  <td colspan="6" class="px-4 py-8 text-center text-[color:var(--saytu-muted,#64748b)]">
                    Aucun paiement de licence enregistré.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  KeyRound,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-vue-next'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const loading = ref(false)
const saving = ref(false)
const paiementSaving = ref(false)
const form = ref(null)
const reference = reactive({
  plans: {},
  modules: {},
  statuts: {},
})

const paiementForm = reactive({
  date_paiement: today(),
  montant: '',
  mode_paiement: '',
  reference: '',
  notes: '',
})

const plans = computed(() => reference.plans || {})
const statuts = computed(() => reference.statuts || {})
const paiements = computed(() => form.value?.paiements || [])
const totalPaiements = computed(() => paiements.value.reduce((total, item) => total + Number(item.montant || 0), 0))
const licenceMessage = computed(() => form.value?.message || '')
const licenceIsSensitive = computed(() => ['expiree', 'essai_expire', 'suspendue'].includes(form.value?.etat) || form.value?.expires_soon || form.value?.depasse_limite_utilisateurs)

const cards = computed(() => [
  {
    label: 'Statut',
    value: form.value?.etat_label || '-',
    hint: form.value?.is_active ? 'Accès autorisé' : 'Accès limité',
    icon: ShieldCheck,
  },
  {
    label: 'Formule',
    value: form.value?.plan_label || '-',
    hint: plans.value?.[form.value?.plan]?.description || 'Plan licence',
    icon: KeyRound,
  },
  {
    label: 'Échéance',
    value: form.value?.date_fin ? formatDate(form.value.date_fin) : 'Illimitée',
    hint: form.value?.days_remaining === null || form.value?.days_remaining === undefined
      ? 'Pas de date de fin'
      : `${form.value.days_remaining} jour(s) restant(s)`,
    icon: CalendarDays,
  },
  {
    label: 'Utilisateurs',
    value: `${form.value?.utilisateurs_actifs || 0}/${form.value?.max_utilisateurs || '∞'}`,
    hint: form.value?.depasse_limite_utilisateurs ? 'Limite dépassée' : 'Comptes actifs',
    icon: Users,
  },
])

const groupedModules = computed(() => {
  const groups = new Map()
  Object.entries(reference.modules || {}).forEach(([key, module]) => {
    const groupName = module.group || 'Autres'
    if (!groups.has(groupName)) groups.set(groupName, [])
    groups.get(groupName).push({ key, ...module })
  })

  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
})

const statusAlertClass = computed(() => {
  if (!form.value?.is_active) return 'border-red-200 bg-red-50 text-red-800'
  if (form.value?.expires_soon || form.value?.depasse_limite_utilisateurs) return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-emerald-200 bg-emerald-50 text-emerald-800'
})

onMounted(loadLicence)

async function loadLicence() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/licence')
    hydrate(data)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur de chargement de la licence.')
  } finally {
    loading.value = false
  }
}

function hydrate(data) {
  Object.assign(reference, data.reference || {})
  form.value = normalizeLicence(data.licence || {})
  syncAuthLicence(form.value)
}

function normalizeLicence(licence) {
  return {
    client_nom: '',
    client_email: '',
    client_telephone: '',
    domaine: '',
    plan: 'business',
    statut: 'actif',
    date_debut: '',
    date_fin: '',
    periode_essai_fin: '',
    max_utilisateurs: '',
    utilisateurs_actifs: 0,
    depasse_limite_utilisateurs: false,
    modules_autorises: [],
    options: {},
    montant_mensuel: '',
    devise: 'XOF',
    notes: '',
    suspension_reason: '',
    paiements: [],
    ...licence,
    modules_autorises: Array.isArray(licence.modules_autorises) ? [...licence.modules_autorises] : [],
    max_utilisateurs: licence.max_utilisateurs ?? '',
    montant_mensuel: licence.montant_mensuel ?? '',
    date_debut: licence.date_debut || '',
    date_fin: licence.date_fin || '',
    periode_essai_fin: licence.periode_essai_fin || '',
    paiements: Array.isArray(licence.paiements) ? licence.paiements : [],
  }
}

async function saveLicence() {
  if (!form.value) return

  saving.value = true
  try {
    const { data } = await api.put('/admin/licence', licencePayload())
    form.value = normalizeLicence(data.licence || {})
    syncAuthLicence(form.value)
    toast.success(data.message || 'Licence enregistrée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’enregistrer la licence.')
  } finally {
    saving.value = false
  }
}

function licencePayload() {
  return {
    client_nom: form.value.client_nom,
    client_email: form.value.client_email || null,
    client_telephone: cleanPhone(form.value.client_telephone),
    domaine: form.value.domaine || null,
    plan: form.value.plan,
    statut: form.value.statut,
    date_debut: form.value.date_debut || null,
    date_fin: form.value.date_fin || null,
    periode_essai_fin: form.value.periode_essai_fin || null,
    max_utilisateurs: parseIntegerOrNull(form.value.max_utilisateurs),
    modules_autorises: [...new Set(form.value.modules_autorises || [])],
    options: form.value.options || {},
    montant_mensuel: parseNumber(form.value.montant_mensuel),
    devise: form.value.devise || 'XOF',
    notes: form.value.notes || null,
    suspension_reason: form.value.suspension_reason || null,
  }
}

function applyPlanModules() {
  if (!form.value) return
  const modules = plans.value?.[form.value.plan]?.modules
  form.value.modules_autorises = Array.isArray(modules) ? [...modules] : []
}

function moduleEnabled(moduleKey) {
  return Array.isArray(form.value?.modules_autorises) && form.value.modules_autorises.includes(moduleKey)
}

function toggleModule(moduleKey) {
  if (!form.value) return
  const modules = new Set(form.value.modules_autorises || [])
  if (modules.has(moduleKey)) {
    modules.delete(moduleKey)
  } else {
    modules.add(moduleKey)
  }
  form.value.modules_autorises = Array.from(modules)
}

async function suspendreLicence() {
  if (!form.value) return
  const ok = await askConfirm({
    title: 'Suspendre la licence',
    message: 'Suspendre cette licence ? Les modules métier seront bloqués jusqu’à réactivation.',
    confirmLabel: 'Suspendre',
    tone: 'danger',
  })
  if (!ok) return

  saving.value = true
  try {
    const { data } = await api.post('/admin/licence/suspendre', {
      raison: form.value.suspension_reason || 'Licence suspendue manuellement.',
    })
    form.value = normalizeLicence(data.licence || {})
    syncAuthLicence(form.value)
    toast.success(data.message || 'Licence suspendue.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de suspendre la licence.')
  } finally {
    saving.value = false
  }
}

async function reactiverLicence() {
  const ok = await askConfirm({
    title: 'Réactiver la licence',
    message: 'Réactiver cette licence maintenant ?',
    confirmLabel: 'Réactiver',
  })
  if (!ok) return

  saving.value = true
  try {
    const { data } = await api.post('/admin/licence/reactiver')
    form.value = normalizeLicence(data.licence || {})
    syncAuthLicence(form.value)
    toast.success(data.message || 'Licence réactivée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de réactiver la licence.')
  } finally {
    saving.value = false
  }
}

async function enregistrerPaiement() {
  paiementSaving.value = true
  try {
    const { data } = await api.post('/admin/licence/paiements', {
      ...paiementForm,
      montant: parseNumber(paiementForm.montant),
    })
    form.value = normalizeLicence(data.licence || {})
    Object.assign(paiementForm, {
      date_paiement: today(),
      montant: '',
      mode_paiement: '',
      reference: '',
      notes: '',
    })
    toast.success(data.message || 'Paiement enregistré.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’enregistrer le paiement.')
  } finally {
    paiementSaving.value = false
  }
}

async function supprimerPaiement(paiement) {
  const ok = await askConfirm({
    title: 'Supprimer le paiement',
    message: `Supprimer le paiement du ${formatDate(paiement.date_paiement)} ?`,
    confirmLabel: 'Supprimer',
    tone: 'danger',
  })
  if (!ok) return

  try {
    const { data } = await api.delete(`/admin/licence/paiements/${paiement.id}`)
    form.value = normalizeLicence(data.licence || {})
    toast.success(data.message || 'Paiement supprimé.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de supprimer le paiement.')
  }
}

function syncAuthLicence(licence) {
  if (!auth.user) return
  auth.user = { ...auth.user, licence }
  localStorage.setItem('xelltekk_user', JSON.stringify(auth.user))
}

function parseNumber(value) {
  const raw = String(value ?? '').replace(/\s/g, '').replace(',', '.')
  const number = Number(raw)
  return Number.isFinite(number) ? number : 0
}

function parseIntegerOrNull(value) {
  const number = parseNumber(value)
  return number > 0 ? Math.trunc(number) : null
}

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00221')) return digits.slice(5, 14)
  if (digits.startsWith('221') && digits.length > 9) return digits.slice(3, 12)
  return digits.slice(0, 9) || null
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR')
  } catch (e) {
    return value
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  try {
    return new Date(value.replace(' ', 'T')).toLocaleString('fr-FR')
  } catch (e) {
    return value
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
</script>

<style scoped>
.licence-panel,
.licence-card {
  border: 1px solid var(--saytu-border, #e2e8f0);
  background: var(--saytu-surface, #ffffff);
  color: var(--saytu-shell-text, #334155);
  box-shadow: 0 14px 42px rgb(15 23 42 / 0.06);
}

.licence-panel {
  border-radius: 1rem;
  overflow: hidden;
}

.licence-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--saytu-border, #e2e8f0);
  padding: 0.85rem 1rem;
}

.licence-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 1rem;
  padding: 1rem;
}

.licence-card-label {
  color: var(--saytu-muted, #64748b);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.licence-card-icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  flex-shrink: 0;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
}

.licence-module {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 94%, var(--saytu-primary, #2563eb) 6%);
  color: var(--saytu-shell-text, #334155);
  padding: 0.55rem 0.65rem;
  transition: 160ms ease;
}

.licence-module:hover,
.licence-module-active {
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 55%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
}

.label {
  display: block;
  margin-bottom: 0.3rem;
  color: var(--saytu-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 800;
}
</style>
