<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-3xl border border-[var(--saytu-border)] bg-gradient-to-br from-[var(--saytu-primary)] via-[var(--saytu-primary-hover)] to-slate-950 p-5 text-white shadow-sm sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <Sparkles class="h-4 w-4" />
            Assistant de pilotage
          </div>
          <h1 class="text-2xl font-black tracking-tight sm:text-3xl">Aujourd’hui</h1>
          <p class="mt-2 max-w-3xl text-sm text-white/85">
            {{ data?.message || 'Chargement des priorités du jour...' }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/25 disabled:opacity-60"
          :disabled="loading"
          @click="loadPilotage"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Actualiser
        </button>
      </div>
    </section>

    <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Actions critiques"
        :value="summary.critiques"
        sub="À traiter en premier"
        tone="red"
        :icon="AlertTriangle"
      />
      <SummaryCard
        label="À encaisser"
        :value="formatAmount(summary.montant_a_encaisser)"
        sub="Factures/relevés à suivre"
        tone="green"
        :icon="TrendingUp"
      />
      <SummaryCard
        label="À payer"
        :value="formatAmount(summary.montant_a_payer)"
        sub="Fournisseurs/achats"
        tone="orange"
        :icon="Wallet"
      />
      <SummaryCard
        label="Actions du jour"
        :value="summary.total_actions"
        :sub="`${summary.attentions || 0} attention(s), ${summary.a_faire || 0} à faire`"
        tone="blue"
        :icon="CalendarDays"
      />
    </section>

    <section v-if="loading && !sections.length" class="grid gap-4 lg:grid-cols-2">
      <div v-for="i in 4" :key="i" class="h-52 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/70"></div>
    </section>

    <section v-else-if="!sections.length" class="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/70 dark:bg-emerald-950/30">
      <CheckCircle2 class="mx-auto h-12 w-12 text-emerald-600" />
      <h2 class="mt-4 text-xl font-bold text-slate-900 dark:text-white">Tout est calme pour le moment.</h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Aucune urgence détectée. Tu peux travailler sereinement — le petit copilote veille au grain.
      </p>
    </section>

    <section v-else class="grid gap-4 xl:grid-cols-2">
      <article
        v-for="section in sections"
        :key="section.key"
        class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl" style="background: color-mix(in srgb, var(--saytu-primary) 12%, transparent); color: var(--saytu-primary);">
                <component :is="sectionIcon(section.key)" class="h-5 w-5" />
              </span>
              <div>
                <h2 class="font-bold text-slate-950 dark:text-white">{{ section.label }}</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ section.description }}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--saytu-primary)] hover:text-[var(--saytu-primary)] dark:border-slate-700 dark:text-slate-200"
            @click="go(section.route)"
          >
            {{ section.action_label || 'Voir' }}
            <ArrowRight class="h-3.5 w-3.5" />
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2 text-xs">
          <span class="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {{ section.total }} élément(s)
          </span>
          <span v-if="Number(section.amount) > 0" class="rounded-full px-3 py-1 font-semibold" style="background: color-mix(in srgb, var(--saytu-primary) 12%, transparent); color: var(--saytu-primary);">
            {{ formatAmount(section.amount) }}
          </span>
        </div>

        <div class="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          <button
            v-for="item in section.items"
            :key="item.id"
            type="button"
            class="group flex w-full gap-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70 sm:px-2"
            @click="go(item.route || section.route)"
          >
            <span
              class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl"
              :class="priorityClasses(item.priority).icon"
            >
              <component :is="priorityIcon(item.priority)" class="h-4 w-4" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-slate-950 dark:text-white">{{ item.title }}</span>
              <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{{ item.subtitle }}</span>
              <span v-if="item.meta" class="mt-1 block truncate text-[11px] text-slate-400 dark:text-slate-500">{{ item.meta }}</span>
            </span>

            <span class="shrink-0 text-right">
              <span v-if="Number(item.amount) > 0" class="block text-sm font-bold text-slate-950 dark:text-white">{{ formatAmount(item.amount) }}</span>
              <span v-else-if="item.quantity !== null && item.quantity !== undefined" class="block text-sm font-bold text-slate-950 dark:text-white">{{ formatQuantity(item.quantity) }}</span>
              <span class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" :class="priorityClasses(item.priority).badge">
                {{ priorityLabel(item.priority) }}
              </span>
            </span>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileClock,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
  Wrench,
} from 'lucide-vue-next'
import api from '@/services/api'
import { formatMoney } from '@/composables/useCurrency'

const router = useRouter()
const data = ref(null)
const loading = ref(false)
const error = ref('')

const summary = computed(() => data.value?.summary || {
  total_actions: 0,
  critiques: 0,
  attentions: 0,
  a_faire: 0,
  montant_a_encaisser: 0,
  montant_a_payer: 0,
})

const sections = computed(() => data.value?.sections || [])

async function loadPilotage() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/pilotage/aujourdhui')
    data.value = response.data
  } catch (e) {
    error.value = e.response?.data?.message || 'Chargement du pilotage impossible pour le moment.'
  } finally {
    loading.value = false
  }
}

function go(route) {
  if (!route) return
  router.push(typeof route === 'string' ? { path: route } : route)
}

function formatAmount(value) {
  return formatMoney(value || 0)
}

function formatQuantity(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(value || 0))
}

function priorityLabel(priority) {
  return {
    critical: 'Critique',
    warning: 'Attention',
    todo: 'À faire',
    info: 'Info',
  }[priority] || 'Info'
}

function priorityIcon(priority) {
  return {
    critical: AlertTriangle,
    warning: Clock3,
    todo: CalendarCheck,
    info: CheckCircle2,
  }[priority] || CheckCircle2
}

function priorityClasses(priority) {
  return {
    critical: {
      icon: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
      badge: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
    },
    warning: {
      icon: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    },
    todo: {
      icon: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    },
    info: {
      icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
  }[priority] || {
    icon: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }
}

function sectionIcon(key) {
  if (key.includes('facture') || key.includes('devis')) return FileClock
  if (key.includes('fournisseur') || key.includes('achat')) return ShoppingCart
  if (key.includes('stock')) return PackageCheck
  if (key.includes('leasing') || key.includes('intervention')) return Wrench
  if (key.includes('caisse')) return CreditCard
  return Sparkles
}

const SummaryCard = {
  props: {
    label: String,
    value: [String, Number],
    sub: String,
    tone: String,
    icon: [Object, Function],
  },
  setup(props) {
    const tones = {
      red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300',
      green: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
      orange: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300',
      blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300',
    }

    return () => h('article', { class: ['rounded-3xl border p-4 shadow-sm', tones[props.tone] || tones.blue] }, [
      h('div', { class: 'flex items-start justify-between gap-3' }, [
        h('div', [
          h('div', { class: 'text-xs font-bold uppercase tracking-wide opacity-80' }, props.label),
          h('div', { class: 'mt-3 text-2xl font-black text-slate-950 dark:text-white' }, String(props.value ?? 0)),
          h('div', { class: 'mt-1 text-xs opacity-80' }, props.sub || ''),
        ]),
        h('span', { class: 'inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-white/10' }, [
          h(props.icon || Sparkles, { class: 'h-5 w-5' }),
        ]),
      ]),
    ])
  },
}

onMounted(loadPilotage)
</script>
