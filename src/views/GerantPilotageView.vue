<template>
  <div class="gerant-page space-y-6">
    <section class="gerant-hero rounded-[2rem] border p-5 text-white shadow-sm sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">
            <Sparkles class="h-4 w-4" />
            Pilotage gérant
          </div>
          <h1 class="text-2xl font-black tracking-tight sm:text-3xl">Vue de contrôle opérationnelle</h1>
          <p class="mt-2 max-w-3xl text-sm text-white/85">
            Les 10 blocs utiles au gérant : chiffre d’affaires, validations, alertes, équipe, trésorerie, marges,
            journal, objectifs et vision propriétaire.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <select v-model="period" class="rounded-2xl border border-white/25 bg-white/95 px-4 py-3 text-sm font-black text-sky-900 shadow-sm">
            <option value="today">Aujourd’hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/25 disabled:opacity-60"
            :disabled="loading"
            @click="loadPilotage"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
            Actualiser
          </button>
          <button type="button" class="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/25" @click="downloadExport('csv')">
            Export CSV
          </button>
          <button type="button" class="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/25" @click="downloadExport('pdf')">
            Export PDF
          </button>
        </div>
      </div>

      <p v-if="generatedAt" class="mt-4 text-xs font-medium text-white/75">
        Période : {{ payload?.periode?.label || 'Ce mois' }} · {{ payload?.periode?.start }} → {{ payload?.periode?.end }} · Dernière mise à jour : {{ formatDateTime(generatedAt) }}
      </p>
    </section>

    <div v-if="error" class="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {{ error }}
    </div>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 max-sm:flex max-sm:overflow-x-auto max-sm:pb-1">
      <a
        v-for="item in quickNav"
        :key="item.key"
        :href="`#${item.key}`"
        class="rounded-3xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm font-black text-sky-800 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white max-sm:min-w-40"
      >
        <span class="block text-[11px] uppercase tracking-[0.18em] text-cyan-600">{{ item.index }}</span>
        {{ item.label }}
      </a>
    </section>

    <section v-if="loading && !hasData" class="grid gap-4 xl:grid-cols-4">
      <div v-for="i in 8" :key="i" class="h-32 animate-pulse rounded-3xl border border-cyan-100 bg-cyan-50/60"></div>
    </section>

    <section v-else id="dashboard" class="space-y-4">
      <SectionHeader title="1. Tableau de bord gérant" subtitle="Les chiffres qui permettent de savoir vite si la journée est saine." />
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="kpi in sec('dashboard').kpis || []"
          :key="kpi.label"
          class="gerant-card rounded-3xl border p-4 shadow-sm"
        >
          <p class="text-xs font-black uppercase tracking-[0.18em] text-sky-700">{{ kpi.label }}</p>
          <p class="mt-3 text-2xl font-black text-slate-950">{{ metricValue(kpi) }}</p>
        </article>
      </div>
    </section>

    <section id="validations" class="space-y-4">
      <SectionHeader title="2. Centre de validation" subtitle="Ce que le gérant doit approuver ou contrôler avant que ça avance." />
      <div class="grid gap-4 xl:grid-cols-5">
        <article
          v-for="group in sec('validations').groups || []"
          :key="group.label"
          class="gerant-card rounded-3xl border p-4 shadow-sm"
        >
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-black text-slate-950">{{ group.label }}</h3>
            <span class="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">{{ group.count }}</span>
          </div>
          <div class="mt-3 space-y-2">
            <RouterLink
              v-for="item in group.items || []"
              :key="`${group.label}-${item.reference}-${item.label}`"
              :to="item.route"
              class="block rounded-2xl border border-cyan-100 bg-white/75 p-3 text-sm transition hover:border-cyan-300"
            >
              <span class="block font-black text-sky-950">{{ item.reference || item.type }}</span>
              <span class="mt-1 block truncate text-xs text-slate-600">{{ item.label || item.user || 'À vérifier' }}</span>
              <span v-if="Number(item.amount) > 0" class="mt-1 block text-xs font-bold text-cyan-700">{{ formatAmount(item.amount) }}</span>
              <span class="mt-2 inline-flex rounded-full bg-cyan-600 px-3 py-1 text-[11px] font-black text-white">Traiter</span>
            </RouterLink>
            <p v-if="!(group.items || []).length" class="rounded-2xl border border-dashed border-cyan-200 p-3 text-xs font-semibold text-slate-500">
              Rien à traiter.
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="grid gap-5 xl:grid-cols-2">
      <article id="autorisations" class="space-y-4">
        <SectionHeader title="3. Autorisations rapides" subtitle="Remises, annulations, remboursements et sorties de caisse à surveiller." />
        <div class="grid gap-3 sm:grid-cols-2">
          <RouterLink
            v-for="card in sec('autorisations').cards || []"
            :key="card.label"
            :to="card.route"
            class="gerant-card rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5"
          >
            <p class="text-xs font-black uppercase tracking-[0.18em] text-sky-700">{{ card.label }}</p>
            <p class="mt-3 text-2xl font-black text-slate-950">{{ formatNumber(card.value) }}</p>
          </RouterLink>
        </div>
      </article>

      <article id="alertes" class="space-y-4">
        <SectionHeader title="5. Alertes gérant" subtitle="Les anomalies à repérer avant qu’elles deviennent un problème." />
        <div class="gerant-card max-h-[28rem] overflow-y-auto rounded-3xl border p-4 shadow-sm">
          <div v-for="group in sec('alertes').groups || []" :key="group.label" class="mb-4 last:mb-0">
            <h3 class="mb-2 text-sm font-black text-sky-950">{{ group.label }}</h3>
            <RouterLink
              v-for="item in group.items || []"
              :key="`${group.label}-${item.label}-${item.detail}`"
              :to="item.route"
              class="mb-2 block rounded-2xl border border-cyan-100 bg-white/75 p-3 text-sm transition hover:border-cyan-300"
            >
              <span class="font-black text-slate-950">{{ item.label }}</span>
              <span class="mt-1 block text-xs text-slate-600">{{ item.detail }}</span>
              <span class="mt-2 inline-flex rounded-full bg-cyan-600 px-3 py-1 text-[11px] font-black text-white">Traiter</span>
            </RouterLink>
            <p v-if="!(group.items || []).length" class="rounded-2xl border border-dashed border-cyan-200 p-3 text-xs font-semibold text-slate-500">
              Aucune alerte.
            </p>
          </div>
        </div>
      </article>
    </section>

    <section id="performance_equipe" class="space-y-4">
      <SectionHeader title="4. Rapport performance équipe" subtitle="Suivi rapide des commerciaux et caissiers sur la période sélectionnée." />
      <div class="grid gap-4 xl:grid-cols-2">
        <SimpleTable title="Commerciaux" :rows="sec('performance_equipe').commerciaux || []" :columns="commercialColumns" />
        <SimpleTable title="Caissiers" :rows="sec('performance_equipe').caissiers || []" :columns="cashierColumns" />
      </div>
    </section>

    <section id="tresorerie" class="space-y-4">
      <SectionHeader title="6. Vue trésorerie simplifiée" subtitle="Ce qui est disponible, à recevoir et à payer." />
      <div class="grid gap-4 xl:grid-cols-[1.1fr_2fr]">
        <article class="gerant-card rounded-3xl border p-5 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Total disponible</p>
          <p class="mt-3 text-3xl font-black text-slate-950">{{ formatAmount(sec('tresorerie').total_disponible) }}</p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InfoLine label="Clients à recevoir" :value="formatAmount(sec('tresorerie').clients_a_recevoir)" />
            <InfoLine label="Fournisseurs à payer" :value="formatAmount(sec('tresorerie').fournisseurs_a_payer)" />
            <InfoLine label="Caisse ouverte théorique" :value="formatAmount(sec('tresorerie').caisse_theorique_ouverte)" />
          </div>
        </article>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="compte in sec('tresorerie').comptes || []" :key="compte.id" class="gerant-card rounded-3xl border p-4 shadow-sm">
            <p class="font-black text-slate-950">{{ compte.label }}</p>
            <p class="mt-1 text-xs font-semibold text-slate-500">{{ compte.type }} · {{ compte.mode || 'Mode libre' }}</p>
            <p class="mt-3 text-xl font-black text-cyan-700">{{ formatAmount(compte.solde) }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="marges" class="space-y-4">
      <SectionHeader title="7. Contrôle prix / marges" subtitle="Produits à faible marge ou à surveiller." />
      <article class="gerant-card overflow-hidden rounded-3xl border shadow-sm">
        <div class="grid gap-3 border-b border-cyan-100 bg-cyan-50/70 p-4 sm:grid-cols-3">
          <InfoLine label="CA HT" :value="formatAmount(sec('marges').summary?.ca_ht)" />
          <InfoLine label="Marge" :value="formatAmount(sec('marges').summary?.marge)" />
          <InfoLine label="Marge %" :value="percent(sec('marges').summary?.marge_pct)" />
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-cyan-50 text-xs uppercase tracking-[0.16em] text-sky-800">
              <tr>
                <th class="px-4 py-3">Produit</th>
                <th class="px-4 py-3">CA HT</th>
                <th class="px-4 py-3">Marge</th>
                <th class="px-4 py-3">Marge %</th>
                <th class="px-4 py-3">Remise moy.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-cyan-100 bg-white/70">
              <tr v-for="item in sec('marges').items || []" :key="`${item.reference}-${item.libelle}`">
                <td class="px-4 py-3 font-bold text-slate-950">{{ item.reference }} · {{ item.libelle }}</td>
                <td class="px-4 py-3">{{ formatAmount(item.ca_ht) }}</td>
                <td class="px-4 py-3" :class="item.alert ? 'font-black text-red-600' : 'font-bold text-cyan-700'">{{ formatAmount(item.marge) }}</td>
                <td class="px-4 py-3">{{ percent(item.marge_pct) }}</td>
                <td class="px-4 py-3">{{ percent(item.remise_moyenne) }}</td>
              </tr>
              <tr v-if="!(sec('marges').items || []).length">
                <td colspan="5" class="px-4 py-8 text-center text-sm font-semibold text-slate-500">Aucune ligne de marge sur la période.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section id="journal" class="space-y-4">
      <SectionHeader title="8. Journal de contrôle gérant" subtitle="Dernières actions métier importantes." />
      <article class="gerant-card rounded-3xl border p-4 shadow-sm">
        <div class="grid gap-2">
          <RouterLink
            v-for="item in sec('journal').items || []"
            :key="`${item.date}-${item.title}-${item.reference}`"
            :to="item.route || '/activites'"
            class="grid gap-2 rounded-2xl border border-cyan-100 bg-white/75 p-3 text-sm transition hover:border-cyan-300 md:grid-cols-[11rem_1fr_12rem]"
          >
            <span class="text-xs font-bold text-slate-500">{{ formatDateTime(item.date) }}</span>
            <span>
              <span class="block font-black text-slate-950">{{ item.title }}</span>
              <span class="block text-xs text-slate-500">{{ item.module }} · {{ item.user }}</span>
            </span>
            <span class="text-xs font-bold text-cyan-700">{{ item.reference || '' }}</span>
          </RouterLink>
        </div>
      </article>
    </section>

    <section id="objectifs" class="space-y-4">
      <SectionHeader title="9. Objectifs commerciaux" subtitle="Comparaison objectif/réalisé pour chaque commercial." />
      <div class="grid gap-4 xl:grid-cols-2">
        <article v-for="objectif in sec('objectifs').items || []" :key="`${objectif.commercial}-${objectif.periode}`" class="gerant-card rounded-3xl border p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="font-black text-slate-950">{{ objectif.commercial }}</h3>
              <p class="text-xs font-semibold text-slate-500">{{ objectif.periode }}</p>
            </div>
            <span class="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">{{ percent(objectif.progress) }}</span>
          </div>
          <div class="mt-4 space-y-3">
            <div v-for="metric in objectif.metrics" :key="metric.label">
              <div class="mb-1 flex justify-between text-xs font-bold text-slate-600">
                <span>{{ metric.label }}</span>
                <span>{{ metric.realise }} / {{ metric.objectif }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-cyan-100">
                <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" :style="{ width: `${Math.min(metric.progress || 0, 100)}%` }"></div>
              </div>
            </div>
          </div>
        </article>
        <p v-if="!(sec('objectifs').items || []).length" class="gerant-card rounded-3xl border p-6 text-sm font-semibold text-slate-500">
          Aucun objectif actif sur la période.
        </p>
      </div>
    </section>

    <section id="proprietaire" class="space-y-4">
      <SectionHeader title="10. Mode vue propriétaire" subtitle="Vision synthétique de la société et accès rapides." />
      <article class="gerant-card rounded-3xl border p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 class="text-xl font-black text-slate-950">{{ sec('proprietaire').societe?.nom || 'Société' }}</h3>
            <p class="mt-1 text-sm font-semibold text-slate-500">{{ sec('proprietaire').societe?.domaine || 'Espace client' }}</p>
            <p class="mt-2 text-xs font-bold text-cyan-700">
              Onboarding : {{ sec('proprietaire').societe?.onboarding_completed ? 'terminé' : 'à finaliser' }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink
              v-for="link in sec('proprietaire').routes || []"
              :key="link.to"
              :to="link.to"
              class="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black text-sky-800 transition hover:bg-white"
            >
              {{ link.label }}
            </RouterLink>
          </div>
        </div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <InfoLine v-for="compteur in sec('proprietaire').compteurs || []" :key="compteur.label" :label="compteur.label" :value="formatNumber(compteur.value)" />
        </div>
        <div v-if="(sec('proprietaire').portfolio || []).length" class="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoLine v-for="compteur in sec('proprietaire').portfolio || []" :key="compteur.label" :label="compteur.label" :value="formatNumber(compteur.value)" />
        </div>
        <div class="mt-5 grid gap-3 lg:grid-cols-3">
          <div v-for="droit in sec('proprietaire').droits || []" :key="droit.role" class="rounded-2xl border border-cyan-100 bg-white/75 p-3">
            <p class="text-sm font-black text-slate-950">{{ droit.role }}</p>
            <p class="mt-1 text-xs font-semibold text-slate-600">{{ droit.niveau }}</p>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { RefreshCw, Sparkles } from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const loading = ref(false)
const error = ref('')
const payload = ref(null)
const period = ref('month')

const sections = computed(() => payload.value?.sections || {})
const generatedAt = computed(() => payload.value?.generated_at || null)
const hasData = computed(() => Boolean(payload.value))

const quickNav = [
  { key: 'dashboard', index: '01', label: 'Dashboard' },
  { key: 'validations', index: '02', label: 'Validations' },
  { key: 'autorisations', index: '03', label: 'Autorisations' },
  { key: 'performance_equipe', index: '04', label: 'Équipe' },
  { key: 'alertes', index: '05', label: 'Alertes' },
  { key: 'tresorerie', index: '06', label: 'Trésorerie' },
  { key: 'marges', index: '07', label: 'Marges' },
  { key: 'journal', index: '08', label: 'Journal' },
  { key: 'objectifs', index: '09', label: 'Objectifs' },
  { key: 'proprietaire', index: '10', label: 'Propriétaire' },
]

const commercialColumns = [
  { key: 'name', label: 'Nom' },
  { key: 'ca', label: 'CA', money: true },
  { key: 'factures', label: 'Factures' },
  { key: 'devis', label: 'Devis' },
  { key: 'conversion', label: 'Conv.', percent: true },
]

const cashierColumns = [
  { key: 'name', label: 'Nom' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'ca', label: 'CA', money: true },
  { key: 'panier_moyen', label: 'Panier moy.', money: true },
]

function sec(key) {
  return sections.value?.[key] || {}
}

async function loadPilotage() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/gerant/pilotage', { params: { periode: period.value } })
    payload.value = data
  } catch (e) {
    error.value = e.response?.data?.message || 'Chargement du pilotage gérant impossible.'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

async function downloadExport(format) {
  try {
    const { data } = await api.get('/gerant/pilotage/export', {
      params: { format, periode: period.value },
      responseType: 'blob',
    })
    const extension = format === 'pdf' ? 'pdf' : 'csv'
    const blob = new Blob([data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pilotage-gerant-${period.value}.${extension}`
    link.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    toast.error('Export du pilotage impossible.')
  }
}

function metricValue(kpi) {
  if (kpi?.format === 'money') return formatAmount(kpi.value)
  return formatNumber(kpi?.value)
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value) || 0)
}

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `${formatNumber(value)} XOF`
}

function percent(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `${formatNumber(value)} %`
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const SectionHeader = defineComponent({
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
  },
  setup(props) {
    return () => h('div', { class: 'flex flex-col gap-1' }, [
      h('h2', { class: 'text-xl font-black text-slate-950' }, props.title),
      props.subtitle ? h('p', { class: 'text-sm font-semibold text-slate-500' }, props.subtitle) : null,
    ])
  },
})

const InfoLine = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: '—' },
  },
  setup(props) {
    return () => h('div', { class: 'rounded-2xl border border-cyan-100 bg-white/75 p-3' }, [
      h('p', { class: 'text-[11px] font-black uppercase tracking-[0.16em] text-sky-700' }, props.label),
      h('p', { class: 'mt-2 text-base font-black text-slate-950' }, props.value),
    ])
  },
})

const SimpleTable = defineComponent({
  props: {
    title: { type: String, required: true },
    rows: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
  },
  setup(props) {
    const renderValue = (row, column) => {
      const value = row?.[column.key]
      if (column.money) return formatAmount(value)
      if (column.percent) return percent(value)
      return formatNumber(value) === '0' && typeof value === 'string' ? value : (value ?? '—')
    }

    return () => h('article', { class: 'gerant-card overflow-hidden rounded-3xl border shadow-sm' }, [
      h('div', { class: 'border-b border-cyan-100 bg-cyan-50/70 px-4 py-3 font-black text-sky-950' }, props.title),
      h('div', { class: 'overflow-x-auto' }, [
        h('table', { class: 'min-w-full text-left text-sm' }, [
          h('thead', { class: 'bg-cyan-50 text-xs uppercase tracking-[0.16em] text-sky-800' }, [
            h('tr', props.columns.map(column => h('th', { class: 'px-4 py-3' }, column.label))),
          ]),
          h('tbody', { class: 'divide-y divide-cyan-100 bg-white/70' }, props.rows.length
            ? props.rows.map(row => h('tr', props.columns.map(column => h('td', { class: 'px-4 py-3 font-semibold text-slate-700' }, renderValue(row, column)))))
            : [h('tr', [h('td', { class: 'px-4 py-8 text-center text-sm font-semibold text-slate-500', colspan: props.columns.length }, 'Aucune donnée sur la période.')])]
          ),
        ]),
      ]),
    ])
  },
})

watch(period, loadPilotage)

onMounted(loadPilotage)
</script>

<style scoped>
.gerant-page {
  --gerant-border: color-mix(in srgb, var(--saytu-primary, #0ea5e9) 30%, #dff9ff);
}

.gerant-hero {
  background:
    radial-gradient(circle at 10% 0%, rgba(34, 211, 238, 0.45), transparent 30%),
    linear-gradient(135deg, #075985 0%, #0ea5e9 48%, #22d3ee 100%);
  border-color: rgba(125, 211, 252, 0.75);
}

.gerant-card {
  border-color: var(--gerant-border);
  background: linear-gradient(135deg, rgba(236, 254, 255, 0.95), rgba(255, 255, 255, 0.92));
}
</style>
