<template>
  <div class="app-surface space-y-4">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input
          v-model="filters.search"
          @input="onSearchInput"
          type="search"
          placeholder="🔍 Numéro, objet, client, email, téléphone..."
          class="input flex-1"
        />

        <select v-model="filters.statut" @change="onStatutSelectChange" class="input md:w-44">
          <option value="">Tous statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="envoye">Envoyé</option>
          <option value="accepte">Accepté</option>
          <option value="refuse">Refusé</option>
          <option value="expire">Expiré</option>
          <option value="facture">Facturé</option>
        </select>

        <select v-model="filters.suivi" @change="onSuiviSelectChange" class="input md:w-48">
          <option value="">Tous suivis</option>
          <option value="a_relancer">À relancer</option>
          <option value="acceptes_a_facturer">Acceptés à facturer</option>
          <option value="expires">Expirés</option>
          <option value="gros">Gros devis</option>
        </select>

        <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          {{ exportLoading ? 'Export...' : 'Exporter CSV' }}
        </button>

        <button @click="openCreate" class="btn-primary whitespace-nowrap">
          + Nouveau devis
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6">
      <button type="button" @click="applyStatutFilter('')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('')">
        <div class="text-xs text-gray-500 uppercase">Total</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</div>
      </button>
      <button type="button" @click="applyStatutFilter('brouillon')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('brouillon')">
        <div class="text-xs text-gray-500 uppercase">Brouillons</div>
        <div class="text-2xl font-bold text-gray-500">{{ stats.brouillons || 0 }}</div>
      </button>
      <button type="button" @click="applyStatutFilter('envoye')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('envoye')">
        <div class="text-xs text-gray-500 uppercase">Envoyés</div>
        <div class="text-2xl font-bold text-blue-600">{{ stats.envoyes || 0 }}</div>
      </button>
      <button type="button" @click="applySuiviFilter('a_relancer')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="suiviCardClass('a_relancer')">
        <div class="text-xs text-gray-500 uppercase">À relancer</div>
        <div class="text-2xl font-bold text-orange-600">{{ stats.a_relancer || 0 }}</div>
      </button>
      <button type="button" @click="applyStatutFilter('accepte')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('accepte')">
        <div class="text-xs text-gray-500 uppercase">Acceptés</div>
        <div class="text-2xl font-bold text-green-600">{{ stats.acceptes || 0 }}</div>
      </button>
      <button type="button" @click="applyStatutFilter('accepte')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('accepte')">
        <div class="text-xs text-gray-500 uppercase">Montant accepté</div>
        <div class="text-base font-bold text-xelltekk-700">{{ formatPrice(stats.montant_total_acceptes) }}</div>
      </button>
    </div>

    <div class="rounded-lg border border-xelltekk-100 bg-white shadow-sm">
      <div class="flex flex-col gap-2 border-b border-xelltekk-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h4 class="font-semibold text-gray-900">Pilotage devis</h4>
          <p class="text-xs text-gray-500">Décidez vite quoi finaliser, relancer, convertir ou analyser.</p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:w-auto">
          <button type="button" class="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-left" @click="applyStatutFilter('envoye')">
            <span class="block text-[11px] font-semibold uppercase text-cyan-700">En attente</span>
            <span class="block font-bold text-cyan-900">{{ formatPrice(stats.montant_total_en_attente) }} XOF</span>
          </button>
          <button type="button" class="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-left" @click="applySuiviFilter('a_relancer')">
            <span class="block text-[11px] font-semibold uppercase text-orange-700">À relancer</span>
            <span class="block font-bold text-orange-900">{{ formatPrice(stats.montant_a_relancer) }} XOF</span>
          </button>
          <button type="button" class="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-left" @click="applySuiviFilter('acceptes_a_facturer')">
            <span class="block text-[11px] font-semibold uppercase text-green-700">À facturer</span>
            <span class="block font-bold text-green-900">{{ stats.acceptes_a_facturer || 0 }} devis</span>
          </button>
          <div class="rounded-xl border border-xelltekk-100 bg-xelltekk-50 px-3 py-2">
            <span class="block text-[11px] font-semibold uppercase text-xelltekk-700">Acceptation</span>
            <span class="block font-bold text-xelltekk-900">{{ stats.taux_acceptation || 0 }}%</span>
          </div>
        </div>
      </div>

      <div class="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <button
          v-for="stage in pipelineDevis"
          :key="stage.key"
          type="button"
          class="rounded-xl border bg-gradient-to-br p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          :class="devisPipelineCardClass(stage)"
          @click="applyPipelineFilter(stage)"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="text-xs font-bold uppercase tracking-wide text-gray-700">{{ stage.label }}</div>
              <div class="mt-1 text-[11px] leading-snug text-gray-500">{{ stage.description }}</div>
            </div>
            <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="devisPipelineBadgeClass(stage.key)">{{ stage.count || 0 }}</span>
          </div>
          <div class="mt-3 font-semibold text-gray-900">{{ formatPrice(stage.amount) }} XOF</div>
        </button>
      </div>

      <div class="grid gap-3 border-t border-xelltekk-100 p-3 lg:grid-cols-3">
        <div class="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
          <div class="text-xs font-semibold uppercase text-gray-500">Indicateurs</div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div class="rounded-lg bg-white p-2">
              <div class="text-[11px] text-gray-500">Transformation</div>
              <div class="font-bold text-xelltekk-800">{{ stats.taux_transformation || 0 }}%</div>
            </div>
            <div class="rounded-lg bg-white p-2">
              <div class="text-[11px] text-gray-500">Panier moyen</div>
              <div class="font-bold text-xelltekk-800">{{ formatPrice(stats.panier_moyen) }}</div>
            </div>
            <div class="rounded-lg bg-white p-2">
              <div class="text-[11px] text-gray-500">Décidés</div>
              <div class="font-bold text-xelltekk-800">{{ stats.decides || 0 }}</div>
            </div>
            <div class="rounded-lg bg-white p-2">
              <div class="text-[11px] text-gray-500">Délai décision</div>
              <div class="font-bold text-xelltekk-800">{{ stats.delai_moyen_decision_jours ?? '–' }} j</div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-orange-100 bg-orange-50/70 p-3">
          <div class="mb-2 flex items-center justify-between">
            <h5 class="font-semibold text-orange-800">Relances prioritaires</h5>
            <button type="button" class="text-xs font-semibold text-orange-700 hover:underline" @click="applySuiviFilter('a_relancer')">Tout voir</button>
          </div>
          <div class="space-y-2">
            <div v-for="item in relancesPrioritaires" :key="`relance-${item.id}`" class="rounded-lg bg-white p-2 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-gray-900">{{ item.numero }} · {{ item.client?.nom || 'Client' }}</div>
                  <div class="text-xs text-orange-700">{{ followUpHint(item) }} · {{ formatPrice(item.total_ttc) }} XOF</div>
                  <div class="text-[11px] text-gray-500">{{ item.action_recommandee || 'Relancer le client' }}</div>
                </div>
                <div class="flex shrink-0 flex-wrap justify-end gap-1">
                  <EmailActionButtons v-if="item.client?.email" :draft="relanceEmailDraft(item)" :filename="`relance-devis-${item.numero || item.id}`" dialog compact />
                  <button type="button" class="text-xs font-semibold text-xelltekk-700 hover:underline" @click="openEdit(item)">Ouvrir</button>
                </div>
              </div>
            </div>
            <div v-if="!relancesPrioritaires.length" class="py-4 text-center text-xs text-gray-400">Aucune relance prioritaire.</div>
          </div>
        </div>

        <div class="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3">
          <div class="mb-2 flex items-center justify-between">
            <h5 class="font-semibold text-cyan-800">Gros devis ouverts</h5>
            <button type="button" class="text-xs font-semibold text-cyan-700 hover:underline" @click="applySuiviFilter('gros')">Tout voir</button>
          </div>
          <div class="space-y-2">
            <div v-for="item in grosDevis" :key="`gros-${item.id}`" class="rounded-lg bg-white p-2 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-gray-900">{{ item.numero }} · {{ item.client?.nom || 'Client' }}</div>
                  <div class="text-xs text-cyan-700">{{ statutLabel(item.statut) }} · {{ formatPrice(item.total_ttc) }} XOF</div>
                  <div class="text-[11px] text-gray-500">{{ item.action_recommandee || followUpLabel(item) }}</div>
                </div>
                <div class="flex shrink-0 flex-wrap justify-end gap-1">
                  <button v-if="item.statut === 'accepte'" type="button" class="text-xs font-semibold text-green-700 hover:underline" @click="confirmConvertir(item)">Facturer</button>
                  <button type="button" class="text-xs font-semibold text-xelltekk-700 hover:underline" @click="ouvrirPdf(item)">PDF</button>
                  <button type="button" class="text-xs font-semibold text-xelltekk-700 hover:underline" @click="openEdit(item)">Ouvrir</button>
                </div>
              </div>
            </div>
            <div v-if="!grosDevis.length" class="py-4 text-center text-xs text-gray-400">Aucun gros devis ouvert.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">
      Chargement...
    </div>

    <!-- Tableau -->
    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="numero" :active="sort.key === 'numero'" :icon="sortIcon('numero')" @sort="toggleSort">N°</SortableTh>
              <SortableTh column="client" :active="sort.key === 'client'" :icon="sortIcon('client')" @sort="toggleSort">Client</SortableTh>
              <SortableTh column="objet" :active="sort.key === 'objet'" :icon="sortIcon('objet')" @sort="toggleSort">Objet</SortableTh>
              <SortableTh column="date" :active="sort.key === 'date'" :icon="sortIcon('date')" align="center" @sort="toggleSort">Date</SortableTh>
              <SortableTh column="validite" :active="sort.key === 'validite'" :icon="sortIcon('validite')" align="center" @sort="toggleSort">Validité</SortableTh>
              <SortableTh column="suivi" :active="sort.key === 'suivi'" :icon="sortIcon('suivi')" align="center" @sort="toggleSort">Suivi</SortableTh>
              <SortableTh column="total" :active="sort.key === 'total'" :icon="sortIcon('total')" align="right" @sort="toggleSort">Total TTC</SortableTh>
              <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="devi in sortedDevis" :key="devi.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ devi.numero }}</td>
              <td class="px-4 py-3">
                <div class="compact-row-primary text-gray-900" :title="devi.client?.nom || 'Client non renseigné'">
                  {{ devi.client?.nom || 'Client non renseigné' }}
                </div>
                <div class="compact-row-meta">
                  <span>{{ devi.client?.code || '–' }}</span>
                  <span v-if="devi.client?.email" class="text-xelltekk-700">
                    {{ devi.client.email }}
                  </span>
                  <span class="text-blue-600">Commercial : {{ devi.commercial?.name || 'Non affecté' }}</span>
                </div>
              </td>
              <td class="px-4 py-3 max-w-[220px] truncate text-sm text-gray-700" :title="devi.objet || ''">{{ devi.objet || '–' }}</td>
              <td class="px-4 py-3 text-sm text-center text-gray-600">{{ formatDate(devi.date_devis) }}</td>
              <td class="px-4 py-3 text-sm text-center" :class="validiteClass(devi)">
                {{ formatDate(devi.date_validite) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span class="badge text-[10px]" :class="followUpBadgeClass(devi)">{{ followUpLabel(devi) }}</span>
                <div class="mt-1 text-[11px] text-gray-500">{{ followUpHint(devi) }}</div>
              </td>
              <td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                {{ formatPrice(devi.total_ttc) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span class="badge" :class="statutBadge(devi.statut)">{{ statutLabel(devi.statut) }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <EmailActionButtons
                    v-if="devi.client?.email"
                    :draft="relanceEmailDraft(devi)"
                    :filename="`relance-devis-${devi.numero || devi.id}`"
                    dialog
                    compact
                  />
                  <button
                    v-if="canAccepter(devi)"
                    @click="changeStatutDevis(devi, 'accepter')"
                    :disabled="statusChangingId === `accepter-${devi.id}`"
                    class="rounded-full border border-green-200 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                    title="Marquer le devis comme accepté"
                  >
                    Accepter
                  </button>
                  <button
                    v-if="canRefuser(devi)"
                    @click="changeStatutDevis(devi, 'refuser')"
                    :disabled="statusChangingId === `refuser-${devi.id}`"
                    class="rounded-full border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    title="Marquer le devis comme refusé"
                  >
                    Refuser
                  </button>
                <button @click="ouvrirPdf(devi)" class="text-xelltekk-600 hover:text-xelltekk-800 text-sm font-medium mr-2" title="Voir PDF">
                  📄
                </button>
                <button
                  v-if="devi.statut !== 'facture' && devi.statut !== 'refuse'"
                  @click="confirmConvertir(devi)"
                  class="text-green-600 hover:text-green-800 text-sm font-medium mr-2"
                  title="Convertir en facture"
                >
                  🔄
                </button>
                <button
                  @click="handleCloner(devi)"
                  :disabled="cloningId === devi.id"
                  class="text-cyan-700 hover:text-cyan-900 text-sm font-medium mr-2 disabled:opacity-50"
                  title="Cloner ce devis"
                >
                  Cloner
                </button>
                <button @click="openEdit(devi)" class="text-xelltekk-600 hover:text-xelltekk-800 text-sm font-medium mr-2" title="Modifier">
                  ✏️
                </button>
                <button v-if="isAdmin" @click="openAssignDevis(devi)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-2" title="Affecter">
                  Affecter
                </button>
                <button @click="confirmDelete(devi)" class="text-red-600 hover:text-red-800 text-sm font-medium" title="Supprimer">
                  🗑️
                </button>
                </div>
              </td>
            </tr>
            <tr v-if="devis.length === 0">
              <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun devis. Cliquez sur "Nouveau devis" pour commencer.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          Affichage de <strong>{{ meta.from }}</strong> à <strong>{{ meta.to }}</strong>
          sur <strong>{{ meta.total }}</strong> devis
        </div>
        <div class="flex gap-2">
          <button @click="loadDevis(meta.current_page - 1)" :disabled="meta.current_page === 1" class="btn-secondary px-3 py-1.5 disabled:opacity-40">← Précédent</button>
          <span class="px-3 py-1.5 text-gray-600">Page {{ meta.current_page }} / {{ meta.last_page }}</span>
          <button @click="loadDevis(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="btn-secondary px-3 py-1.5 disabled:opacity-40">Suivant →</button>
        </div>
      </div>
    </div>

    <!-- Modal création/édition -->
    <AppModal
      v-model="showModal"
      :title="editingDevis ? `Modifier ${editingDevis.numero}` : 'Nouveau devis'"
      size="xl"
      :before-close="requestCloseSaisie"
      @minimized-change="saisieModalMinimized = $event"
    >
      <DevisForm
        :devis="editingDevis"
        :client="creatingClient"
        @saved="onSaved"
        @cancel="closeSaisie"
        @dirty-change="formDirty = $event"
      />
    </AppModal>

    <AppConfirmModal
      v-model="showLeaveConfirm"
      title="Quitter la saisie ?"
      message="Voulez-vous quitter la saisie du devis ? Les informations non enregistrées seront perdues."
      hint="Choisissez « Rester » pour continuer votre saisie."
      cancel-label="Rester"
      confirm-label="Quitter sans enregistrer"
      tone="danger"
      @confirm="discardDevisForm"
    />

    <AssignCommercialModal
      v-if="assignTarget"
      v-model="showAssignModal"
      :endpoint="assignEndpoint"
      :current-commercial-id="assignTarget?.commercial_id"
      :item-label="assignTarget ? `${assignTarget.numero} - ${assignTarget.client?.nom || ''}` : ''"
      title="Affecter devis"
      @assigned="onAssigned"
    />

    <!-- Modal suppression -->
    <AppModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p class="text-gray-700">Supprimer le devis <strong>{{ devisToDelete.numero }}</strong> </p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleDelete" :disabled="deleting" class="btn-danger">
          <span v-if="deleting">Suppression...</span>
          <span v-else>Supprimer</span>
        </button>
      </template>
    </AppModal>

    <!-- Modal conversion devis → facture -->
    <AppModal v-model="showConvertModal" title="Convertir en facture" size="sm">
      <p class="text-gray-700">
        Convertir le devis <strong>{{ devisToConvert.numero }}</strong> en facture 
      </p>
      <div class="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-800">
        <p class="mb-1">✓ Une nouvelle facture sera créée en brouillon</p>
        <p class="mb-1">✓ Toutes les lignes du devis seront copiées</p>
        <p>✓ Le devis passera au statut "Facturé"</p>
      </div>
      <template #footer>
        <button @click="showConvertModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleConvertir" :disabled="converting" class="btn-primary">
          <span v-if="converting">Conversion...</span>
          <span v-else>Confirmer la conversion</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import AppModal from '@/components/AppModal.vue'
import AppConfirmModal from '@/components/AppConfirmModal.vue'
import DevisForm from '@/components/DevisForm.vue'
import AssignCommercialModal from '@/components/AssignCommercialModal.vue'
import EmailActionButtons from '@/components/EmailActionButtons.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { useAuthStore } from '@/stores/auth'
import { telechargerCSV } from '@/services/exports'
import { buildEmailDraft } from '@/utils/emailComposer'
import { hasAnyRole } from '@/utils/access'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => hasAnyRole(auth.user, ['admin', 'gerant']))

const devis = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('numero', 'desc')
const loading = ref(false)
const exportLoading = ref(false)
const stats = reactive({
  total: 0,
  brouillons: 0,
  envoyes: 0,
  acceptes: 0,
  refuses: 0,
  factures: 0,
  expires: 0,
  a_relancer: 0,
  acceptes_a_facturer: 0,
  ouverts: 0,
  decides: 0,
  montant_total: 0,
  montant_total_acceptes: 0,
  montant_total_en_attente: 0,
  montant_total_factures: 0,
  montant_total_refuses: 0,
  montant_total_expires: 0,
  montant_a_relancer: 0,
  panier_moyen: 0,
  taux_acceptation: 0,
  taux_transformation: 0,
  delai_moyen_decision_jours: null,
  pipeline: [],
  relances_prioritaires: [],
  gros_devis: [],
})
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', statut: '', suivi: '' })

const showModal = ref(false)
const editingDevis = ref(null)
const creatingClient = ref(null)
const formDirty = ref(false)
const saisieModalMinimized = ref(false)
const showLeaveConfirm = ref(false)
const pendingLeaveRoute = ref(null)
const showDeleteModal = ref(false)
const devisToDelete = ref(null)
const deleting = ref(false)

const showConvertModal = ref(false)
const devisToConvert = ref(null)
const converting = ref(false)
const cloningId = ref(null)
const statusChangingId = ref(null)
const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignEndpoint = computed(() => assignTarget.value ? `/devis/${assignTarget.value.id}/assign-commercial` : '/devis/0/assign-commercial')

const sortedDevis = computed(() => sortedRows(devis.value, {
  numero: 'numero',
  client: (devi) => devi.client?.nom || '',
  objet: 'objet',
  date: 'date_devis',
  validite: 'date_validite',
  suivi: (devi) => daysUntil(devi.date_validite) ?? 9999,
  total: (devi) => parseFloat(devi.total_ttc || 0),
  statut: 'statut',
}))

const pipelineDevis = computed(() => (stats.pipeline || []).map((stage) => ({
  ...stage,
  count: Number(stage.count || 0),
  amount: Number(stage.amount || 0),
})))
const relancesPrioritaires = computed(() => stats.relances_prioritaires || [])
const grosDevis = computed(() => stats.gros_devis || [])

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadDevis(1), 350)
}

function syncFiltersFromRoute() {
  filters.search = typeof route.query.search === 'string' ? route.query.search : ''
  filters.statut = typeof route.query.statut === 'string' ? route.query.statut : ''
  filters.suivi = typeof route.query.suivi === 'string' ? route.query.suivi : ''
}

function applyStatutFilter(statut) {
  filters.statut = statut
  filters.suivi = ''
  loadDevis(1)
}

function applySuiviFilter(suivi) {
  filters.suivi = suivi
  filters.statut = ''
  loadDevis(1)
}

function applyPipelineFilter(stage) {
  if (['brouillon', 'envoye', 'accepte', 'facture'].includes(stage.key)) {
    applyStatutFilter(stage.key)
    return
  }

  if (stage.key === 'expire') {
    applySuiviFilter('expires')
    return
  }

  if (stage.key === 'a_relancer') {
    applySuiviFilter('a_relancer')
  }
}

function onStatutSelectChange() {
  if (filters.statut) filters.suivi = ''
  loadDevis(1)
}

function onSuiviSelectChange() {
  if (filters.suivi) filters.statut = ''
  loadDevis(1)
}

function statCardClass(statut) {
  return !filters.suivi && filters.statut === statut ?
     'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100'
    : 'border-gray-200'
}

function suiviCardClass(suivi) {
  return filters.suivi === suivi ?
     'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100'
    : 'border-gray-200'
}

function devisPipelineActive(stage) {
  if (['brouillon', 'envoye', 'accepte', 'facture'].includes(stage.key)) {
    return !filters.suivi && filters.statut === stage.key
  }
  if (stage.key === 'expire') return filters.suivi === 'expires'
  if (stage.key === 'a_relancer') return filters.suivi === 'a_relancer'
  return false
}

function devisPipelineCardClass(stage) {
  const base = {
    brouillon: 'from-gray-50 to-white border-gray-200',
    envoye: 'from-blue-50 to-white border-blue-200',
    a_relancer: 'from-orange-50 to-white border-orange-200',
    accepte: 'from-green-50 to-white border-green-200',
    facture: 'from-purple-50 to-white border-purple-200',
    expire: 'from-red-50 to-white border-red-200',
  }[stage.key] || 'from-white to-white border-gray-200'

  return devisPipelineActive(stage) ? `${base} ring-2 ring-xelltekk-200` : base
}

function devisPipelineBadgeClass(key) {
  return {
    brouillon: 'bg-gray-100 text-gray-700',
    envoye: 'bg-blue-100 text-blue-700',
    a_relancer: 'bg-orange-100 text-orange-700',
    accepte: 'bg-green-100 text-green-700',
    facture: 'bg-purple-100 text-purple-700',
    expire: 'bg-red-100 text-red-700',
  }[key] || 'bg-gray-100 text-gray-700'
}

async function loadDevis(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/devis', {
      params: {
        page,
        per_page: 20,
        search: filters.search || undefined,
        statut: filters.statut || undefined,
        suivi: filters.suivi || undefined,
      },
    })
    devis.value = data.data
    Object.assign(meta, {
      current_page: data.current_page,
      last_page: data.last_page,
      total: data.total,
      from: data.from || 0,
      to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement des devis')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const { data } = await api.get('/devis/stats')
    Object.assign(stats, data)
  } catch (e) {}
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/devis', {
      search: filters.search || undefined,
      statut: filters.statut || undefined,
      suivi: filters.suivi || undefined,
    }, 'devis_saytu.csv')
    toast.success('Export des devis téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

function openCreate(client = null) {
  editingDevis.value = null
  creatingClient.value = client
  formDirty.value = false
  saisieModalMinimized.value = false
  showModal.value = true
}

async function openEdit(devi) {
  const { data } = await api.get(`/devis/${devi.id}`)
  creatingClient.value = null
  editingDevis.value = data
  formDirty.value = false
  saisieModalMinimized.value = false
  showModal.value = true
}

function openAssignDevis(devi) {
  assignTarget.value = devi
  showAssignModal.value = true
}

function onAssigned() {
  loadDevis(meta.current_page)
  loadStats()
}

function onSaved() {
  formDirty.value = false
  saisieModalMinimized.value = false
  showModal.value = false
  loadDevis(meta.current_page)
  loadStats()
}

function requestCloseSaisie() {
  if (!formDirty.value) return true
  showLeaveConfirm.value = true
  return false
}
function closeSaisie() {
  requestCloseSaisie()
}
function discardDevisForm() {
  showLeaveConfirm.value = false
  formDirty.value = false
  saisieModalMinimized.value = false
  showModal.value = false
  const nextRoute = pendingLeaveRoute.value
  pendingLeaveRoute.value = null
  if (nextRoute) router.push(nextRoute)
}
function confirmDelete(devi) {
  devisToDelete.value = devi
  showDeleteModal.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/devis/${devisToDelete.value.id}`)
    toast.success(`Devis ${devisToDelete.value.numero} supprimé`)
    showDeleteModal.value = false
    devisToDelete.value = null
    loadDevis(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur de suppression')
  } finally {
    deleting.value = false
  }
}

function confirmConvertir(devi) {
  devisToConvert.value = devi
  showConvertModal.value = true
}

async function handleConvertir() {
  converting.value = true
  try {
    const { data } = await api.post(`/devis/${devisToConvert.value.id}/convertir-en-facture`)
    toast.success(`Facture ${data.facture?.numero || ''} créée !`)
    showConvertModal.value = false
    devisToConvert.value = null
    setTimeout(() => router.push('/factures'), 800)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur de conversion')
  } finally {
    converting.value = false
  }
}

async function changeStatutDevis(devi, action) {
  statusChangingId.value = `${action}-${devi.id}`
  try {
    await api.post(`/devis/${devi.id}/${action}`)
    toast.success(action === 'accepter' ? `Devis ${devi.numero} accepté` : `Devis ${devi.numero} refusé`)
    await loadDevis(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Impossible de modifier le statut du devis')
  } finally {
    statusChangingId.value = null
  }
}

function canAccepter(devi) {
  return !['accepte', 'facture', 'refuse'].includes(devi.statut)
}

function canRefuser(devi) {
  return !['refuse', 'facture', 'accepte'].includes(devi.statut)
}

async function handleCloner(devi) {
  cloningId.value = devi.id
  try {
    const { data } = await api.post(`/devis/${devi.id}/cloner`)
    toast.success(data.message || `Devis ${devi.numero} cloné`)
    creatingClient.value = null
    editingDevis.value = data.devis
    formDirty.value = false
    showModal.value = true
    await loadDevis(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur lors du clonage du devis')
  } finally {
    cloningId.value = null
  }
}

async function ouvrirPdf(devi) {
  try {
    await ouvrirPDF(`/devis/${devi.id}/pdf`, `${devi.numero}.pdf`)
  } catch (e) {
    toast.error('Impossible d\'ouvrir le PDF')
  }
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
}

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('fr-FR')
}

function daysUntil(date) {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function validiteClass(devi) {
  const days = daysUntil(devi.date_validite)
  if (['accepte', 'facture', 'refuse'].includes(devi.statut)) return 'text-gray-600'
  if (days !== null && days < 0) return 'text-red-700 font-semibold'
  if (days !== null && days <= 7) return 'text-orange-700 font-semibold'
  return 'text-gray-600'
}

function followUpLabel(devi) {
  if (devi.statut === 'facture') return 'Facturé'
  if (devi.statut === 'refuse') return 'Refusé'
  if (devi.statut === 'accepte') return 'À facturer'
  if (devi.statut === 'brouillon') return 'À finaliser'

  const days = Number.isFinite(devi.jours_restant) ? devi.jours_restant : daysUntil(devi.date_validite)
  if (days !== null && days < 0) return 'Expiré'
  if (days !== null && days <= 7) return 'Relancer'
  return 'Suivi normal'
}

function followUpHint(devi) {
  const days = Number.isFinite(devi.jours_restant) ? devi.jours_restant : daysUntil(devi.date_validite)
  if (devi.statut === 'accepte') return 'Prêt à facturer'
  if (devi.statut === 'facture') return 'Déjà converti'
  if (devi.statut === 'refuse') return 'Clôturé'
  if (devi.statut === 'brouillon') return 'Non envoyé'
  if (days === null) return 'À suivre'
  if (days < 0) return `${Math.abs(days)} j de retard`
  if (days === 0) return 'Expire aujourd’hui'
  return `${days} j restants`
}

function followUpBadgeClass(devi) {
  const label = followUpLabel(devi)
  return {
    'À facturer': 'bg-green-100 text-green-800',
    Relancer: 'bg-orange-100 text-orange-800',
    Expiré: 'bg-red-100 text-red-800',
    'À finaliser': 'bg-gray-100 text-gray-700',
    Facturé: 'bg-purple-100 text-purple-800',
    Refusé: 'bg-red-100 text-red-800',
    'Suivi normal': 'bg-blue-100 text-blue-800',
  }[label] || 'bg-gray-100 text-gray-700'
}

function statutLabel(statut) {
  return {
    brouillon: 'Brouillon',
    envoye: 'Envoyé',
    accepte: 'Accepté',
    refuse: 'Refusé',
    expire: 'Expiré',
    facture: 'Facturé',
  }[statut] || statut || '–'
}

function statutBadge(statut) {
  return {
    brouillon: 'bg-gray-100 text-gray-700',
    envoye: 'bg-blue-100 text-blue-800',
    accepte: 'bg-green-100 text-green-800',
    refuse: 'bg-red-100 text-red-800',
    expire: 'bg-yellow-100 text-yellow-800',
    facture: 'bg-purple-100 text-purple-800',
  }[statut] || 'bg-gray-100'
}

function relanceEmailDraft(devi) {
  const client = devi.client || {}
  if (!client.email) return buildEmailDraft()
  const subject = `Relance devis ${devi.numero || ''} - ${client.nom || ''}`.trim()
  const bodyLines = [
    `Bonjour${client.nom ? ` ${client.nom}` : ''},`,
    '',
    `Je me permets de revenir vers vous concernant le devis ${devi.numero || ''}${devi.objet ? ` relatif à : ${devi.objet}` : ''}.`,
    `Montant du devis : ${formatPrice(devi.total_ttc)}.`,
    devi.date_validite ? `Validité : ${formatDate(devi.date_validite)}.` : '',
    '',
    'Pouvez-vous nous confirmer votre retour ou nous indiquer si vous souhaitez un ajustement ?',
    '',
    'Cordialement,',
    auth.user?.name || 'XELLTEKK',
  ].filter(Boolean)
  return buildEmailDraft({
    to: client.email,
    subject,
    body: bodyLines.join('\n'),
    context_type: 'devis',
    context_id: devi.id,
  })
}

async function openFromRoute(id) {
  if (!id) return
  try {
    const { data } = await api.get(`/devis/${parseInt(id)}`)
    editingDevis.value = data
    formDirty.value = false
    showModal.value = true
    router.replace({ path: '/devis', query: {} })
  } catch (e) {
    toast.error('Devis introuvable')
  }
}

async function openCreateFromRoute(clientId) {
  if (!clientId) return
  try {
    const { data } = await api.get(`/clients/${parseInt(clientId)}`)
    openCreate(data)
    router.replace({ path: '/devis', query: {} })
  } catch (e) {
    toast.error('Client introuvable')
  }
}

onMounted(async () => {
  syncFiltersFromRoute()
  await loadDevis()
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
  () => [route.query.statut, route.query.search, route.query.suivi],
  async () => {
    syncFiltersFromRoute()
    await loadDevis(1)
  }
)

onBeforeRouteLeave((to) => {
  if (showModal.value && formDirty.value && !saisieModalMinimized.value) {
    pendingLeaveRoute.value = to.fullPath
    showLeaveConfirm.value = true
    return false
  }
  if (!saisieModalMinimized.value) formDirty.value = false
  return true
})
</script>
