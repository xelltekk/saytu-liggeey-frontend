<template>
  <div class="achat-page space-y-4">
    <section class="achat-toolbar">
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--saytu-primary,#2563eb)]">Achats fournisseurs</p>
        <h2 class="truncate text-lg font-black text-[color:var(--saytu-shell-text,#0f172a)]">Pilotage des commandes</h2>
        <p class="text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">Demande → commande → réception → facture fournisseur.</p>
      </div>
      <div class="achat-toolbar-actions">
        <div class="achat-mode-tabs">
          <button type="button" class="achat-mode-tab" :class="!showRequests ? 'achat-mode-tab-active' : 'achat-mode-tab-idle'" @click="setAchatsMode('commandes')">
            Commandes <small>{{ stats.total || 0 }}</small>
          </button>
          <button type="button" class="achat-mode-tab" :class="showRequests ? 'achat-mode-tab-active' : 'achat-mode-tab-idle'" @click="setAchatsMode('demandes')">
            Demandes <small>{{ demandStats.total || 0 }}</small>
          </button>
        </div>
        <button v-if="!showRequests" class="btn-secondary rounded-full px-4 py-2 text-sm" @click="togglePerformance">{{ showPerformance ? 'Masquer performance' : 'Performance' }}</button>
        <button v-if="!showRequests" class="btn-secondary rounded-full px-4 py-2 text-sm" @click="goToDebtPilotage">Pilotage dettes</button>
        <button v-if="!showRequests" class="btn-secondary rounded-full px-4 py-2 text-sm" @click="goToAchatReports">Rapports</button>
        <button v-if="!showRequests" class="btn-secondary rounded-full px-4 py-2 text-sm" :disabled="loadingDashboard" @click="loadDashboard">{{ loadingDashboard ? 'Pilotage...' : 'Actualiser pilotage' }}</button>
        <button class="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm" @click="showRequests ? openDemandCreate() : openCreate()"><Plus :size="18" /> {{ showRequests ? 'Demande' : 'Bon de commande' }}</button>
      </div>
    </section>

    <div data-inline-modal-workspace></div>

    <section v-if="!showRequests" class="achat-dashboard-panel">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Tableau de bord achats</h3>
          <p class="text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">Vue rapide : validations, réceptions, dettes fournisseurs et litiges.</p>
        </div>
        <span class="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">Temps réel</span>
      </div>
      <div class="achat-dashboard-grid">
        <button v-for="card in dashboardCards" :key="card.key" type="button" class="achat-dashboard-card" @click="applyDashboardShortcut(card)">
          <span>{{ card.label }}</span>
          <strong :class="card.color">{{ card.value }}</strong>
          <small>{{ card.hint }}</small>
        </button>
      </div>
      <div class="grid gap-3 xl:grid-cols-3">
        <div class="achat-mini-panel">
          <h4>Livraisons en retard</h4>
          <div v-for="row in achatDashboard.commandes_retard" :key="row.id" class="achat-mini-row">
            <button type="button" @click="goToCommande(row)">{{ row.numero }}</button>
            <span>{{ row.fournisseur?.nom || '-' }} · {{ formatDate(row.date_livraison_prevue) }}</span>
          </div>
          <p v-if="!achatDashboard.commandes_retard.length" class="achat-empty">Aucune livraison en retard.</p>
        </div>
        <div class="achat-mini-panel">
          <h4>Factures à payer</h4>
          <div v-for="row in achatDashboard.factures_urgentes" :key="row.id" class="achat-mini-row">
            <button type="button" @click="goToInvoice(row)">{{ row.numero }}</button>
            <span>{{ row.fournisseur?.nom || '-' }} · reste {{ money(row.reste_a_payer) }}</span>
          </div>
          <p v-if="!achatDashboard.factures_urgentes.length" class="achat-empty">Aucune facture urgente.</p>
        </div>
        <div class="achat-mini-panel">
          <h4>Top fournisseurs</h4>
          <div v-for="row in achatDashboard.top_fournisseurs" :key="row.id" class="achat-mini-row">
            <button type="button" @click="goToSupplier360(row.id)">{{ row.nom }}</button>
            <span>{{ row.commandes_count }} commande(s) · {{ money(row.montant_total) }}</span>
          </div>
          <p v-if="!achatDashboard.top_fournisseurs.length" class="achat-empty">Aucun achat historisé.</p>
        </div>
      </div>
    </section>

    <section v-if="!showRequests" class="achat-strip">
      <button v-for="card in statCards" :key="card.key" type="button" class="achat-stat-pill" :class="statPillClass(card)" @click="applyStatFilter(card.key)">
        <span>{{ card.label }}</span>
        <strong :class="card.color">{{ card.value }}</strong>
      </button>
    </section>

    <section v-if="showPerformance && !showRequests" class="achat-performance-panel">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div><h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Performance fournisseurs</h3><p class="text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">Qualité, délais, retours et volume d’achats.</p></div>
        <button class="btn-secondary rounded-full px-4 py-2 text-sm" :disabled="loadingPerformance" @click="loadPerformance">Actualiser</button>
      </div>
      <div class="achat-performance-summary">
        <div><span>Suivis</span><strong>{{ performanceSummary.count }}</strong></div>
        <div><span>Score moyen</span><strong class="text-emerald-700">{{ performanceSummary.averageScore !== null ? performanceSummary.averageScore + ' %' : '-' }}</strong></div>
        <div><span>Meilleur</span><strong class="text-[color:var(--saytu-primary,#2563eb)]">{{ performanceSummary.best || '-' }}</strong></div>
      </div>
      <div v-if="loadingPerformance" class="py-8 text-center text-sm text-slate-500">Chargement...</div>
      <div v-else class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="w-full min-w-[900px]"><thead><tr><th>Fournisseur</th><th class="text-right">Score</th><th class="text-right">Note</th><th class="text-right">Livraisons à temps</th><th class="text-right">Retours</th><th class="text-right">Commandes</th><th class="text-right">Volume achats</th></tr></thead><tbody>
          <tr v-for="supplier in supplierPerformance" :key="supplier.id"><td><strong>{{ supplier.nom }}</strong><p class="text-xs text-slate-500">{{ supplier.code }}</p></td><td class="text-right"><span class="badge" :class="performanceClass(supplier.score_global)">{{ supplier.score_global !== null ? supplier.score_global + ' %' : '-' }}</span></td><td class="text-right">{{ supplier.note_moyenne !== null ? supplier.note_moyenne + ' / 5' : 'Non noté' }}</td><td class="text-right">{{ supplier.taux_livraison_temps !== null ? supplier.taux_livraison_temps + ' %' : '-' }}</td><td class="text-right">{{ supplier.taux_retour }} %</td><td class="text-right">{{ supplier.commandes_count }}</td><td class="text-right font-semibold">{{ money(supplier.montant_achats) }}</td></tr>
          <tr v-if="!supplierPerformance.length"><td colspan="7" class="py-8 text-center text-slate-400">Aucune donnée fournisseur.</td></tr>
        </tbody></table>
      </div>
    </section>

    <section v-if="!showRequests" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-3">
      <div class="grid gap-2 lg:grid-cols-[1fr_220px_220px_150px_150px_auto]">
        <input v-model="filters.search" class="input" placeholder="Rechercher numéro, fournisseur, objet..." @keyup.enter="loadCommandes(1)" />
        <select v-model="filters.statut" class="input" @change="loadCommandes(1)">
          <option value="">Tous les statuts</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option>
        </select>
        <select v-model.number="filters.fournisseur_id" class="input" @change="loadCommandes(1)">
          <option :value="null">Tous les fournisseurs</option>
          <option v-for="f in referentiels.fournisseurs" :key="f.id" :value="f.id">{{ f.nom }}</option>
        </select>
        <input v-model="filters.date_from" type="date" class="input" @change="loadCommandes(1)" />
        <input v-model="filters.date_to" type="date" class="input" @change="loadCommandes(1)" />
        <button class="btn-secondary" @click="loadCommandes(1)">Actualiser</button>
      </div>
    </section>

    <section v-if="!showRequests" class="overflow-x-auto rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)]">
      <table class="w-full min-w-[1120px]">
        <thead><tr><th>N°</th><th>Fournisseur</th><th>Date</th><th>Livraison prévue</th><th>Entrepôt</th><th class="text-right">Total TTC</th><th>Réception</th><th>Facture</th><th>Statut</th><th class="text-right">Actions</th></tr></thead>
        <tbody>
          <tr v-for="commande in commandes" :key="commande.id">
            <td><button class="font-mono font-semibold text-blue-700 hover:underline" @click="goToCommande(commande)">{{ commande.numero }}</button></td>
            <td>
              <button v-if="commande.fournisseur?.id" type="button" class="font-black text-[color:var(--saytu-primary,#2563eb)] hover:underline" @click="goToSupplier360(commande.fournisseur.id)">{{ commande.fournisseur?.nom || '-' }}</button>
              <strong v-else>{{ commande.fournisseur?.nom || '-' }}</strong>
              <p class="text-xs text-slate-500">{{ commande.objet || 'Sans objet' }}</p>
            </td>
            <td>{{ formatDate(commande.date_commande) }}</td>
            <td>{{ formatDate(commande.date_livraison_prevue) }}</td>
            <td>{{ commande.entrepot?.libelle || 'À définir' }}</td>
            <td class="text-right font-semibold">{{ money(commande.total_ttc) }}</td>
            <td>{{ commande.lignes_count || 0 }} ligne(s)</td>
            <td>
              <button v-if="commande.facture_fournisseur" class="font-mono text-violet-700 hover:underline" @click="goToInvoice(commande.facture_fournisseur)">{{ commande.facture_fournisseur.numero }}</button>
              <span v-else class="text-slate-400">-</span>
            </td>
            <td><span class="badge" :class="statusClass(commande.statut)">{{ statusLabel(commande.statut) }}</span></td>
            <td>
              <div class="flex justify-end gap-2">
                <button v-if="commande.statut === 'brouillon'" class="text-blue-700" title="Modifier" @click="editCommande(commande)">Modifier</button>
                <button v-if="commande.statut === 'brouillon'" class="text-indigo-700" title="Soumettre" @click="submitCommande(commande)">Soumettre</button>
                <button v-if="commande.statut === 'soumise' && canApprove" class="text-green-700" title="Approuver" @click="approveCommande(commande)">Approuver</button>
                <button v-if="['approuvee', 'partiellement_recue'].includes(commande.statut) && canReceive" class="text-cyan-700" title="Réceptionner" @click="goToReception(commande)">Réceptionner</button>
                <button v-if="['partiellement_recue', 'recue'].includes(commande.statut) && !commande.facture_fournisseur && canInvoice" class="text-violet-700" title="Générer la facture fournisseur" @click="goToSupplierInvoiceCreate(commande)">Facturer</button>
                <button v-if="commande.facture_fournisseur" class="text-violet-700" title="Voir la facture fournisseur" @click="goToInvoice(commande.facture_fournisseur)">Voir facture</button>
                <button v-if="commande.statut === 'recue' && canEvaluate" class="text-amber-700" title="Évaluer le fournisseur" @click="goToCommande(commande, 'evaluation')">{{ commande.evaluation_fournisseur ? 'Réévaluer' : 'Évaluer' }}</button>
                <button class="inline-flex items-center gap-1 text-slate-700" title="Télécharger le bon de commande PDF" @click="downloadOrderPdf(commande)"><FileDown :size="16" /> BC</button>
                <button v-if="commande.statut === 'brouillon'" class="text-red-600" title="Supprimer" @click="deleteCommande(commande)"><Trash2 :size="17" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!commandes.length"><td colspan="10" class="py-12 text-center text-sm text-slate-400">Aucun bon de commande trouvé.</td></tr>
        </tbody>
      </table>
      <AppPagination v-if="meta.total" :meta="meta" label="bons de commande" @page="loadCommandes" />
    </section>

    <template v-else>
      <section class="achat-strip">
        <button v-for="card in demandStatCards" :key="card.key" type="button" class="achat-stat-pill" :class="demandPillClass(card)" @click="applyDemandStatFilter(card.key)">
          <span>{{ card.label }}</span><strong :class="card.color">{{ card.value }}</strong>
        </button>
      </section>
      <section class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-3">
        <div class="grid gap-2 md:grid-cols-[1fr_200px_180px_auto]"><input v-model="demandFilters.search" class="input" placeholder="Rechercher numéro, objet, service..." @keyup.enter="loadDemands(1)" /><select v-model="demandFilters.statut" class="input" @change="loadDemands(1)"><option value="">Tous les statuts</option><option v-for="status in demandStatuses" :key="status" :value="status">{{ demandStatusLabel(status) }}</option></select><select v-model="demandFilters.priorite" class="input" @change="loadDemands(1)"><option value="">Toutes priorités</option><option value="basse">Basse</option><option value="normale">Normale</option><option value="haute">Haute</option><option value="urgente">Urgente</option></select><button class="btn-secondary" @click="loadDemands(1)">Actualiser</button></div>
      </section>
      <section class="overflow-x-auto rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)]">
        <table class="w-full min-w-[1150px]"><thead><tr><th>N°</th><th>Demandeur</th><th>Besoin</th><th>Objet</th><th>Priorité</th><th class="text-right">Estimation</th><th>Statut</th><th>Commande</th><th class="text-right">Actions</th></tr></thead><tbody>
          <tr v-for="demand in demands" :key="demand.id"><td><button class="font-mono font-semibold text-blue-700 hover:underline" @click="goToDemand(demand)">{{ demand.numero }}</button></td><td><strong>{{ demand.demandeur?.name || '-' }}</strong><p class="text-xs text-slate-500">{{ demand.service_demandeur || 'Service non précisé' }}</p></td><td>{{ formatDate(demand.date_besoin) }}</td><td><strong>{{ demand.objet }}</strong><p class="text-xs text-slate-500">{{ demand.lignes?.length || 0 }} ligne(s)</p></td><td><span class="badge" :class="priorityClass(demand.priorite)">{{ priorityLabel(demand.priorite) }}</span></td><td class="text-right font-semibold">{{ money(demand.montant_estime) }}</td><td><span class="badge" :class="demandStatusClass(demand.statut)">{{ demandStatusLabel(demand.statut) }}</span><p v-if="demand.motif_rejet" class="mt-1 max-w-48 truncate text-xs text-red-600" :title="demand.motif_rejet">{{ demand.motif_rejet }}</p></td><td><button v-if="demand.commande" class="font-mono text-blue-700 hover:underline" @click="goToCommande(demand.commande)">{{ demand.commande.numero }}</button><span v-else>-</span></td><td><div class="flex justify-end gap-2"><button v-if="demand.statut === 'brouillon'" class="text-blue-700" @click="editDemand(demand)">Modifier</button><button v-if="demand.statut === 'brouillon'" class="text-indigo-700" @click="submitDemand(demand)">Soumettre</button><button v-if="demand.statut === 'soumise' && canApprove" class="text-green-700" @click="approveDemand(demand)">Approuver</button><button v-if="demand.statut === 'soumise' && canApprove" class="text-red-600" @click="goToDemand(demand, 'fiche', 'reject')">Rejeter</button><button v-if="demand.statut === 'approuvee' && canApprove" class="text-violet-700" @click="goToDemand(demand, 'conversion')">Convertir</button><button v-if="demand.statut === 'brouillon'" class="text-red-600" @click="deleteDemand(demand)"><Trash2 :size="16" /></button></div></td></tr>
          <tr v-if="!demands.length"><td colspan="9" class="py-12 text-center text-slate-400">Aucune demande d’achat.</td></tr>
        </tbody></table>
        <AppPagination v-if="demandMeta.total" :meta="demandMeta" label="demandes d’achat" @page="loadDemands" />
      </section>
    </template>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FileDown, Plus, Trash2 } from 'lucide-vue-next'
import api from '@/services/api'
import AppPagination from '@/components/AppPagination.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { ouvrirPDF } from '@/services/pdf'
import { hasAnyRole } from '@/utils/access'

const auth = useAuthStore()
const toast = useToast()
const { confirm: askConfirm } = useConfirm()
const router = useRouter()
const route = useRoute()
const commandes = ref([])
const showPerformance = ref(false)
const showRequests = ref(false)
const loadingDashboard = ref(false)
const loadingPerformance = ref(false)
const loadingReferentiels = ref(false)
const referentielsError = ref('')
const supplierPerformance = ref([])
const demands = ref([])
const achatDashboard = reactive({ kpis: {}, top_fournisseurs: [], commandes_retard: [], factures_urgentes: [], litiges: [] })
const stats = reactive({ total: 0, a_approuver: 0, a_receptionner: 0, recues_mois: 0, engagement_total: 0 })
const demandStats = reactive({ total: 0, brouillons: 0, a_approuver: 0, approuvees: 0, urgentes: 0 })
const meta = reactive({})
const demandMeta = reactive({})
const referentiels = reactive({ fournisseurs: [], produits: [], entrepots: [] })
const filters = reactive({ search: '', statut: '', fournisseur_id: null, date_from: '', date_to: '' })
const demandFilters = reactive({ search: '', statut: '', priorite: '' })
const statuses = ['brouillon', 'soumise', 'approuvee', 'partiellement_recue', 'recue', 'annulee']
const demandStatuses = ['brouillon', 'soumise', 'approuvee', 'rejetee', 'convertie', 'annulee']
const canApprove = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))
const canReceive = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'magasinier']))
const canInvoice = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))
const canEvaluate = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'magasinier', 'comptable']))
const statCards = computed(() => [
  { key: 'total', label: 'Commandes', value: stats.total, color: 'text-slate-900' },
  { key: 'soumise', label: 'À approuver', value: stats.a_approuver, color: 'text-amber-700' },
  { key: 'approuvee', label: 'À réceptionner', value: stats.a_receptionner, color: 'text-blue-700' },
  { key: 'recue', label: 'Reçues ce mois', value: stats.recues_mois, color: 'text-green-700' },
  { key: 'engagement', label: 'Engagement', value: money(stats.engagement_total), color: 'text-violet-700' },
])
const dashboardCards = computed(() => [
  { key: 'soumise', label: 'À approuver', value: achatDashboard.kpis.commandes_a_approuver || 0, hint: 'Commandes soumises', color: 'text-amber-700', action: 'statut', statut: 'soumise' },
  { key: 'reception', label: 'À réceptionner', value: achatDashboard.kpis.commandes_a_receptionner || 0, hint: 'Commandes approuvées', color: 'text-blue-700', action: 'statut', statut: 'approuvee' },
  { key: 'retard', label: 'Retards livraison', value: achatDashboard.kpis.commandes_retard_livraison || 0, hint: 'Livraison dépassée', color: 'text-red-700', action: 'retard' },
  { key: 'dette', label: 'Dette fournisseurs', value: money(achatDashboard.kpis.dette_fournisseurs), hint: 'Reste à payer', color: 'text-violet-700', action: 'invoice' },
  { key: 'factures', label: 'Factures en retard', value: achatDashboard.kpis.factures_en_retard || 0, hint: 'À régler', color: 'text-orange-700', action: 'invoice' },
  { key: 'litiges', label: 'Litiges ouverts', value: achatDashboard.kpis.litiges_ouverts || 0, hint: 'Retours sans avoir', color: 'text-rose-700', action: 'report' },
])
const demandStatCards = computed(() => [
  { key: 'total', label: 'Demandes', value: demandStats.total, color: 'text-slate-900' },
  { key: 'brouillon', label: 'Brouillons', value: demandStats.brouillons, color: 'text-slate-700' },
  { key: 'soumise', label: 'À approuver', value: demandStats.a_approuver, color: 'text-amber-700' },
  { key: 'approuvee', label: 'Approuvées', value: demandStats.approuvees, color: 'text-green-700' },
  { key: 'urgente', label: 'Urgentes', value: demandStats.urgentes, color: 'text-red-700' },
])
const performanceSummary = computed(() => { const scored = supplierPerformance.value.filter(item => item.score_global !== null); return { count: supplierPerformance.value.length, averageScore: scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.score_global), 0) / scored.length) : null, best: scored[0]?.nom || null } })

function money(value) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))  }
function formatDate(value) { return value ? new Date(value).toLocaleDateString('fr-FR') : '-' }
function statusLabel(status) { return { brouillon: 'Brouillon', soumise: 'Soumise', approuvee: 'Approuvée', partiellement_recue: 'Partiellement reçue', recue: 'Reçue', annulee: 'Annulée' }[status] || status }
function statusClass(status) { return { brouillon: 'bg-slate-100 text-slate-700', soumise: 'bg-amber-100 text-amber-800', approuvee: 'bg-blue-100 text-blue-800', partiellement_recue: 'bg-cyan-100 text-cyan-800', recue: 'bg-green-100 text-green-800', annulee: 'bg-red-100 text-red-700' }[status] || 'bg-slate-100 text-slate-700' }
function performanceClass(score) { if (score === null) return 'bg-slate-100 text-slate-600'; if (score >= 80) return 'bg-green-100 text-green-800'; if (score >= 60) return 'bg-amber-100 text-amber-800'; return 'bg-red-100 text-red-800' }
function demandStatusLabel(status) { return { brouillon: 'Brouillon', soumise: 'Soumise', approuvee: 'Approuvée', rejetee: 'Rejetée', convertie: 'Convertie', annulee: 'Annulée' }[status] || status }
function demandStatusClass(status) { return { brouillon: 'bg-slate-100 text-slate-700', soumise: 'bg-amber-100 text-amber-800', approuvee: 'bg-green-100 text-green-800', rejetee: 'bg-red-100 text-red-700', convertie: 'bg-blue-100 text-blue-800', annulee: 'bg-slate-100 text-slate-500' }[status] || 'bg-slate-100 text-slate-700' }
function priorityLabel(value) { return { basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' }[value] || value }
function priorityClass(value) { return { basse: 'bg-slate-100 text-slate-600', normale: 'bg-blue-100 text-blue-700', haute: 'bg-orange-100 text-orange-700', urgente: 'bg-red-100 text-red-700' }[value] || 'bg-slate-100 text-slate-600' }
function statPillClass(card) {
  const active = (card.key === 'total' && !filters.statut) || filters.statut === card.key
  return active ? 'achat-stat-pill-active' : 'achat-stat-pill-idle'
}

function demandPillClass(card) {
  const active = (card.key === 'total' && !demandFilters.statut && !demandFilters.priorite)
    || demandFilters.statut === card.key
    || (card.key === 'urgente' && demandFilters.priorite === 'urgente')
  return active ? 'achat-stat-pill-active' : 'achat-stat-pill-idle'
}

function applyStatFilter(key) { filters.statut = key === 'total' || key === 'engagement' ? '' : key; loadCommandes(1) }

function applyDemandStatFilter(key) {
  demandFilters.statut = ''
  demandFilters.priorite = ''
  if (key === 'urgente') demandFilters.priorite = 'urgente'
  else if (key !== 'total') demandFilters.statut = key
  loadDemands(1)
}

function normalizeListPayload(payload) { return Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []) }
function normalizeSupplier(item) { return { id: item.id, code: item.code || '', nom: item.nom || item.name || '', email: item.email || '', telephone: item.telephone || item.mobile || '', delai_paiement_jours: item.delai_paiement_jours ?? null } }
function normalizeProduct(item) { return { id: item.id, reference: item.reference || '', libelle: item.libelle || item.designation || '', prix_achat_ht: item.prix_achat_ht ?? 0, taux_tva: item.taux_tva ?? 0, unite: item.unite || '', gere_stock: Boolean(item.gere_stock), fournisseur_id: item.fournisseur_id ?? null } }
function mergeUniqueById(lists) { const map = new Map(); lists.flat().filter(item => item?.id).forEach(item => map.set(Number(item.id), item)); return Array.from(map.values()) }

async function fetchSupplierType(type, params = {}) {
  const { data } = await api.get('/clients', { params: { type, per_page: 500, ...params } })
  return normalizeListPayload(data).map(normalizeSupplier)
}

async function loadFallbackSuppliers() {
  const types = ['fournisseur', 'client_fournisseur', 'client']
  const activeResults = await Promise.allSettled(types.map(type => fetchSupplierType(type, { statut: 'actif' })))
  const activeSuppliers = mergeUniqueById(activeResults.filter(result => result.status === 'fulfilled').map(result => result.value))
  if (activeSuppliers.length) return activeSuppliers

  const allResults = await Promise.allSettled(types.map(type => fetchSupplierType(type)))
  return mergeUniqueById(allResults.filter(result => result.status === 'fulfilled').map(result => result.value))
}

async function loadFallbackProducts() {
  const fetchProducts = async (params) => {
    const { data } = await api.get('/produits', { params: { per_page: 500, sort_by: 'libelle', ...params } })
    return normalizeListPayload(data).map(normalizeProduct)
  }
  const actifs = await fetchProducts({ actifs_seulement: 1 })
  return actifs.length ? actifs : fetchProducts({})
}

async function loadReferentielsFallback(error) {
  const [suppliersResult, productsResult] = await Promise.allSettled([
    loadFallbackSuppliers(),
    loadFallbackProducts(),
  ])

  if (suppliersResult.status === 'fulfilled' && suppliersResult.value.length) {
    referentiels.fournisseurs = suppliersResult.value
  }
  if (productsResult.status === 'fulfilled' && productsResult.value.length) {
    referentiels.produits = productsResult.value
  }

  if (!referentiels.fournisseurs.length || !referentiels.produits.length) {
    referentielsError.value = error?.response?.data?.message || 'Impossible de charger complètement les fournisseurs et produits. Vérifiez les données en ligne ou rechargez la page.'
    toast.error(referentielsError.value)
  }
}

async function loadReferentiels() {
  loadingReferentiels.value = true
  referentielsError.value = ''
  try {
    const { data } = await api.get('/achats/referentiels')
    referentiels.fournisseurs = Array.isArray(data?.fournisseurs) ? data.fournisseurs : []
    referentiels.produits = Array.isArray(data?.produits) ? data.produits : []
    referentiels.entrepots = Array.isArray(data?.entrepots) ? data.entrepots : []
    if (!referentiels.fournisseurs.length || !referentiels.produits.length) {
      await loadReferentielsFallback()
    }
  } catch (error) {
    await loadReferentielsFallback(error)
  } finally {
    loadingReferentiels.value = false
  }
}
async function loadStats() { Object.assign(stats, (await api.get('/achats/stats')).data) }
async function loadDashboard() {
  loadingDashboard.value = true
  try {
    const { data } = await api.get('/achats/dashboard')
    Object.assign(achatDashboard, {
      kpis: data.kpis || {},
      top_fournisseurs: data.top_fournisseurs || [],
      commandes_retard: data.commandes_retard || [],
      factures_urgentes: data.factures_urgentes || [],
      litiges: data.litiges || [],
    })
  } catch (e) {
    toast.error(e.response?.data?.message || 'Impossible de charger le tableau de bord achats.')
  } finally {
    loadingDashboard.value = false
  }
}
function applyDashboardShortcut(card) {
  if (card.action === 'statut') {
    filters.statut = card.statut
    loadCommandes(1)
  } else if (card.action === 'invoice') {
    router.push({ path: '/fournisseurs-reglements', query: { etat: 'retard' } })
  } else if (card.action === 'report') {
    goToAchatReports()
  } else if (card.action === 'retard') {
    filters.statut = ''
    loadCommandes(1)
  }
}

function goToDebtPilotage() {
  router.push({ path: '/fournisseurs-reglements', query: { tab: 'pilotage' } })
}

function goToAchatReports() {
  router.push({ name: 'achat-rapports' })
}

function goToSupplier360(id) {
  if (!id) return
  router.push({ name: 'achat-fournisseur-360', params: { id } })
}
async function loadPerformance() { loadingPerformance.value = true; try { supplierPerformance.value = (await api.get('/achats/fournisseurs-performance')).data.data || [] } catch (e) { toast.error(e.response?.data?.message || 'Impossible de charger la performance fournisseurs.') } finally { loadingPerformance.value = false } }
async function togglePerformance() { showPerformance.value = !showPerformance.value; if (showPerformance.value && !supplierPerformance.value.length) await loadPerformance() }
async function loadDemandStats() { Object.assign(demandStats, (await api.get('/achats/demandes/stats')).data) }
async function loadDemands(page = 1) { try { const { data } = await api.get('/achats/demandes', { params: { page, per_page: 20, ...demandFilters } }); demands.value = data.data || []; Object.assign(demandMeta, data) } catch (e) { toast.error(e.response?.data?.message || 'Impossible de charger les demandes d’achat.') } }
async function toggleRequests() { showRequests.value = !showRequests.value; if (showRequests.value) { showPerformance.value = false; await Promise.all([loadDemands(), loadDemandStats()]) } }
async function setAchatsMode(mode) {
  const demandes = mode === 'demandes'
  if (showRequests.value === demandes) return
  showRequests.value = demandes
  if (demandes) {
    showPerformance.value = false
    await Promise.all([loadDemands(), loadDemandStats()])
  } else {
    await refresh(meta.current_page || 1)
  }
}
async function refreshDemands() { await Promise.all([loadDemands(demandMeta.current_page || 1), loadDemandStats()]) }
function openDemandCreate() { router.push({ name: 'achat-demande-create', query: { tab: 'saisie' } }) }
function goToDemand(demand, tab = 'fiche', action = null) {
  if (!demand?.id) return
  const query = { tab }
  if (action) query.action = action
  router.push({ name: 'achat-demande-detail', params: { id: demand.id }, query })
}
function editDemand(demand) { goToDemand(demand, 'saisie') }
async function submitDemand(demand) { if (!await askConfirm({ message: 'Soumettre ' + demand.numero + ' pour approbation ?', tone: 'primary' })) return; try { await api.post('/achats/demandes/' + demand.id + '/soumettre'); toast.success('Demande soumise.'); await refreshDemands() } catch (e) { toast.error(e.response?.data?.message || 'Soumission impossible.') } }
async function approveDemand(demand) { if (!await askConfirm({ message: 'Approuver ' + demand.numero + ' ?', tone: 'primary' })) return; try { await api.post('/achats/demandes/' + demand.id + '/approuver'); toast.success('Demande approuvée.'); await refreshDemands() } catch (e) { toast.error(e.response?.data?.message || 'Approbation impossible.') } }
async function deleteDemand(demand) { if (!await askConfirm({ message: 'Supprimer le brouillon ' + demand.numero + ' ?', tone: 'danger', confirmLabel: 'Supprimer' })) return; try { await api.delete('/achats/demandes/' + demand.id); toast.success('Demande supprimée.'); await refreshDemands() } catch (e) { toast.error(e.response?.data?.message || 'Suppression impossible.') } }
async function loadCommandes(page = 1) { try { const { data } = await api.get('/achats/commandes', { params: { page, per_page: 20, ...filters, fournisseur_id: filters.fournisseur_id || undefined } }); commandes.value = data.data || []; Object.assign(meta, data) } catch (e) { toast.error(e.response?.data?.message || 'Impossible de charger les achats.') } }
async function refresh(page = meta.current_page || 1) { await Promise.all([loadCommandes(page), loadStats(), loadDashboard()]) }
function goToCommande(row, tab = 'fiche') {
  if (!row?.id) return
  router.push({ name: 'achat-commande-detail', params: { id: row.id }, query: { tab } })
}
function goToReception(row) {
  if (!row?.id) return
  router.push({ name: 'achat-reception-create', params: { id: row.id } })
}
function goToSupplierInvoiceCreate(row) {
  if (!row?.id) return
  router.push({ name: 'achat-facture-create', params: { id: row.id } })
}
function openCreate() { router.push({ name: 'achat-commande-create', query: { tab: 'saisie' } }) }
function editCommande(row) { goToCommande(row, 'saisie') }
async function runAction(row, action, message) { try { await api.post(`/achats/commandes/${row.id}/${action}`); toast.success(message); await refresh() } catch (e) { toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Action impossible.') } }
async function submitCommande(row) { if (await askConfirm({ message: `Soumettre ${row.numero} pour approbation ?`, tone: 'primary' })) runAction(row, 'soumettre', 'Commande soumise.') }
async function approveCommande(row) { if (await askConfirm({ message: `Approuver ${row.numero} ?`, tone: 'primary' })) runAction(row, 'approuver', 'Commande approuvée.') }
async function deleteCommande(row) { if (!await askConfirm({ message: `Supprimer le brouillon ${row.numero} ?`, tone: 'danger', confirmLabel: 'Supprimer' })) return; try { await api.delete(`/achats/commandes/${row.id}`); toast.success('Bon de commande supprimé.'); await refresh() } catch (e) { toast.error(e.response?.data?.message || 'Suppression impossible.') } }

function goToInvoice(invoice) {
  router.push({ path: '/fournisseurs-reglements', query: { search: invoice.numero } })
}

async function downloadOrderPdf(commande) {
  try {
    await ouvrirPDF(`/achats/commandes/${commande.id}/pdf`, `${commande.numero}.pdf`)
  } catch (e) {
    toast.error('Impossible de générer le bon de commande PDF.')
  }
}

async function openFromRoute(id) {
  if (id) await router.replace({ name: 'achat-commande-detail', params: { id }, query: { tab: 'fiche' } })
}

watch(() => route.query.open, (id, previousId) => {
  if (id && id !== previousId) openFromRoute(id)
})

watch(() => route.query.demandes, async value => {
  if (value && !showRequests.value) {
    showRequests.value = true
    showPerformance.value = false
    await Promise.all([loadDemands(), loadDemandStats()])
  }
})

onMounted(async () => {
  await Promise.all([loadReferentiels(), loadStats(), loadDashboard(), loadCommandes(), loadDemandStats()])
  if (route.query.demandes) {
    showRequests.value = true
    await Promise.all([loadDemands(), loadDemandStats()])
  }
  await openFromRoute(route.query.open)
})
</script>

<style scoped>
.achat-page {
  color: var(--saytu-shell-text, #0f172a);
}

.achat-toolbar,
.achat-strip,
.achat-performance-panel {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-border, #e2e8f0));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary, #2563eb) 6%, transparent), transparent 48%),
    var(--saytu-surface, #ffffff);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--saytu-primary, #2563eb) 7%, transparent);
}

.achat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 1.25rem;
  padding: 0.85rem 1rem;
}

.achat-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

.achat-mode-tabs {
  display: inline-flex;
  gap: 0.3rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 7%, var(--saytu-surface, #ffffff));
  padding: 0.25rem;
}

.achat-mode-tab,
.achat-stat-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 999px;
  font-weight: 850;
  transition: all 0.15s ease;
}

.achat-mode-tab {
  min-height: 2.25rem;
  padding: 0.45rem 0.75rem;
  font-size: 0.82rem;
}

.achat-mode-tab small {
  border-radius: 999px;
  background: rgb(255 255 255 / 78%);
  padding: 0.08rem 0.45rem;
  font-size: 0.68rem;
  font-weight: 950;
}

.achat-mode-tab-active {
  background: linear-gradient(135deg, var(--saytu-primary, #2563eb), var(--saytu-brand-to, #06b6d4));
  color: white;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--saytu-primary, #2563eb) 20%, transparent);
}

.achat-mode-tab-idle {
  color: var(--saytu-topbar-subtitle, #64748b);
}

.achat-mode-tab-idle:hover {
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 8%, var(--saytu-surface, #ffffff));
  color: var(--saytu-shell-text, #0f172a);
}

.achat-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-radius: 1.15rem;
  padding: 0.55rem;
}

.achat-stat-pill {
  min-height: 2.35rem;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-border, #e2e8f0));
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.achat-stat-pill span {
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.achat-stat-pill strong {
  font-size: 0.92rem;
  font-weight: 950;
}

.achat-stat-pill-active {
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 38%, var(--saytu-border, #e2e8f0));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--saytu-primary, #2563eb) 18%, transparent);
}

.achat-stat-pill-idle {
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, var(--saytu-primary, #2563eb) 8%);
}

.achat-stat-pill-idle:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 30%, var(--saytu-border, #e2e8f0));
}

.achat-performance-panel {
  border-radius: 1.25rem;
  padding: 0.9rem;
}

.achat-dashboard-panel {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 16%, var(--saytu-border, #bae6fd));
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-brand-to, #22d3ee) 18%, transparent), transparent 34%),
    color-mix(in srgb, var(--saytu-surface, #ffffff) 86%, var(--saytu-primary, #0ea5e9) 14%);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--saytu-primary, #0ea5e9) 10%, transparent);
  padding: 0.9rem;
}

.achat-dashboard-grid {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  margin: 0.75rem 0;
}

.achat-dashboard-card {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 18%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: rgb(255 255 255 / 72%);
  padding: 0.75rem;
  text-align: left;
}

.achat-dashboard-card span,
.achat-mini-panel h4 {
  color: var(--saytu-muted, #64748b);
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.achat-dashboard-card strong {
  display: block;
  font-size: 1.25rem;
  font-weight: 950;
  line-height: 1.1;
  margin-top: 0.25rem;
}

.achat-dashboard-card small {
  color: var(--saytu-muted, #64748b);
  font-size: 0.72rem;
  font-weight: 700;
}

.achat-mini-panel {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 14%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: rgb(255 255 255 / 72%);
  padding: 0.75rem;
}

.achat-mini-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 12%, transparent);
  margin-top: 0.55rem;
  padding-top: 0.55rem;
}

.achat-mini-row button {
  color: var(--saytu-primary, #0ea5e9);
  font-weight: 900;
  text-align: left;
}

.achat-mini-row span,
.achat-empty {
  color: var(--saytu-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 700;
}

.achat-performance-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.achat-performance-summary div {
  display: inline-flex;
  min-height: 2.4rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #2563eb) 10%);
  padding: 0.45rem 0.75rem;
}

.achat-performance-summary span {
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.achat-performance-summary strong {
  font-weight: 950;
}

@media (max-width: 768px) {
  .achat-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .achat-toolbar-actions,
  .achat-mode-tabs,
  .achat-strip {
    justify-content: stretch;
  }

  .achat-mode-tab,
  .achat-stat-pill,
  .achat-performance-summary div {
    flex: 1 1 9rem;
  }
}

th { @apply whitespace-nowrap bg-slate-50 px-3 py-2 text-left text-xs uppercase text-slate-500; }
td { @apply whitespace-nowrap border-t border-slate-100 px-3 py-3 text-sm text-slate-700; }
.field-label { @apply block text-sm font-medium text-slate-700; }
.field-label .input { @apply mt-1; }
.caption { @apply mb-1 block text-xs uppercase text-slate-500; }
</style>
