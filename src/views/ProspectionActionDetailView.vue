<template>
  <div class="app-surface space-y-4">
    <div class="rounded-xl border border-xelltekk-100 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-xelltekk-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button type="button" class="mb-2 text-sm font-semibold text-xelltekk-700 hover:underline" @click="goBack">
            ← Retour prospection
          </button>
          <p class="text-xs font-bold uppercase tracking-[0.35em] text-xelltekk-600">Action prospection</p>
          <h2 class="mt-1 text-2xl font-black text-slate-900">
            {{ isCreate ? 'Nouvelle action' : form.objet || 'Modifier action' }}
          </h2>
          <p class="text-sm text-slate-500">
            Planification, relance, compte rendu et potentiel commercial.
          </p>
        </div>
        <button v-if="form.client_id" type="button" class="btn-secondary" @click="openProspect">
          Ouvrir la fiche prospect
        </button>
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
      Chargement de l’action...
    </div>

    <form v-else-if="activeTab === 'saisie'" class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm" @submit.prevent="saveAction">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-bold text-slate-700">Prospect / client concerné *</span>
          <ClientSearchSelect v-model="form.client_id" required placeholder="Rechercher le prospect..." />
        </label>

        <label v-if="isAdmin" class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Commercial</span>
          <select v-model.number="form.commercial_id" class="input">
            <option :value="null">Commercial...</option>
            <option v-for="c in commerciaux" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Type d’action</span>
          <select v-model="form.type_action" class="input">
            <option value="appel">Appel</option>
            <option value="email">Email</option>
            <option value="visite">Visite</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="relance">Relance</option>
            <option value="devis">Devis à préparer</option>
            <option value="autre">Autre</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Statut</span>
          <select v-model="form.statut" class="input">
            <option value="planifiee">Planifiée</option>
            <option value="effectuee">Effectuée</option>
            <option value="annulee">Annulée</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Résultat</span>
          <select v-model="form.resultat" class="input">
            <option value="aucun">Aucun</option>
            <option value="interesse">Intéressé</option>
            <option value="a_relancer">À relancer</option>
            <option value="devis_a_faire">Devis à faire</option>
            <option value="converti">Converti</option>
            <option value="perdu">Perdu</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Date de l’action *</span>
          <input v-model="form.date_action" required type="datetime-local" class="input" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Prochaine relance</span>
          <input v-model="form.date_relance" type="datetime-local" class="input" />
        </label>

        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-bold text-slate-700">Objet *</span>
          <input v-model="form.objet" required class="input" placeholder="Ex. Relance proposition commerciale" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-bold text-slate-700">Montant potentiel</span>
          <input v-model.number="form.montant_potentiel" type="number" min="0" step="1" class="input" />
        </label>

        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-bold text-slate-700">Prochaine étape</span>
          <input v-model="form.prochaine_etape" class="input" placeholder="Ex. Envoyer une offre, rappeler mardi..." />
        </label>

        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-bold text-slate-700">Compte rendu</span>
          <textarea v-model="form.compte_rendu" rows="4" class="input" placeholder="Compte rendu de l’échange..."></textarea>
        </label>
      </div>

      <div class="mt-4 flex justify-end gap-2 border-t border-xelltekk-100 pt-4">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button type="submit" :disabled="saving" class="btn-primary">
          {{ saving ? 'Enregistrement...' : isCreate ? 'Créer l’action' : 'Mettre à jour' }}
        </button>
      </div>
    </form>

    <section v-else class="grid gap-4 lg:grid-cols-3">
      <div class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-[0.3em] text-xelltekk-600">Statut</p>
        <div class="mt-2 text-2xl font-black text-slate-900">{{ statutActionLabel(form.statut) }}</div>
      </div>
      <div class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-[0.3em] text-xelltekk-600">Relance</p>
        <div class="mt-2 text-2xl font-black text-slate-900">{{ formatDateTime(form.date_relance) }}</div>
      </div>
      <div class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-[0.3em] text-xelltekk-600">Potentiel</p>
        <div class="mt-2 text-2xl font-black text-slate-900">{{ formatPrice(form.montant_potentiel) }} XOF</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import ClientSearchSelect from '@/components/ClientSearchSelect.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { hasAnyRole } from '@/utils/access'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const isCreate = computed(() => route.name === 'prospection-action-create')
const isAdmin = computed(() => hasAnyRole(auth.user, ['admin', 'gerant']))
const tabs = [
  { id: 'saisie', label: 'Saisie action' },
  { id: 'contexte', label: 'Contexte' },
]

const activeTab = ref('saisie')
const loading = ref(false)
const saving = ref(false)
const commerciaux = ref([])
const form = reactive(defaultForm())

onMounted(async () => {
  await loadCommerciaux()

  if (isCreate.value) {
    Object.assign(form, defaultForm(), {
      client_id: route.query.client_id ? Number(route.query.client_id) : null,
    })
    return
  }

  await loadAction()
})

function defaultForm() {
  return {
    client_id: null,
    commercial_id: null,
    type_action: 'appel',
    statut: 'planifiee',
    date_action: new Date().toISOString().slice(0, 16),
    date_relance: '',
    objet: '',
    compte_rendu: '',
    resultat: 'aucun',
    montant_potentiel: 0,
    prochaine_etape: '',
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

async function loadAction() {
  loading.value = true
  try {
    const { data } = await api.get(`/prospection/actions/${route.params.id}`)
    Object.assign(form, {
      client_id: data.client_id || data.client?.id || null,
      commercial_id: data.commercial_id || data.commercial?.id || null,
      type_action: data.type_action || 'appel',
      statut: data.statut || 'planifiee',
      date_action: inputDateTime(data.date_action) || new Date().toISOString().slice(0, 16),
      date_relance: inputDateTime(data.date_relance),
      objet: data.objet || '',
      compte_rendu: data.compte_rendu || '',
      resultat: data.resultat || 'aucun',
      montant_potentiel: Number(data.montant_potentiel || 0),
      prochaine_etape: data.prochaine_etape || '',
    })
  } catch (e) {
    toast.error(e.response?.data?.message || 'Impossible de charger l’action')
    goBack()
  } finally {
    loading.value = false
  }
}

async function saveAction() {
  saving.value = true
  try {
    const payload = {
      ...form,
      commercial_id: form.commercial_id || undefined,
      date_relance: form.date_relance || null,
      compte_rendu: form.compte_rendu || null,
      prochaine_etape: form.prochaine_etape || null,
    }

    if (isCreate.value) {
      const { data } = await api.post('/prospection/actions', payload)
      toast.success('Action enregistrée')
      router.push({ name: 'prospection-action-detail', params: { id: data.id } })
    } else {
      await api.put(`/prospection/actions/${route.params.id}`, payload)
      toast.success('Action mise à jour')
      goBack()
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur enregistrement')
  } finally {
    saving.value = false
  }
}

function openProspect() {
  if (!form.client_id) return
  router.push({ name: 'prospect-detail', params: { id: form.client_id }, query: { tab: 'actions' } })
}

function goBack() {
  router.push({ name: 'prospection', query: { tab: 'actions' } })
}

function inputDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '-' }
function statutActionLabel(s) { return { planifiee: 'Planifiée', effectuee: 'Effectuée', annulee: 'Annulée' }[s] || s }
</script>
