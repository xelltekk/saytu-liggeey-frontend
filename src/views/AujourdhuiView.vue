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

    <section id="agenda" class="pilotage-panel scroll-mt-24 rounded-3xl border p-4 shadow-sm sm:p-5">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex items-start gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl" style="background: color-mix(in srgb, var(--saytu-primary) 12%, var(--saytu-surface)); color: var(--saytu-primary);">
            <CalendarDays class="h-5 w-5" />
          </span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="pilotage-title text-lg font-black">Agenda</h2>
              <span class="pilotage-chip rounded-full px-3 py-1 text-xs font-bold">
                {{ agenda.total || 0 }} événement(s)
              </span>
            </div>
            <p class="pilotage-muted mt-1 text-sm">
              Devis, factures, achats, leasing et interventions en cours sur le mois.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="agenda-nav-button" @click="changeAgendaMonth(-1)">
            <ChevronLeft class="h-4 w-4" />
          </button>
          <div class="agenda-month-label min-w-44 rounded-2xl px-4 py-2 text-center text-sm font-black">
            {{ agendaMonthLabel }}
          </div>
          <button type="button" class="agenda-nav-button" @click="changeAgendaMonth(1)">
            <ChevronRight class="h-4 w-4" />
          </button>
          <button type="button" class="agenda-today-button" @click="resetAgendaMonth">
            Aujourd’hui
          </button>
        </div>
      </div>

      <div class="mt-4 hidden grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wide text-[color:var(--saytu-topbar-subtitle)] md:grid">
        <div v-for="day in weekDays" :key="day" class="rounded-xl py-2" style="background: color-mix(in srgb, var(--saytu-primary) 5%, var(--saytu-surface));">
          {{ day }}
        </div>
      </div>

      <div class="mt-2 grid gap-2 md:grid-cols-7">
        <article
          v-for="day in agendaDays"
          :key="day.key"
          class="agenda-day min-h-32 rounded-2xl border p-2"
          :class="{ 'agenda-day-outside': !day.inMonth, 'agenda-day-today': day.isToday }"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-xs font-black" :class="day.isToday ? 'agenda-today-number' : 'pilotage-title'">
              {{ day.dayNumber }}
            </span>
            <span v-if="day.events.length" class="rounded-full px-2 py-0.5 text-[10px] font-black" style="background: color-mix(in srgb, var(--saytu-primary) 10%, var(--saytu-surface)); color: var(--saytu-primary);">
              {{ day.events.length }}
            </span>
          </div>

          <div class="space-y-1.5">
            <button
              v-for="event in day.events.slice(0, 3)"
              :key="event.id"
              type="button"
              class="agenda-event w-full rounded-xl border px-2 py-1.5 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              :style="agendaEventStyle(event)"
              @click="go(event.route)"
            >
              <span class="block truncate font-black">{{ event.title }}</span>
              <span class="mt-0.5 block truncate opacity-80">{{ event.subtitle }}</span>
              <span v-if="Number(event.amount) > 0" class="mt-1 block font-bold">{{ formatAmount(event.amount) }}</span>
            </button>
            <div v-if="day.events.length > 3" class="rounded-xl border px-2 py-1 text-center text-[11px] font-bold" style="border-color: color-mix(in srgb, var(--saytu-primary) 18%, var(--saytu-border)); color: var(--saytu-primary);">
              + {{ day.events.length - 3 }} autre(s)
            </div>
          </div>
        </article>
      </div>

      <div class="mt-4 flex flex-wrap gap-2 text-xs">
        <span v-for="type in agendaTypes" :key="type.key" class="agenda-legend rounded-full border px-3 py-1 font-bold" :style="agendaTypeStyle(type.key)">
          {{ type.label }}
        </span>
      </div>
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
  ChevronLeft,
  ChevronRight,
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
const agendaMonth = ref(monthKey(new Date()))
const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const agendaTypes = [
  { key: 'facture', label: 'Factures' },
  { key: 'devis', label: 'Devis' },
  { key: 'achat', label: 'Achats' },
  { key: 'fournisseur', label: 'Fournisseurs' },
  { key: 'leasing', label: 'Leasing' },
  { key: 'intervention', label: 'Interventions' },
  { key: 'caisse', label: 'Caisse' },
]

const summary = computed(() => data.value?.summary || {
  total_actions: 0,
  critiques: 0,
  attentions: 0,
  a_faire: 0,
  montant_a_encaisser: 0,
  montant_a_payer: 0,
})

const sections = computed(() => data.value?.sections || [])
const agenda = computed(() => data.value?.agenda || { month: agendaMonth.value, label: '', total: 0, events: [] })
const agendaMonthLabel = computed(() => {
  const date = dateFromMonth(agenda.value.month || agendaMonth.value)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
})

const agendaEventsByDate = computed(() => {
  return (agenda.value.events || []).reduce((groups, event) => {
    if (!event.date) return groups
    if (!groups[event.date]) groups[event.date] = []
    groups[event.date].push(event)
    return groups
  }, {})
})

const agendaDays = computed(() => {
  const monthDate = dateFromMonth(agenda.value.month || agendaMonth.value)
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const start = new Date(first)
  const mondayIndex = (first.getDay() + 6) % 7
  start.setDate(first.getDate() - mondayIndex)

  const days = []
  for (let i = 0; i < 42; i += 1) {
    const current = new Date(start)
    current.setDate(start.getDate() + i)
    const key = dateKey(current)
    days.push({
      key,
      dayNumber: current.getDate().toString().padStart(2, '0'),
      inMonth: current.getMonth() === monthDate.getMonth(),
      isToday: key === dateKey(new Date()),
      events: agendaEventsByDate.value[key] || [],
    })
  }

  return days
})

async function loadPilotage() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/pilotage/aujourdhui', { params: { month: agendaMonth.value } })
    data.value = response.data
  } catch (e) {
    error.value = e.response?.data?.message || 'Chargement du pilotage impossible pour le moment.'
  } finally {
    loading.value = false
  }
}

function changeAgendaMonth(delta) {
  const date = dateFromMonth(agendaMonth.value)
  date.setMonth(date.getMonth() + delta)
  agendaMonth.value = monthKey(date)
  loadPilotage()
}

function resetAgendaMonth() {
  agendaMonth.value = monthKey(new Date())
  loadPilotage()
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

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateFromMonth(value) {
  const [year, month] = String(value || '').split('-').map(Number)
  if (!year || !month) return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  return new Date(year, month - 1, 1)
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

function agendaAccent(type, priority = 'info') {
  if (priority === 'critical') return 'var(--saytu-primary-hover)'
  return {
    facture: 'var(--saytu-primary)',
    devis: 'var(--saytu-brand-to)',
    achat: 'var(--saytu-focus)',
    fournisseur: 'var(--saytu-primary-hover)',
    leasing: 'var(--saytu-brand-to)',
    intervention: 'var(--saytu-focus)',
    caisse: 'var(--saytu-primary)',
  }[type] || themeAccent(priority)
}

function agendaEventStyle(event) {
  const accent = agendaAccent(event.type, event.priority)
  return {
    color: 'var(--saytu-topbar-title)',
    borderColor: `color-mix(in srgb, ${accent} 32%, var(--saytu-border))`,
    background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 16%, var(--saytu-surface)), var(--saytu-surface))`,
    borderLeftColor: accent,
    borderLeftWidth: '4px',
  }
}

function agendaTypeStyle(type) {
  const accent = agendaAccent(type)
  return {
    color: accent,
    borderColor: `color-mix(in srgb, ${accent} 28%, var(--saytu-border))`,
    background: `color-mix(in srgb, ${accent} 10%, var(--saytu-surface))`,
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

.agenda-nav-button,
.agenda-today-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--saytu-primary) 24%, var(--saytu-border));
  background: color-mix(in srgb, var(--saytu-primary) 7%, var(--saytu-surface));
  color: var(--saytu-primary);
  font-size: 0.8rem;
  font-weight: 900;
  padding: 0 0.85rem;
  transition: 160ms ease;
}

.agenda-nav-button {
  width: 2.5rem;
  padding: 0;
}

.agenda-nav-button:hover,
.agenda-today-button:hover {
  background: color-mix(in srgb, var(--saytu-primary) 14%, var(--saytu-surface));
  transform: translateY(-1px);
}

.agenda-month-label {
  background: color-mix(in srgb, var(--saytu-primary) 8%, var(--saytu-surface));
  color: var(--saytu-topbar-title);
}

.agenda-day {
  border-color: color-mix(in srgb, var(--saytu-primary) 14%, var(--saytu-border));
  background: color-mix(in srgb, var(--saytu-surface) 96%, var(--saytu-primary) 4%);
}

.agenda-day-outside {
  opacity: 0.55;
  background: color-mix(in srgb, var(--saytu-surface) 88%, var(--saytu-border) 12%);
}

.agenda-day-today {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--saytu-primary) 42%, transparent);
  background: color-mix(in srgb, var(--saytu-primary) 9%, var(--saytu-surface));
}

.agenda-today-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: var(--saytu-primary);
  color: white;
}

.agenda-event {
  border-color: var(--saytu-border);
}
</style>
