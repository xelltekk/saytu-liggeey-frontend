<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button type="button" class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900" @click="goBack">
        ← Retour agenda
      </button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">{{ eventTypeLabel(event) }}</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">{{ event?.title || 'Événement' }}</h1>
      <p class="mt-1 text-sm text-cyan-800">{{ event?.subtitle || 'Détail en page complète.' }}</p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>
      <div v-else-if="!event" class="rounded-2xl border border-dashed border-cyan-200 p-8 text-center text-sm text-slate-500">
        Événement introuvable.
      </div>
      <div v-else class="space-y-4">
        <div class="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div v-for="detail in eventDetails" :key="detail.label" class="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3">
            <span class="block text-[11px] font-black uppercase tracking-wide text-cyan-700">{{ detail.label }}</span>
            <strong class="mt-1 block text-slate-950">{{ detail.value }}</strong>
          </div>
        </div>

        <div class="rounded-2xl border border-cyan-100 bg-white p-4 text-sm text-slate-700">
          <p v-if="event.meta" class="whitespace-pre-line"><strong>Détails :</strong> {{ event.meta }}</p>
          <p v-if="event.description" class="mt-2 whitespace-pre-line"><strong>Notes :</strong> {{ event.description }}</p>
          <p v-if="!event.meta && !event.description" class="text-slate-500">
            Aucun détail complémentaire pour cet événement.
          </p>
        </div>

        <div class="flex flex-col-reverse gap-2 border-t border-cyan-100 pt-4 sm:flex-row sm:justify-end">
          <button
            v-if="event.route"
            type="button"
            class="btn-primary"
            @click="openEventTarget"
          >
            Ouvrir le document lié
          </button>
          <button
            v-if="event.source === 'rendez_vous' && event.can_manage"
            type="button"
            class="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            :disabled="deleting"
            @click="deleteRdv"
          >
            {{ deleting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { formatMoney } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirm: askConfirm } = useConfirm()
const loading = ref(true)
const deleting = ref(false)
const event = ref(null)

const eventDetails = computed(() => {
  const item = event.value
  if (!item) return []
  return [
    { label: 'Date', value: formatEventDate(item.date) },
    { label: 'Heure', value: item.time },
    { label: 'Montant', value: Number(item.amount) > 0 ? formatMoney(item.amount) : null },
    { label: 'Priorité', value: priorityLabel(item.priority) },
    { label: 'Référence', value: item.source_id ? String(item.source_id) : null },
  ].filter(row => row.value)
})

onMounted(loadEvent)

async function loadEvent() {
  loading.value = true
  try {
    const cached = JSON.parse(sessionStorage.getItem('saytu_agenda_event') || 'null')
    if (cached && String(cached.id) === String(route.params.id)) {
      event.value = cached
      return
    }

    const month = typeof route.query.month === 'string' ? route.query.month : monthKey(new Date())
    const { data } = await api.get('/pilotage/aujourdhui', { params: { month } })
    const events = data?.agenda?.events || []
    event.value = events.find(item => String(item.id) === String(route.params.id)) || null
  } catch (error) {
    toast.error('Impossible de charger l’événement.')
  } finally {
    loading.value = false
  }
}

async function deleteRdv() {
  if (!event.value?.source_id) return
  if (!await askConfirm({ message: 'Supprimer ce rendez-vous de l’agenda ?', tone: 'danger', confirmLabel: 'Supprimer' })) return

  deleting.value = true
  try {
    await api.delete(`/agenda/rendez-vous/${event.value.source_id}`)
    toast.success('Rendez-vous supprimé.')
    goBack()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Suppression du rendez-vous impossible.')
  } finally {
    deleting.value = false
  }
}

function openEventTarget() {
  if (!event.value?.route) return
  router.push(typeof event.value.route === 'string' ? { path: event.value.route } : event.value.route)
}

function goBack() {
  router.push({ name: 'agenda' })
}

function formatEventDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function eventTypeLabel(item) {
  return {
    rendez_vous: 'Rendez-vous',
    facture: 'Facture',
    devis: 'Devis',
    achat: item?.source === 'achat_demande' ? 'Demande d’achat' : 'Achat fournisseur',
    fournisseur: 'Facture fournisseur',
    leasing: item?.source === 'leasing_releve' ? 'Relevé leasing' : 'Contrat leasing',
    intervention: 'Intervention',
    caisse: 'Caisse',
  }[item?.type] || 'Événement'
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
</script>
