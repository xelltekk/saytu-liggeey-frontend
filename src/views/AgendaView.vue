<template>
  <div class="space-y-4">
    <div v-if="error" class="pilotage-alert rounded-2xl border p-4 text-sm font-medium">
      {{ error }}
    </div>

    <section class="pilotage-panel rounded-3xl border p-4 shadow-sm sm:p-5">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex items-start gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl" style="background: color-mix(in srgb, var(--saytu-primary) 12%, var(--saytu-surface)); color: var(--saytu-primary);">
            <CalendarDays class="h-5 w-5" />
          </span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="pilotage-title text-lg font-black">Agenda</h1>
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
          <button type="button" class="agenda-primary-button" :disabled="savingRdv" @click="openRdvModal()">
            <Plus class="h-4 w-4" />
            Rendez-vous
          </button>
          <button type="button" class="agenda-nav-button" :disabled="loading" @click="changeAgendaMonth(-1)">
            <ChevronLeft class="h-4 w-4" />
          </button>
          <div class="agenda-month-label min-w-44 rounded-2xl px-4 py-2 text-center text-sm font-black">
            {{ agendaMonthLabel }}
          </div>
          <button type="button" class="agenda-nav-button" :disabled="loading" @click="changeAgendaMonth(1)">
            <ChevronRight class="h-4 w-4" />
          </button>
          <button type="button" class="agenda-today-button" :disabled="loading" @click="resetAgendaMonth">
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
            <div class="flex items-center gap-1">
              <span v-if="day.events.length" class="rounded-full px-2 py-0.5 text-[10px] font-black" style="background: color-mix(in srgb, var(--saytu-primary) 10%, var(--saytu-surface)); color: var(--saytu-primary);">
                {{ day.events.length }}
              </span>
              <button type="button" class="agenda-day-add" title="Ajouter un rendez-vous" @click="openRdvModal(day)">
                +
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <button
              v-for="event in day.events.slice(0, 3)"
              :key="event.id"
              type="button"
              class="agenda-event w-full rounded-xl border px-2 py-1.5 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              :style="agendaEventStyle(event)"
              @click="handleEventClick(event)"
            >
              <span class="block truncate font-black">
                <span v-if="event.time" class="mr-1 opacity-75">{{ event.time }}</span>{{ event.title }}
              </span>
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

    <AppModal v-model="showRdvModal" title="Nouveau rendez-vous" size="md" centered>
      <form class="space-y-4" @submit.prevent="saveRdv">
        <label class="field-label">
          Titre du rendez-vous
          <input v-model.trim="rdvForm.titre" class="input" placeholder="Ex : Rendez-vous client, réunion interne..." required />
        </label>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label">
            Début
            <input v-model="rdvForm.date_debut" type="datetime-local" class="input" required />
          </label>
          <label class="field-label">
            Fin
            <input v-model="rdvForm.date_fin" type="datetime-local" class="input" />
          </label>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label">
            Client / contact
            <input v-model.trim="rdvForm.client_nom" class="input" placeholder="Optionnel" />
          </label>
          <label class="field-label">
            Lieu
            <input v-model.trim="rdvForm.lieu" class="input" placeholder="Bureau, téléphone, adresse..." />
          </label>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label">
            Visibilité
            <select v-model="rdvForm.visibilite" class="input">
              <option value="equipe">Visible par l’équipe</option>
              <option value="personnelle">Personnel</option>
            </select>
          </label>
          <label class="field-label">
            Priorité
            <select v-model="rdvForm.priorite" class="input">
              <option value="info">Information</option>
              <option value="todo">À faire</option>
              <option value="warning">Attention</option>
              <option value="critical">Critique</option>
            </select>
          </label>
        </div>

        <label class="field-label">
          Notes
          <textarea v-model.trim="rdvForm.description" rows="3" class="input" placeholder="Détails utiles pour le rendez-vous..."></textarea>
        </label>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" class="btn-secondary" @click="showRdvModal = false">Annuler</button>
          <button class="btn-primary" :disabled="savingRdv">
            {{ savingRdv ? 'Enregistrement...' : 'Ajouter à l’agenda' }}
          </button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showEventModal" :title="eventModalTitle" size="sm" centered>
      <div v-if="selectedEvent" class="space-y-4">
        <div>
          <p class="text-xs font-black uppercase tracking-wide text-[color:var(--saytu-primary)]">{{ eventTypeLabel(selectedEvent) }}</p>
          <h2 class="mt-1 text-xl font-black text-[color:var(--saytu-topbar-title)]">{{ selectedEvent.title }}</h2>
          <p class="mt-1 text-sm text-[color:var(--saytu-topbar-subtitle)]">{{ selectedEvent.subtitle }}</p>
        </div>

        <div class="grid gap-2 text-sm sm:grid-cols-2">
          <div
            v-for="detail in selectedEventDetails"
            :key="detail.label"
            class="rounded-2xl border p-3"
            style="border-color: var(--saytu-border); background: var(--saytu-surface);"
          >
            <span class="block text-[11px] font-black uppercase tracking-wide text-[color:var(--saytu-topbar-subtitle)]">{{ detail.label }}</span>
            <strong class="mt-1 block text-[color:var(--saytu-topbar-title)]">{{ detail.value }}</strong>
          </div>
        </div>

        <div class="rounded-2xl border p-4 text-sm" style="border-color: var(--saytu-border); background: var(--saytu-surface);">
          <p v-if="selectedEvent.meta" class="whitespace-pre-line"><strong>Détails :</strong> {{ selectedEvent.meta }}</p>
          <p v-if="selectedEvent.description" class="mt-2 whitespace-pre-line"><strong>Notes :</strong> {{ selectedEvent.description }}</p>
          <p v-if="!selectedEvent.meta && !selectedEvent.description" class="text-[color:var(--saytu-topbar-subtitle)]">
            Aucun détail complémentaire pour cet événement.
          </p>
        </div>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" class="btn-secondary" @click="showEventModal = false">Fermer</button>
          <button
            v-if="selectedEvent.route"
            type="button"
            class="btn-primary inline-flex items-center justify-center gap-2"
            @click="openSelectedEvent"
          >
            Ouvrir
            <ExternalLink class="h-4 w-4" />
          </button>
          <button
            v-if="selectedEvent.source === 'rendez_vous' && selectedEvent.can_manage"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            :disabled="savingRdv"
            @click="deleteSelectedRdv"
          >
            <Trash2 class="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Plus, Trash2 } from 'lucide-vue-next'
import AppModal from '@/components/AppModal.vue'
import api from '@/services/api'
import { formatMoney } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const toast = useToast()
const { confirm: askConfirm } = useConfirm()
const data = ref(null)
const loading = ref(false)
const error = ref('')
const agendaMonth = ref(monthKey(new Date()))
const savingRdv = ref(false)
const showRdvModal = ref(false)
const showEventModal = ref(false)
const selectedEvent = ref(null)
const rdvForm = reactive(defaultRdvForm())

const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const agendaTypes = [
  { key: 'rendez_vous', label: 'Rendez-vous' },
  { key: 'facture', label: 'Factures' },
  { key: 'devis', label: 'Devis' },
  { key: 'achat', label: 'Achats' },
  { key: 'fournisseur', label: 'Fournisseurs' },
  { key: 'leasing', label: 'Leasing' },
  { key: 'intervention', label: 'Interventions' },
  { key: 'caisse', label: 'Caisse' },
]

const agenda = computed(() => data.value?.agenda || { month: agendaMonth.value, label: '', total: 0, events: [] })
const agendaMonthLabel = computed(() => {
  const date = dateFromMonth(agenda.value.month || agendaMonth.value)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
})
const eventModalTitle = computed(() => selectedEvent.value ? `Détail ${eventTypeLabel(selectedEvent.value).toLowerCase()}` : 'Détail')
const selectedEventDetails = computed(() => {
  const event = selectedEvent.value
  if (!event) return []

  return [
    { label: 'Date', value: formatEventDate(event.date) },
    { label: 'Heure', value: event.time },
    { label: 'Montant', value: Number(event.amount) > 0 ? formatAmount(event.amount) : null },
    { label: 'Priorité', value: priorityLabel(event.priority) },
    { label: 'Référence', value: event.source_id ? String(event.source_id) : null },
  ].filter(item => item.value)
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

async function loadAgenda() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/pilotage/aujourdhui', { params: { month: agendaMonth.value } })
    data.value = response.data
  } catch (e) {
    error.value = e.response?.data?.message || 'Chargement de l’agenda impossible pour le moment.'
  } finally {
    loading.value = false
  }
}

function changeAgendaMonth(delta) {
  const date = dateFromMonth(agendaMonth.value)
  date.setMonth(date.getMonth() + delta)
  agendaMonth.value = monthKey(date)
  loadAgenda()
}

function resetAgendaMonth() {
  agendaMonth.value = monthKey(new Date())
  loadAgenda()
}

function openRdvModal(day = null) {
  Object.assign(rdvForm, defaultRdvForm(day?.key))
  showRdvModal.value = true
}

async function saveRdv() {
  savingRdv.value = true
  try {
    await api.post('/agenda/rendez-vous', normalizeRdvPayload())
    toast.success('Rendez-vous ajouté à l’agenda.')
    showRdvModal.value = false
    await loadAgenda()
  } catch (e) {
    toast.error(apiError(e, 'Enregistrement du rendez-vous impossible.'))
  } finally {
    savingRdv.value = false
  }
}

async function deleteSelectedRdv() {
  if (!selectedEvent.value?.source_id) return
  if (!await askConfirm({ message: 'Supprimer ce rendez-vous de l’agenda ?', tone: 'danger', confirmLabel: 'Supprimer' })) return

  savingRdv.value = true
  try {
    await api.delete(`/agenda/rendez-vous/${selectedEvent.value.source_id}`)
    toast.success('Rendez-vous supprimé.')
    showEventModal.value = false
    selectedEvent.value = null
    await loadAgenda()
  } catch (e) {
    toast.error(apiError(e, 'Suppression du rendez-vous impossible.'))
  } finally {
    savingRdv.value = false
  }
}

function handleEventClick(event) {
  selectedEvent.value = event
  showEventModal.value = true
}

function openSelectedEvent() {
  if (!selectedEvent.value?.route) return
  const route = selectedEvent.value.route
  showEventModal.value = false
  selectedEvent.value = null
  go(route)
}

function go(route) {
  if (!route) return
  router.push(typeof route === 'string' ? { path: route } : route)
}

function formatAmount(value) {
  return formatMoney(value || 0)
}

function formatEventDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function eventTypeLabel(event) {
  return {
    rendez_vous: 'Rendez-vous',
    facture: 'Facture',
    devis: 'Devis',
    achat: event?.source === 'achat_demande' ? 'Demande d’achat' : 'Achat fournisseur',
    fournisseur: 'Facture fournisseur',
    leasing: event?.source === 'leasing_releve' ? 'Relevé leasing' : 'Contrat leasing',
    intervention: 'Intervention',
    caisse: 'Caisse',
  }[event?.type] || 'Événement'
}

function priorityLabel(value) {
  return {
    critical: 'Critique',
    warning: 'Attention',
    todo: 'À faire',
    info: 'Information',
  }[value] || value || null
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

function dateFromKey(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day, 9, 0, 0)
}

function defaultRdvForm(dateKeyValue = null) {
  const start = dateKeyValue ? dateFromKey(dateKeyValue) : nextDefaultDateTime()
  const end = new Date(start)
  end.setHours(end.getHours() + 1)

  return {
    titre: '',
    description: '',
    date_debut: toDateTimeLocal(start),
    date_fin: toDateTimeLocal(end),
    lieu: '',
    client_nom: '',
    visibilite: 'equipe',
    priorite: 'todo',
  }
}

function nextDefaultDateTime() {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return date
}

function toDateTimeLocal(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-') + `T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function normalizeRdvPayload() {
  return {
    titre: rdvForm.titre,
    description: rdvForm.description || null,
    date_debut: rdvForm.date_debut,
    date_fin: rdvForm.date_fin || null,
    lieu: rdvForm.lieu || null,
    client_nom: rdvForm.client_nom || null,
    visibilite: rdvForm.visibilite,
    priorite: rdvForm.priorite,
    statut: 'planifie',
  }
}

function apiError(e, fallback) {
  const errors = e.response?.data?.errors || {}
  const firstError = Object.values(errors).flat().find(Boolean)
  return e.response?.data?.message || firstError || fallback
}

function agendaAccent(type, priority = 'info') {
  if (priority === 'critical') return 'var(--saytu-primary-hover)'
  return {
    rendez_vous: 'var(--saytu-primary)',
    facture: 'var(--saytu-primary)',
    devis: 'var(--saytu-brand-to)',
    achat: 'var(--saytu-focus)',
    fournisseur: 'var(--saytu-primary-hover)',
    leasing: 'var(--saytu-brand-to)',
    intervention: 'var(--saytu-focus)',
    caisse: 'var(--saytu-primary)',
  }[type] || 'var(--saytu-primary)'
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

onMounted(loadAgenda)
</script>

<style scoped>
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

.pilotage-chip {
  background: color-mix(in srgb, var(--saytu-primary) 9%, var(--saytu-surface));
  color: var(--saytu-primary);
}

.pilotage-alert {
  border-color: color-mix(in srgb, var(--saytu-primary-hover) 28%, var(--saytu-border));
  background: color-mix(in srgb, var(--saytu-primary-hover) 10%, var(--saytu-surface));
  color: var(--saytu-primary-hover);
}

.agenda-nav-button,
.agenda-primary-button,
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

.agenda-primary-button {
  gap: 0.45rem;
  background: linear-gradient(135deg, var(--saytu-primary), var(--saytu-brand-to));
  border-color: color-mix(in srgb, var(--saytu-primary) 40%, var(--saytu-border));
  color: white;
  box-shadow: 0 12px 25px color-mix(in srgb, var(--saytu-primary) 18%, transparent);
}

.agenda-nav-button {
  width: 2.5rem;
  padding: 0;
}

.agenda-primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.agenda-nav-button:hover:not(:disabled),
.agenda-today-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--saytu-primary) 14%, var(--saytu-surface));
  transform: translateY(-1px);
}

.agenda-nav-button:disabled,
.agenda-primary-button:disabled,
.agenda-today-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.agenda-month-label {
  background: color-mix(in srgb, var(--saytu-primary) 8%, var(--saytu-surface));
  color: var(--saytu-topbar-title);
}

.agenda-day {
  border-color: color-mix(in srgb, var(--saytu-primary) 14%, var(--saytu-border));
  background: color-mix(in srgb, var(--saytu-surface) 96%, var(--saytu-primary) 4%);
}

.agenda-day-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--saytu-primary) 22%, var(--saytu-border));
  background: color-mix(in srgb, var(--saytu-primary) 7%, var(--saytu-surface));
  color: var(--saytu-primary);
  font-size: 0.85rem;
  font-weight: 900;
  line-height: 1;
  transition: 160ms ease;
}

.agenda-day-add:hover {
  background: color-mix(in srgb, var(--saytu-primary) 15%, var(--saytu-surface));
  transform: translateY(-1px);
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
