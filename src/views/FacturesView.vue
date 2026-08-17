<template>
  <div>
    <!-- Filtres -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="🔍 Numéro, objet, client..." class="input flex-1" />
        <select v-model="filters.statut" @change="onFactureFilterChange" class="input md:w-44">
          <option value="">Tous statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="validee">Validée</option>
          <option value="envoyee">Envoyée</option>
          <option value="partiellement_payee">Partiel. payée</option>
          <option value="payee">Payée</option>
          <option value="impayee">Impayée</option>
          <option value="annulee">Annulée</option>
        </select>
        <select v-model="filters.type" @change="onFactureFilterChange" class="input md:w-36">
          <option value="">Tous types</option>
          <option value="standard">Standard</option>
          <option value="avoir">Avoir</option>
          <option value="acompte">Acompte</option>
        </select>
        <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          <span v-if="exportLoading">⏳ Export...</span>
          <span v-else>📥 Exporter CSV</span>
        </button>
        <button @click="openCreate" class="btn-primary whitespace-nowrap">+ Nouvelle facture</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 mb-4">
      <button type="button" @click="applyQuickFilter('standard')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="quickCardClass('standard')">
        <div class="text-xs text-gray-500 uppercase">Total</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</div>
      </button>
      <button v-if="!isCommercial" type="button" @click="applyQuickFilter('impayees')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="quickCardClass('impayees')">
        <div class="text-xs text-gray-500 uppercase">Impayées</div>
        <div class="text-2xl font-bold text-orange-600">{{ stats.impayees || 0 }}</div>
      </button>
      <button v-if="!isCommercial" type="button" @click="applyQuickFilter('en_retard')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="quickCardClass('en_retard')">
        <div class="text-xs text-gray-500 uppercase">En retard</div>
        <div class="text-2xl font-bold text-red-600">{{ stats.en_retard || 0 }}</div>
      </button>
      <button v-if="!isCommercial" type="button" @click="applyQuickFilter('ca_annee')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="quickCardClass('ca_annee')">
        <div class="text-xs text-gray-500 uppercase">CA Année</div>
        <div class="text-base font-bold text-green-600">{{ formatPrice(stats.ca_annee) }}</div>
      </button>
      <button v-if="!isCommercial" type="button" @click="applyQuickFilter('encours')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="quickCardClass('encours')">
        <div class="text-xs text-gray-500 uppercase">Encours</div>
        <div class="text-base font-bold text-xelltekk-700">{{ formatPrice(stats.encours_total) }}</div>
      </button>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="numero" :active="sort.key === 'numero'" :icon="sortIcon('numero')" @sort="toggleSort">N°</SortableTh>
              <SortableTh column="client" :active="sort.key === 'client'" :icon="sortIcon('client')" @sort="toggleSort">Client</SortableTh>
              <SortableTh column="date" :active="sort.key === 'date'" :icon="sortIcon('date')" align="center" @sort="toggleSort">Date</SortableTh>
              <SortableTh column="echeance" :active="sort.key === 'echeance'" :icon="sortIcon('echeance')" align="center" @sort="toggleSort">Échéance</SortableTh>
              <SortableTh column="total" :active="sort.key === 'total'" :icon="sortIcon('total')" align="right" @sort="toggleSort">Total TTC</SortableTh>
              <SortableTh column="reste" :active="sort.key === 'reste'" :icon="sortIcon('reste')" align="right" @sort="toggleSort">Reste</SortableTh>
              <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="f in sortedFactures" :key="f.id" class="hover:bg-gray-50">
              <td class="px-3 py-3 text-xs font-mono text-gray-600">
                {{ f.numero }}
                <span v-if="f.type === 'avoir'" class="ml-1 text-red-600 text-[10px]">AVOIR</span>
              </td>
              <td class="px-3 py-3">
                <div class="text-sm font-medium text-gray-900 truncate max-w-[180px]">{{ f.client?.nom || 'Client non renseigné' }}</div>
                <div class="text-xs text-gray-500">{{ f.client?.code || '–' }}</div>
                <div class="text-xs text-blue-600">Commercial : {{ f.commercial?.name || 'Non affecté' }}</div>
              </td>
              <td class="px-3 py-3 text-xs text-center text-gray-600">{{ formatDate(f.date_facture) }}</td>
              <td class="px-3 py-3 text-xs text-center" :class="isEnRetard(f) ? 'text-red-600 font-semibold' : 'text-gray-600'">
                {{ formatDate(f.date_echeance) }}
              </td>
              <td class="px-3 py-3 text-right font-mono text-sm font-semibold text-gray-900">{{ formatPrice(f.total_ttc) }}</td>
              <td class="px-3 py-3 text-right font-mono text-sm" :class="parseFloat(f.reste_a_payer) > 0 ? 'text-orange-700 font-semibold' : 'text-gray-400'">
                {{ parseFloat(f.reste_a_payer) > 0 ? formatPrice(f.reste_a_payer) : '–' }}
              </td>
              <td class="px-3 py-3 text-center">
                <span class="badge text-[10px]" :class="statutBadge(f.statut)">{{ statutLabel(f.statut) }}</span>
              </td>
              <td class="px-3 py-3 text-right whitespace-nowrap">
                <button @click="ouvrirPdf(f)" class="text-xelltekk-600 hover:text-xelltekk-800 mr-2" title="PDF">📄</button>
                <button
                  v-if="canManagePayments && f.type !== 'avoir' && !['payee','annulee'].includes(f.statut)"
                  @click="openMarquerPayee(f)"
                  class="text-green-600 hover:text-green-800 mr-2"
                  title="Marquer comme payée"
                >
                  ✅
                </button>
                <button
                  v-if="f.type !== 'avoir' && !['payee','annulee'].includes(f.statut) && !parseFloat(f.montant_paye)"
                  @click="openAnnuler(f)"
                  class="text-orange-600 hover:text-orange-800 mr-2"
                  title="Annuler la facture"
                >
                  🚫
                </button>
                <button
                  v-if="f.type !== 'avoir' && f.statut !== 'brouillon' && f.statut !== 'annulee'"
                  @click="openCreateAvoir(f)"
                  class="text-red-600 hover:text-red-800 mr-2"
                  title="Créer un avoir"
                >
                  ↩️
                </button>
                <button
                  @click="handleCloner(f)"
                  :disabled="cloningId === f.id"
                  class="text-cyan-700 hover:text-cyan-900 mr-2 text-sm font-medium disabled:opacity-50"
                  title="Cloner cette facture"
                >
                  Cloner
                </button>
                <button @click="openEdit(f)" class="text-xelltekk-600 hover:text-xelltekk-800 mr-2" title="Modifier">✏️</button>
                <button v-if="isAdmin" @click="openAssignFacture(f)" class="text-indigo-600 hover:text-indigo-800 mr-2 text-sm font-medium" title="Affecter">Affecter</button>
                <button @click="confirmDelete(f)" class="text-red-600 hover:text-red-800" title="Supprimer">🗑️</button>
              </td>
            </tr>
            <tr v-if="factures.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">Aucune facture</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          <strong>{{ meta.from }}</strong>–<strong>{{ meta.to }}</strong> sur <strong>{{ meta.total }}</strong> factures
        </div>
        <div class="flex gap-2">
          <button @click="loadFactures(meta.current_page - 1)" :disabled="meta.current_page === 1" class="btn-secondary px-3 py-1.5 disabled:opacity-40">←</button>
          <span class="px-3 py-1.5 text-gray-600">{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button @click="loadFactures(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="btn-secondary px-3 py-1.5 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>

    <AppModal
      v-model="showModal"
      :title="editingFacture ? `Modifier ${editingFacture.numero}` : 'Nouvelle facture'"
      size="xl"
      :before-close="requestCloseSaisie"
    >
      <FactureForm
        :facture="editingFacture"
        :client="creatingClient"
        @saved="onSaved"
        @cancel="closeSaisie"
        @dirty-change="formDirty = $event"
      />
    </AppModal>

    <AppConfirmModal
      v-model="showLeaveConfirm"
      title="Quitter la saisie ?"
      message="Voulez-vous quitter la saisie de la facture ? Les informations non enregistrées seront perdues."
      hint="Choisissez « Rester » pour continuer votre saisie."
      cancel-label="Rester"
      confirm-label="Quitter sans enregistrer"
      tone="danger"
      @confirm="discardInvoiceForm"
    />

    <AssignCommercialModal
      v-if="assignTarget"
      v-model="showAssignModal"
      :endpoint="assignEndpoint"
      :current-commercial-id="assignTarget?.commercial_id"
      :item-label="assignTarget ? `${assignTarget.numero} - ${assignTarget.client?.nom || ''}` : ''"
      title="Affecter facture"
      @assigned="onAssigned"
    />

    <AppModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p class="text-gray-700">Supprimer la facture <strong>{{ factureToDelete.numero }}</strong> </p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleDelete" :disabled="deleting" class="btn-danger">
          <span v-if="deleting">...</span><span v-else>Supprimer</span>
        </button>
      </template>
    </AppModal>

    <!-- Modal création d'avoir -->
    <AppModal v-model="showAvoirModal" :title="avoirFacture ? `Créer un avoir sur ${avoirFacture.numero}` : 'Créer un avoir'" size="lg">
      <div v-if="loadingAvoir" class="text-center py-8 text-gray-500">Chargement...</div>
      <div v-else class="space-y-4">
        <div class="flex gap-2">
          <label class="flex-1 cursor-pointer">
            <input type="radio" v-model="avoirForm.type_avoir" value="total" class="sr-only peer" />
            <div class="border-2 border-gray-200 rounded-lg p-3 peer-checked:border-red-500 peer-checked:bg-red-50 transition-colors">
              <div class="font-semibold text-gray-900">Avoir total</div>
              <div class="text-xs text-gray-600">Annule totalement la facture (toutes les lignes)</div>
            </div>
          </label>
          <label class="flex-1 cursor-pointer">
            <input type="radio" v-model="avoirForm.type_avoir" value="partiel" class="sr-only peer" />
            <div class="border-2 border-gray-200 rounded-lg p-3 peer-checked:border-red-500 peer-checked:bg-red-50 transition-colors">
              <div class="font-semibold text-gray-900">Avoir partiel</div>
              <div class="text-xs text-gray-600">Sélectionnez les lignes à avoiriser</div>
            </div>
          </label>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Motif de l'avoir</label>
          <input v-model="avoirForm.motif" type="text" class="input" placeholder="Ex: Produit défectueux, erreur de facturation..." />
        </div>

        <div v-if="avoirForm.type_avoir === 'partiel'" class="border border-gray-200 rounded-lg">
          <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
            Lignes à avoiriser
          </div>
          <div class="max-h-72 overflow-y-auto divide-y divide-gray-100">
            <div v-for="ligne in avoirFacture.lignes" :key="ligne.id" ?
                 class="flex items-center gap-3 p-3 hover:bg-gray-50"
                 :class="lignesPartielles[ligne.id] ? 'bg-red-50' : ''">
              <input type="checkbox" :checked="!!lignesPartielles[ligne.id]" @change="toggleLignePartielle(ligne)" class="h-4 w-4" />
              <div class="flex-1">
                <div class="font-medium text-sm">{{ ligne.designation }}</div>
                <div class="text-xs text-gray-500">
                  Qté facturée : <strong>{{ formatQte(ligne.quantite) }}</strong> {{ ligne.unite }} ×
                  {{ formatPrice(ligne.prix_unitaire_ht) }} HT
                </div>
              </div>
              <div v-if="lignesPartielles[ligne.id]" class="w-24">
                <input v-model.number="lignesPartielles[ligne.id]" type="number" step="0.001" min="0.001" :max="ligne.quantite"
                       class="input text-sm text-right" :placeholder="`Max ${ligne.quantite}`" />
              </div>
            </div>
          </div>
          <div v-if="!avoirFacture.lignes.length" class="p-4 text-center text-gray-400 text-sm">
            Aucune ligne à afficher
          </div>
        </div>

        <div class="p-3 bg-blue-50 rounded text-sm text-blue-800">
          <p class="font-semibold mb-1">📋 Ce qui va se passer :</p>
          <p class="mb-1">✓ Un nouvel avoir sera créé en brouillon</p>
          <p class="mb-1">✓ Les quantités seront négatives (déduction du compte client)</p>
          <p>✓ La facture d'origine ne sera pas modifiée (l'avoir est lié)</p>
        </div>

        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded text-sm text-red-700 p-3">
          {{ errorMessage }}
        </div>
      </div>

      <template #footer>
        <button @click="showAvoirModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleCreerAvoir" :disabled="creatingAvoir || !canSubmitAvoir" class="btn-danger">
          <span v-if="creatingAvoir">Création...</span>
          <span v-else>Créer l'avoir</span>
        </button>
      </template>
    </AppModal>

    <!-- Modal "Marquer comme payée" -->
    <AppModal v-model="showMarquerPayeeModal" :title="payeeFacture ? `Marquer ${payeeFacture.numero} comme payée` : ''" size="md">
      <div v-if="payeeFacture" class="space-y-4">
        <div class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <p class="font-semibold mb-1">💡 Action de régularisation</p>
          <p>Un paiement automatique sera créé pour solder le montant restant <strong>{{ formatPrice(payeeFacture.reste_a_payer || payeeFacture.total_ttc) }}</strong>.</p>
          <p class="mt-1">L'écriture comptable correspondante sera générée.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
          <select v-model="payeeForm.mode_paiement" class="input">
            <option value="especes">Espèces</option>
            <option value="virement">Virement</option>
            <option value="cheque">Chèque</option>
            <option value="wave">Wave 🌊</option>
            <option value="orange_money">Orange Money 🟠</option>
            <option value="free_money">Free Money</option>
            <option value="carte_bancaire">Carte bancaire</option>
            <option value="compensation">Compensation</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date du paiement</label>
          <input v-model="payeeForm.date_paiement" type="date" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
          <textarea v-model="payeeForm.notes" rows="2" class="input" placeholder="Ex: Paiement reçu en cash le 15/05, régularisation..."></textarea>
        </div>
      </div>

      <template #footer>
        <button @click="showMarquerPayeeModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleMarquerPayee" :disabled="marquantPayee" class="btn-primary bg-green-600 hover:bg-green-700">
          <span v-if="marquantPayee">...</span>
          <span v-else>✅ Confirmer le paiement</span>
        </button>
      </template>
    </AppModal>

    <!-- Modal "Annuler la facture" -->
    <AppModal v-model="showAnnulerModal" :title="annulFacture ? `Annuler la facture ${annulFacture.numero}` : ''" size="md">
      <div v-if="annulFacture" class="space-y-4">
        <div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
          <p class="font-semibold mb-1">⚠️ Annulation de facture</p>
          <p>La facture sera marquée <strong>"Annulée"</strong> et l'écriture comptable correspondante sera supprimée. Cette action est traçable dans les notes privées.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Motif de l'annulation <span class="text-red-500">*</span>
          </label>
          <textarea v-model="annulForm.motif" rows="3" class="input" required
                    placeholder="Ex: Erreur de saisie, doublon, client refuse, facture obsolète..."></textarea>
        </div>

        <div v-if="annulError" class="bg-red-50 border border-red-200 rounded text-sm text-red-700 p-3">
          {{ annulError }}
        </div>
      </div>

      <template #footer>
        <button @click="showAnnulerModal = false" class="btn-secondary">Retour</button>
        <button @click="handleAnnuler" :disabled="annulant || !annulForm.motif || annulForm.motif.length < 3" class="btn-danger">
          <span v-if="annulant">...</span>
          <span v-else>🚫 Confirmer l'annulation</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ref, reactive, onMounted, computed, watch } from 'vue'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import { telechargerCSV } from '@/services/exports'
import AppModal from '@/components/AppModal.vue'
import AppConfirmModal from '@/components/AppConfirmModal.vue'
import FactureForm from '@/components/FactureForm.vue'
import AssignCommercialModal from '@/components/AssignCommercialModal.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isCommercial = computed(() => auth.user?.role === 'commercial')
const isAdmin = computed(() => ['admin', 'gerant'].includes(auth.user?.role))
const canManagePayments = computed(() => ['admin', 'gerant', 'comptable'].includes(auth.user?.role))
const factures = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('numero', 'desc')
const loading = ref(false)
const exportLoading = ref(false)
const stats = reactive({ total: 0, impayees: 0, en_retard: 0, ca_annee: 0, encours_total: 0 })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', statut: '', type: '', quick: '' })

const showModal = ref(false)
const editingFacture = ref(null)
const creatingClient = ref(null)
const formDirty = ref(false)
const showLeaveConfirm = ref(false)
const pendingLeaveRoute = ref(null)
const showDeleteModal = ref(false)
const factureToDelete = ref(null)
const deleting = ref(false)
const cloningId = ref(null)
const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignEndpoint = computed(() => assignTarget.value ? `/factures/${assignTarget.value.id}/assign-commercial` : '/factures/0/assign-commercial')

// Avoirs
const showAvoirModal = ref(false)
const avoirFacture = ref(null)
const loadingAvoir = ref(false)
const avoirForm = reactive({ type_avoir: 'total', motif: '' })
const lignesPartielles = reactive({})
const creatingAvoir = ref(false)
const errorMessage = ref('')

const sortedFactures = computed(() => sortedRows(factures.value, {
  numero: 'numero',
  client: (facture) => facture.client?.nom || '',
  date: 'date_facture',
  echeance: 'date_echeance',
  total: (facture) => parseFloat(facture.total_ttc || 0),
  reste: (facture) => parseFloat(facture.reste_a_payer || 0),
  statut: 'statut',
}))

// Marquer payée
const showMarquerPayeeModal = ref(false)
const payeeFacture = ref(null)
const payeeForm = reactive({
  mode_paiement: 'especes',
  date_paiement: new Date().toISOString().slice(0, 10),
  notes: '',
})
const marquantPayee = ref(false)

// Annuler
const showAnnulerModal = ref(false)
const annulFacture = ref(null)
const annulForm = reactive({ motif: '' })
const annulant = ref(false)
const annulError = ref('')

const canSubmitAvoir = computed(() => {
  if (avoirForm.type_avoir === 'total') return true
  return Object.values(lignesPartielles).some(q => q > 0)
})

const allowedQuickFilters = computed(() => (
  isCommercial.value ?
     ['standard']
    : ['standard', 'impayees', 'en_retard', 'ca_mois', 'ca_annee', 'encours']
))

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadFactures(1), 350)
}

function syncFiltersFromRoute() {
  const quick = typeof route.query.quick === 'string' ? route.query.quick : ''
  filters.quick = allowedQuickFilters.value.includes(quick) ? quick : ''
  filters.search = typeof route.query.search === 'string' ? route.query.search : ''
  filters.statut = filters.quick ? '' : typeof route.query.statut === 'string' ? route.query.statut : ''
  filters.type = filters.quick ? '' : typeof route.query.type === 'string' ? route.query.type : ''
}

function onFactureFilterChange() {
  filters.quick = ''
  loadFactures(1)
}

function applyQuickFilter(quick) {
  if (!allowedQuickFilters.value.includes(quick)) return
  filters.quick = quick
  filters.statut = ''
  filters.type = ''
  loadFactures(1)
}

function quickCardClass(quick) {
  return filters.quick === quick ?
     'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100'
    : 'border-gray-200'
}

async function loadFactures(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/factures', {
      params: {
        page,
        per_page: 25,
        search: filters.search || undefined,
        statut: filters.quick ? undefined : filters.statut || undefined,
        type: filters.quick ? undefined : filters.type || undefined,
        quick: filters.quick || undefined,
      },
    })
    factures.value = data.data
    Object.assign(meta, {
      current_page: data.current_page, last_page: data.last_page,
      total: data.total, from: data.from || 0, to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const { data } = await api.get('/factures/stats')
    Object.assign(stats, data)
  } catch (e) {}
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/factures', {
      statut: filters.quick ? undefined : filters.statut || undefined,
      type: filters.quick ? undefined : filters.type || undefined,
      quick: filters.quick || undefined,
    }, 'factures_xelltekk.csv')
    toast.success('Export téléchargé')
  } catch (e) {
    toast.error('Erreur lors de l\'export')
  } finally {
    exportLoading.value = false
  }
}

function openCreate(client = null) {
  editingFacture.value = null
  creatingClient.value = client
  formDirty.value = false
  showModal.value = true
}

async function openEdit(f) {
  const { data } = await api.get(`/factures/${f.id}`)
  creatingClient.value = null
  editingFacture.value = data
  formDirty.value = false
  showModal.value = true
}

function openAssignFacture(f) {
  assignTarget.value = f
  showAssignModal.value = true
}

function onAssigned() {
  loadFactures(meta.current_page)
  loadStats()
}

function onSaved() { formDirty.value = false; showModal.value = false; loadFactures(meta.current_page); loadStats() }
function requestCloseSaisie() {
  if (!formDirty.value) return true
  showLeaveConfirm.value = true
  return false
}
function closeSaisie() {
  requestCloseSaisie()
}
function discardInvoiceForm() {
  showLeaveConfirm.value = false
  formDirty.value = false
  showModal.value = false
  const nextRoute = pendingLeaveRoute.value
  pendingLeaveRoute.value = null
  if (nextRoute) router.push(nextRoute)
}
function confirmDelete(f) { factureToDelete.value = f; showDeleteModal.value = true }

async function handleCloner(f) {
  cloningId.value = f.id
  try {
    const { data } = await api.post(`/factures/${f.id}/cloner`)
    toast.success(data.message || `Facture ${f.numero} clonée`)
    creatingClient.value = null
    editingFacture.value = data.facture
    formDirty.value = false
    showModal.value = true
    await loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur lors du clonage de la facture')
  } finally {
    cloningId.value = null
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/factures/${factureToDelete.value.id}`)
    toast.success(`Facture supprimée`)
    showDeleteModal.value = false
    loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur')
  } finally {
    deleting.value = false
  }
}

async function ouvrirPdf(f) {
  try { await ouvrirPDF(`/factures/${f.id}/pdf`, `${f.numero}.pdf`) }
  catch (e) { toast.error('Impossible d\'ouvrir le PDF') }
}

// ===== AVOIRS =====
async function openCreateAvoir(f) {
  showAvoirModal.value = true
  loadingAvoir.value = true
  avoirFacture.value = null
  avoirForm.type_avoir = 'total'
  avoirForm.motif = ''
  Object.keys(lignesPartielles).forEach(k => delete lignesPartielles[k])
  errorMessage.value = ''

  try {
    const { data } = await api.get(`/factures/${f.id}`)
    avoirFacture.value = data
  } catch (e) {
    toast.error('Erreur de chargement de la facture')
    showAvoirModal.value = false
  } finally {
    loadingAvoir.value = false
  }
}

function toggleLignePartielle(ligne) {
  if (lignesPartielles[ligne.id]) {
    delete lignesPartielles[ligne.id]
  } else {
    lignesPartielles[ligne.id] = parseFloat(ligne.quantite)
  }
}

async function handleCreerAvoir() {
  if (!canSubmitAvoir.value) {
    errorMessage.value = 'Sélectionnez au moins une ligne pour un avoir partiel'
    return
  }

  creatingAvoir.value = true
  errorMessage.value = ''

  try {
    const payload = {
      type_avoir: avoirForm.type_avoir,
      motif: avoirForm.motif || null,
    }

    if (avoirForm.type_avoir === 'partiel') {
      payload.lignes_partielles = Object.entries(lignesPartielles)
        .filter(([_, q]) => q > 0)
        .map(([ligne_id, quantite]) => ({
          ligne_id: parseInt(ligne_id),
          quantite: parseFloat(quantite),
        }))
    }

    const { data } = await api.post(`/factures/${avoirFacture.value.id}/creer-avoir`, payload)
    toast.success(`Avoir ${data.avoir.numero} créé !`)
    showAvoirModal.value = false
    loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    errorMessage.value = err.response.data.message || 'Erreur lors de la création'
  } finally {
    creatingAvoir.value = false
  }
}

// ===== MARQUER PAYÉE =====
function openMarquerPayee(f) {
  payeeFacture.value = f
  payeeForm.mode_paiement = 'especes'
  payeeForm.date_paiement = new Date().toISOString().slice(0, 10)
  payeeForm.notes = ''
  showMarquerPayeeModal.value = true
}

async function handleMarquerPayee() {
  marquantPayee.value = true
  try {
    const { data } = await api.post(`/factures/${payeeFacture.value.id}/marquer-payee`, payeeForm)
    toast.success(data.message || 'Facture marquée payée')
    showMarquerPayeeModal.value = false
    loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur')
  } finally {
    marquantPayee.value = false
  }
}

// ===== ANNULER =====
function openAnnuler(f) {
  annulFacture.value = f
  annulForm.motif = ''
  annulError.value = ''
  showAnnulerModal.value = true
}

async function handleAnnuler() {
  annulant.value = true
  annulError.value = ''
  try {
    const { data } = await api.post(`/factures/${annulFacture.value.id}/annuler`, annulForm)
    toast.success(data.message || 'Facture annulée')
    showAnnulerModal.value = false
    loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    annulError.value = err.response.data.message || 'Erreur'
  } finally {
    annulant.value = false
  }
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatQte(n) { return parseFloat(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }
function isEnRetard(f) {
  if (!['validee', 'envoyee', 'partiellement_payee', 'impayee'].includes(f.statut)) return false
  return new Date(f.date_echeance) < new Date()
}
function statutLabel(s) {
  return { brouillon: 'Brouillon', validee: 'Validée', envoyee: 'Envoyée',
    partiellement_payee: 'Partiel.', payee: 'Payée', impayee: 'Impayée', annulee: 'Annulée' }[s] || s
}
function statutBadge(s) {
  return { brouillon: 'bg-gray-100 text-gray-700', validee: 'bg-blue-100 text-blue-800',
    envoyee: 'bg-indigo-100 text-indigo-800', partiellement_payee: 'bg-yellow-100 text-yellow-800',
    payee: 'bg-green-100 text-green-800', impayee: 'bg-orange-100 text-orange-800',
    annulee: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100'
}

async function openFromRoute(id) {
  if (!id) return
  try {
    const { data } = await api.get(`/factures/${parseInt(id)}`)
    editingFacture.value = data
    formDirty.value = false
    showModal.value = true
    router.replace({ path: '/factures', query: {} })
  } catch (e) {
    toast.error('Facture introuvable')
  }
}

async function openCreateFromRoute(clientId) {
  if (!clientId) return
  try {
    const { data } = await api.get(`/clients/${parseInt(clientId)}`)
    openCreate(data)
    router.replace({ path: '/factures', query: {} })
  } catch (e) {
    toast.error('Client introuvable')
  }
}

onMounted(async () => {
  syncFiltersFromRoute()
  await loadFactures()
  loadStats()
  openFromRoute(route.query.open)
  openCreateFromRoute(route.query.create_client)
})

watch(() => route.query.open, (id) => {
  openFromRoute(id)
})

watch(() => route.query.create_client, (id) => {
  openCreateFromRoute(id)
})

watch(
  () => [route.query.quick, route.query.statut, route.query.type, route.query.search],
  async () => {
    syncFiltersFromRoute()
    await loadFactures(1)
  }
)

onBeforeRouteLeave((to) => {
  if (showModal.value && formDirty.value) {
    pendingLeaveRoute.value = to.fullPath
    showLeaveConfirm.value = true
    return false
  }
  formDirty.value = false
  return true
})
</script>
