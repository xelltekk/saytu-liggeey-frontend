<template>
  <div class="space-y-4">
    <section class="rounded-3xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-[color:var(--saytu-primary,#2563eb)]">Suivi paiements clients</p>
          <h1 class="mt-1 text-xl font-black text-slate-950 dark:text-white">Recouvrement clients</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-300">
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
            <p class="mt-2 text-2xl font-black text-slate-950 dark:text-white">{{ card.value }}</p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-300">{{ card.sub }}</p>
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
          <h2 class="text-base font-black text-slate-950 dark:text-white">Factures à suivre</h2>
          <p class="amount-unit-note mt-1">{{ amountNoteText }}</p>
        </div>
        <span class="rounded-full bg-[color:var(--saytu-soft,#eef6ff)] px-3 py-1 text-xs font-bold text-[color:var(--saytu-primary,#2563eb)]">
          {{ meta.total || factures.length }} dossier(s)
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1120px]">
          <thead class="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900/70 dark:text-slate-300">
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
                <div class="mt-1 font-bold text-slate-950 dark:text-white">{{ facture.client?.nom || 'Client non renseigné' }}</div>
                <div class="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-300">
                  <a v-if="facture.client?.email" :href="buildMailtoUrl({ to: facture.client.email })" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ facture.client.email }}</a>
                  <span v-if="facture.client?.telephone">{{ facture.client.telephone }}</span>
                  <span v-if="facture.commercial?.name">Com. {{ facture.commercial.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 align-top text-slate-600 dark:text-slate-300">
                <div>{{ formatDate(facture.date_echeance) }}</div>
                <div class="text-xs text-slate-400">Facturée le {{ formatDate(facture.date_facture) }}</div>
              </td>
              <td class="px-4 py-3 text-center align-top">
                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold" :class="riskBadge(facture.niveau_risque)">
                  {{ facture.jours_retard > 0 ? `${facture.jours_retard} j` : 'À jour' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right align-top font-mono text-slate-600 dark:text-slate-300">{{ formatPrice(facture.total_ttc) }}</td>
              <td class="px-4 py-3 text-right align-top font-mono text-emerald-700 dark:text-emerald-300">{{ formatPrice(facture.montant_paye) }}</td>
              <td class="px-4 py-3 text-right align-top font-mono text-base font-black text-[color:var(--saytu-primary,#2563eb)]">{{ formatPrice(facture.reste_a_payer) }}</td>
              <td class="px-4 py-3 align-top">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="statusBadge(facture.recouvrement?.statut)">
                    {{ statusLabel(facture.recouvrement?.statut) }}
                  </span>
                  <span class="text-xs text-slate-400">{{ facture.recouvrement?.suivis_count || 0 }} action(s)</span>
                </div>
                <p v-if="facture.recouvrement?.dernier_suivi" class="mt-1 max-w-[260px] truncate text-xs text-slate-500 dark:text-slate-300">
                  {{ typeActionLabel(facture.recouvrement.dernier_suivi.type_action) }}
                  <span v-if="facture.recouvrement.dernier_suivi.user?.name"> · {{ facture.recouvrement.dernier_suivi.user.name }}</span>
                </p>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="flex flex-wrap justify-end gap-2">
                  <button type="button" class="btn-secondary rounded-full px-3 py-1.5 text-xs" @click="openHistory(facture)">Historique</button>
                  <button type="button" class="btn-secondary rounded-full px-3 py-1.5 text-xs" @click="openSuivi(facture)">Suivi</button>
                  <button type="button" class="btn-primary rounded-full px-3 py-1.5 text-xs" :disabled="relanceLoading === facture.id" @click="prepareRelance(facture)">
                    {{ relanceLoading === facture.id ? '...' : 'Relancer' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.total > 0" class="flex flex-col gap-3 border-t border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-slate-500 dark:text-slate-300">
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
      <h2 class="text-base font-black text-slate-950 dark:text-white">Dernières actions</h2>
      <div class="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="action in stats.dernieres_actions" :key="action.id" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-soft,#eef6ff)]/35 p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-bold text-slate-900 dark:text-white">{{ typeActionLabel(action.type_action) }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-300">
                {{ action.facture?.numero || 'Facture' }} · {{ action.facture?.client?.nom || 'Client' }}
              </p>
            </div>
            <span class="text-[11px] text-slate-400">{{ formatDateTime(action.date_action) }}</span>
          </div>
          <p v-if="action.commentaire" class="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{{ action.commentaire }}</p>
        </div>
      </div>
    </section>

    <AppModal v-model="showSuiviModal" :title="selectedFacture ? `Suivi ${selectedFacture.numero}` : 'Suivi recouvrement'" size="md" centered>
      <form class="space-y-4" @submit.prevent="saveSuivi">
        <div v-if="selectedFacture" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-soft,#eef6ff)] p-3 text-sm">
          <div class="font-bold text-slate-950 dark:text-white">{{ selectedFacture.client?.nom }}</div>
          <div class="mt-1 text-slate-500 dark:text-slate-300">
            Reste à payer : <strong>{{ formatPrice(selectedFacture.reste_a_payer) }}</strong>
            · Échéance : {{ formatDate(selectedFacture.date_echeance) }}
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Statut recouvrement
            <select v-model="suiviForm.statut" class="input mt-1 rounded-2xl" required>
              <option value="a_surveiller">À surveiller</option>
              <option value="a_relancer">À relancer</option>
              <option value="relance">Relancé</option>
              <option value="promesse_paiement">Promesse de paiement</option>
              <option value="litige">Litige</option>
              <option value="paye">Payé / clôturé</option>
            </select>
          </label>
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Type d’action
            <select v-model="suiviForm.type_action" class="input mt-1 rounded-2xl" required>
              <option value="note">Note</option>
              <option value="relance_email">Relance email</option>
              <option value="appel">Appel</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="promesse_paiement">Promesse paiement</option>
              <option value="litige">Litige</option>
              <option value="paiement_recu">Paiement reçu</option>
              <option value="cloture">Clôture</option>
            </select>
          </label>
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Date promise
            <input v-model="suiviForm.date_promesse" type="date" class="input mt-1 rounded-2xl" />
          </label>
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Prochain rappel
            <input v-model="suiviForm.prochain_rappel" type="date" class="input mt-1 rounded-2xl" />
          </label>
        </div>

        <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Commentaire
          <textarea v-model="suiviForm.commentaire" rows="4" class="input mt-1 rounded-2xl" placeholder="Ex : client relancé, promesse de virement vendredi, litige sur BL..."></textarea>
        </label>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary rounded-full px-4 py-2" @click="showSuiviModal = false">Annuler</button>
          <button type="submit" class="btn-primary rounded-full px-4 py-2" :disabled="savingSuivi">
            {{ savingSuivi ? 'Enregistrement...' : 'Enregistrer le suivi' }}
          </button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showHistoryModal" :title="selectedFacture ? `Historique ${selectedFacture.numero}` : 'Historique recouvrement'" size="lg" centered>
      <div v-if="historyLoading" class="py-10 text-center text-sm text-slate-500">Chargement de l’historique...</div>
      <div v-else class="space-y-4">
        <div v-if="history.facture" class="grid grid-cols-1 gap-3 rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-soft,#eef6ff)] p-3 text-sm sm:grid-cols-3">
          <div>
            <p class="text-xs text-slate-500">Client</p>
            <p class="font-bold text-slate-950 dark:text-white">{{ history.facture.client?.nom || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">Reste à payer</p>
            <p class="font-mono font-black text-[color:var(--saytu-primary,#2563eb)]">{{ formatPrice(history.facture.reste_a_payer) }}</p>
          </div>
          <div class="sm:text-right">
            <p class="text-xs text-slate-500">Échéance</p>
            <p class="font-bold text-slate-950 dark:text-white">{{ formatDate(history.facture.date_echeance) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h3 class="text-sm font-black uppercase tracking-wide text-slate-500">Actions de recouvrement</h3>
            <div class="mt-2 space-y-2">
              <div v-if="!history.suivis?.length" class="rounded-2xl border border-dashed border-[color:var(--saytu-border,#e2e8f0)] p-4 text-center text-sm text-slate-500">
                Aucun suivi enregistré.
              </div>
              <div v-for="suivi in history.suivis" :key="suivi.id" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-bold text-slate-950 dark:text-white">{{ typeActionLabel(suivi.type_action) }}</p>
                    <p class="text-xs text-slate-500">{{ statusLabel(suivi.statut) }} · {{ suivi.user?.name || 'Utilisateur' }}</p>
                  </div>
                  <span class="text-xs text-slate-400">{{ formatDateTime(suivi.date_action) }}</span>
                </div>
                <p v-if="suivi.commentaire" class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ suivi.commentaire }}</p>
                <div v-if="suivi.date_promesse || suivi.prochain_rappel" class="mt-2 flex flex-wrap gap-2 text-xs">
                  <span v-if="suivi.date_promesse" class="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">Promesse : {{ formatDate(suivi.date_promesse) }}</span>
                  <span v-if="suivi.prochain_rappel" class="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">Rappel : {{ formatDate(suivi.prochain_rappel) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-black uppercase tracking-wide text-slate-500">Paiements liés</h3>
            <div class="mt-2 space-y-2">
              <div v-if="!history.paiements?.length" class="rounded-2xl border border-dashed border-[color:var(--saytu-border,#e2e8f0)] p-4 text-center text-sm text-slate-500">
                Aucun paiement affecté.
              </div>
              <div v-for="paiement in history.paiements" :key="paiement.id" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-mono font-bold text-slate-950 dark:text-white">{{ paiement.reference }}</p>
                    <p class="text-xs text-slate-500">{{ modePaiementLabel(paiement.mode_paiement) }} · {{ formatDate(paiement.date_paiement) }}</p>
                  </div>
                  <span class="font-mono font-black text-emerald-700">{{ formatPrice(paiement.montant_affecte || paiement.montant) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary rounded-full px-4 py-2" @click="openFacture(history.facture || selectedFacture)">Ouvrir la facture</button>
          <button type="button" class="btn-primary rounded-full px-4 py-2" @click="openSuivi(history.facture || selectedFacture)">Ajouter un suivi</button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, CalendarClock, CreditCard, FileWarning } from 'lucide-vue-next'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'
import { buildMailtoUrl, closeReservedEmailComposerWindow, openEmailComposer, reserveEmailComposerWindow } from '@/utils/emailComposer'

const router = useRouter()
const toast = useToast()
const { amountNoteText, formatMoney } = useCurrency()

const factures = ref([])
const loading = ref(false)
const historyLoading = ref(false)
const savingSuivi = ref(false)
const relanceLoading = ref(null)
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

const showSuiviModal = ref(false)
const showHistoryModal = ref(false)
const selectedFacture = ref(null)
const history = reactive({
  facture: null,
  suivis: [],
  paiements: [],
})
const suiviForm = reactive({
  statut: 'relance',
  type_action: 'relance_email',
  date_promesse: '',
  prochain_rappel: '',
  commentaire: '',
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
    textClass: 'text-rose-600 dark:text-rose-300',
  },
  {
    key: 'partiels',
    label: 'Paiements partiels',
    value: stats.partielles || 0,
    sub: 'Clients ayant déjà versé une partie',
    quick: 'partiel',
    icon: FileWarning,
    textClass: 'text-amber-600 dark:text-amber-300',
  },
  {
    key: 'relances',
    label: 'Relances du jour',
    value: stats.relances_du_jour || 0,
    sub: `${stats.promesses || 0} promesse(s), ${stats.litiges || 0} litige(s)`,
    quick: 'a_relancer',
    icon: CalendarClock,
    textClass: 'text-cyan-600 dark:text-cyan-300',
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

function resetSuiviForm(overrides = {}) {
  Object.assign(suiviForm, {
    statut: 'relance',
    type_action: 'relance_email',
    date_promesse: '',
    prochain_rappel: datePlus(7),
    commentaire: '',
    ...overrides,
  })
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

function modePaiementLabel(mode) {
  return {
    especes: 'Espèces',
    cheque: 'Chèque',
    virement: 'Virement',
    virement_bancaire: 'Virement bancaire',
    carte_bancaire: 'Carte bancaire',
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'YAS',
    mobile_money: 'Mobile money',
    compensation: 'Compensation',
  }[mode] || mode || 'Paiement'
}

function riskBadge(level) {
  return {
    critique: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
    retard: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    promesse: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200',
    litige: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200',
    partiel: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
    normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  }[level] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
}

function statusBadge(status) {
  return {
    a_surveiller: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    a_relancer: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    relance: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
    promesse_paiement: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    litige: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200',
    paye: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200',
  }[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
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
  router.push({ path: '/factures', query: { open: facture.id } })
}

function openSuivi(facture, overrides = {}) {
  selectedFacture.value = facture
  resetSuiviForm(overrides)
  showHistoryModal.value = false
  showSuiviModal.value = true
}

async function saveSuivi() {
  if (!selectedFacture.value?.id) return
  savingSuivi.value = true
  try {
    const payload = {
      statut: suiviForm.statut,
      type_action: suiviForm.type_action,
      date_promesse: suiviForm.date_promesse || null,
      prochain_rappel: suiviForm.prochain_rappel || null,
      commentaire: suiviForm.commentaire || null,
    }
    const { data } = await api.post(`/recouvrement/factures/${selectedFacture.value.id}/suivis`, payload)
    const index = factures.value.findIndex((item) => Number(item.id) === Number(data.facture?.id))
    if (index >= 0 && data.facture) factures.value.splice(index, 1, data.facture)
    toast.success('Suivi enregistré.')
    showSuiviModal.value = false
    await loadStats()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’enregistrer le suivi.')
  } finally {
    savingSuivi.value = false
  }
}

function mailtoHref(facture) {
  const relance = facture?.email_relance || {}
  if (!relance.to) return ''
  return buildMailtoUrl({
    to: relance.to,
    subject: relance.subject || 'Relance facture',
    body: relance.body || '',
  })
}

async function prepareRelance(facture) {
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

  relanceLoading.value = facture.id
  const emailWindow = reserveEmailComposerWindow()
  try {
    await api.post(`/recouvrement/factures/${facture.id}/suivis`, {
      statut: 'relance',
      type_action: 'relance_email',
      prochain_rappel: datePlus(7),
      commentaire: 'Relance email préparée depuis le module recouvrement.',
    })
    await reloadAll()
    const href = mailtoHref(facture)
    if (href) {
      openEmailComposer(href, emailWindow)
    } else {
      closeReservedEmailComposerWindow(emailWindow)
    }
  } catch (error) {
    closeReservedEmailComposerWindow(emailWindow)
    toast.error(error.response?.data?.message || 'Relance impossible.')
  } finally {
    relanceLoading.value = null
  }
}

async function openHistory(facture) {
  if (!facture?.id) return
  selectedFacture.value = facture
  showHistoryModal.value = true
  historyLoading.value = true
  Object.assign(history, { facture, suivis: [], paiements: [] })
  try {
    const { data } = await api.get(`/recouvrement/factures/${facture.id}/historique`)
    Object.assign(history, {
      facture: data.facture || facture,
      suivis: data.suivis || [],
      paiements: data.paiements || [],
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de charger l’historique.')
  } finally {
    historyLoading.value = false
  }
}

onMounted(reloadAll)
</script>
