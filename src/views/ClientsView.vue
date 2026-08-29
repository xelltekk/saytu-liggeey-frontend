<template>
  <div class="client-page">
    <!-- Header avec filtres et bouton -->
    <div class="client-theme-panel rounded-lg p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input
          v-model="filters.search"
          @input="onSearchInput"
          type="search"
          placeholder="🔍 Rechercher par nom, email, téléphone, code, NINEA..."
          class="input flex-1"
        />

        <select v-model="filters.type" @change="loadClients(1)" class="input md:w-44">
          <option value="">Tous les types</option>
          <option value="client">Clients</option>
          <option value="prospect">Prospects</option>
          <option value="fournisseur">Fournisseurs</option>
          <option value="client_fournisseur">Client/Fournisseur</option>
        </select>

        <select v-model="filters.tag_id" @change="loadClients(1)" class="input md:w-44">
          <option value="">Tous les tags</option>
          <option v-for="t in tagsList" :key="t.id" :value="t.id">{{ t.emoji }} {{ t.libelle }}</option>
        </select>

        <select v-model="filters.statut" @change="loadClients(1)" class="input md:w-40">
          <option value="">Tous statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
          <option value="archive">Archivés</option>
        </select>

        <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          <span v-if="exportLoading">⏳</span>
          <span v-else>📥 CSV</span>
        </button>

        <button @click="openCreate" class="btn-primary whitespace-nowrap">
          + Nouveau client
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="client-theme-kpi client-theme-tone-1">
        <div class="client-theme-kpi-label">Clients affichés</div>
        <div class="client-theme-kpi-value">{{ meta.total }}</div>
        <div class="client-theme-kpi-help">Base filtrée en cours</div>
      </div>
      <div class="client-theme-kpi client-theme-tone-2">
        <div class="client-theme-kpi-label">CA cumulé</div>
        <div class="client-theme-kpi-value">{{ formatPrice(clientsSummary.ca) }}</div>
        <div class="client-theme-kpi-help">{{ amountNoteText }}</div>
      </div>
      <div class="client-theme-kpi client-theme-tone-3">
        <div class="client-theme-kpi-label">À encaisser</div>
        <div class="client-theme-kpi-value">{{ formatPrice(clientsSummary.reste) }}</div>
        <div class="client-theme-kpi-help">{{ clientsSummary.impayes }} facture(s) impayée(s)</div>
      </div>
      <div class="client-theme-kpi client-theme-tone-1">
        <div class="client-theme-kpi-label">À relancer</div>
        <div class="client-theme-kpi-value">{{ clientsSummary.retards }}</div>
        <div class="client-theme-kpi-help">Client(s) avec retard</div>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="loading" class="client-theme-panel rounded-lg p-12 text-center text-gray-500">
      Chargement...
    </div>

    <!-- Tableau -->
    <div v-else class="client-theme-panel rounded-lg overflow-hidden">
      <div class="border-b border-slate-100 px-4 py-3">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900">Portefeuille clients</h2>
            <p class="text-xs text-slate-500">Vue enrichie : activité, encours, alertes et raccourcis commerciaux.</p>
          </div>
          <p class="text-xs font-medium text-slate-500">{{ amountNoteText }}</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="code" :active="sort.key === 'code'" :icon="sortIcon('code')" @sort="toggleSort">Client</SortableTh>
              <SortableTh column="contact" :active="sort.key === 'contact'" :icon="sortIcon('contact')" @sort="toggleSort">Contact</SortableTh>
              <SortableTh column="ca" :active="sort.key === 'ca'" :icon="sortIcon('ca')" align="right" @sort="toggleSort">CA</SortableTh>
              <SortableTh column="reste" :active="sort.key === 'reste'" :icon="sortIcon('reste')" align="right" @sort="toggleSort">Impayés</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions rapides</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="client in sortedClients" :key="client.id" class="hover:bg-gray-50/80">
              <td class="px-4 py-2.5">
                <button type="button" class="flex min-w-[260px] items-center gap-3 text-left" @click="openClient360(client)">
                  <span class="font-mono text-xs font-semibold text-xelltekk-600">{{ client.code }}</span>
                  <span class="max-w-[300px] truncate font-semibold text-gray-900 hover:text-xelltekk-700">{{ client.nom }}</span>
                </button>
                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  <span class="badge text-[10px]" :class="typeBadgeClass(client.type)">{{ typeLabel(client.type) }}</span>
                  <span class="badge text-[10px]" :class="statutBadgeClass(client.statut)">
                    {{ client.statut }}
                  </span>
                  <span class="badge text-[10px]" :class="scoreBadgeClass(summary(client).score_relation?.tone)">
                    {{ summary(client).score_relation?.label || 'Nouveau' }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-2.5 text-sm">
                <div class="flex flex-col gap-0.5">
                  <a
                    v-if="client.email"
                    :href="emailHref(client.email)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="max-w-[240px] truncate font-medium text-xelltekk-700 hover:text-xelltekk-900 hover:underline"
                    @click.stop
                  >
                    {{ client.email }}
                  </a>
                  <span v-if="client.telephone || client.mobile" class="text-xs text-gray-500">{{ client.telephone || client.mobile }}</span>
                  <span v-if="!client.email && !client.telephone && !client.mobile" class="text-xs text-gray-400">–</span>
                </div>
              </td>
              <td class="px-4 py-2.5 text-right">
                <div class="font-mono text-sm font-bold text-emerald-700">{{ formatPrice(summary(client).ca_total) }}</div>
                <div class="text-[11px] text-gray-400">{{ summary(client).factures_count || 0 }} facture(s)</div>
              </td>
              <td class="px-4 py-2.5 text-right">
                <div class="font-mono text-sm font-bold" :class="Number(summary(client).reste_a_payer || 0) > 0 ? 'text-amber-700' : 'text-slate-400'">
                  {{ formatPrice(summary(client).reste_a_payer) }}
                </div>
                <div v-if="summary(client).factures_retard_count" class="text-[11px] font-semibold text-rose-600">
                  {{ summary(client).factures_retard_count }} en retard
                </div>
                <div v-else class="text-[11px] text-gray-400">RAS</div>
              </td>
              <td class="px-4 py-2.5 text-right whitespace-nowrap">
                <button @click="openClient360(client)" class="text-slate-700 hover:text-xelltekk-700 text-sm font-semibold mr-2">
                  Vue 360°
                </button>
                <button v-if="canSellTo(client)" @click="creerDevis(client)" class="text-emerald-600 hover:text-emerald-800 text-sm font-medium mr-2">
                  + Devis
                </button>
                <button v-if="canSellTo(client)" @click="creerFacture(client)" class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2">
                  + Facture
                </button>
                <button v-if="Number(summary(client).reste_a_payer || 0) > 0" @click="relancerClient(client)" class="text-amber-700 hover:text-amber-900 text-sm font-medium mr-2">
                  Relancer
                </button>
                <button v-if="isAdmin" @click="openAssignClient(client)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-2">
                  Affecter
                </button>
                <button @click="openEdit(client)" class="text-xelltekk-600 hover:text-xelltekk-800 text-sm font-medium mr-2">
                  ✏️ Modifier
                </button>
                <button @click="confirmDelete(client)" class="text-red-600 hover:text-red-800 text-sm font-medium">
                  🗑️
                </button>
              </td>
            </tr>
            <tr v-if="clients.length === 0">
              <td colspan="5" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun client trouvé
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          Affichage de <strong>{{ meta.from }}</strong> à <strong>{{ meta.to }}</strong>
          sur <strong>{{ meta.total }}</strong> clients
        </div>
        <div class="flex gap-2">
          <button
            @click="loadClients(meta.current_page - 1)"
            :disabled="meta.current_page === 1"
            class="btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <span class="px-3 py-1.5 text-gray-600">
            Page {{ meta.current_page }} / {{ meta.last_page }}
          </span>
          <button
            @click="loadClients(meta.current_page + 1)"
            :disabled="meta.current_page === meta.last_page"
            class="btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>

    <!-- Modal création / édition -->
    <AppModal v-model="showModal" :title="editingClient ? `Modifier : ${editingClient.nom}` : 'Nouveau client'" size="lg">
      <ClientForm
        :client="editingClient"
        @saved="onClientSaved"
        @cancel="showModal = false"
      />
    </AppModal>

    <AssignCommercialModal
      v-if="assignTarget"
      v-model="showAssignModal"
      :endpoint="assignEndpoint"
      :current-commercial-id="assignTarget?.commercial_id"
      :item-label="assignTarget ? `${assignTarget.code} - ${assignTarget.nom}` : ''"
      title="Affecter client / prospect"
      @assigned="onAssigned"
    />

    <AppModal
      v-model="showClient360Modal"
      :title="client360 ? `Client 360° : ${client360.nom}` : 'Client 360°'"
      size="xl"
    >
      <div v-if="client360Loading" class="rounded-2xl bg-white p-10 text-center text-slate-500">
        Chargement de la fiche client...
      </div>

      <div v-else-if="client360" class="space-y-5">
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-xelltekk-50 px-3 py-1 font-mono text-xs font-bold text-xelltekk-700">{{ client360.code }}</span>
                <span class="badge" :class="typeBadgeClass(client360.type)">{{ typeLabel(client360.type) }}</span>
                <span class="badge" :class="statutBadgeClass(client360.statut)">{{ client360.statut }}</span>
                <span class="badge" :class="scoreBadgeClass(summary(client360).score_relation?.tone)">{{ summary(client360).score_relation?.label }}</span>
              </div>
              <h2 class="mt-3 text-2xl font-black text-slate-900">{{ client360.nom }}</h2>
              <p class="mt-1 text-sm text-slate-500">
                {{ client360.secteur_activite || 'Secteur non renseigné' }}
                <span v-if="client360.commercial?.name"> · Commercial : {{ client360.commercial.name }}</span>
              </p>
              <div class="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                <div>📞 {{ client360.telephone || client360.mobile || 'Téléphone non renseigné' }}</div>
                <div>✉️ {{ client360.email || 'Email non renseigné' }}</div>
                <div>📍 {{ [client360.adresse, client360.ville, client360.pays].filter(Boolean).join(', ') || 'Adresse non renseignée' }}</div>
                <div>🧾 NINEA : {{ client360.ninea || '—' }} · RCCM : {{ client360.rccm || '—' }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[420px]">
              <button v-if="canSellTo(client360)" type="button" class="quick-client-btn" @click="creerDevis(client360)">+ Devis</button>
              <button v-if="canSellTo(client360)" type="button" class="quick-client-btn" @click="creerFacture(client360)">+ Facture</button>
              <button type="button" class="quick-client-btn" @click="creerPaiement(client360)">+ Paiement</button>
              <button type="button" class="quick-client-btn" @click="creerRdv(client360)">+ Rendez-vous</button>
              <button type="button" class="quick-client-btn" @click="creerIntervention(client360)">+ Intervention</button>
              <button type="button" class="quick-client-btn" @click="relancerClient(client360)">Relancer</button>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="client360-card">
            <div class="client360-label">CA total</div>
            <div class="client360-value text-emerald-700">{{ formatPrice(summary(client360).ca_total) }}</div>
            <div class="client360-help">{{ summary(client360).factures_count || 0 }} facture(s)</div>
          </div>
          <div class="client360-card">
            <div class="client360-label">Reste à payer</div>
            <div class="client360-value text-amber-700">{{ formatPrice(summary(client360).reste_a_payer) }}</div>
            <div class="client360-help">{{ summary(client360).factures_impayees_count || 0 }} facture(s) impayée(s)</div>
          </div>
          <div class="client360-card">
            <div class="client360-label">Retard</div>
            <div class="client360-value text-rose-700">{{ formatPrice(summary(client360).retard_total) }}</div>
            <div class="client360-help">{{ summary(client360).factures_retard_count || 0 }} facture(s) à relancer</div>
          </div>
          <div class="client360-card">
            <div class="client360-label">Crédit disponible</div>
            <div class="client360-value text-blue-700">{{ formatPrice(summary(client360).credit_disponible) }}</div>
            <div class="client360-help">Plafond : {{ formatPrice(summary(client360).plafond_credit) }}</div>
          </div>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Client360List
            title="Alertes impayées"
            empty="Aucune facture en retard"
            :items="client360.alertes?.factures_en_retard || []"
          >
            <template #default="{ item }">
              <div class="font-mono font-semibold">{{ item.numero }}</div>
              <div class="text-xs text-slate-500">Échéance {{ formatDate(item.date_echeance) }}</div>
              <div class="font-mono text-sm font-bold text-rose-700">{{ formatPrice(item.reste_a_payer) }}</div>
            </template>
          </Client360List>

          <Client360List
            title="Devis à relancer"
            empty="Aucun devis proche de l’échéance"
            :items="client360.alertes?.devis_a_relancer || []"
          >
            <template #default="{ item }">
              <div class="font-mono font-semibold">{{ item.numero }}</div>
              <div class="text-xs text-slate-500">Valide jusqu’au {{ formatDate(item.date_validite) }}</div>
              <div class="font-mono text-sm font-bold text-blue-700">{{ formatPrice(item.total_ttc) }}</div>
            </template>
          </Client360List>

          <Client360List
            title="Interventions ouvertes"
            empty="Aucune intervention ouverte"
            :items="client360.alertes?.interventions_ouvertes || []"
          >
            <template #default="{ item }">
              <div class="font-mono font-semibold">{{ item.reference }}</div>
              <div class="text-xs text-slate-500">{{ item.type }} · {{ formatDate(item.date_intervention) }}</div>
              <span class="badge text-[10px]" :class="genericStatusBadge(item.statut)">{{ item.statut }}</span>
            </template>
          </Client360List>
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Client360List title="Dernières factures" empty="Aucune facture" :items="client360.historique?.factures || []">
            <template #default="{ item }">
              <button type="button" class="text-left font-mono font-semibold text-xelltekk-700 hover:underline" @click="goToDocument('/factures', item.id)">{{ item.numero }}</button>
              <div class="text-xs text-slate-500">{{ formatDate(item.date_facture) }} · {{ item.statut }}</div>
              <div class="font-mono text-sm font-bold text-slate-900">{{ formatPrice(item.total_ttc) }}</div>
            </template>
          </Client360List>

          <Client360List title="Derniers devis" empty="Aucun devis" :items="client360.historique?.devis || []">
            <template #default="{ item }">
              <button type="button" class="text-left font-mono font-semibold text-xelltekk-700 hover:underline" @click="goToDocument('/devis', item.id)">{{ item.numero }}</button>
              <div class="text-xs text-slate-500">{{ formatDate(item.date_devis) }} · {{ item.statut }}</div>
              <div class="font-mono text-sm font-bold text-slate-900">{{ formatPrice(item.total_ttc) }}</div>
            </template>
          </Client360List>

          <Client360List title="Derniers paiements" empty="Aucun paiement" :items="client360.historique?.paiements || []">
            <template #default="{ item }">
              <div class="font-mono font-semibold">{{ item.reference }}</div>
              <div class="text-xs text-slate-500">{{ formatDate(item.date_paiement) }} · {{ modeLabel(item.mode_paiement) }}</div>
              <div class="font-mono text-sm font-bold text-emerald-700">{{ formatPrice(item.montant) }}</div>
            </template>
          </Client360List>

          <Client360List title="Leasing & interventions" empty="Aucun élément leasing" :items="leasingTimeline">
            <template #default="{ item }">
              <button type="button" class="text-left font-mono font-semibold text-xelltekk-700 hover:underline" @click="goToLeasing(item)">
                {{ item.reference }}
              </button>
              <div class="text-xs text-slate-500">{{ item.kind }} · {{ item.subtitle }}</div>
              <span class="badge text-[10px]" :class="genericStatusBadge(item.statut)">{{ item.statut }}</span>
            </template>
          </Client360List>
        </section>

        <section v-if="client360.notes_privees || client360.notes_publiques" class="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 class="font-bold text-slate-900">Notes client</h3>
          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-3">
              <div class="text-xs font-semibold uppercase text-slate-500">Notes publiques</div>
              <p class="mt-1 whitespace-pre-line text-sm text-slate-700">{{ client360.notes_publiques || '—' }}</p>
            </div>
            <div class="rounded-2xl bg-amber-50 p-3">
              <div class="text-xs font-semibold uppercase text-amber-700">Notes privées</div>
              <p class="mt-1 whitespace-pre-line text-sm text-slate-700">{{ client360.notes_privees || '—' }}</p>
            </div>
          </div>
        </section>
      </div>
    </AppModal>

    <!-- Modal confirmation suppression -->
    <AppModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p class="text-gray-700">
        Êtes-vous sûr de vouloir supprimer le client
        <strong>{{ clientToDelete.nom }}</strong> 
      </p>
      <p class="mt-2 text-xs text-gray-500">
        Cette action est réversible (soft delete) mais le client ne sera plus visible.
      </p>

      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleDelete" :disabled="deleting" class="btn-danger">
          <span v-if="deleting">Suppression...</span>
          <span v-else>Supprimer</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import ClientForm from '@/components/ClientForm.vue'
import Client360List from '@/components/Client360List.vue'
import AssignCommercialModal from '@/components/AssignCommercialModal.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { telechargerCSV } from '@/services/exports'
import { useTableSort } from '@/composables/useTableSort'
import { useAuthStore } from '@/stores/auth'
import { useCurrency } from '@/composables/useCurrency'
import { buildMailtoUrl, closeReservedEmailComposerWindow, openEmailComposer, reserveEmailComposerWindow } from '@/utils/emailComposer'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => ['admin', 'gerant'].includes(auth.user?.role))
const { amountNoteText, formatMoney } = useCurrency()

const clients = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('created_at', 'desc')
const tagsList = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', type: '', statut: '', tag_id: '' })

const showModal = ref(false)
const editingClient = ref(null)
const showDeleteModal = ref(false)
const clientToDelete = ref(null)
const deleting = ref(false)
const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignEndpoint = computed(() => assignTarget.value ? `/clients/${assignTarget.value.id}/assign-commercial` : '/clients/0/assign-commercial')
const showClient360Modal = ref(false)
const client360 = ref(null)
const client360Loading = ref(false)

const sortedClients = computed(() => sortedRows(clients.value, {
  created_at: 'created_at',
  code: 'code',
  nom: 'nom',
  type: 'type',
  tags: (client) => (client.tags || []).map((tag) => tag.libelle).join(', '),
  contact: (client) => client.email || client.telephone || client.mobile || '',
  ville: 'ville',
  statut: 'statut',
  ca: (client) => Number(summary(client).ca_total || 0),
  reste: (client) => Number(summary(client).reste_a_payer || 0),
}))

const clientsSummary = computed(() => clients.value.reduce((acc, client) => {
  const resume = summary(client)
  acc.ca += Number(resume.ca_total || 0)
  acc.reste += Number(resume.reste_a_payer || 0)
  acc.impayes += Number(resume.factures_impayees_count || 0)
  if (Number(resume.factures_retard_count || 0) > 0) acc.retards += 1
  return acc
}, { ca: 0, reste: 0, impayes: 0, retards: 0 }))

const leasingTimeline = computed(() => {
  const contrats = (client360.value?.historique?.leasing_contrats || []).map((contrat) => ({
    ...contrat,
    kind: 'Contrat',
    reference: contrat.numero,
    subtitle: `${formatDate(contrat.date_debut)} · ${contrat.imprimante?.designation || contrat.imprimante?.reference || 'Imprimante'}`,
    routeTab: 'contrats',
  }))
  const interventions = (client360.value?.historique?.leasing_interventions || []).map((intervention) => ({
    ...intervention,
    kind: 'Intervention',
    reference: intervention.reference,
    subtitle: `${formatDate(intervention.date_intervention)} · ${intervention.imprimante?.designation || intervention.type || 'Intervention'}`,
    routeTab: 'interventions',
  }))
  return [...interventions, ...contrats].slice(0, 8)
})

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadClients(1), 350)
}

async function loadClients(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/clients', {
      params: {
        page,
        per_page: 20,
        search: filters.search || undefined,
        type: filters.type || undefined,
        statut: filters.statut || undefined,
        tag_id: filters.tag_id || undefined,
      },
    })
    clients.value = data.data
    Object.assign(meta, {
      current_page: data.current_page,
      last_page: data.last_page,
      total: data.total,
      from: data.from || 0,
      to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

async function loadTags() {
  try {
    const { data } = await api.get('/tags')
    tagsList.value = data
  } catch (e) {}
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/clients', {}, 'clients_xelltekk.csv')
    toast.success('Export téléchargé')
  } catch (e) {
    toast.error('Erreur lors de l\'export')
  } finally {
    exportLoading.value = false
  }
}

function openCreate() {
  editingClient.value = null
  showModal.value = true
}

function openEdit(client) {
  editingClient.value = { ...client }
  showModal.value = true
}

function openAssignClient(client) {
  assignTarget.value = client
  showAssignModal.value = true
}

function onAssigned() {
  loadClients(meta.current_page)
}

function canSellTo(client) {
  return ['client', 'client_fournisseur'].includes(client.type)
}

function summary(client) {
  return client?.resume_commercial || {}
}

function creerDevis(client) {
  router.push({ path: '/devis', query: { create_client: client.id } })
}

function creerFacture(client) {
  router.push({ path: '/factures', query: { create_client: client.id } })
}

function creerPaiement(client) {
  router.push({ path: '/paiements', query: { search: client.code || client.nom } })
}

function creerRdv(client) {
  router.push({ path: '/agenda', query: { search: client.code || client.nom } })
}

function creerIntervention(client) {
  router.push({ path: '/leasing', query: { tab: 'interventions', search: client.code || client.nom } })
}

async function openClient360(client) {
  showClient360Modal.value = true
  client360.value = client
  client360Loading.value = true

  try {
    const { data } = await api.get(`/clients/${client.id}`)
    client360.value = data
  } catch (e) {
    toast.error('Impossible de charger la fiche 360°')
  } finally {
    client360Loading.value = false
  }
}

function goToDocument(path, id) {
  showClient360Modal.value = false
  router.push({ path, query: { open: id } })
}

function goToLeasing(item) {
  showClient360Modal.value = false
  router.push({
    path: '/leasing',
    query: item.routeTab === 'interventions'
      ? { tab: 'interventions', search: item.reference }
      : { tab: 'contrats', search: item.reference },
  })
}

function emailHref(email) {
  return buildMailtoUrl({ to: email })
}

async function loadClientForRelance(client) {
  if (client?.alertes && client?.historique) {
    return client
  }

  try {
    const { data } = await api.get(`/clients/${client.id}`)
    return data
  } catch (e) {
    return client
  }
}

function uniqueInvoicesForRelance(client) {
  const invoices = [
    ...(client.alertes?.factures_en_retard || []),
    ...(client.historique?.factures || []).filter((facture) => Number(facture.reste_a_payer || 0) > 0),
  ]

  return Array.from(new Map(invoices.map((invoice) => [invoice.id || invoice.numero, invoice])).values())
}

function buildRelanceEmail(client) {
  const resume = summary(client)
  const invoices = uniqueInvoicesForRelance(client)
  const totalDue = formatPrice(resume.reste_a_payer || 0)
  const totalOverdue = formatPrice(resume.retard_total || 0)
  const currencyNote = amountNoteText.value || 'Montants exprimés en Francs CFA BCEAO'
  const today = new Date().toLocaleDateString('fr-FR')
  const invoiceLines = invoices.length
    ? invoices.map((invoice) => {
        const echeance = invoice.date_echeance || invoice.date_validite
        const amount = invoice.reste_a_payer ?? invoice.total_ttc ?? 0
        return `- ${invoice.numero || invoice.reference} · échéance ${formatDate(echeance)} · reste à payer : ${formatPrice(amount)}`
      })
    : ['- Détail des factures disponible dans votre compte client.']

  const subject = `Relance règlement - ${client.code || ''} ${client.nom}`.trim()
  const body = [
    `Bonjour,`,
    '',
    `Nous vous contactons au sujet de votre compte client ${client.code || ''} - ${client.nom}.`,
    '',
    `Situation arrêtée au ${today} :`,
    `- Solde total à régulariser : ${totalDue}`,
    `- Montant en retard : ${totalOverdue}`,
    `- Factures impayées : ${resume.factures_impayees_count || 0}`,
    `- Factures en retard : ${resume.factures_retard_count || 0}`,
    '',
    'Détail des éléments concernés :',
    ...invoiceLines,
    '',
    currencyNote + '.',
    '',
    'Merci de bien vouloir procéder au règlement ou nous transmettre une confirmation de paiement.',
    'Si le règlement a déjà été effectué, merci de nous envoyer le justificatif afin que nous mettions votre compte à jour.',
    '',
    'Cordialement,',
    'XELLTEKK',
  ].join('\n')

  return { subject, body }
}

async function relancerClient(client) {
  const emailWindow = reserveEmailComposerWindow()
  const fullClient = await loadClientForRelance(client)
  const { subject, body } = buildRelanceEmail(fullClient)

  if (fullClient.email) {
    openEmailComposer(buildMailtoUrl({ to: fullClient.email, subject, body }), emailWindow)
    return
  }

  closeReservedEmailComposerWindow(emailWindow)
  try {
    await navigator.clipboard?.writeText(`${subject}\n\n${body}`)
    toast.success('Email de relance copié, aucun email client renseigné')
  } catch (e) {
    toast.info('Aucun email renseigné pour ce client')
  }
}

async function openFromRoute(id) {
  if (!id) return
  try {
    const { data } = await api.get(`/clients/${id}`)
    editingClient.value = data
    showModal.value = true
    router.replace({ path: '/clients', query: {} })
  } catch (e) {
    toast.error('Client introuvable')
  }
}

function onClientSaved() {
  showModal.value = false
  loadClients(meta.current_page)
  if (showClient360Modal.value && client360.value?.id) {
    openClient360(client360.value)
  }
}

function confirmDelete(client) {
  clientToDelete.value = client
  showDeleteModal.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/clients/${clientToDelete.value.id}`)
    toast.success(`Client "${clientToDelete.value.nom}" supprimé`)
    showDeleteModal.value = false
    clientToDelete.value = null
    loadClients(meta.current_page)
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur de suppression')
  } finally {
    deleting.value = false
  }
}

function typeLabel(type) {
  return {
    client: 'Client', prospect: 'Prospect',
    fournisseur: 'Fournisseur', client_fournisseur: 'Client/Four.',
  }[type] || type
}

function typeBadgeClass(type) {
  return {
    client: 'bg-blue-100 text-blue-800',
    prospect: 'bg-yellow-100 text-yellow-800',
    fournisseur: 'bg-purple-100 text-purple-800',
    client_fournisseur: 'bg-indigo-100 text-indigo-800',
  }[type] || 'bg-gray-100 text-gray-700'
}

function statutBadgeClass(statut) {
  return {
    actif: 'bg-green-100 text-green-700',
    inactif: 'bg-gray-100 text-gray-600',
    archive: 'bg-red-100 text-red-600',
  }[statut] || 'bg-gray-100 text-gray-700'
}

function scoreBadgeClass(tone) {
  return {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700',
    slate: 'bg-slate-100 text-slate-600',
  }[tone] || 'bg-slate-100 text-slate-600'
}

function genericStatusBadge(statut) {
  return {
    payee: 'bg-emerald-100 text-emerald-700',
    valide: 'bg-emerald-100 text-emerald-700',
    actif: 'bg-emerald-100 text-emerald-700',
    accepte: 'bg-emerald-100 text-emerald-700',
    en_cours: 'bg-blue-100 text-blue-700',
    planifiee: 'bg-blue-100 text-blue-700',
    envoye: 'bg-blue-100 text-blue-700',
    partiellement_payee: 'bg-amber-100 text-amber-700',
    impayee: 'bg-amber-100 text-amber-700',
    brouillon: 'bg-slate-100 text-slate-600',
    annulee: 'bg-rose-100 text-rose-700',
    refuse: 'bg-rose-100 text-rose-700',
  }[statut] || 'bg-slate-100 text-slate-600'
}

function modeLabel(mode) {
  return {
    especes: 'Espèces',
    virement: 'Virement',
    cheque: 'Chèque',
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'YAS',
    carte_bancaire: 'Carte',
    autre: 'Autre',
  }[mode] || mode || '—'
}

function formatPrice(value) {
  return formatMoney(value)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR')
}

onMounted(() => {
  loadClients()
  loadTags()
  openFromRoute(route.query.open)
})

watch(() => route.query.open, (id) => {
  openFromRoute(id)
})
</script>

<style scoped>
.client-theme-panel {
  border: 1px solid color-mix(in srgb, var(--saytu-border, #e2e8f0) 72%, var(--saytu-primary, #2563eb) 28%);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-brand-to, #22d3ee) 10%, transparent), transparent 30%),
    color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, var(--saytu-primary, #2563eb) 8%);
  box-shadow: 0 14px 34px color-mix(in srgb, var(--saytu-primary, #2563eb) 8%, transparent);
}

.client-theme-kpi {
  --client-kpi-color: var(--saytu-primary, #2563eb);
  border: 1px solid color-mix(in srgb, var(--client-kpi-color) 34%, var(--saytu-border, #e2e8f0));
  border-radius: 1rem;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--client-kpi-color) 20%, transparent), transparent 34%),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--saytu-surface, #ffffff) 88%, var(--client-kpi-color) 12%),
      color-mix(in srgb, var(--saytu-surface, #ffffff) 96%, var(--client-kpi-color) 4%)
    );
  padding: 1rem;
  box-shadow: 0 12px 28px color-mix(in srgb, var(--client-kpi-color) 8%, transparent);
}

.client-theme-tone-1 {
  --client-kpi-color: var(--saytu-brand-from, #3b82f6);
}

.client-theme-tone-2 {
  --client-kpi-color: var(--saytu-brand-to, #22d3ee);
}

.client-theme-tone-3 {
  --client-kpi-color: var(--saytu-sidebar-via, #1e293b);
}

.client-theme-kpi-label {
  color: color-mix(in srgb, var(--client-kpi-color) 74%, var(--saytu-shell-text, #334155));
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.client-theme-kpi-value {
  margin-top: 0.5rem;
  color: var(--client-kpi-color);
  font-size: 1.5rem;
  font-weight: 950;
  line-height: 2rem;
}

.client-theme-kpi-help {
  color: color-mix(in srgb, var(--saytu-shell-text, #334155) 68%, var(--client-kpi-color));
  font-size: 0.75rem;
}

.quick-client-btn {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 28%, var(--saytu-border, #e2e8f0));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 84%, var(--saytu-primary, #2563eb) 16%);
  color: var(--saytu-primary, #2563eb);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 800;
  transition: 160ms ease;
}

.quick-client-btn:hover {
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 74%, var(--saytu-primary, #2563eb) 26%);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, transparent);
  transform: translateY(-1px);
}

.client360-card {
  border: 1px solid color-mix(in srgb, var(--saytu-border, #e2e8f0) 72%, var(--saytu-primary, #2563eb) 28%);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #2563eb) 10%);
  padding: 1rem;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--saytu-primary, #2563eb) 8%, transparent);
}

.client360-label {
  color: color-mix(in srgb, var(--saytu-topbar-subtitle, #64748b) 80%, var(--saytu-primary, #2563eb));
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.client360-value {
  margin-top: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 1.5rem;
  font-weight: 950;
}

.client360-help {
  margin-top: 0.25rem;
  color: color-mix(in srgb, var(--saytu-topbar-subtitle, #64748b) 82%, var(--saytu-primary, #2563eb));
  font-size: 0.75rem;
}
</style>
