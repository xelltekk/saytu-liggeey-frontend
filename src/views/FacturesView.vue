<template>
  <div>
    <!-- Filtres -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="🔍 Numéro, objet, client..." class="input flex-1" />
        <select v-model="filters.statut" @change="loadFactures(1)" class="input md:w-44">
          <option value="">Tous statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="validee">Validée</option>
          <option value="envoyee">Envoyée</option>
          <option value="partiellement_payee">Partiel. payée</option>
          <option value="payee">Payée</option>
          <option value="impayee">Impayée</option>
          <option value="annulee">Annulée</option>
        </select>
        <select v-model="filters.type" @change="loadFactures(1)" class="input md:w-36">
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
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Total</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Impayées</div>
        <div class="text-2xl font-bold text-orange-600">{{ stats.impayees || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">En retard</div>
        <div class="text-2xl font-bold text-red-600">{{ stats.en_retard || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">CA Année</div>
        <div class="text-base font-bold text-green-600">{{ formatPrice(stats.ca_annee) }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Encours</div>
        <div class="text-base font-bold text-xelltekk-700">{{ formatPrice(stats.encours_total) }}</div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N°</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
              <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Échéance</th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total TTC</th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Reste</th>
              <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="f in factures" :key="f.id" class="hover:bg-gray-50">
              <td class="px-3 py-3 text-xs font-mono text-gray-600">
                {{ f.numero }}
                <span v-if="f.type === 'avoir'" class="ml-1 text-red-600 text-[10px]">AVOIR</span>
              </td>
              <td class="px-3 py-3">
                <div class="text-sm font-medium text-gray-900 truncate max-w-[180px]">{{ f.client?.nom }}</div>
                <div class="text-xs text-gray-500">{{ f.client?.code }}</div>
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
                  v-if="f.type !== 'avoir' && !['payee','annulee'].includes(f.statut)"
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
                <button @click="openEdit(f)" class="text-xelltekk-600 hover:text-xelltekk-800 mr-2" title="Modifier">✏️</button>
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

    <AppModal v-model="showModal" :title="editingFacture ? `Modifier ${editingFacture.numero}` : 'Nouvelle facture'" size="xl">
      <FactureForm :facture="editingFacture" @saved="onSaved" @cancel="showModal = false" />
    </AppModal>

    <AppModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p class="text-gray-700">Supprimer la facture <strong>{{ factureToDelete?.numero }}</strong> ?</p>
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
            <div v-for="ligne in avoirFacture?.lignes" :key="ligne.id"
                 class="flex items-center gap-3 p-3 hover:bg-gray-50"
                 :class="lignesPartielles[ligne.id] ? 'bg-red-50' : ''">
              <input type="checkbox" :checked="!!lignesPartielles[ligne.id]" @change="toggleLignePartielle(ligne)" class="h-4 w-4" />
              <div class="flex-1">
                <div class="font-medium text-sm">{{ ligne.designation }}</div>
                <div class="text-xs text-gray-500">
                  Qté facturée : <strong>{{ formatQte(ligne.quantite) }}</strong> {{ ligne.unite }} ×
                  {{ formatPrice(ligne.prix_unitaire_ht) }} XOF HT
                </div>
              </div>
              <div v-if="lignesPartielles[ligne.id]" class="w-24">
                <input v-model.number="lignesPartielles[ligne.id]" type="number" step="0.001" min="0.001" :max="ligne.quantite"
                       class="input text-sm text-right" :placeholder="`Max ${ligne.quantite}`" />
              </div>
            </div>
          </div>
          <div v-if="!avoirFacture?.lignes?.length" class="p-4 text-center text-gray-400 text-sm">
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
          <p>Un paiement automatique sera créé pour solder le montant restant <strong>{{ formatPrice(payeeFacture.reste_a_payer || payeeFacture.total_ttc) }} XOF</strong>.</p>
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
import { useRoute, useRouter } from 'vue-router'
import { ref, reactive, onMounted, computed, watch } from 'vue'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import { telechargerCSV } from '@/services/exports'
import AppModal from '@/components/AppModal.vue'
import FactureForm from '@/components/FactureForm.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const factures = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const stats = reactive({ total: 0, impayees: 0, en_retard: 0, ca_annee: 0, encours_total: 0 })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', statut: '', type: '' })

const showModal = ref(false)
const editingFacture = ref(null)
const showDeleteModal = ref(false)
const factureToDelete = ref(null)
const deleting = ref(false)

// Avoirs
const showAvoirModal = ref(false)
const avoirFacture = ref(null)
const loadingAvoir = ref(false)
const avoirForm = reactive({ type_avoir: 'total', motif: '' })
const lignesPartielles = reactive({})
const creatingAvoir = ref(false)
const errorMessage = ref('')

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

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadFactures(1), 350)
}

async function loadFactures(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/factures', {
      params: { page, per_page: 25, search: filters.search || undefined, statut: filters.statut || undefined, type: filters.type || undefined },
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
      statut: filters.statut || undefined,
      type: filters.type || undefined,
    }, 'factures_xelltekk.csv')
    toast.success('Export téléchargé')
  } catch (e) {
    toast.error('Erreur lors de l\'export')
  } finally {
    exportLoading.value = false
  }
}

function openCreate() { editingFacture.value = null; showModal.value = true }

async function openEdit(f) {
  const { data } = await api.get(`/factures/${f.id}`)
  editingFacture.value = data
  showModal.value = true
}

function onSaved() { showModal.value = false; loadFactures(meta.current_page); loadStats() }
function confirmDelete(f) { factureToDelete.value = f; showDeleteModal.value = true }

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/factures/${factureToDelete.value.id}`)
    toast.success(`Facture supprimée`)
    showDeleteModal.value = false
    loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
  } finally {
    deleting.value = false
  }
}

async function ouvrirPdf(f) {
  try { await ouvrirPDF(`/factures/${f.id}/pdf`) }
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
    errorMessage.value = err.response?.data?.message || 'Erreur lors de la création'
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
    toast.error(err.response?.data?.message || 'Erreur')
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
    annulError.value = err.response?.data?.message || 'Erreur'
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
    showModal.value = true
    router.replace({ path: '/factures', query: {} })
  } catch (e) {
    toast.error('Facture introuvable')
  }
}

onMounted(async () => {
  await loadFactures()
  loadStats()
  openFromRoute(route.query.open)
})

watch(() => route.query.open, (id) => {
  openFromRoute(id)
})
</script>
