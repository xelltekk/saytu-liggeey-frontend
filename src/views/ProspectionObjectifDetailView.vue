<template>
  <div class="app-surface space-y-4">
    <div class="rounded-xl border border-xelltekk-100 bg-white shadow-sm">
      <div class="border-b border-xelltekk-100 px-4 py-4">
        <button type="button" class="mb-2 text-sm font-semibold text-xelltekk-700 hover:underline" @click="goBack">
          ← Retour prospection
        </button>
        <p class="text-xs font-bold uppercase tracking-[0.35em] text-xelltekk-600">Objectif commercial</p>
        <h2 class="mt-1 text-2xl font-black text-slate-900">
          {{ isCreate ? 'Nouvel objectif' : objectif?.commercial?.name || 'Modifier objectif' }}
        </h2>
        <p class="text-sm text-slate-500">
          Objectifs prospects, actions, devis et chiffre d’affaires.
        </p>
      </div>

      <div class="flex overflow-x-auto border-b border-xelltekk-100 bg-xelltekk-50/40 px-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="whitespace-nowrap px-4 py-3 text-sm font-bold"
          :class="activeTab === tab.id ? 'border-b-2 border-xelltekk-600 text-xelltekk-700' : 'text-slate-500 hover:text-xelltekk-700'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="rounded-xl border border-xelltekk-100 bg-white p-10 text-center text-slate-500">
      Chargement de l’objectif...
    </div>

    <form v-else-if="activeTab === 'saisie'" class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm" @submit.prevent="saveObjectif">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-bold text-slate-700">Commercial *</span>
          <select v-model.number="form.commercial_id" required class="input">
            <option :value="null">Commercial...</option>
            <option v-for="c in commerciaux" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Date début *</span>
          <input v-model="form.periode_debut" required type="date" class="input" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Date fin *</span>
          <input v-model="form.periode_fin" required type="date" class="input" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Objectif prospects</span>
          <input v-model.number="form.objectif_prospects" type="number" min="0" class="input" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Objectif actions</span>
          <input v-model.number="form.objectif_actions" type="number" min="0" class="input" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Objectif devis</span>
          <input v-model.number="form.objectif_devis" type="number" min="0" class="input" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Objectif CA</span>
          <input v-model.number="form.objectif_ca" type="number" min="0" step="1" class="input" />
        </label>

        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-bold text-slate-700">Notes</span>
          <textarea v-model="form.notes" rows="3" class="input" placeholder="Notes internes sur l’objectif..."></textarea>
        </label>
      </div>

      <div class="mt-4 flex justify-end gap-2 border-t border-xelltekk-100 pt-4">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button type="submit" :disabled="saving" class="btn-primary">
          {{ saving ? 'Enregistrement...' : isCreate ? 'Créer l’objectif' : 'Mettre à jour' }}
        </button>
      </div>
    </form>

    <section v-else class="grid gap-4 lg:grid-cols-4">
      <ProgressCard label="Prospects" :value="realisation.prospects" :target="form.objectif_prospects" />
      <ProgressCard label="Actions" :value="realisation.actions" :target="form.objectif_actions" />
      <ProgressCard label="Devis" :value="realisation.devis" :target="form.objectif_devis" />
      <ProgressCard label="CA" :value="realisation.ca" :target="form.objectif_ca" money />
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isCreate = computed(() => route.name === 'prospection-objectif-create')
const tabs = [
  { id: 'saisie', label: 'Saisie objectif' },
  { id: 'realisation', label: 'Réalisation' },
]

const activeTab = ref('saisie')
const loading = ref(false)
const saving = ref(false)
const commerciaux = ref([])
const objectif = ref(null)
const form = reactive(defaultForm())
const realisation = computed(() => objectif.value?.realisation || { prospects: 0, actions: 0, devis: 0, ca: 0 })

const ProgressCard = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], default: 0 },
    target: { type: [Number, String], default: 0 },
    money: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const percent = objectifPercent(props.value, props.target)
      return h('div', { class: 'rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm' }, [
        h('p', { class: 'text-xs font-bold uppercase tracking-[0.3em] text-xelltekk-600' }, props.label),
        h('div', { class: 'mt-2 text-2xl font-black text-slate-900' }, `${displayValue(props.value, props.money)} / ${displayValue(props.target, props.money)}`),
        h('div', { class: 'mt-3 h-2 overflow-hidden rounded-full bg-xelltekk-100' }, [
          h('div', {
            class: 'h-full rounded-full bg-xelltekk-500',
            style: { width: `${Math.min(percent, 100)}%` },
          }),
        ]),
        h('p', { class: 'mt-2 text-sm font-bold text-xelltekk-700' }, `${percent}%`),
      ])
    }
  },
})

onMounted(async () => {
  await loadCommerciaux()
  if (!isCreate.value) {
    await loadObjectif()
  }
})

function defaultForm() {
  const today = new Date()
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const todayIso = today.toISOString().slice(0, 10)

  return {
    commercial_id: null,
    periode_debut: startMonth,
    periode_fin: todayIso,
    objectif_prospects: 0,
    objectif_actions: 0,
    objectif_devis: 0,
    objectif_ca: 0,
    notes: '',
  }
}

async function loadCommerciaux() {
  try {
    const { data } = await api.get('/prospection/commerciaux')
    commerciaux.value = data || []
  } catch {
    commerciaux.value = []
  }
}

async function loadObjectif() {
  loading.value = true
  try {
    const { data } = await api.get(`/prospection/objectifs/${route.params.id}`)
    objectif.value = data
    Object.assign(form, {
      commercial_id: data.commercial_id || data.commercial?.id || null,
      periode_debut: inputDate(data.periode_debut),
      periode_fin: inputDate(data.periode_fin),
      objectif_prospects: Number(data.objectif_prospects || 0),
      objectif_actions: Number(data.objectif_actions || 0),
      objectif_devis: Number(data.objectif_devis || 0),
      objectif_ca: Number(data.objectif_ca || 0),
      notes: data.notes || '',
    })
  } catch (e) {
    toast.error(e.response?.data?.message || 'Impossible de charger l’objectif')
    goBack()
  } finally {
    loading.value = false
  }
}

async function saveObjectif() {
  saving.value = true
  try {
    if (isCreate.value) {
      const { data } = await api.post('/prospection/objectifs', form)
      toast.success('Objectif enregistré')
      router.push({ name: 'prospection-objectif-detail', params: { id: data.id } })
    } else {
      const { data } = await api.put(`/prospection/objectifs/${route.params.id}`, form)
      objectif.value = data
      toast.success('Objectif mis à jour')
      goBack()
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur objectif')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'prospection', query: { tab: 'objectifs' } })
}

function inputDate(value) { return value ? String(value).slice(0, 10) : '' }
function objectifPercent(value, target) {
  const goal = Number(target || 0)
  if (goal <= 0) return Number(value || 0) > 0 ? 100 : 0
  return Math.round((Number(value || 0) / goal) * 100)
}
function displayValue(value, money = false) {
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.round(value || 0))
  return money ? `${formatted} XOF` : formatted
}
</script>
