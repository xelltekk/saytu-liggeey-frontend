<template>
  <div class="space-y-6">
    <section class="pilotage-hero overflow-hidden rounded-3xl border p-5 text-white shadow-sm sm:p-6">
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

    <div v-if="error" class="pilotage-alert rounded-2xl border p-4 text-sm font-medium">
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
      <div v-for="i in 4" :key="i" class="pilotage-skeleton h-52 animate-pulse rounded-3xl border"></div>
    </section>

    <section v-else-if="!sections.length" class="pilotage-panel rounded-3xl border p-8 text-center">
      <CheckCircle2 class="mx-auto h-12 w-12 text-[color:var(--saytu-primary)]" />
      <h2 class="pilotage-title mt-4 text-xl font-bold">Tout est calme pour le moment.</h2>
      <p class="pilotage-muted mt-2 text-sm">
        Aucune urgence détectée. Tu peux travailler sereinement — le petit copilote veille au grain.
      </p>
    </section>

    <section v-else class="grid gap-4 xl:grid-cols-2">
      <article
        v-for="section in sections"
        :key="section.key"
        class="pilotage-panel rounded-3xl border p-4 shadow-sm transition hover:shadow-md sm:p-5"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl" style="background: color-mix(in srgb, var(--saytu-primary) 12%, transparent); color: var(--saytu-primary);">
                <component :is="sectionIcon(section.key)" class="h-5 w-5" />
              </span>
              <div>
                <h2 class="pilotage-title font-bold">{{ section.label }}</h2>
                <p class="pilotage-muted text-xs">{{ section.description }}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="pilotage-action inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            @click="go(section.route)"
          >
            {{ section.action_label || 'Voir' }}
            <ArrowRight class="h-3.5 w-3.5" />
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2 text-xs">
          <span class="pilotage-chip rounded-full px-3 py-1 font-semibold">
            {{ section.total }} élément(s)
          </span>
          <span v-if="Number(section.amount) > 0" class="rounded-full px-3 py-1 font-semibold" style="background: color-mix(in srgb, var(--saytu-primary) 12%, transparent); color: var(--saytu-primary);">
            {{ formatAmount(section.amount) }}
          </span>
        </div>

        <div class="mt-4 divide-y divide-[var(--saytu-border)]">
          <button
            v-for="item in section.items"
            :key="item.id"
            type="button"
            class="pilotage-row group flex w-full gap-3 py-3 text-left transition sm:px-2"
            @click="go(item.route || section.route)"
          >
            <span
              class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl"
              :style="priorityStyle(item.priority)"
            >
              <component :is="priorityIcon(item.priority)" class="h-4 w-4" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="pilotage-title block truncate text-sm font-semibold">{{ item.title }}</span>
              <span class="pilotage-muted mt-0.5 block text-xs">{{ item.subtitle }}</span>
              <span v-if="item.meta" class="pilotage-muted mt-1 block truncate text-[11px] opacity-75">{{ item.meta }}</span>
            </span>

            <span class="shrink-0 text-right">
              <span v-if="Number(item.amount) > 0" class="pilotage-title block text-sm font-bold">{{ formatAmount(item.amount) }}</span>
              <span v-else-if="item.quantity !== null && item.quantity !== undefined" class="pilotage-title block text-sm font-bold">{{ formatQuantity(item.quantity) }}</span>
              <span class="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" :style="priorityStyle(item.priority, true)">
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

function themeAccent(kind) {
  return {
    critical: 'var(--saytu-primary-hover)',
    warning: 'var(--saytu-primary)',
    todo: 'var(--saytu-brand-to)',
    info: 'var(--saytu-focus)',
    red: 'var(--saytu-primary-hover)',
    green: 'var(--saytu-brand-to)',
    orange: 'var(--saytu-focus)',
    blue: 'var(--saytu-primary)',
  }[kind] || 'var(--saytu-primary)'
}

function priorityStyle(priority, compact = false) {
  const accent = themeAccent(priority)
  const backgroundWeight = compact ? 10 : 12
  const borderWeight = compact ? 30 : 22

  return {
    color: accent,
    background: `color-mix(in srgb, ${accent} ${backgroundWeight}%, var(--saytu-surface))`,
    borderColor: `color-mix(in srgb, ${accent} ${borderWeight}%, var(--saytu-border))`,
  }
}

function cardStyle(tone) {
  const accent = themeAccent(tone)

  return {
    '--pilotage-card-accent': accent,
    color: 'var(--saytu-shell-text)',
    borderColor: `color-mix(in srgb, ${accent} 28%, var(--saytu-border))`,
    background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 10%, var(--saytu-surface)), var(--saytu-surface))`,
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
    return () => h('article', { class: 'rounded-3xl border p-4 shadow-sm', style: cardStyle(props.tone) }, [
      h('div', { class: 'flex items-start justify-between gap-3' }, [
        h('div', [
          h('div', { class: 'text-xs font-bold uppercase tracking-wide opacity-80' }, props.label),
          h('div', { class: 'mt-3 text-2xl font-black', style: { color: 'var(--saytu-topbar-title)' } }, String(props.value ?? 0)),
          h('div', { class: 'mt-1 text-xs opacity-80' }, props.sub || ''),
        ]),
        h('span', {
          class: 'inline-flex h-10 w-10 items-center justify-center rounded-2xl',
          style: {
            color: 'var(--pilotage-card-accent)',
            background: 'color-mix(in srgb, var(--pilotage-card-accent) 14%, var(--saytu-surface))',
          },
        }, [
          h(props.icon || Sparkles, { class: 'h-5 w-5' }),
        ]),
      ]),
    ])
  },
}

onMounted(loadPilotage)
</script>

<style scoped>
.pilotage-hero {
  border-color: color-mix(in srgb, var(--saytu-primary) 34%, var(--saytu-border));
  background-image:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-brand-to) 35%, transparent), transparent 28%),
    linear-gradient(
      135deg,
      var(--saytu-sidebar-from),
      var(--saytu-primary),
      var(--saytu-sidebar-to)
    );
}

.pilotage-panel {
  border-color: var(--saytu-border);
  background: color-mix(in srgb, var(--saytu-surface) 94%, var(--saytu-primary) 6%);
  color: var(--saytu-shell-text);
}

.pilotage-title {
  color: var(--saytu-topbar-title);
}

.pilotage-muted {
  color: var(--saytu-topbar-subtitle);
}

.pilotage-action {
  border-color: color-mix(in srgb, var(--saytu-primary) 24%, var(--saytu-border));
  color: var(--saytu-primary);
  background: color-mix(in srgb, var(--saytu-primary) 6%, var(--saytu-surface));
}

.pilotage-action:hover,
.pilotage-row:hover {
  background: color-mix(in srgb, var(--saytu-primary) 10%, var(--saytu-surface));
}

.pilotage-chip {
  background: color-mix(in srgb, var(--saytu-primary) 9%, var(--saytu-surface));
  color: var(--saytu-primary);
}

.pilotage-skeleton {
  border-color: var(--saytu-border);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--saytu-primary) 5%, var(--saytu-surface)),
      color-mix(in srgb, var(--saytu-primary) 13%, var(--saytu-surface)),
      color-mix(in srgb, var(--saytu-primary) 5%, var(--saytu-surface))
    );
}

.pilotage-alert {
  border-color: color-mix(in srgb, var(--saytu-primary-hover) 28%, var(--saytu-border));
  background: color-mix(in srgb, var(--saytu-primary-hover) 10%, var(--saytu-surface));
  color: var(--saytu-primary-hover);
}
</style>
