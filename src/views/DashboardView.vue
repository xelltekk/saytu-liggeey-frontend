<template>
  <div>
    <div v-if="loading" class="rounded-lg bg-white p-12 text-center text-gray-500 dark:bg-slate-900 dark:text-slate-300">
      Chargement du tableau de bord...
    </div>

    <div v-else class="space-y-4">
      <div class="rounded-lg bg-gradient-to-r from-xelltekk-700 to-xelltekk-900 px-4 py-3 text-white shadow-sm sm:px-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-bold">Bonjour {{ userName }}</h2>
            <p class="mt-0.5 text-xs text-xelltekk-100">{{ dashboardIntro }}</p>
          </div>
          <div class="text-right text-xs sm:text-sm">
            <div class="font-mono">{{ today }}</div>
            <div class="mt-0.5 text-[11px] text-xelltekk-200">Saytu Liggéey 2.0</div>
          </div>
        </div>
      </div>

      <section v-if="annonces.length" class="rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm dark:border-blue-500/30 dark:bg-blue-950/30 sm:p-5">
        <div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="font-semibold text-blue-950 dark:text-blue-100">Annonces internes</h3>
            <p class="text-xs text-blue-700 dark:text-blue-200">Messages visibles par tous les utilisateurs.</p>
          </div>
          <span class="text-xs font-semibold uppercase text-blue-700 dark:text-blue-200">{{ annonces.length }} annonce(s)</span>
        </div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="annonce in annonces" :key="annonce.id" class="rounded-lg border border-blue-100 bg-white p-3 dark:border-blue-500/20 dark:bg-slate-900">
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ annonce.titre }}</h4>
            <p class="mt-1 text-sm text-gray-600 dark:text-slate-300">{{ annonce.contenu }}</p>
            <p class="mt-2 text-xs text-gray-400 dark:text-slate-500">{{ formatDateTime(annonce.publie_le) }} · {{ annonce.auteur?.name || 'RH' }}</p>
          </article>
        </div>
      </section>

      <div v-if="hasKpiCards" class="stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard v-if="isBusinessDashboard" :to="{ path: '/factures', query: { quick: 'ca_mois' } }" label="CA du mois" :value="formatPrice(kpi.ca_mois)" suffix="XOF" icon="CA" :icon-component="TrendingUp" color="green" />
        <KpiCard v-if="isBusinessDashboard" :to="{ path: '/factures', query: { quick: 'ca_annee' } }" label="CA de l'année" :value="formatPrice(kpi.ca_annee)" suffix="XOF" icon="An" :icon-component="CalendarDays" color="blue" />
        <KpiCard v-if="isBusinessDashboard" :to="{ path: '/factures', query: { quick: 'encours' } }" label="Encours total" :value="formatPrice(kpi.encours_total)" suffix="XOF" icon="EC" :icon-component="FileClock" color="orange" />
        <KpiCard v-if="isBusinessDashboard" :to="{ path: '/factures', query: { quick: 'impayees' } }" label="Factures impayees" :value="kpi.factures_impayees || 0" icon="FI" :icon-component="FileWarning" color="purple" :sub="`dont ${kpi.factures_en_retard || 0} en retard`" />

        <KpiCard v-if="isCommercial" to="/clients" label="Mes clients actifs" :value="kpi.clients_actifs || 0" icon="CL" :icon-component="UsersRound" color="green" />
        <KpiCard v-if="isCommercial" to="/devis" label="Mes devis en cours" :value="kpi.devis_en_cours || 0" icon="DV" :icon-component="FileText" color="blue" />

        <KpiCard v-if="isStockManager" to="/stock" label="Produits en stock" :value="kpi.produits_stockes || 0" icon="ST" :icon-component="Package" color="green" />
        <KpiCard v-if="isStockManager" to="/stock" label="Alertes stock" :value="kpi.stock_alertes || 0" icon="AL" :icon-component="TriangleAlert" color="orange" />
        <KpiCard v-if="isStockManager" to="/stock" label="Ruptures" :value="kpi.ruptures_stock || 0" icon="RP" :icon-component="TriangleAlert" color="purple" />
        <KpiCard v-if="isStockManager" to="/stock" label="Valeur stock" :value="formatPrice(kpi.valeur_stock)" suffix="XOF" icon="VS" :icon-component="Wallet" color="blue" />
      </div>

      <section v-else class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 class="font-semibold text-gray-900 dark:text-white">Tableau de bord</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Votre profil est bien connecte. Aucun indicateur specifique n'est encore configure pour ce role.
        </p>
      </section>

      <div v-if="isStockManager" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Produits en alerte</h3>
            <router-link to="/stock" class="text-xs text-xelltekk-600 hover:underline dark:text-cyan-300">Voir le stock</router-link>
          </div>
          <div v-if="stockAlertes.length" class="space-y-2">
            <router-link
              v-for="produit in stockAlertes"
              :key="produit.id"
              to="/stock"
              class="flex items-center justify-between gap-3 rounded-lg border border-orange-100 bg-orange-50 p-3 transition hover:bg-orange-100 dark:border-orange-500/30 dark:bg-orange-950/30 dark:hover:bg-orange-950/50"
            >
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ produit.libelle }}</div>
                <div class="text-xs text-gray-500 dark:text-slate-400">{{ produit.reference || 'Sans reference' }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm font-bold text-orange-700 dark:text-orange-300">{{ formatQty(produit.stock_total) }}</div>
                <div class="text-[10px] text-gray-500 dark:text-slate-400">seuil {{ produit.stock_alerte || 0 }}</div>
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-green-600 dark:text-green-300">
            Aucun produit en alerte.
          </div>
        </section>

        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Derniers mouvements de stock</h3>
            <router-link to="/stock" class="text-xs text-xelltekk-600 hover:underline dark:text-cyan-300">Voir tout</router-link>
          </div>
          <div v-if="derniersMouvementsStock.length" class="space-y-2">
            <router-link
              v-for="mouvement in derniersMouvementsStock"
              :key="mouvement.id"
              to="/stock"
              class="block rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ mouvement.produit?.libelle || 'Produit' }}</div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">
                    {{ mouvement.produit?.reference || 'Sans référence' }} - {{ mouvement.entrepot?.libelle || mouvement.entrepot?.code || 'Entrepôt' }}
                  </div>
                  <div class="mt-1 text-xs text-gray-500 dark:text-slate-400">{{ mouvement.motif || mouvement.type }}</div>
                </div>
                <div class="text-right">
                  <div class="font-mono text-sm font-bold" :class="mouvementTypeClass(mouvement.type)">
                    {{ mouvement.type }} {{ formatQty(mouvement.quantite) }}
                  </div>
                  <div class="text-[10px] text-gray-500 dark:text-slate-400">{{ formatDate(mouvement.date_mouvement) }}</div>
                </div>
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucun mouvement recent.
          </div>
        </section>
      </div>

      <section v-if="isBusinessDashboard" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white">Soldes de trésorerie</h3>
          <span class="text-xs text-gray-500 dark:text-slate-400">Temps réel</span>
        </div>
        <div v-if="soldesTresorerieComptes.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Solde total disponible"
            :value="formatPrice(soldesTresorerieTotal)"
            suffix="XOF"
            icon="TR"
            :icon-component="Wallet"
            color="blue"
            :sub="`${soldesTresorerieComptes.length} compte(s) actif(s)`"
            to="/tresorerie-comptes"
          />
          <KpiCard
            v-for="compte in soldesTresorerieComptes"
            :key="compte.id || compte.code"
            :label="compte.label"
            :value="formatPrice(compte.solde_actuel)"
            suffix="XOF"
            :icon="compte.icon"
            :icon-image="compte.iconImage"
            :icon-component="compte.iconComponent"
            :color="compte.color"
            :sub="compte.sub"
            to="/tresorerie-comptes"
          />
        </div>
        <div v-else class="flex min-h-52 items-center justify-center text-sm text-gray-400">
          Aucun compte de trésorerie actif
        </div>
      </section>

      <div v-if="isBusinessDashboard" class="grid grid-cols-1 gap-6">
        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Chiffre d'affaires mensuel</h3>
            <span class="text-xs text-gray-500 dark:text-slate-400">12 derniers mois</span>
          </div>
          <div class="h-64">
            <Line v-if="caChartData" :data="caChartData" :options="caChartOptions" />
          </div>
        </section>
      </div>

      <section v-if="isManagerDashboard" class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Avancement des commerciaux</h3>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Objectifs actifs et réalisations sur leur période en cours.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <router-link to="/prospection" class="btn-secondary px-3 py-1.5 text-xs">Voir le suivi</router-link>
            <button type="button" class="btn-primary px-3 py-1.5 text-xs" :disabled="commercialPdfLoading" @click="ouvrirEtatCommerciauxPdf">
              {{ commercialPdfLoading ? 'PDF...' : 'État PDF' }}
            </button>
          </div>
        </div>

        <div v-if="avancementCommerciaux.length" class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">Commercial</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">Score global</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">Prospects</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">Actions</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">Devis</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">CA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
              <tr v-for="ligne in avancementCommerciaux" :key="ligne.commercial?.id || ligne.commercial_id || ligne.id" class="hover:bg-gray-50 dark:hover:bg-slate-800">
                <td class="px-3 py-3">
                  <div class="font-medium text-gray-900 dark:text-white">{{ ligne.commercial?.name || 'Commercial' }}</div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">{{ formatDate(ligne.periode_debut) }} - {{ formatDate(ligne.periode_fin) }}</div>
                  <div v-if="!ligne.has_objectif" class="mt-1 text-[11px] font-medium text-orange-700 dark:text-orange-300">Aucun objectif actif</div>
                </td>
                <td class="px-3 py-3"><CommercialProgress :percent="ligne.score_global" score /></td>
                <td class="px-3 py-3"><CommercialProgress :value="ligne.realisation.prospects" :target="ligne.targets.prospects" :percent="ligne.percentages.prospects" /></td>
                <td class="px-3 py-3"><CommercialProgress :value="ligne.realisation.actions" :target="ligne.targets.actions" :percent="ligne.percentages.actions" /></td>
                <td class="px-3 py-3"><CommercialProgress :value="ligne.realisation.devis" :target="ligne.targets.devis" :percent="ligne.percentages.devis" /></td>
                <td class="px-3 py-3"><CommercialProgress :value="ligne.realisation.ca" :target="ligne.targets.ca" :percent="ligne.percentages.ca" money /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
          Aucun objectif commercial actif. Créez les objectifs depuis la rubrique Prospection.
        </div>
      </section>

      <div v-if="isBusinessDashboard" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Top 10 clients</h3>
            <span class="text-xs text-gray-500 dark:text-slate-400">Année en cours</span>
          </div>
          <div v-if="topClients.length" class="space-y-2">
            <router-link
              v-for="(client, index) in topClients"
              :key="client.id"
              :to="{ path: '/clients', query: { open: client.id } }"
              class="flex items-center gap-3 rounded p-2 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-xelltekk-400 dark:hover:bg-slate-800"
            >
              <div class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" :class="rangColor(index)">
                {{ index + 1 }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ client.nom }}</div>
                <div class="text-xs text-gray-500 dark:text-slate-400">{{ client.nb_factures }} facture(s) - {{ client.code }}</div>
              </div>
              <div class="whitespace-nowrap font-mono text-sm font-semibold text-xelltekk-700 dark:text-cyan-300">
                {{ formatPrice(client.ca_total) }}
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucune vente cette année
          </div>
        </section>

        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Factures en retard</h3>
            <router-link :to="{ path: '/factures', query: { quick: 'en_retard' } }" class="text-xs text-xelltekk-600 hover:underline dark:text-cyan-300">Voir tout</router-link>
          </div>
          <div v-if="facturesRetard.length" class="max-h-96 space-y-2 overflow-y-auto">
            <router-link
              v-for="facture in facturesRetard"
              :key="facture.id"
              :to="{ path: '/factures', query: { open: facture.id } }"
              class="block rounded-lg border border-red-100 bg-red-50 p-3 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 dark:border-red-500/30 dark:bg-red-950/30"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-semibold text-gray-700 dark:text-slate-200">{{ facture.numero }}</span>
                    <span class="badge bg-red-200 text-[10px] text-red-800">{{ facture.jours_retard }} j</span>
                  </div>
                  <div class="mt-1 truncate text-sm font-medium text-gray-900 dark:text-white">{{ facture.client?.nom || 'Client' }}</div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">Echu le {{ formatDate(facture.date_echeance) }}</div>
                </div>
                <div class="whitespace-nowrap text-right">
                  <div class="font-mono font-bold text-red-700 dark:text-red-300">{{ formatPrice(facture.reste_a_payer) }}</div>
                  <div class="text-[10px] text-gray-500 dark:text-slate-400">XOF</div>
                </div>
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-green-600 dark:text-green-300">
            Aucune facture en retard.
          </div>
        </section>
      </div>

      <div v-if="!isStockManager" class="grid grid-cols-1 gap-6" :class="isBusinessDashboard ? 'lg:grid-cols-2' : ''">
        <section v-if="isBusinessDashboard" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Derniers paiements</h3>
            <router-link to="/paiements" class="text-xs text-xelltekk-600 hover:underline dark:text-cyan-300">Voir tout</router-link>
          </div>
          <div v-if="derniersPaiements.length" class="space-y-2">
            <router-link
              v-for="paiement in derniersPaiements"
              :key="paiement.id"
              to="/paiements"
              class="flex items-center gap-3 rounded p-2 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-xelltekk-400 dark:hover:bg-slate-800"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ paiement.client?.nom || 'Client' }}</div>
                <div class="text-xs text-gray-500 dark:text-slate-400">{{ formatDate(paiement.date_paiement) }} - {{ paiement.reference }}</div>
              </div>
              <div class="whitespace-nowrap font-mono font-bold text-green-700 dark:text-green-300">
                +{{ formatPrice(paiement.montant) }}
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucun paiement recent
          </div>
        </section>

        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Devis en attente</h3>
            <router-link :to="{ path: '/devis', query: { statut: 'envoye' } }" class="text-xs text-xelltekk-600 hover:underline dark:text-cyan-300">Voir tout</router-link>
          </div>
          <div v-if="devisEnAttente.length" class="space-y-2">
            <router-link
              v-for="devis in devisEnAttente"
              :key="devis.id"
              :to="{ path: '/devis', query: { open: devis.id } }"
              class="block rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-xelltekk-400 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-semibold text-gray-700 dark:text-slate-200">{{ devis.numero }}</span>
                    <span class="badge text-[10px]" :class="devis.statut === 'brouillon' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-800'">
                      {{ devis.statut }}
                    </span>
                  </div>
                  <div class="mt-1 truncate text-sm font-medium text-gray-900 dark:text-white">{{ devis.client?.nom || 'Client' }}</div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">Validité : {{ formatDate(devis.date_validite) }}</div>
                </div>
                <div class="whitespace-nowrap text-right">
                  <div class="font-mono font-bold text-gray-900 dark:text-white">{{ formatPrice(devis.total_ttc) }}</div>
                  <div class="text-[10px] text-gray-500 dark:text-slate-400">XOF</div>
                </div>
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucun devis en attente
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, resolveComponent } from 'vue'
import { Line } from 'vue-chartjs'
import {
  ArrowRightLeft,
  Banknote,
  CalendarDays,
  CreditCard,
  FileClock,
  FileText,
  FileWarning,
  Landmark,
  Package,
  TriangleAlert,
  TrendingUp,
  UsersRound,
  Wallet,
} from 'lucide-vue-next'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const dashboardScope = ref('business')
const kpi = ref({})
const annonces = ref([])
const caChartData = ref(null)
const soldesTresorerie = ref({ total: 0, comptes: [] })
const topClients = ref([])
const facturesRetard = ref([])
const derniersPaiements = ref([])
const devisEnAttente = ref([])
const stockAlertes = ref([])
const derniersMouvementsStock = ref([])
const avancementCommerciaux = ref([])
const commercialPdfLoading = ref(false)

const userName = computed(() => auth.user?.name?.split(' ')[0] || 'Utilisateur')
const userRole = computed(() => String(auth.user?.role || '').toLowerCase())
const isCommercial = computed(() => dashboardScope.value === 'commercial' || userRole.value.includes('commercial'))
const isStockManager = computed(() => dashboardScope.value === 'stock' || userRole.value === 'magasinier' || userRole.value.includes('stock'))
const isManagerDashboard = computed(() => ['admin', 'gerant'].includes(userRole.value))
const isBusinessDashboard = computed(() => dashboardScope.value === 'business' && !isCommercial.value && !isStockManager.value)
const hasKpiCards = computed(() => isBusinessDashboard.value || isCommercial.value || isStockManager.value)
const dashboardIntro = computed(() => {
  if (isStockManager.value) return 'Voici les informations de stock qui vous concernent.'
  if (isCommercial.value) return 'Voici votre activit commerciale.'
  return "Voici votre vue d'ensemble pour aujourd'hui."
})

const today = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
})

const soldesTresorerieComptes = computed(() => {
  const comptes = Array.isArray(soldesTresorerie.value.comptes) ? soldesTresorerie.value.comptes : []

  return comptes.map((compte, index) => {
    const solde = Number(compte.solde_actuel ?? compte.solde_initial ?? 0)

    return {
      ...compte,
      solde_actuel: solde,
      label: tresorerieCompteLabel(compte),
      icon: modePaiementIcon(compte.mode_paiement || compte.type || compte.libelle),
      iconImage: modePaiementIconImage([compte.mode_paiement, compte.type, compte.libelle].filter(Boolean).join(' ')),
      iconComponent: modePaiementIconComponent([compte.mode_paiement, compte.type, compte.libelle].filter(Boolean).join(' ')),
      color: modePaiementColor(compte.mode_paiement || compte.type || compte.libelle, index),
      sub: tresorerieCompteSub(compte),
    }
  })
})

const soldesTresorerieTotal = computed(() => {
  const total = Number(soldesTresorerie.value.total)
  return Number.isFinite(total)
    ? total
    : soldesTresorerieComptes.value.reduce((sum, compte) => sum + Number(compte.solde_actuel || 0), 0)
})

const KpiCard = {
  props: ['label', 'value', 'suffix', 'icon', 'iconImage', 'iconComponent', 'color', 'sub', 'to'],
  setup(props) {
    const RouterLink = resolveComponent('RouterLink')
    const bgClass = {
      green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-500/30',
      blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-500/30',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-500/30',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-500/30',
      red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-500/30',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-500/30',
      slate: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    }[props.color] || 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'

    const children = () => [
        h('div', { class: 'mb-1 flex items-center justify-between' }, [
          h('span', { class: 'text-xs font-semibold uppercase opacity-75' }, props.label),
          props.iconImage
            ? h('img', { src: props.iconImage, alt: props.label, class: 'h-7 w-7 rounded-full bg-white object-contain p-1 shadow-sm ring-1 ring-black/5' })
            : props.iconComponent
              ? h(props.iconComponent, { class: 'h-6 w-6 opacity-80', strokeWidth: 2.2, 'aria-hidden': 'true' })
              : h('span', { class: 'text-sm font-bold opacity-80' }, props.icon),
        ]),
        h('div', { class: 'flex items-baseline gap-1' }, [
          h('span', { class: 'text-xl font-bold' }, props.value),
          props.suffix ? h('span', { class: 'text-xs opacity-75' }, props.suffix) : null,
        ]),
        props.sub ? h('div', { class: 'mt-0.5 text-xs opacity-75' }, props.sub) : null,
      ]

    return () => h(
      props.to ? RouterLink : 'div',
      {
        ...(props.to ? { to: props.to } : {}),
        class: `block rounded-lg border p-3 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-xelltekk-400 ${bgClass}`,
      },
      props.to ? { default: children } : children()
    )
  },
}

const CommercialProgress = {
  props: ['value', 'target', 'percent', 'money', 'score'],
  setup(props) {
    return () => {
      const percent = props.percent === null || props.percent === undefined ? null : Number(props.percent)
      const width = Math.min(Math.max(percent || 0, 2), 100)
      const color = progressColor(percent)
      const value = props.score ?
         `${Math.round(percent || 0)}%`
        : `${props.money ? formatPrice(props.value) : formatQty(props.value)} / ${props.money ? formatPrice(props.target) : formatQty(props.target)}`

      return h('div', { class: 'min-w-28' }, [
        h('div', { class: 'mb-1 flex items-center justify-between gap-2 text-xs' }, [
          h('span', { class: 'font-semibold text-gray-800 dark:text-slate-100' }, value),
          props.score ? null : h('span', { class: color.text }, percent === null ? '-' : `${percent}%`),
        ]),
        h('div', { class: 'h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700' }, [
          h('div', { class: `h-full rounded-full ${color.bar}`, style: { width: `${width}%` } }),
        ]),
      ])
    }
  },
}

const caChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => 'CA : ' + new Intl.NumberFormat('fr-FR').format(ctx.parsed.y) + ' XOF',
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value),
      },
    },
  },
}


async function loadDashboard() {
  loading.value = true
  try {
    const { data } = await api.get('/dashboard')

    dashboardScope.value = data.scope || (userRole.value.includes('commercial') ? 'commercial' : (userRole.value.includes('stock') || userRole.value === 'magasinier' ? 'stock' : 'business'))
    kpi.value = data.kpi || {}
    stockAlertes.value = data.stock_alertes || []
    derniersMouvementsStock.value = data.derniers_mouvements_stock || []
    avancementCommerciaux.value = data.avancement_commerciaux || []
    annonces.value = Array.isArray(data.annonces) ? data.annonces : []

    if (data.ca_mensuel) {
      caChartData.value = {
        labels: data.ca_mensuel.labels,
        datasets: [{
          label: 'CA',
          data: data.ca_mensuel.data,
          borderColor: '#1e40af',
          backgroundColor: 'rgba(30, 64, 175, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#1e40af',
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      }
    }

    soldesTresorerie.value = normalizeSoldesTresorerie(data.soldes_tresorerie)

    topClients.value = data.top_clients || []
    facturesRetard.value = data.factures_retard || []
    derniersPaiements.value = data.derniers_paiements || []
    devisEnAttente.value = data.devis_en_attente || []
  } catch (e) {
    toast.error('Erreur de chargement du dashboard')
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function ouvrirEtatCommerciauxPdf() {
  commercialPdfLoading.value = true
  try {
    await ouvrirPDF('/prospection/etat-commerciaux/pdf', 'Etat-avancement-commerciaux.pdf')
  } catch (e) {
    toast.error('Impossible de générer le PDF des commerciaux.')
  } finally {
    commercialPdfLoading.value = false
  }
}

function normalizeSoldesTresorerie(payload) {
  const comptes = Array.isArray(payload?.comptes) ? payload.comptes : []
  const total = Number(payload?.total)

  return {
    total: Number.isFinite(total)
      ? total
      : comptes.reduce((sum, compte) => sum + Number(compte.solde_actuel ?? compte.solde_initial ?? 0), 0),
    comptes,
  }
}

function tresorerieCompteLabel(compte) {
  const fallback = modePaiementLabel(compte.mode_paiement || compte.type)
  const label = String(compte.libelle || fallback || '')
  return label.replace(/free\s*money/gi, 'YAS') || fallback || 'Compte'
}
function tresorerieCompteSub(compte) {
  return [
    modePaiementLabel(compte.mode_paiement || compte.type),
    compte.code,
    compte.is_default ? 'Par défaut' : null,
  ].filter(Boolean).join(' · ')
}

function modePaiementLabel(value) {
  const slug = modePaiementSlug(value)
  const labels = {
    especes: 'Caisse espèces',
    caisse: 'Caisse',
    wave: 'Wave',
    virement: 'Virement / Banque',
    banque: 'Banque',
    orange_money: 'Orange Money',
    orange: 'Orange Money',
    om: 'Orange Money',
    compensation: 'Compensation',
    cheque: 'Chèque',
    carte: 'Carte bancaire',
    carte_bancaire: 'Carte bancaire',
    free_money: 'YAS',
    yas: 'YAS',
    mobile_money: 'Mobile Money',
    autre: 'Autre compte',
  }

  return labels[slug] || String(value || '').replace(/_/g, ' ')
}

function modePaiementSlug(label) {
  return String(label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function modePaiementIcon(label) {
  const slug = modePaiementSlug(label)
  const map = {
    especes: 'ES',
    wave: 'WV',
    virement: 'VR',
    orange_money: 'OM',
    compensation: 'CP',
    cheque: 'CH',
    carte: 'CB',
    carte_bancaire: 'CB',
    free_money: 'YAS',
    yas: 'YAS',
    mobile_money: 'MM',
  }

  if (map[slug]) return map[slug]
  return slug.split('_').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'MP'
}

function modePaiementIconImage(label) {
  const slug = modePaiementSlug(label)
  if (slug.includes('wave')) return '/images/payment/wave.png'
  if (slug.includes('orange_money') || slug === 'om' || slug.includes('orange')) return '/images/payment/orange-money.png'
  if (slug.includes('free_money') || slug.includes('yas')) return '/images/payment/yas.svg'
  return null
}
function modePaiementIconComponent(label) {
  const slug = modePaiementSlug(label)
  if (slug.includes('wave') || slug.includes('orange') || slug.includes('free_money') || slug.includes('yas')) return null
  if (slug.includes('banque') || slug.includes('bank')) return Landmark
  if (slug.includes('caisse') || slug.includes('especes')) return Banknote
  if (slug.includes('virement') || slug.includes('compensation')) return ArrowRightLeft
  if (slug.includes('cheque')) return FileText
  if (slug.includes('carte')) return CreditCard
  return Wallet
}
function modePaiementColor(label, index) {
  const slug = modePaiementSlug(label)
  const map = {
    especes: 'blue',
    wave: 'green',
    virement: 'orange',
    orange_money: 'red',
    compensation: 'purple',
    cheque: 'slate',
    carte: 'cyan',
    carte_bancaire: 'cyan',
    free_money: 'purple',
    yas: 'purple',
    mobile_money: 'green',
  }
  const fallback = ['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'slate']

  return map[slug] || fallback[index % fallback.length]
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value || 0))
}

function formatQty(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function rangColor(index) {
  return {
    0: 'bg-yellow-400 text-yellow-950',
    1: 'bg-gray-300 text-gray-800',
    2: 'bg-orange-400 text-orange-950',
  }[index] || 'bg-gray-100 text-gray-600'
}

function mouvementTypeClass(type) {
  return {
    entree: 'text-green-700 dark:text-green-300',
    sortie: 'text-red-700 dark:text-red-300',
    ajustement: 'text-blue-700 dark:text-blue-300',
  }[type] || 'text-gray-800 dark:text-slate-200'
}

function progressColor(percent) {
  if (percent === null || percent === undefined) return { bar: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-300' }
  if (percent >= 100) return { bar: 'bg-green-500', text: 'text-green-700 dark:text-green-300' }
  if (percent >= 70) return { bar: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' }
  if (percent >= 40) return { bar: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' }
  return { bar: 'bg-red-500', text: 'text-red-700 dark:text-red-300' }
}

onMounted(() => loadDashboard())
</script>
