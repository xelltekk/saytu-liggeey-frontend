<template>
  <div>
    <!-- Loader initial -->
    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">
      Chargement du tableau de bord...
    </div>

    <div v-else class="space-y-6">
      <!-- Bandeau de bienvenue -->
      <div class="bg-gradient-to-r from-xelltekk-700 to-xelltekk-900 rounded-lg p-5 text-white shadow-sm">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-xl font-bold">Bonjour {{ userName }} 👋</h2>
            <p class="text-sm text-xelltekk-100 mt-1">Voici votre vue d'ensemble pour aujourd'hui</p>
          </div>
          <div class="text-right text-sm">
            <div class="font-mono">{{ today }}</div>
            <div class="text-xs text-xelltekk-200 mt-1">Saytu Liggéey 2.0</div>
          </div>
        </div>
      </div>

      <!-- KPI principaux -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard to="/factures" label="CA du mois" :value="formatPrice(kpi.ca_mois)" suffix="XOF" icon="📈" color="green" />
        <KpiCard to="/factures" label="CA de l'année" :value="formatPrice(kpi.ca_annee)" suffix="XOF" icon="💰" color="blue" />
        <KpiCard to="/paiements" label="Encours total" :value="formatPrice(kpi.encours_total)" suffix="XOF" icon="🏦" color="orange" />
        <KpiCard to="/factures" label="Factures impayées" :value="kpi.factures_impayees" icon="🧾" color="purple" :sub="`dont ${kpi.factures_en_retard} en retard`" />
      </div>

      <!-- 2 colonnes : CA mensuel + Modes de paiement -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- CA mensuel (2/3) -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">📊 Chiffre d'affaires mensuel</h3>
            <span class="text-xs text-gray-500">12 derniers mois</span>
          </div>
          <div class="h-64">
            <Line v-if="caChartData" :data="caChartData" :options="caChartOptions" />
          </div>
        </div>

        <!-- Modes de paiement (1/3) -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">🥧 Modes de paiement</h3>
            <span class="text-xs text-gray-500">Année</span>
          </div>
          <div v-if="modesChartData && modesChartData.labels.length" class="h-64 flex items-center justify-center">
            <Doughnut :data="modesChartData" :options="modesChartOptions" />
          </div>
          <div v-else class="h-64 flex items-center justify-center text-gray-400 text-sm">
            Aucun paiement cette année
          </div>
        </div>
      </div>

      <!-- 2 colonnes : Top clients + Factures en retard -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top clients -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">🏆 Top 10 clients</h3>
            <span class="text-xs text-gray-500">Année en cours</span>
          </div>
          <div v-if="topClients.length" class="space-y-2">
            <router-link v-for="(c, i) in topClients" :key="c.id" to="/clients"
                 class="flex items-center gap-3 p-2 rounded transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-xelltekk-400">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                   :class="i < 3 ? rangColor(i) : 'bg-gray-100 text-gray-600'">
                {{ i + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm text-gray-900 truncate">{{ c.nom }}</div>
                <div class="text-xs text-gray-500">{{ c.nb_factures }} facture(s) — {{ c.code }}</div>
              </div>
              <div class="font-mono font-semibold text-sm text-xelltekk-700 whitespace-nowrap">
                {{ formatPrice(c.ca_total) }}
              </div>
            </router-link>
          </div>
          <div v-else class="text-center text-gray-400 text-sm py-8">
            Aucune vente cette année
          </div>
        </div>

        <!-- Factures en retard -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">⚠️ Factures en retard</h3>
            <router-link to="/factures" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
          </div>
          <div v-if="facturesRetard.length" class="space-y-2 max-h-96 overflow-y-auto">
            <router-link v-for="f in facturesRetard" :key="f.id" to="/factures"
                 class="block p-3 border border-red-100 rounded-lg bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-semibold text-gray-700">{{ f.numero }}</span>
                    <span class="badge bg-red-200 text-red-800 text-[10px]">{{ f.jours_retard }} j</span>
                  </div>
                  <div class="text-sm font-medium text-gray-900 mt-1 truncate">{{ f.client?.nom }}</div>
                  <div class="text-xs text-gray-500">
                    Échu le {{ formatDate(f.date_echeance) }}
                    <span v-if="f.client?.telephone">• 📞 {{ f.client.telephone }}</span>
                  </div>
                </div>
                <div class="text-right whitespace-nowrap">
                  <div class="font-mono font-bold text-red-700">{{ formatPrice(f.reste_a_payer) }}</div>
                  <div class="text-[10px] text-gray-500">XOF</div>
                </div>
              </div>
            </router-link>
          </div>
          <div v-else class="text-center text-green-600 text-sm py-8">
            ✅ Aucune facture en retard !
          </div>
        </div>
      </div>

      <!-- 2 colonnes : Derniers paiements + Devis en attente -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Derniers paiements -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">💰 Derniers paiements</h3>
            <router-link to="/paiements" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
          </div>
          <div v-if="derniersPaiements.length" class="space-y-2">
            <router-link v-for="p in derniersPaiements" :key="p.id" to="/paiements"
                 class="flex items-center gap-3 p-2 rounded transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-xelltekk-400">
              <div class="text-2xl">{{ modeIcon(p.mode_paiement) }}</div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm text-gray-900 truncate">{{ p.client?.nom }}</div>
                <div class="text-xs text-gray-500">
                  {{ formatDate(p.date_paiement) }} — {{ p.reference }}
                </div>
              </div>
              <div class="font-mono font-bold text-green-700 whitespace-nowrap">
                +{{ formatPrice(p.montant) }}
              </div>
            </router-link>
          </div>
          <div v-else class="text-center text-gray-400 text-sm py-8">
            Aucun paiement récent
          </div>
        </div>

        <!-- Devis en attente -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">📋 Devis en attente</h3>
            <router-link to="/devis" class="text-xs text-xelltekk-600 hover:underline">Voir tout →</router-link>
          </div>
          <div v-if="devisEnAttente.length" class="space-y-2">
            <router-link v-for="d in devisEnAttente" :key="d.id" to="/devis"
                 class="block p-3 border border-gray-200 rounded-lg transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-xelltekk-400">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-semibold text-gray-700">{{ d.numero }}</span>
                    <span class="badge text-[10px]" :class="d.statut === 'brouillon' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-800'">
                      {{ d.statut }}
                    </span>
                  </div>
                  <div class="text-sm font-medium text-gray-900 mt-1 truncate">{{ d.client?.nom }}</div>
                  <div class="text-xs text-gray-500">Validité : {{ formatDate(d.date_validite) }}</div>
                </div>
                <div class="text-right whitespace-nowrap">
                  <div class="font-mono font-bold text-gray-900">{{ formatPrice(d.total_ttc) }}</div>
                  <div class="text-[10px] text-gray-500">XOF</div>
                </div>
              </div>
            </router-link>
          </div>
          <div v-else class="text-center text-gray-400 text-sm py-8">
            Aucun devis en attente
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, resolveComponent } from 'vue'
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend, ArcElement,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const kpi = ref({})
const caChartData = ref(null)
const modesChartData = ref(null)
const topClients = ref([])
const facturesRetard = ref([])
const derniersPaiements = ref([])
const devisEnAttente = ref([])

const userName = computed(() => auth.user?.name?.split(' ')[0] || 'Utilisateur')

const today = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
})

// Carte KPI inline (composant léger)
const KpiCard = {
  props: ['label', 'value', 'suffix', 'icon', 'color', 'sub', 'to'],
  setup(props) {
    const RouterLink = resolveComponent('RouterLink')
    const bgClass = {
      green: 'bg-green-50 text-green-700 border-green-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
    }[props.color] || 'bg-gray-50 text-gray-700 border-gray-200'

    return () => h(
      props.to ? RouterLink : 'div',
      {
        to: props.to,
        class: `block rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-xelltekk-400 ${bgClass}`,
      },
      [
      h('div', { class: 'flex items-center justify-between mb-2' }, [
        h('span', { class: 'text-xs uppercase font-semibold opacity-75' }, props.label),
        h('span', { class: 'text-2xl' }, props.icon),
      ]),
      h('div', { class: 'flex items-baseline gap-1' }, [
        h('span', { class: 'text-2xl font-bold' }, props.value),
        props.suffix ? h('span', { class: 'text-xs opacity-75' }, props.suffix) : null,
      ]),
      props.sub ? h('div', { class: 'text-xs opacity-75 mt-1' }, props.sub) : null,
      ]
    )
  },
}

// Options Chart.js
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
        callback: (v) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(v),
      },
    },
  },
}

const modesChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.label}: ${new Intl.NumberFormat('fr-FR').format(ctx.parsed)} XOF`,
      },
    },
  },
}

const couleurs = [
  '#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#6366f1', '#f97316', '#84cc16',
]

async function loadDashboard() {
  loading.value = true
  try {
    const { data } = await api.get('/dashboard')

    kpi.value = data.kpi || {}

    // CA mensuel (line chart)
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

    // Modes de paiement (donut)
    if (data.modes_paiement && data.modes_paiement.labels.length) {
      modesChartData.value = {
        labels: data.modes_paiement.labels,
        datasets: [{
          data: data.modes_paiement.data,
          backgroundColor: couleurs,
          borderWidth: 2,
          borderColor: '#fff',
        }],
      }
    }

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

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
}

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rangColor(i) {
  return {
    0: 'bg-yellow-400 text-white',
    1: 'bg-gray-300 text-white',
    2: 'bg-orange-400 text-white',
  }[i] || 'bg-gray-100'
}

function modeIcon(m) {
  return {
    virement: '🏦', cheque: '📑', especes: '💵', carte_bancaire: '💳',
    wave: '🌊', orange_money: '🟠', free_money: '⚪', mobile_money: '📱',
    compensation: '🔄', autre: '💸',
  }[m] || '💰'
}

onMounted(() => loadDashboard())
</script>
