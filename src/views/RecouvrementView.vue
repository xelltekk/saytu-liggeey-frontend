<template>
  <div class="space-y-4">
    <section class="rounded-3xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-[color:var(--saytu-primary,#2563eb)]">Suivi paiements clients</p>
          <h1 class="mt-1 text-xl font-black text-slate-950">Recouvrement clients</h1>
          <p class="mt-1 text-sm text-slate-500">
            Factures non soldées, relances, promesses de paiement et litiges.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary rounded-full px-4 py-2 text-sm" :disabled="loading" @click="reloadAll">
            {{ loading ? 'Actualisation...' : 'Actualiser' }}
          </button>
          <button type="button" class="btn-primary rounded-full px-4 py-2 text-sm" @click="goPaiement">
            + Paiement
          </button>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <button
        v-for="card in summaryCards"
        :key="card.key"
        type="button"
        class="rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        :class="quick === card.quick ? 'border-[color:var(--saytu-primary,#2563eb)] bg-[color:var(--saytu-soft,#eef6ff)]' : 'border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)]'"
        @click="applyQuick(card.quick)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide" :class="card.textClass">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ card.value }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ card.sub }}</p>
          </div>
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--saytu-soft,#eef6ff)] text-[color:var(--saytu-primary,#2563eb)]">
            <component :is="card.icon" class="h-5 w-5" />
          </span>
        </div>
      </button>
    </section>

    <section class="rounded-3xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-3 shadow-sm">
      <div class="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(220px,1fr)_220px_170px_auto]">
        <input
          v-model="filters.search"
          type="search"
          class="input rounded-2xl"
          placeholder="Rechercher client, facture, email, téléphone..."
          @input="debouncedLoad"
        />
        <select v-model="filters.statut_recouvrement" class="input rounded-2xl" @change="loadFactures(1)">
          <option value="">Tous les suivis</option>
          <option value="sans_suivi">Sans suivi</option>
          <option value="a_surveiller">À surveiller</option>
          <option value="a_relancer">À relancer</option>
          <option value="relance">Relancé</option>
          <option value="promesse_paiement">Promesse de paiement</option>
          <option value="litige">Litige</option>
        </select>
        <select v-model="filters.per_page" class="input rounded-2xl" @change="loadFactures(1)">
          <option :value="15">15 lignes</option>
          <option :value="25">25 lignes</option>
          <option :value="50">50 lignes</option>
        </select>
        <button type="button" class="btn-secondary rounded-2xl px-4 py-2 text-sm" @click="clearFilters">Réinitialiser</button>
      </div>
    </section>

    <section class="overflow-hidden rounded-3xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] shadow-sm">
      <div class="flex flex-col gap-2 border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-base font-black text-slate-950">Factures à suivre</h2>
          <p class="amount-unit-note mt-1">{{ amountNoteText }}</p>
        </div>
        <span class="rounded-full bg-[color:var(--saytu-soft,#eef6ff)] px-3 py-1 text-xs font-bold text-[color:var(--saytu-primary,#2563eb)]">
          {{ meta.total || factures.length }} dossier(s)
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px]">
          <thead class="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Client / facture</th>
              <th class="px-4 py-3">Échéance</th>
              <th class="px-4 py-3 text-center">Retard</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3 text-right">Payé</th>
              <th class="px-4 py-3 text-right">Reste</th>
              <th class="px-4 py-3">Dernier suivi</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[color:var(--saytu-border,#e2e8f0)]">
            <tr v-if="loading">
              <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-500">Chargement du recouvrement...</td>
            </tr>
            <tr v-else-if="factures.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-500">Aucune facture à recouvrer pour le moment.</td>
            </tr>
            <tr
              v-for="facture in factures"
              v-else
              :key="facture.id"
              class="text-sm transition hover:bg-[color:var(--saytu-soft,#eef6ff)]/50"
            >
              <td class="px-4 py-3 align-top">
                <button type="button" class="font-mono text-xs font-bold text-[color:var(--saytu-primary,#2563eb)] hover:underline" @click="openFacture(facture)">
                  {{ facture.numero }}
                </button>
                <div class="mt-1 font-bold text-slate-950">{{ facture.client?.nom || 'Client non renseigné' }}</div>
                <div class="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span v-if="facture.client?.email">{{ facture.client.email }}</span>
                  <span v-if="facture.client?.telephone">{{ facture.client.telephone }}</span>
                  <span v-if="facture.commercial?.name">Com. {{ facture.commercial.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 align-top text-slate-600">
                <div>{{ formatDate(facture.date_echeance) }}</div>
                <div class="text-xs text-slate-400">Facturée le {{ formatDate(facture.date_facture) }}</div>
              </td>
              <td class="px-4 py-3 text-center align-top">
                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold" :class="riskBadge(facture.niveau_risque)">
                  {{ facture.jours_retard > 0 ? `${facture.jours_retard} j` : 'À jour' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right align-top font-mono text-slate-600">{{ formatPrice(facture.total_ttc) }}</td>
              <td class="px-4 py-3 text-right align-top font-mono text-emerald-700">{{ formatPrice(facture.montant_paye) }}</td>
              <td class="px-4 py-3 text-right align-top font-mono text-base font-black text-[color:var(--saytu-primary,#2563eb)]">{{ formatPrice(facture.reste_a_payer) }}</td>
              <td class="px-4 py-3 align-top">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="statusBadge(facture.recouvrement?.statut)">
                    {{ statusLabel(facture.recouvrement?.statut) }}
                  </span>
                  <span class="text-xs text-slate-400">{{ facture.recouvrement?.suivis_count || 0 }} action(s)</span>
                </div>
                <p v-if="facture.recouvrement?.dernier_suivi" class="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                  {{ typeActionLabel(facture.recouvrement.dernier_suivi.type_action) }}
                  <span v-if="facture.recouvrement.dernier_suivi.user?.name"> · {{ facture.recouvrement.dernier_suivi.user.name }}</span>
                </p>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="flex flex-wrap justify-end gap-2">
                  <button type="button" class="btn-secondary rounded-full px-3 py-1.5 text-xs" @click="openHistory(facture)">Historique</button>
                  <button type="button" class="btn-secondary rounded-full px-3 py-1.5 text-xs" @click="openSuivi(facture)">Suivi</button>
                  <EmailActionButtons
                    v-if="facture.client?.email"
                    :draft="relanceEmailDraft(facture)"
                    :filename="`relance-facture-${facture.numero || facture.id}`"
                    dialog
                    compact
                    @sent="recordRelance(facture, 'send')"
                    @outlook="recordRelance(facture, 'outlook')"
                  />
                  <button
                    v-else
                    type="button"
                    class="btn-secondary rounded-full px-3 py-1.5 text-xs"
                    @click="prepareRelance(facture)"
                  >
                    Relancer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.total > 0" class="flex flex-col gap-3 border-t border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-slate-500">
          {{ meta.from || 0 }}–{{ meta.to || 0 }} sur {{ meta.total || 0 }}
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary rounded-full px-3 py-1.5 text-sm" :disabled="meta.current_page <= 1 || loading" @click="loadFactures(meta.current_page - 1)">←</button>
          <span class="px-2 text-slate-500">Page {{ meta.current_page }} / {{ meta.last_page }}</span>
          <button type="button" class="btn-secondary rounded-full px-3 py-1.5 text-sm" :disabled="meta.current_page >= meta.last_page || loading" @click="loadFactures(meta.current_page + 1)">→</button>
        </div>
      </div>
    </section>

    <section v-if="stats.dernieres_actions?.length" class="rounded-3xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-4 shadow-sm">
      <h2 class="text-base font-black text-slate-950">Dernières actions</h2>
      <div class="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="action in stats.dernieres_actions" :key="action.id" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-soft,#eef6ff)]/35 p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-bold text-slate-900">{{ typeActionLabel(action.type_action) }}</p>
              <p class="text-xs text-slate-500">
                {{ action.facture?.numero || 'Facture' }} · {{ action.facture?.client?.nom || 'Client' }}
              </p>
            </div>
            <span class="text-[11px] text-slate-400">{{ formatDateTime(action.date_action) }}</span>
          </div>
          <p v-if="action.commentaire" class="mt-2 line-clamp-2 text-xs text-slate-600">{{ action.commentaire }}</p>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, CalendarClock, CreditCard, FileWarning } from 'lucide-vue-next'
import api from '@/services/api'
import EmailActionButtons from '@/components/EmailActionButtons.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'
import { buildEmailDraft, downloadOutlookEml } from '@/utils/emailComposer'

const router = useRouter()
const toast = useToast()
const { amountNoteText, formatMoney } = useCurrency()

const factures = ref([])
const loading = ref(false)
const quick = ref('')
const stats = reactive({
  factures_a_suivre: 0,
  clients_a_suivre: 0,
  reste_total: 0,
  en_retard: 0,
  retard_total: 0,
  partielles: 0,
  relances_du_jour: 0,
  promesses: 0,
  litiges: 0,
  dernieres_actions: [],
})
const filters = reactive({
  search: '',
  statut_recouvrement: '',
  per_page: 25,
})
const meta = reactive({
  current_page: 1,
  last_page: 1,
  total: 0,
  from: 0,
  to: 0,
})

let searchTimer = null

const summaryCards = computed(() => [
  {
    key: 'reste',
    label: 'À encaisser',
    value: formatPrice(stats.reste_total),
    sub: `${stats.factures_a_suivre || 0} facture(s), ${stats.clients_a_suivre || 0} client(s)`,
    quick: '',
    icon: CreditCard,
    textClass: 'text-[color:var(--saytu-primary,#2563eb)]',
  },
  {
    key: 'retard',
    label: 'En retard',
    value: formatPrice(stats.retard_total),
    sub: `${stats.en_retard || 0} facture(s) dépassée(s)`,
    quick: 'retard',
    icon: AlertTriangle,
    textClass: 'text-rose-600',
  },
  {
    key: 'partiels',
    label: 'Paiements partiels',
    value: stats.partielles || 0,
    sub: 'Clients ayant déjà versé une partie',
    quick: 'partiel',
    icon: FileWarning,
    textClass: 'text-amber-600',
  },
  {
    key: 'relances',
    label: 'Relances du jour',
    value: stats.relances_du_jour || 0,
    sub: `${stats.promesses || 0} promesse(s), ${stats.litiges || 0} litige(s)`,
    quick: 'a_relancer',
    icon: CalendarClock,
    textClass: 'text-cyan-600',
  },
])

function formatPrice(value) {
  return formatMoney(value)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR').format(date)
}

function formatDateTime(value) {
  if (!value) return '—'
  const normalized = String(value).replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return formatDate(value)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}

function datePlus(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function statusLabel(status) {
  return {
    a_surveiller: 'À surveiller',
    a_relancer: 'À relancer',
    relance: 'Relancé',
    promesse_paiement: 'Promesse',
    litige: 'Litige',
    paye: 'Payé',
  }[status] || 'À surveiller'
}

function typeActionLabel(type) {
  return {
    note: 'Note',
    relance_email: 'Relance email',
    appel: 'Appel client',
    whatsapp: 'WhatsApp',
    promesse_paiement: 'Promesse paiement',
    litige: 'Litige',
    paiement_recu: 'Paiement reçu',
    cloture: 'Clôture',
  }[type] || type || 'Action'
}

function riskBadge(level) {
  return {
    critique: 'bg-rose-100 text-rose-700',
    retard: 'bg-amber-100 text-amber-700',
    promesse: 'bg-cyan-100 text-cyan-700',
    litige: 'bg-purple-100 text-purple-700',
    partiel: 'bg-blue-100 text-blue-700',
    normal: 'bg-emerald-100 text-emerald-700',
  }[level] || 'bg-slate-100 text-slate-600'
}

function statusBadge(status) {
  return {
    a_surveiller: 'bg-slate-100 text-slate-700',
    a_relancer: 'bg-amber-100 text-amber-700',
    relance: 'bg-blue-100 text-blue-700',
    promesse_paiement: 'bg-emerald-100 text-emerald-700',
    litige: 'bg-purple-100 text-purple-700',
    paye: 'bg-green-100 text-green-700',
  }[status] || 'bg-slate-100 text-slate-700'
}

function apiParams(page = 1) {
  return {
    page,
    per_page: filters.per_page,
    search: filters.search || undefined,
    quick: quick.value || undefined,
    statut_recouvrement: filters.statut_recouvrement || undefined,
  }
}

async function loadStats() {
  const { data } = await api.get('/recouvrement/stats')
  Object.assign(stats, {
    factures_a_suivre: data.factures_a_suivre || 0,
    clients_a_suivre: data.clients_a_suivre || 0,
    reste_total: Number(data.reste_total || 0),
    en_retard: data.en_retard || 0,
    retard_total: Number(data.retard_total || 0),
    partielles: data.partielles || 0,
    relances_du_jour: data.relances_du_jour || 0,
    promesses: data.promesses || 0,
    litiges: data.litiges || 0,
    dernieres_actions: data.dernieres_actions || [],
  })
}

async function loadFactures(page = meta.current_page || 1) {
  loading.value = true
  try {
    const { data } = await api.get('/recouvrement/factures', { params: apiParams(page) })
    factures.value = data.data || []
    Object.assign(meta, {
      current_page: data.current_page || 1,
      last_page: data.last_page || 1,
      total: data.total || factures.value.length,
      from: data.from || 0,
      to: data.to || 0,
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur de chargement du recouvrement.')
  } finally {
    loading.value = false
  }
}

async function reloadAll() {
  await Promise.all([
    loadStats().catch(() => toast.error('Impossible de charger les statistiques de recouvrement.')),
    loadFactures(meta.current_page || 1),
  ])
}

function debouncedLoad() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadFactures(1), 300)
}

function applyQuick(value) {
  quick.value = quick.value === value ? '' : value
  loadFactures(1)
}

function clearFilters() {
  filters.search = ''
  filters.statut_recouvrement = ''
  filters.per_page = 25
  quick.value = ''
  loadFactures(1)
}

function goPaiement() {
  router.push('/paiements')
}

function openFacture(facture) {
  if (!facture?.id) return
  router.push({ name: 'facture-detail', params: { id: facture.id } })
}

function openSuivi(facture, overrides = {}) {
  if (!facture?.id) return
  router.push({
    name: 'recouvrement-detail',
    params: { id: facture.id },
    query: { tab: 'suivi', ...overrides },
  })
}

function relanceEmailDraft(facture) {
  const relance = facture?.email_relance || {}
  if (!relance.to) return buildEmailDraft()
  return buildEmailDraft({
    to: relance.to,
    subject: relance.subject || 'Relance facture',
    body: relance.body || '',
    context_type: 'recouvrement',
    context_id: facture.id,
  })
}

async function recordRelance(facture, mode = 'send') {
  if (!facture?.id) return

  try {
    await api.post(`/recouvrement/factures/${facture.id}/suivis`, {
      statut: 'relance',
      type_action: 'relance_email',
      prochain_rappel: datePlus(7),
      commentaire: mode === 'send'
        ? 'Relance email envoyée depuis Saytu.'
        : 'Relance email préparée en fichier Outlook depuis le module recouvrement.',
    })
    await reloadAll()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Email traité, mais le suivi de relance n’a pas pu être enregistré.')
  }
}

async function prepareRelance(facture, mode = 'send') {
  if (!facture?.client?.email) {
    openSuivi(facture, {
      statut: 'a_relancer',
      type_action: 'appel',
      prochain_rappel: datePlus(2),
      commentaire: 'Client sans email : prévoir un appel ou WhatsApp.',
    })
    toast.error('Aucun email client renseigné. Ajoutez un suivi manuel.')
    return
  }

  const draft = relanceEmailDraft(facture)
  try {
    if (mode === 'send') {
      await api.post('/emails/send', draft)
    } else if (!downloadOutlookEml(draft, `relance-facture-${facture.numero || facture.id}`)) {
      throw new Error('eml_generation_failed')
    }

    await api.post(`/recouvrement/factures/${facture.id}/suivis`, {
      statut: 'relance',
      type_action: 'relance_email',
      prochain_rappel: datePlus(7),
      commentaire: mode === 'send'
        ? 'Relance email envoyée depuis Saytu.'
        : 'Relance email préparée en fichier Outlook depuis le module recouvrement.',
    })
    await reloadAll()
    toast.success(mode === 'send' ? 'Relance envoyée depuis Saytu.' : 'Fichier .eml téléchargé pour Outlook classique.')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Relance impossible.')
  }
}

function openHistory(facture) {
  if (!facture?.id) return
  router.push({ name: 'recouvrement-detail', params: { id: facture.id }, query: { tab: 'historique' } })
}

onMounted(reloadAll)
</script>
