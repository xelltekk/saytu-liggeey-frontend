<template>
  <div class="space-y-4">
    <section class="theme-hero-card rounded-2xl p-5 text-white">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] opacity-80">XELLTEKK</p>
          <h1 class="mt-1 text-2xl font-black">Admin licences clients</h1>
          <p class="mt-1 max-w-3xl text-sm opacity-85">
            Créez les clés, choisissez les modules, renouvelez les abonnements et copiez le certificat à installer chez le client.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary bg-white/90" :disabled="loading" @click="loadDashboard">
            <RefreshCw class="h-4 w-4" />
            Actualiser
          </button>
          <button type="button" class="btn-primary" @click="resetForm">
            <Plus class="h-4 w-4" />
            Nouvelle licence
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in statCards" :key="card.label" class="xell-card">
        <div>
          <p class="xell-card-label">{{ card.label }}</p>
          <p class="mt-2 text-2xl font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ card.value }}</p>
          <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">{{ card.hint }}</p>
        </div>
        <span class="xell-card-icon">
          <component :is="card.icon" class="h-5 w-5" />
        </span>
      </article>
    </section>

    <section class="xell-panel overflow-hidden">
      <div class="xell-panel-header">
        <div>
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Assistant onboarding client</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            Un parcours court : client, offre, documents commerciaux, puis licence d’activation.
          </p>
        </div>
        <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-3 py-1 text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">
          {{ editingId ? 'Pack prêt' : 'Nouveau client' }}
        </span>
      </div>

      <div class="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
        <div class="grid gap-3 md:grid-cols-4">
          <article
            v-for="step in onboardingSteps"
            :key="step.label"
            class="xell-step"
            :class="step.done ? 'xell-step-done' : ''"
          >
            <div class="flex items-center gap-2">
              <span class="xell-step-number">{{ step.index }}</span>
              <h3 class="font-black">{{ step.label }}</h3>
            </div>
            <p class="mt-2 text-xs text-[color:var(--saytu-muted,#64748b)]">{{ step.hint }}</p>
          </article>
        </div>

        <div class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3">
          <p class="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">Pack commercial</p>
          <p class="mt-2 font-black text-[color:var(--saytu-shell-text,#0f172a)]">
            {{ form.client_nom || 'Client à renseigner' }}
          </p>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
            {{ planLabel(form.plan) }} · {{ money(form.montant_mensuel) }} {{ form.devise }}/mois · {{ form.modules_autorises.length }} module(s)
          </p>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button type="button" class="btn-primary col-span-2" :disabled="saving" @click="saveLicence">
              <Save class="h-4 w-4" />
              {{ editingId ? 'Mettre à jour le pack' : 'Créer licence + pack' }}
            </button>
            <button type="button" class="btn-secondary col-span-2 px-3 py-2 text-xs" :disabled="!activeLicence || sendingEmailId === activeLicence?.id" @click="sendOnboardingEmail(activeLicence)">
              <Send class="h-4 w-4" />
              {{ sendingEmailId === activeLicence?.id ? 'Envoi...' : 'Envoyer offre + PDF' }}
            </button>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="!activeLicence" @click="openDocument(activeLicence, 'devis')">
              <FileText class="h-4 w-4" />
              Devis
            </button>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="!activeLicence" @click="openDocument(activeLicence, 'contrat')">
              <FileSignature class="h-4 w-4" />
              Contrat
            </button>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="!activeLicence" @click="prepareOnboardingEmail(activeLicence)">
              <Mail class="h-4 w-4" />
              Email
            </button>
            <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="!activeLicence?.licence_certificate" @click="copyText(activeLicence?.licence_certificate, 'Certificat copié.')">
              <Copy class="h-4 w-4" />
              Certificat
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="loading" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#fff)] p-8 text-center text-[color:var(--saytu-muted,#64748b)]">
      Chargement de l’espace XELLTEKK Admin...
    </section>

    <section v-else class="grid gap-4 xl:grid-cols-[480px_1fr]">
      <form class="xell-panel overflow-hidden" @submit.prevent="saveLicence">
        <div class="xell-panel-header">
          <div>
            <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">
              {{ editingId ? 'Modifier une licence' : 'Créer une licence' }}
            </h2>
            <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
              Le certificat généré sera signé et copiable pour l’installation client.
            </p>
          </div>
          <span v-if="editingId" class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-3 py-1 text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">
            Édition
          </span>
        </div>

        <div class="space-y-4 p-4">
          <div class="grid gap-3 md:grid-cols-2">
            <label class="md:col-span-2">
              <span class="label">Client / société <span class="text-red-500">*</span></span>
              <input v-model="form.client_nom" required class="input" placeholder="Nom du client" />
            </label>

            <label>
              <span class="label">Email</span>
              <input v-model="form.client_email" type="email" class="input" placeholder="client@entreprise.com" />
            </label>

            <label>
              <span class="label">Téléphone</span>
              <input v-model="form.client_telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
            </label>

            <label>
              <span class="label">Domaine</span>
              <input v-model="form.domaine" class="input" placeholder="client.saytuliggeey.com" />
            </label>

            <label>
              <span class="label">Contact</span>
              <input v-model="form.contact_nom" class="input" placeholder="Nom du contact" />
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
              <span class="label">Début</span>
              <input v-model="form.date_debut" type="date" class="input" />
            </label>

            <label>
              <span class="label">Fin</span>
              <input v-model="form.date_fin" type="date" class="input" />
            </label>

            <label>
              <span class="label">Utilisateurs max</span>
              <input v-model="form.max_utilisateurs" data-numeric-input class="input" placeholder="Illimité" />
            </label>

            <label>
              <span class="label">Mensuel</span>
              <input v-model="form.montant_mensuel" data-numeric-input data-decimals="2" class="input" placeholder="0" />
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
              <span class="label">Fin essai</span>
              <input v-model="form.periode_essai_fin" type="date" class="input" />
            </label>
          </div>

          <section class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] p-3">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Modules autorisés</h3>
                <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">{{ form.modules_autorises.length }} module(s) sélectionné(s).</p>
              </div>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="applyPlanModules">
                Formule
              </button>
            </div>

            <div class="max-h-72 space-y-3 overflow-y-auto pr-1">
              <div v-for="group in groupedModules" :key="group.name">
                <p class="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">{{ group.name }}</p>
                <div class="grid gap-2 sm:grid-cols-2">
                  <button
                    v-for="module in group.items"
                    :key="module.key"
                    type="button"
                    class="xell-module-chip"
                    :class="moduleEnabled(module.key) ? 'xell-module-chip-active' : ''"
                    @click="toggleModule(module.key)"
                  >
                    {{ module.label }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <label>
            <span class="label">Notes internes</span>
            <textarea v-model="form.notes" class="input min-h-20" placeholder="Suivi commercial, conditions, observations..."></textarea>
          </label>

          <div class="flex flex-wrap justify-end gap-2 border-t border-[color:var(--saytu-border,#e2e8f0)] pt-3">
            <button type="button" class="btn-secondary" @click="resetForm">Réinitialiser</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <Save class="h-4 w-4" />
              {{ saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer + générer le pack' }}
            </button>
          </div>
        </div>
      </form>

      <section class="xell-panel overflow-hidden">
        <div class="xell-panel-header">
          <div>
            <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Portefeuille licences</h2>
            <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">
              {{ filteredLicences.length }} licence(s) affichée(s).
            </p>
          </div>
          <div class="relative w-full max-w-xs">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--saytu-muted,#64748b)]" />
            <input v-model="search" class="input pl-9" placeholder="Rechercher client, clé..." />
          </div>
        </div>

        <div class="max-h-[calc(100vh-22rem)] min-h-[30rem] overflow-y-auto p-3">
          <article
            v-for="licence in filteredLicences"
            :key="licence.id"
            class="xell-licence-row"
            :class="editingId === licence.id ? 'xell-licence-row-active' : ''"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ licence.client_nom || 'Client sans nom' }}</h3>
                <span class="rounded-full px-2 py-0.5 text-[11px] font-black" :class="statusClass(licence)">
                  {{ statutLabel(licence.statut) }}
                </span>
                <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-2 py-0.5 text-[11px] font-black text-[color:var(--saytu-primary,#2563eb)]">
                  {{ licence.plan_label }}
                </span>
              </div>
              <p class="mt-1 truncate text-xs text-[color:var(--saytu-muted,#64748b)]">
                {{ licence.numero }} · {{ licence.licence_key }}
              </p>
              <div class="mt-2 grid gap-2 text-xs text-[color:var(--saytu-muted,#64748b)] sm:grid-cols-3">
                <span><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Fin :</strong> {{ formatDate(licence.date_fin) }}</span>
                <span><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Modules :</strong> {{ licence.modules_count }}</span>
                <span><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">Mensuel :</strong> {{ money(licence.montant_mensuel) }} {{ licence.devise }}</span>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="editLicence(licence)">
                Modifier
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="copyText(licence.licence_certificate, 'Certificat copié.')">
                <Copy class="h-4 w-4" />
                Certificat
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="openDocument(licence, 'devis')">
                Devis
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="openDocument(licence, 'contrat')">
                Contrat
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="prepareOnboardingEmail(licence)">
                Email
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="sendingEmailId === licence.id" @click="sendOnboardingEmail(licence)">
                <Send class="h-4 w-4" />
                {{ sendingEmailId === licence.id ? '...' : 'Envoyer' }}
              </button>
              <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="renewLicence(licence)">
                +12 mois
              </button>
              <button
                type="button"
                class="btn-secondary px-3 py-2 text-xs"
                :class="licence.statut === 'suspendue' ? 'text-emerald-700' : 'text-red-700'"
                @click="toggleLicenceStatus(licence)"
              >
                {{ licence.statut === 'suspendue' ? 'Réactiver' : 'Suspendre' }}
              </button>
            </div>
          </article>

          <div v-if="!filteredLicences.length" class="rounded-2xl border border-dashed border-[color:var(--saytu-border,#e2e8f0)] p-8 text-center text-sm text-[color:var(--saytu-muted,#64748b)]">
            Aucune licence trouvée.
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  Copy,
  FileSignature,
  FileText,
  KeyRound,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-vue-next'
import api from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { buildMailtoUrl, closeReservedEmailComposerWindow, openEmailComposer, reserveEmailComposerWindow } from '@/utils/emailComposer'

const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const loading = ref(false)
const saving = ref(false)
const sendingEmailId = ref(null)
const search = ref('')
const editingId = ref(null)
const stats = reactive({
  clients: 0,
  licences_actives: 0,
  a_renouveler: 0,
  revenu_mensuel: 0,
})
const reference = reactive({
  plans: {},
  modules: {},
  statuts: {},
  tarifs: {},
})
const licences = ref([])
const form = reactive(emptyForm())

const plans = computed(() => reference.plans || {})
const statuts = computed(() => reference.statuts || {})
const tarifs = computed(() => reference.tarifs || {})
const activeLicence = computed(() => licences.value.find(licence => licence.id === editingId.value) || null)

const statCards = computed(() => [
  {
    label: 'Clients',
    value: stats.clients,
    hint: 'Comptes suivis',
    icon: Users,
  },
  {
    label: 'Licences actives',
    value: stats.licences_actives,
    hint: 'Installations autorisées',
    icon: ShieldCheck,
  },
  {
    label: 'À renouveler',
    value: stats.a_renouveler,
    hint: 'Échéance ≤ 30 jours',
    icon: KeyRound,
  },
  {
    label: 'Mensuel actif',
    value: money(stats.revenu_mensuel),
    hint: 'Revenu mensuel estimé',
    icon: TrendingUp,
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

const filteredLicences = computed(() => {
  const needle = search.value.trim().toLowerCase()
  if (!needle) return licences.value

  return licences.value.filter((licence) => {
    return [
      licence.client_nom,
      licence.client_email,
      licence.domaine,
      licence.numero,
      licence.licence_key,
      licence.plan_label,
      licence.statut,
    ].join(' ').toLowerCase().includes(needle)
  })
})

const onboardingSteps = computed(() => [
  {
    index: 1,
    label: 'Client',
    hint: form.client_nom && form.client_email ? 'Identité et email prêts.' : 'Renseigner au minimum le nom et l’email.',
    done: Boolean(form.client_nom && form.client_email),
  },
  {
    index: 2,
    label: 'Offre',
    hint: form.plan && parseNumber(form.montant_mensuel) > 0 ? 'Formule et tarif définis.' : 'Choisir une formule et un montant mensuel.',
    done: Boolean(form.plan && parseNumber(form.montant_mensuel) > 0),
  },
  {
    index: 3,
    label: 'Modules',
    hint: form.modules_autorises.length ? `${form.modules_autorises.length} module(s) inclus.` : 'Sélectionner les modules autorisés.',
    done: form.modules_autorises.length > 0,
  },
  {
    index: 4,
    label: 'Documents',
    hint: activeLicence.value ? 'Devis, contrat, email et certificat disponibles.' : 'Créer la licence pour générer le pack.',
    done: Boolean(activeLicence.value?.licence_certificate),
  },
])

onMounted(loadDashboard)

async function loadDashboard() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/xelltekk')
    hydrate(data)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur de chargement de l’espace XELLTEKK Admin.')
  } finally {
    loading.value = false
  }
}

function hydrate(data) {
  Object.assign(stats, data.stats || {})
  Object.assign(reference, data.reference || {})
  licences.value = Array.isArray(data.licences) ? data.licences : []
  if (!editingId.value && form.modules_autorises.length === 0) {
    applyPlanModules()
  }
}

async function saveLicence() {
  saving.value = true
  try {
    const payload = licencePayload()
    const request = editingId.value
      ? api.put(`/admin/xelltekk/licences/${editingId.value}`, payload)
      : api.post('/admin/xelltekk/licences', payload)
    const { data } = await request
    hydrate(data)
    if (data.licence) editLicence(data.licence)
    toast.success(data.message || 'Licence enregistrée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’enregistrer la licence.')
  } finally {
    saving.value = false
  }
}

async function renewLicence(licence) {
  const ok = await askConfirm({
    title: 'Renouveler la licence',
    message: `Ajouter 12 mois à la licence de ${licence.client_nom} ?`,
    confirmLabel: 'Renouveler',
  })
  if (!ok) return

  try {
    const { data } = await api.post(`/admin/xelltekk/licences/${licence.id}/renouveler`, { mois: 12 })
    hydrate(data)
    toast.success(data.message || 'Licence renouvelée.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de renouveler la licence.')
  }
}

async function toggleLicenceStatus(licence) {
  const action = licence.statut === 'suspendue' ? 'reactiver' : 'suspendre'
  const ok = await askConfirm({
    title: action === 'reactiver' ? 'Réactiver la licence' : 'Suspendre la licence',
    message: `${action === 'reactiver' ? 'Réactiver' : 'Suspendre'} la licence de ${licence.client_nom} ?`,
    confirmLabel: action === 'reactiver' ? 'Réactiver' : 'Suspendre',
    tone: action === 'reactiver' ? 'default' : 'danger',
  })
  if (!ok) return

  try {
    const { data } = await api.post(`/admin/xelltekk/licences/${licence.id}/${action}`)
    hydrate(data)
    toast.success(data.message || 'Statut mis à jour.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de changer le statut.')
  }
}

function editLicence(licence) {
  editingId.value = licence.id
  Object.assign(form, {
    ...emptyForm(),
    ...licence,
    modules_autorises: Array.isArray(licence.modules_autorises) ? [...licence.modules_autorises] : [],
    max_utilisateurs: licence.max_utilisateurs ?? '',
    montant_mensuel: licence.montant_mensuel ?? '',
    date_debut: licence.date_debut || '',
    date_fin: licence.date_fin || '',
    periode_essai_fin: licence.periode_essai_fin || '',
  })
}

function resetForm() {
  editingId.value = null
  Object.assign(form, emptyForm())
  applyPlanModules()
}

function licencePayload() {
  return {
    client_nom: form.client_nom,
    client_email: form.client_email || null,
    client_telephone: cleanPhone(form.client_telephone),
    domaine: form.domaine || null,
    contact_nom: form.contact_nom || null,
    client_notes: form.client_notes || null,
    client_statut: form.client_statut || 'client',
    plan: form.plan,
    statut: form.statut,
    date_debut: form.date_debut || null,
    date_fin: form.date_fin || null,
    periode_essai_fin: form.periode_essai_fin || null,
    max_utilisateurs: parseIntegerOrNull(form.max_utilisateurs),
    modules_autorises: [...new Set(form.modules_autorises || [])],
    montant_mensuel: parseNumber(form.montant_mensuel),
    devise: form.devise || 'XOF',
    notes: form.notes || null,
  }
}

function applyPlanModules() {
  const modules = plans.value?.[form.plan]?.modules
  form.modules_autorises = Array.isArray(modules) ? [...modules] : []
  if (!parseNumber(form.montant_mensuel)) {
    form.montant_mensuel = tarifs.value?.[form.plan] ?? form.montant_mensuel
  }
}

function moduleEnabled(moduleKey) {
  return Array.isArray(form.modules_autorises) && form.modules_autorises.includes(moduleKey)
}

function toggleModule(moduleKey) {
  const modules = new Set(form.modules_autorises || [])
  if (modules.has(moduleKey)) {
    modules.delete(moduleKey)
  } else {
    modules.add(moduleKey)
  }
  form.modules_autorises = Array.from(modules)
}

async function copyText(value, successMessage = 'Copié.') {
  const text = String(value || '')
  if (!text) return

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    toast.success(successMessage)
  } catch (error) {
    toast.error('Impossible de copier automatiquement.')
  }
}

function openDocument(licence, type) {
  if (!licence?.id) return

  const rawUrl = type === 'contrat'
    ? licence.contrat_pdf_url || `/api/admin/xelltekk/licences/${licence.id}/contrat-pdf`
    : licence.devis_pdf_url || `/api/admin/xelltekk/licences/${licence.id}/devis-pdf`
  const url = browserApiUrl(rawUrl)

  window.open(url, '_blank', 'noopener,noreferrer')
}

async function prepareOnboardingEmail(licence) {
  if (!licence?.id) return

  const reservedWindow = reserveEmailComposerWindow()
  try {
    const { data } = await api.get(axiosApiUrl(licence.email_onboarding_url || `/admin/xelltekk/licences/${licence.id}/email-onboarding`))
    const mailto = buildMailtoUrl({
      to: data.to,
      subject: data.subject,
      body: data.body,
    })

    if (!data.to) {
      closeReservedEmailComposerWindow(reservedWindow)
      await copyText(data.body, 'Email copié : aucun email client renseigné.')
      return
    }

    if (openEmailComposer(mailto, reservedWindow)) {
      toast.success('Email préparé. Pensez à joindre le devis et le contrat PDF.')
    } else {
      closeReservedEmailComposerWindow(reservedWindow)
      await copyText(data.body, 'Email copié.')
    }
  } catch (error) {
    closeReservedEmailComposerWindow(reservedWindow)
    toast.error(error.response?.data?.message || 'Impossible de préparer l’email.')
  }
}

async function sendOnboardingEmail(licence) {
  if (!licence?.id) return

  if (!licence.client_email) {
    toast.error('Aucun email client renseigné pour cette licence.')
    return
  }

  const ok = await askConfirm({
    title: 'Envoyer l’offre au client',
    message: `Envoyer le devis et le contrat PDF à ${licence.client_email} ?`,
    confirmLabel: 'Envoyer',
  })
  if (!ok) return

  sendingEmailId.value = licence.id
  try {
    const endpoint = axiosApiUrl(licence.send_onboarding_email_url || `/admin/xelltekk/licences/${licence.id}/email-onboarding/envoyer`)
    const { data } = await api.post(endpoint, {})
    hydrate(data)
    if (data.licence && editingId.value === licence.id) editLicence(data.licence)
    toast.success(data.message || 'Offre envoyée avec les PDF en pièces jointes.')
  } catch (error) {
    const payload = error.response?.data?.email
    if (payload?.body) {
      await copyText(payload.body, 'Email copié en secours.')
    }
    toast.error(error.response?.data?.message || 'Impossible d’envoyer l’offre.')
  } finally {
    sendingEmailId.value = null
  }
}

function axiosApiUrl(url) {
  return String(url || '').replace(/^\/api(?=\/)/, '')
}

function browserApiUrl(url) {
  const value = String(url || '')
  if (value.startsWith('/api/')) return value
  if (value.startsWith('/')) return `/api${value}`
  return `/api/${value}`
}

function emptyForm() {
  return {
    client_nom: '',
    client_email: '',
    client_telephone: '',
    domaine: '',
    contact_nom: '',
    client_notes: '',
    client_statut: 'client',
    plan: 'business',
    statut: 'actif',
    date_debut: today(),
    date_fin: addMonths(today(), 12),
    periode_essai_fin: '',
    max_utilisateurs: '',
    modules_autorises: [],
    montant_mensuel: '',
    devise: 'XOF',
    notes: '',
  }
}

function statusClass(licence) {
  if (licence.statut === 'suspendue') return 'bg-red-100 text-red-700'
  if (licence.is_expired || licence.statut === 'expiree') return 'bg-amber-100 text-amber-700'
  if (licence.expires_soon) return 'bg-yellow-100 text-yellow-700'
  if (licence.statut === 'essai') return 'bg-blue-100 text-blue-700'
  return 'bg-emerald-100 text-emerald-700'
}

function statutLabel(statut) {
  return statuts.value?.[statut] || statut || '-'
}

function planLabel(plan) {
  return plans.value?.[plan]?.label || plan || '-'
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

function today() {
  return new Date().toISOString().slice(0, 10)
}

function addMonths(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00`)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}
</script>

<style scoped>
.xell-panel,
.xell-card,
.xell-licence-row {
  border: 1px solid var(--saytu-border, #e2e8f0);
  background: var(--saytu-surface, #ffffff);
  color: var(--saytu-shell-text, #334155);
  box-shadow: 0 14px 42px rgb(15 23 42 / 0.06);
}

.xell-panel {
  border-radius: 1rem;
}

.xell-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--saytu-border, #e2e8f0);
  padding: 0.85rem 1rem;
}

.xell-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 1rem;
  padding: 1rem;
}

.xell-card-label {
  color: var(--saytu-muted, #64748b);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.xell-card-icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  flex-shrink: 0;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
}

.xell-module-chip {
  min-height: 2.25rem;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 94%, var(--saytu-primary, #2563eb) 6%);
  color: var(--saytu-shell-text, #334155);
  padding: 0.45rem 0.65rem;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 800;
  transition: 160ms ease;
}

.xell-module-chip:hover,
.xell-module-chip-active {
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 55%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
}

.xell-step {
  min-height: 7rem;
  border: 1px solid var(--saytu-border, #e2e8f0);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 94%, var(--saytu-primary, #2563eb) 6%);
  padding: 0.9rem;
  transition: 160ms ease;
}

.xell-step-done {
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 52%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 10%, var(--saytu-surface, #ffffff));
}

.xell-step-number {
  display: grid;
  height: 1.8rem;
  width: 1.8rem;
  place-items: center;
  border-radius: 999px;
  background: var(--saytu-primary, #2563eb);
  color: white;
  font-size: 0.78rem;
  font-weight: 900;
}

.xell-licence-row {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border-radius: 1rem;
  padding: 1rem;
  transition: 160ms ease;
}

.xell-licence-row + .xell-licence-row {
  margin-top: 0.75rem;
}

.xell-licence-row:hover,
.xell-licence-row-active {
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 55%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 8%, var(--saytu-surface, #ffffff));
}

.label {
  display: block;
  margin-bottom: 0.3rem;
  color: var(--saytu-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 800;
}

@media (min-width: 1024px) {
  .xell-licence-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
