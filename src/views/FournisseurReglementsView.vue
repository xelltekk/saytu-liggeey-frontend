<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <button type="button" @click="setFactureFilter('')" class="stat-card" :class="activeFactureStatut === '' ? activeCardClass : ''">
        <span class="stat-label">Factures fournisseurs</span>
        <strong class="stat-value text-slate-900 dark:text-white">{{ stats.total_factures || 0 }}</strong>
      </button>
      <button type="button" @click="setFactureFilter('impayees')" class="stat-card" :class="activeFactureStatut === 'impayees' ? activeCardClass : ''">
        <span class="stat-label">Impayées</span>
        <strong class="stat-value text-orange-600">{{ stats.impayees || 0 }}</strong>
      </button>
      <button type="button" @click="setFactureFilter('retard')" class="stat-card" :class="activeFactureStatut === 'retard' ? activeCardClass : ''">
        <span class="stat-label">En retard</span>
        <strong class="stat-value text-red-600">{{ stats.en_retard || 0 }}</strong>
      </button>
      <div class="stat-card">
        <span class="stat-label">Dette fournisseurs</span>
        <strong class="stat-value text-blue-700 dark:text-blue-300">{{ formatPrice(stats.dette_total) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Réglé ce mois</span>
        <strong class="stat-value text-emerald-700 dark:text-emerald-300">{{ formatPrice(stats.reglements_mois) }}</strong>
      </div>
    </div>

    <div class="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex gap-2">
        <button type="button" @click="activeTab = 'factures'" class="tab-button" :class="activeTab === 'factures' ? 'tab-active' : ''">
          Factures fournisseurs
        </button>
        <button type="button" @click="activeTab = 'reglements'" class="tab-button" :class="activeTab === 'reglements' ? 'tab-active' : ''">
          Règlements
        </button>
      </div>

      <div class="flex flex-wrap gap-2 pb-3">
        <button type="button" @click="exporterFacturesCSV" :disabled="exportLoading" class="btn-secondary">
          {{ exportLoading ? 'Export...' : 'Exporter factures' }}
        </button>
        <button type="button" @click="exporterReglementsCSV" :disabled="exportLoading" class="btn-secondary">
          {{ exportLoading ? 'Export...' : 'Exporter règlements' }}
        </button>
        <button type="button" @click="openFactureCreate" class="btn-primary">Nouvelle facture fournisseur</button>
        <button type="button" @click="openReglementCreate" class="btn-secondary">Nouveau règlement</button>
      </div>
    </div>

    <section v-show="activeTab === 'factures'" class="space-y-4">
      <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px]">
          <input v-model="factureFilters.search" @input="onFactureSearch" type="search" class="input" placeholder="Rechercher numéro, fournisseur, référence..." />
          <select v-model="factureFilters.fournisseur_id" @change="loadFactures(1)" class="input">
            <option value="">Tous fournisseurs</option>
            <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
          </select>
          <select v-model="factureFilters.statut" @change="onFactureStatutChange" class="input">
            <option value="">Tous statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="validee">Validée</option>
            <option value="partiellement_payee">Partiellement payée</option>
            <option value="payee">Payée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1080px]">
            <thead class="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
              <tr>
                <th class="th">N°</th>
                <th class="th">Fournisseur</th>
                <th class="th">Référence</th>
                <th class="th">Commande</th>
                <th class="th">Objet</th>
                <th class="th text-center">Échéance</th>
                <th class="th text-right">Total</th>
                <th class="th text-right">Payé</th>
                <th class="th text-right">Reste</th>
                <th class="th text-center">Statut</th>
                <th class="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="facture in factures" :key="facture.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="td font-mono text-slate-600 dark:text-slate-300">{{ facture.numero }}</td>
                <td class="td">
                  <div class="font-medium text-slate-900 dark:text-white">{{ facture.fournisseur?.nom || 'Fournisseur' }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">{{ facture.fournisseur?.code || '–' }}</div>
                </td>
                <td class="td text-slate-600 dark:text-slate-300">{{ facture.reference_fournisseur || '-' }}</td>
                <td class="td">
                  <span v-if="facture.commande_achat" class="font-mono text-violet-700 dark:text-violet-300">{{ facture.commande_achat.numero }}</span>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <td class="td text-slate-700 dark:text-slate-200">{{ facture.objet }}</td>
                <td class="td text-center text-slate-600 dark:text-slate-300">{{ formatDate(facture.date_echeance) }}</td>
                <td class="td text-right font-mono font-semibold">{{ formatPrice(facture.total_ttc) }}</td>
                <td class="td text-right font-mono text-emerald-700 dark:text-emerald-300">{{ formatPrice(facture.montant_paye) }}</td>
                <td class="td text-right font-mono text-orange-700 dark:text-orange-300">{{ formatPrice(facture.reste_a_payer) }}</td>
                <td class="td text-center"><span class="badge" :class="statutBadge(facture.statut)">{{ statutLabel(facture.statut) }}</span></td>
                <td class="td">
                  <div class="flex justify-end gap-2">
                    <button type="button" @click="openFactureEdit(facture)" class="table-action">Modifier</button>
                    <button type="button" @click="deleteFacture(facture)" class="table-danger">Supprimer</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!factureLoading && factures.length === 0">
                <td colspan="11" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Aucune facture fournisseur</td>
              </tr>
              <tr v-if="factureLoading">
                <td colspan="11" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Chargement...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <PaginationBar :meta="factureMeta" @page="loadFactures" />
      </div>
    </section>

    <section v-show="activeTab === 'reglements'" class="space-y-4">
      <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px]">
          <input v-model="reglementFilters.search" @input="onReglementSearch" type="search" class="input" placeholder="Rechercher règlement, fournisseur, facture..." />
          <select v-model="reglementFilters.fournisseur_id" @change="loadReglements(1)" class="input">
            <option value="">Tous fournisseurs</option>
            <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
          </select>
          <select v-model="reglementFilters.statut" @change="loadReglements(1)" class="input">
            <option value="">Tous statuts</option>
            <option value="valide">Validé</option>
            <option value="en_attente">En attente</option>
            <option value="rejete">Rejeté</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px]">
            <thead class="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
              <tr>
                <th class="th">Référence</th>
                <th class="th">Fournisseur</th>
                <th class="th text-center">Date</th>
                <th class="th text-right">Montant</th>
                <th class="th text-right">Affecté</th>
                <th class="th text-center">Mode</th>
                <th class="th">Factures</th>
                <th class="th text-center">Statut</th>
                <th class="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="reglement in reglements" :key="reglement.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="td font-mono text-slate-600 dark:text-slate-300">{{ reglement.reference }}</td>
                <td class="td">
                  <div class="font-medium text-slate-900 dark:text-white">{{ reglement.fournisseur?.nom || 'Fournisseur' }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">{{ reglement.fournisseur?.code || '–' }}</div>
                </td>
                <td class="td text-center text-slate-600 dark:text-slate-300">{{ formatDate(reglement.date_reglement) }}</td>
                <td class="td text-right font-mono font-semibold text-red-700 dark:text-red-300">{{ formatPrice(reglement.montant) }}</td>
                <td class="td text-right font-mono text-blue-700 dark:text-blue-300">{{ formatPrice(reglement.montant_affecte) }}</td>
                <td class="td text-center"><span class="badge bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">{{ modeLabel(reglement.mode_paiement) }}</span></td>
                <td class="td text-xs text-slate-600 dark:text-slate-300">
                  <div v-if="reglement.factures.length" class="space-y-1">
                    <div v-for="facture in reglement.factures" :key="facture.id">
                      <span class="font-mono">{{ facture.numero }}</span>
                      <span class="text-slate-400">({{ formatPrice(facture.pivot.montant_affecte) }})</span>
                    </div>
                  </div>
                  <span v-else>-</span>
                </td>
                <td class="td text-center"><span class="badge" :class="reglementBadge(reglement.statut)">{{ reglementLabel(reglement.statut) }}</span></td>
                <td class="td text-right">
                  <button type="button" @click="deleteReglement(reglement)" class="table-danger">Supprimer</button>
                </td>
              </tr>
              <tr v-if="!reglementLoading && reglements.length === 0">
                <td colspan="9" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Aucun règlement fournisseur</td>
              </tr>
              <tr v-if="reglementLoading">
                <td colspan="9" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Chargement...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <PaginationBar :meta="reglementMeta" @page="loadReglements" />
      </div>
    </section>

    <AppModal v-model="showFactureModal" :title="editingFacture ? 'Modifier facture fournisseur' : 'Nouvelle facture fournisseur'" size="lg">
      <form class="space-y-4" @submit.prevent="saveFacture">
        <div v-if="editingFacture?.commande_achat" class="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
          Facture générée depuis la commande <strong class="font-mono">{{ editingFacture.commande_achat.numero }}</strong>. Le fournisseur et les montants restent synchronisés avec cette commande.
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="field-label">
            Fournisseur
            <select v-model="factureForm.fournisseur_id" required class="input mt-1" :disabled="!!editingFacture?.commande_achat">
              <option value="">Sélectionner</option>
              <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
            </select>
          </label>
          <label class="field-label">
            Référence fournisseur
            <input v-model="factureForm.reference_fournisseur" type="text" class="input mt-1" placeholder="N° facture reçue" />
          </label>
          <label class="field-label">
            Date facture
            <input v-model="factureForm.date_facture" type="date" required class="input mt-1" />
          </label>
          <label class="field-label">
            Date échéance
            <input v-model="factureForm.date_echeance" type="date" class="input mt-1" />
          </label>
          <label class="field-label md:col-span-2">
            Objet
            <input v-model="factureForm.objet" type="text" required class="input mt-1" :readonly="!!editingFacture?.commande_achat" placeholder="Achat marchandises, prestation, transport..." />
          </label>
          <label class="field-label">
            Montant HT
            <input v-model.number="factureForm.montant_ht" type="number" min="0" step="1" required class="input mt-1" :readonly="!!editingFacture?.commande_achat" />
          </label>
          <label class="field-label">
            TVA fournisseur
            <input v-model.number="factureForm.montant_tva" type="number" min="0" step="1" class="input mt-1" :readonly="!!editingFacture?.commande_achat" />
          </label>
          <label class="field-label">
            Statut
            <select v-model="factureForm.statut" class="input mt-1">
              <option value="validee">Validée</option>
              <option value="brouillon">Brouillon</option>
              <option value="annulee">Annulée</option>
            </select>
          </label>
          <label class="field-label">
            Total TTC
            <input :value="formatPrice(totalFactureForm)" type="text" readonly class="input mt-1 bg-slate-50 dark:bg-slate-800" />
          </label>
          <label class="field-label md:col-span-2">
            Notes
            <textarea v-model="factureForm.notes" rows="3" class="input mt-1"></textarea>
          </label>
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="button" @click="showFactureModal = false" class="btn-secondary">Annuler</button>
          <button type="submit" :disabled="savingFacture" class="btn-primary">{{ savingFacture ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showReglementModal" title="Nouveau règlement fournisseur" size="lg">
      <form class="space-y-4" @submit.prevent="saveReglement">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="field-label">
            Fournisseur
            <select v-model="reglementForm.fournisseur_id" required class="input mt-1" @change="loadFacturesImpayees">
              <option value="">Sélectionner</option>
              <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
            </select>
          </label>
          <label class="field-label">
            Date règlement
            <input v-model="reglementForm.date_reglement" type="date" required class="input mt-1" />
          </label>
          <label class="field-label">
            Mode de paiement
            <select v-model="reglementForm.mode_paiement" required class="input mt-1">
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="free_money">Free Money</option>
              <option value="carte_bancaire">Carte bancaire</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label class="field-label">
            Montant réglé
            <input v-model.number="reglementForm.montant" type="number" min="1" step="1" required class="input mt-1" />
          </label>
          <label class="field-label">
            Référence paiement
            <input v-model="reglementForm.reference_paiement" type="text" class="input mt-1" placeholder="N° chèque, virement..." />
          </label>
          <label class="field-label">
            Banque
            <input v-model="reglementForm.banque" type="text" class="input mt-1" />
          </label>
        </div>

        <div class="rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            Factures à régler
          </div>
          <div v-if="facturesImpayees.length" class="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            <label v-for="facture in facturesImpayees" :key="facture.id" class="grid cursor-pointer grid-cols-1 gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 sm:grid-cols-[28px_1fr_170px] sm:items-center">
              <input type="checkbox" :checked="isFactureSelected(facture.id)" class="h-4 w-4" @change="toggleFacture(facture)" />
              <div>
                <div class="font-mono text-sm font-semibold text-slate-800 dark:text-white">{{ facture.numero }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Reste: {{ formatPrice(facture.reste_a_payer) }} - Échéance: {{ formatDate(facture.date_echeance) }}</div>
              </div>
              <input
                :disabled="!isFactureSelected(facture.id)"
                :value="selectedAmount(facture.id)"
                type="number"
                min="1"
                step="1"
                class="input"
                @input="setSelectedAmount(facture.id, $event.target.value)"
              />
            </label>
          </div>
          <div v-else class="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Sélectionnez un fournisseur avec des factures impayées.
          </div>
        </div>

        <label class="field-label">
          Notes
          <textarea v-model="reglementForm.notes" rows="3" class="input mt-1"></textarea>
        </label>

        <div class="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="button" @click="showReglementModal = false" class="btn-secondary">Annuler</button>
          <button type="submit" :disabled="savingReglement" class="btn-primary">{{ savingReglement ? 'Enregistrement...' : 'Enregistrer le règlement' }}</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useToast } from '@/composables/useToast'
import { telechargerCSV } from '@/services/exports'

const PaginationBar = defineComponent({
  props: { meta: { type: Object, required: true } },
  emits: ['page'],
  setup(props, { emit }) {
    return () => props.meta.total > 0
      ? h('div', { class: 'flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between' }, [
        h('div', { class: 'text-slate-600 dark:text-slate-300' }, `${props.meta.from || 0}-${props.meta.to || 0} sur ${props.meta.total || 0}`),
        h('div', { class: 'flex gap-2' }, [
          h('button', { class: 'btn-secondary px-3 py-1.5 disabled:opacity-40', disabled: props.meta.current_page <= 1, onClick: () => emit('page', props.meta.current_page - 1) }, '<'),
          h('span', { class: 'px-3 py-1.5 text-slate-600 dark:text-slate-300' }, `${props.meta.current_page || 1} / ${props.meta.last_page || 1}`),
          h('button', { class: 'btn-secondary px-3 py-1.5 disabled:opacity-40', disabled: props.meta.current_page >= props.meta.last_page, onClick: () => emit('page', props.meta.current_page + 1) }, '>'),
        ]),
      ])
      : null
  },
})

const toast = useToast()
const route = useRoute()
const activeTab = ref('factures')
const activeFactureStatut = ref('')
const activeCardClass = 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/30 dark:ring-blue-900/60'

const fournisseurs = ref([])
const factures = ref([])
const reglements = ref([])
const facturesImpayees = ref([])
const factureLoading = ref(false)
const reglementLoading = ref(false)
const exportLoading = ref(false)
const savingFacture = ref(false)
const savingReglement = ref(false)
const showFactureModal = ref(false)
const showReglementModal = ref(false)
const editingFacture = ref(null)
let factureSearchTimer = null
let reglementSearchTimer = null

const stats = reactive({
  total_factures: 0,
  impayees: 0,
  en_retard: 0,
  dette_total: 0,
  reglements_mois: 0,
})

const factureFilters = reactive({ search: '', fournisseur_id: '', statut: '', etat: '' })
const reglementFilters = reactive({ search: '', fournisseur_id: '', statut: '' })
const factureMeta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const reglementMeta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

const factureForm = reactive({
  fournisseur_id: '',
  reference_fournisseur: '',
  objet: '',
  statut: 'validee',
  date_facture: todayInput(),
  date_echeance: '',
  montant_ht: 0,
  montant_tva: 0,
  notes: '',
})

const reglementForm = reactive({
  fournisseur_id: '',
  date_reglement: todayInput(),
  montant: 0,
  mode_paiement: 'virement',
  reference_paiement: '',
  banque: '',
  notes: '',
  factures: [],
})

const totalFactureForm = computed(() => Number(factureForm.montant_ht || 0) + Number(factureForm.montant_tva || 0))

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDate(value) {
  return value ? String(value).slice(0, 10) : ''
}

function syncMeta(target, source) {
  Object.assign(target, {
    current_page: source.current_page || 1,
    last_page: source.last_page || 1,
    total: source.total || 0,
    from: source.from || 0,
    to: source.to || 0,
  })
}

async function loadInitialData() {
  try {
    await Promise.all([loadFournisseurs(), loadStats(), loadFactures(), loadReglements()])
  } catch (error) {
    showApiError(error, 'Impossible de charger les règlements fournisseurs.')
  }
}

async function loadFournisseurs() {
  const { data } = await api.get('/fournisseurs-reglements/fournisseurs')
  fournisseurs.value = data
}

async function loadStats() {
  const { data } = await api.get('/fournisseurs-reglements/stats')
  Object.assign(stats, data)
}

async function loadFactures(page = 1) {
  factureLoading.value = true
  try {
    const params = {
      page,
      per_page: 20,
      search: factureFilters.search || undefined,
      fournisseur_id: factureFilters.fournisseur_id || undefined,
      statut: factureFilters.statut || undefined,
      etat: factureFilters.etat || undefined,
    }
    const { data } = await api.get('/fournisseurs-reglements/factures', { params })
    factures.value = data.data || []
    syncMeta(factureMeta, data)
  } finally {
    factureLoading.value = false
  }
}

async function loadReglements(page = 1) {
  reglementLoading.value = true
  try {
    const params = {
      page,
      per_page: 20,
      search: reglementFilters.search || undefined,
      fournisseur_id: reglementFilters.fournisseur_id || undefined,
      statut: reglementFilters.statut || undefined,
    }
    const { data } = await api.get('/fournisseurs-reglements/reglements', { params })
    reglements.value = data.data || []
    syncMeta(reglementMeta, data)
  } finally {
    reglementLoading.value = false
  }
}

function onFactureSearch() {
  clearTimeout(factureSearchTimer)
  factureSearchTimer = setTimeout(() => loadFactures(1), 350)
}

function onReglementSearch() {
  clearTimeout(reglementSearchTimer)
  reglementSearchTimer = setTimeout(() => loadReglements(1), 350)
}

function setFactureFilter(type) {
  activeFactureStatut.value = type
  activeTab.value = 'factures'
  factureFilters.etat = type || ''
  factureFilters.statut = ''
  loadFactures(1)
}

function onFactureStatutChange() {
  activeFactureStatut.value = ''
  factureFilters.etat = ''
  loadFactures(1)
}

function resetFactureForm() {
  editingFacture.value = null
  Object.assign(factureForm, {
    fournisseur_id: '',
    reference_fournisseur: '',
    objet: '',
    statut: 'validee',
    date_facture: todayInput(),
    date_echeance: '',
    montant_ht: 0,
    montant_tva: 0,
    notes: '',
  })
}

function openFactureCreate() {
  resetFactureForm()
  showFactureModal.value = true
}

function openFactureEdit(facture) {
  editingFacture.value = facture
  Object.assign(factureForm, {
    fournisseur_id: facture.fournisseur_id || facture.fournisseur?.id || '',
    reference_fournisseur: facture.reference_fournisseur || '',
    objet: facture.objet || '',
    statut: ['payee', 'partiellement_payee'].includes(facture.statut) ? 'validee' : facture.statut,
    date_facture: normalizeDate(facture.date_facture),
    date_echeance: normalizeDate(facture.date_echeance),
    montant_ht: Number(facture.montant_ht || 0),
    montant_tva: Number(facture.montant_tva || 0),
    notes: facture.notes || '',
  })
  showFactureModal.value = true
}

async function saveFacture() {
  savingFacture.value = true
  try {
    const payload = { ...factureForm }
    if (!payload.date_echeance) payload.date_echeance = null
    if (editingFacture.value) {
      await api.put(`/fournisseurs-reglements/factures/${editingFacture.value.id}`, payload)
      toast.success('Facture fournisseur modifiée.')
    } else {
      await api.post('/fournisseurs-reglements/factures', payload)
      toast.success('Facture fournisseur créée.')
    }
    showFactureModal.value = false
    await Promise.all([loadStats(), loadFactures(factureMeta.current_page)])
  } catch (error) {
    showApiError(error)
  } finally {
    savingFacture.value = false
  }
}

async function deleteFacture(facture) {
  if (!confirm(`Supprimer la facture fournisseur ${facture.numero} `)) return
  try {
    await api.delete(`/fournisseurs-reglements/factures/${facture.id}`)
    toast.success('Facture fournisseur supprimée.')
    await Promise.all([loadStats(), loadFactures(factureMeta.current_page)])
  } catch (error) {
    showApiError(error)
  }
}

function resetReglementForm() {
  Object.assign(reglementForm, {
    fournisseur_id: '',
    date_reglement: todayInput(),
    montant: 0,
    mode_paiement: 'virement',
    reference_paiement: '',
    banque: '',
    notes: '',
    factures: [],
  })
  facturesImpayees.value = []
}

function openReglementCreate() {
  resetReglementForm()
  showReglementModal.value = true
}

async function loadFacturesImpayees() {
  reglementForm.factures = []
  reglementForm.montant = 0
  facturesImpayees.value = []
  if (!reglementForm.fournisseur_id) return

  try {
    const { data } = await api.get(`/fournisseurs-reglements/fournisseurs/${reglementForm.fournisseur_id}/factures-impayees`)
    facturesImpayees.value = data
  } catch (error) {
    showApiError(error, 'Impossible de charger les factures impayées du fournisseur.')
  }
}

function isFactureSelected(id) {
  return reglementForm.factures.some((facture) => Number(facture.facture_id) === Number(id))
}

function selectedAmount(id) {
  return reglementForm.factures.find((facture) => Number(facture.facture_id) === Number(id))?.montant_affecte || ''
}

function toggleFacture(facture) {
  if (isFactureSelected(facture.id)) {
    reglementForm.factures = reglementForm.factures.filter((item) => Number(item.facture_id) !== Number(facture.id))
  } else {
    reglementForm.factures.push({
      facture_id: facture.id,
      montant_affecte: Number(facture.reste_a_payer || 0),
    })
  }
  syncReglementMontant()
}

function setSelectedAmount(id, value) {
  const item = reglementForm.factures.find((facture) => Number(facture.facture_id) === Number(id))
  if (!item) return
  item.montant_affecte = Number(value || 0)
  syncReglementMontant()
}

function syncReglementMontant() {
  reglementForm.montant = reglementForm.factures.reduce((total, facture) => total + Number(facture.montant_affecte || 0), 0)
}

async function saveReglement() {
  savingReglement.value = true
  try {
    const facturesSelectionnees = reglementForm.factures.filter((facture) => Number(facture.montant_affecte || 0) > 0)
    const totalAffecte = facturesSelectionnees.reduce((total, facture) => total + Number(facture.montant_affecte || 0), 0)

    if (facturesSelectionnees.length === 0) {
      toast.error('Sélectionnez au moins une facture fournisseur.')
      return
    }

    if (Math.abs(totalAffecte - Number(reglementForm.montant || 0)) > 0.01) {
      toast.error('Le montant réglé doit être égal au total affecté aux factures.')
      return
    }

    const payload = {
      ...reglementForm,
      factures: facturesSelectionnees,
    }
    await api.post('/fournisseurs-reglements/reglements', payload)
    toast.success('Règlement fournisseur enregistré.')
    showReglementModal.value = false
    await Promise.all([loadStats(), loadFactures(factureMeta.current_page), loadReglements(1)])
  } catch (error) {
    showApiError(error)
  } finally {
    savingReglement.value = false
  }
}

async function deleteReglement(reglement) {
  if (!confirm(`Supprimer le règlement ${reglement.reference} `)) return
  try {
    await api.delete(`/fournisseurs-reglements/reglements/${reglement.id}`)
    toast.success('Règlement fournisseur supprimé.')
    await Promise.all([loadStats(), loadFactures(factureMeta.current_page), loadReglements(reglementMeta.current_page)])
  } catch (error) {
    showApiError(error)
  }
}

async function exporterReglementsCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/fournisseurs-reglements', {
      search: reglementFilters.search || undefined,
      fournisseur_id: reglementFilters.fournisseur_id || undefined,
      statut: reglementFilters.statut || undefined,
    }, 'reglements_fournisseurs.csv')
    toast.success('Export des règlements fournisseurs téléchargé.')
  } catch (error) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

async function exporterFacturesCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/fournisseurs-factures', {
      search: factureFilters.search || undefined,
      fournisseur_id: factureFilters.fournisseur_id || undefined,
      statut: factureFilters.statut || undefined,
      etat: factureFilters.etat || undefined,
    }, 'factures_fournisseurs.csv')
    toast.success('Export des factures fournisseurs téléchargé.')
  } catch (error) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

function showApiError(error, fallback = 'Une erreur est survenue.') {
  const data = error?.response?.data || {}
  const errors = data.errors
  if (errors) {
    toast.error(Object.values(errors).flat()[0] || 'Veuillez corriger le formulaire.')
    return
  }
  toast.error(data.message || fallback)
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

function statutLabel(statut) {
  return {
    brouillon: 'Brouillon',
    validee: 'Validée',
    partiellement_payee: 'Partielle',
    payee: 'Payée',
    annulee: 'Annulée',
  }[statut] || statut
}

function statutBadge(statut) {
  return {
    brouillon: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
    validee: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
    partiellement_payee: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200',
    payee: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    annulee: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
  }[statut] || 'bg-slate-100 text-slate-700'
}

function reglementLabel(statut) {
  return {
    valide: 'Validé',
    en_attente: 'En attente',
    rejete: 'Rejeté',
    annule: 'Annulé',
  }[statut] || statut
}

function reglementBadge(statut) {
  return {
    valide: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    en_attente: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200',
    rejete: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
    annule: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  }[statut] || 'bg-slate-100 text-slate-700'
}

function modeLabel(mode) {
  return {
    especes: 'Espèces',
    cheque: 'Chèque',
    virement: 'Virement',
    carte_bancaire: 'Carte',
    mobile_money: 'Mobile money',
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'Free Money',
    compensation: 'Compensation',
    autre: 'Autre',
  }[mode] || mode
}

onMounted(() => {
  if (route.query.search) {
    activeTab.value = 'factures'
    factureFilters.search = String(route.query.search)
  }
  loadInitialData()
})
</script>

<style scoped>
.stat-card {
  @apply rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900;
}

.stat-label {
  @apply block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400;
}

.stat-value {
  @apply mt-2 block text-2xl font-bold;
}

.tab-button {
  @apply border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 transition hover:text-blue-600 dark:text-slate-300;
}

.tab-active {
  @apply border-blue-600 text-blue-600 dark:text-blue-300;
}

.th {
  @apply px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300;
}

.td {
  @apply px-4 py-3 text-sm;
}

.badge {
  @apply inline-flex rounded-full px-2.5 py-1 text-xs font-semibold;
}

.table-action {
  @apply rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950;
}

.table-danger {
  @apply rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950;
}

.field-label {
  @apply text-sm font-medium text-slate-700 dark:text-slate-200;
}
</style>
