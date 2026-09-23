<template>
  <div class="app-surface space-y-4">
    <div class="rounded-xl border border-xelltekk-100 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-xelltekk-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button type="button" class="mb-2 text-sm font-semibold text-xelltekk-700 hover:underline" @click="goBack">
            ← Retour liste
          </button>
          <p class="text-xs font-bold uppercase tracking-[0.35em] text-xelltekk-600">Prospection</p>
          <h2 class="mt-1 text-2xl font-black text-slate-900">
            {{ isCreate ? 'Nouveau prospect' : prospect?.nom || 'Fiche prospect' }}
          </h2>
          <p class="text-sm text-slate-500">
            {{ isCreate ? 'Créer un prospect et préparer le suivi commercial.' : `${prospect?.code || '-'} · ${prospect?.email || prospect?.telephone || 'Contact à compléter'}` }}
          </p>
        </div>
        <div v-if="!isCreate && prospect" class="flex flex-wrap gap-2">
          <EmailActionButtons
            v-if="prospect.email"
            :draft="relanceEmailDraft(prospect)"
            :filename="`relance-prospect-${prospect.code || prospect.id}`"
            dialog
            compact
          />
          <button type="button" class="btn-secondary" @click="openActionForm()">+ Action</button>
          <button type="button" class="btn-secondary" @click="creerDevis">+ Devis</button>
          <button v-if="prospect.type === 'prospect'" type="button" class="btn-primary" @click="convertirProspect">
            Convertir en client
          </button>
        </div>
      </div>

      <div class="flex overflow-x-auto border-b border-xelltekk-100 bg-xelltekk-50/40 px-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="whitespace-nowrap px-4 py-3 text-sm font-bold"
          :class="activeTab === tab.id ? 'border-b-2 border-xelltekk-600 text-xelltekk-700' : 'text-slate-500 hover:text-xelltekk-700'"
          @click="setTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="rounded-xl border border-xelltekk-100 bg-white p-10 text-center text-slate-500">
      Chargement de la fiche prospect...
    </div>

    <div v-else-if="activeTab === 'fiche' && prospect" class="grid gap-4 xl:grid-cols-[1fr_380px]">
      <section class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm">
        <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-xelltekk-600">Fiche prospect</p>
            <h3 class="text-xl font-black text-slate-900">{{ prospect.nom }}</h3>
            <p class="text-sm text-slate-500">{{ prospect.secteur_activite || 'Secteur non renseigné' }}</p>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-bold" :class="priorityClass(prospectPriority)">
            {{ priorityLabel(prospectPriority) }}
          </span>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <InfoCard label="Code" :value="prospect.code" />
          <InfoCard label="Statut" :value="prospect.statut" />
          <InfoCard label="Commercial" :value="prospect.commercial?.name || 'Non affecté'" />
          <InfoCard label="Ville / pays" :value="[prospect.ville, prospect.pays].filter(Boolean).join(' · ') || '-'" />
          <InfoCard label="Téléphone" :value="prospect.telephone || prospect.mobile || '-'" />
          <InfoCard label="Email" :value="prospect.email || '-'" />
          <InfoCard label="NINEA" :value="prospect.ninea || '-'" />
          <InfoCard label="RCCM" :value="prospect.rccm || '-'" />
        </div>

        <div class="mt-4 rounded-xl border border-xelltekk-100 bg-xelltekk-50/60 p-4">
          <h4 class="font-bold text-slate-900">Notes internes</h4>
          <p class="mt-1 whitespace-pre-line text-sm text-slate-600">{{ prospect.notes_privees || 'Aucune note interne.' }}</p>
        </div>
      </section>

      <aside class="space-y-4">
        <section class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-[0.3em] text-xelltekk-600">Dernière action</p>
          <div v-if="latestAction" class="mt-3 space-y-2">
            <div class="font-bold text-slate-900">{{ latestAction.objet }}</div>
            <div class="text-sm text-slate-500">{{ typeActionLabel(latestAction.type_action) }} · {{ formatDateTime(latestAction.date_action) }}</div>
            <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold" :class="resultatClass(latestAction.resultat)">
              {{ resultatLabel(latestAction.resultat) }}
            </span>
            <p v-if="latestAction.prochaine_etape" class="text-sm text-slate-600">{{ latestAction.prochaine_etape }}</p>
          </div>
          <p v-else class="mt-3 text-sm text-slate-500">Aucune action enregistrée.</p>
        </section>

        <section class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-[0.3em] text-xelltekk-600">Prochaine relance</p>
          <div v-if="nextReminder" class="mt-3">
            <div class="font-bold" :class="isLate(nextReminder.date_relance, nextReminder.statut) ? 'text-red-700' : 'text-slate-900'">
              {{ formatDateTime(nextReminder.date_relance) }}
            </div>
            <p class="text-sm text-slate-500">{{ nextReminder.objet }}</p>
          </div>
          <p v-else class="mt-3 text-sm text-slate-500">Aucune relance planifiée.</p>
        </section>
      </aside>
    </div>

    <section v-else-if="activeTab === 'saisie'" class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm">
      <ClientForm :client="formClient" :submit-label="isCreate ? 'Créer le prospect' : 'Modifier le prospect'" @saved="onProspectSaved" @cancel="goBack" />
    </section>

    <section v-else-if="activeTab === 'actions' && prospect" class="space-y-4">
      <div class="rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-xelltekk-600">Actions & relances</p>
            <h3 class="text-xl font-black text-slate-900">Suivi commercial</h3>
          </div>
          <button type="button" class="btn-primary" @click="openActionForm()">+ Nouvelle action</button>
        </div>

        <form v-if="actionFormOpen" class="mt-4 rounded-xl border border-xelltekk-100 bg-xelltekk-50/50 p-4" @submit.prevent="saveAction">
          <div class="grid gap-3 md:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-bold text-slate-700">Type d’action</span>
              <select v-model="actionForm.type_action" class="input">
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
              <select v-model="actionForm.statut" class="input">
                <option value="planifiee">Planifiée</option>
                <option value="effectuee">Effectuée</option>
                <option value="annulee">Annulée</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-bold text-slate-700">Date de l’action</span>
              <input v-model="actionForm.date_action" required type="datetime-local" class="input" />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-bold text-slate-700">Prochaine relance</span>
              <input v-model="actionForm.date_relance" type="datetime-local" class="input" />
            </label>
            <label class="block md:col-span-2">
              <span class="mb-1 block text-sm font-bold text-slate-700">Objet</span>
              <input v-model="actionForm.objet" required class="input" placeholder="Objet de l’action" />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-bold text-slate-700">Montant potentiel</span>
              <input v-model.number="actionForm.montant_potentiel" type="number" min="0" step="1" class="input" />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-bold text-slate-700">Résultat</span>
              <select v-model="actionForm.resultat" class="input">
                <option value="aucun">Aucun</option>
                <option value="interesse">Intéressé</option>
                <option value="a_relancer">À relancer</option>
                <option value="devis_a_faire">Devis à faire</option>
                <option value="converti">Converti</option>
                <option value="perdu">Perdu</option>
              </select>
            </label>
            <label class="block md:col-span-2">
              <span class="mb-1 block text-sm font-bold text-slate-700">Prochaine étape</span>
              <input v-model="actionForm.prochaine_etape" class="input" placeholder="Ex. Envoyer une offre, rappeler mardi..." />
            </label>
            <label class="block md:col-span-2">
              <span class="mb-1 block text-sm font-bold text-slate-700">Compte rendu</span>
              <textarea v-model="actionForm.compte_rendu" rows="3" class="input"></textarea>
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2 border-t border-xelltekk-100 pt-3">
            <button type="button" class="btn-secondary" @click="closeActionForm">Annuler</button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Enregistrement...' : editingActionId ? 'Mettre à jour' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>

      <div class="rounded-xl border border-xelltekk-100 bg-white shadow-sm">
        <div v-if="actionsLoading" class="p-8 text-center text-slate-500">Chargement des actions...</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-xelltekk-100 bg-xelltekk-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">Date</th>
                <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">Action</th>
                <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">Relance</th>
                <th class="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-600">Potentiel</th>
                <th class="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-600">Statut</th>
                <th class="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-xelltekk-100">
              <tr v-for="action in actions" :key="action.id" class="hover:bg-xelltekk-50/50">
                <td class="px-4 py-3 text-sm text-slate-600">{{ formatDateTime(action.date_action) }}</td>
                <td class="px-4 py-3">
                  <div class="font-bold text-slate-900">{{ action.objet }}</div>
                  <div class="text-xs text-slate-500">{{ typeActionLabel(action.type_action) }} · {{ resultatLabel(action.resultat) }}</div>
                  <div v-if="action.prochaine_etape" class="text-xs text-slate-500">{{ action.prochaine_etape }}</div>
                </td>
                <td class="px-4 py-3 text-sm" :class="isLate(action.date_relance, action.statut) ? 'font-bold text-red-700' : 'text-slate-600'">
                  {{ formatDateTime(action.date_relance) }}
                </td>
                <td class="px-4 py-3 text-right font-mono font-bold text-xelltekk-700">{{ formatPrice(action.montant_potentiel) }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="rounded-full px-3 py-1 text-xs font-bold" :class="statutActionClass(action.statut)">
                    {{ statutActionLabel(action.statut) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex flex-wrap justify-end gap-2">
                    <button type="button" class="text-sm font-bold text-xelltekk-700 hover:underline" @click="openActionForm(action)">Modifier</button>
                    <button v-if="action.statut !== 'effectuee'" type="button" class="text-sm font-bold text-emerald-700 hover:underline" @click="markActionDone(action)">Terminer</button>
                    <button type="button" class="text-sm font-bold text-red-600 hover:underline" @click="deleteAction(action)">Suppr.</button>
                  </div>
                </td>
              </tr>
              <tr v-if="actions.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">Aucune action enregistrée.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-else-if="activeTab === 'historique' && prospect" class="grid gap-4 xl:grid-cols-2">
      <HistoryPanel title="Devis liés" :items="history.devis" empty="Aucun devis lié.">
        <template #default="{ item }">
          <button type="button" class="font-bold text-xelltekk-700 hover:underline" @click="router.push({ name: 'devis-detail', params: { id: item.id } })">
            {{ item.numero }}
          </button>
          <div class="text-sm text-slate-500">{{ formatDate(item.date_devis) }} · {{ formatPrice(item.total_ttc) }} XOF</div>
        </template>
      </HistoryPanel>
      <HistoryPanel title="Factures liées" :items="history.factures" empty="Aucune facture liée.">
        <template #default="{ item }">
          <button type="button" class="font-bold text-xelltekk-700 hover:underline" @click="router.push({ name: 'facture-detail', params: { id: item.id } })">
            {{ item.numero }}
          </button>
          <div class="text-sm text-slate-500">{{ formatDate(item.date_facture) }} · {{ formatPrice(item.total_ttc) }} XOF</div>
        </template>
      </HistoryPanel>
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import ClientForm from '@/components/ClientForm.vue'
import EmailActionButtons from '@/components/EmailActionButtons.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { buildEmailDraft } from '@/utils/emailComposer'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const prospect = ref(null)
const actions = ref([])
const loading = ref(false)
const actionsLoading = ref(false)
const saving = ref(false)
const activeTab = ref(String(route.query.tab || 'fiche'))
const actionFormOpen = ref(false)
const editingActionId = ref(null)

const isCreate = computed(() => route.name === 'prospect-create')
const prospectId = computed(() => route.params.id)
const history = computed(() => prospect.value?.historique || {})
const latestAction = computed(() => actions.value[0] || null)
const nextReminder = computed(() =>
  actions.value
    .filter(action => action.date_relance && action.statut !== 'effectuee')
    .sort((a, b) => new Date(a.date_relance) - new Date(b.date_relance))[0] || null
)
const prospectPriority = computed(() => priorityFromAction(latestAction.value))

const formClient = computed(() => {
  if (isCreate.value) {
    return { type: 'prospect', statut: 'actif', pays: 'Sénégal' }
  }
  return prospect.value
})

const tabs = computed(() => {
  if (isCreate.value) {
    return [{ id: 'saisie', label: 'Saisie prospect' }]
  }
  return [
    { id: 'fiche', label: 'Fiche' },
    { id: 'saisie', label: 'Saisie prospect' },
    { id: 'actions', label: `Actions (${actions.value.length})` },
    { id: 'historique', label: 'Historique' },
  ]
})

const actionForm = reactive({
  client_id: null,
  commercial_id: null,
  type_action: 'appel',
  statut: 'planifiee',
  date_action: '',
  date_relance: '',
  objet: '',
  compte_rendu: '',
  resultat: 'aucun',
  montant_potentiel: 0,
  prochaine_etape: '',
})

const InfoCard = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: '-' },
  },
  setup(props) {
    return () => h('div', { class: 'rounded-xl border border-xelltekk-100 bg-xelltekk-50/50 p-3' }, [
      h('div', { class: 'text-xs font-bold uppercase tracking-wide text-slate-500' }, props.label),
      h('div', { class: 'mt-1 font-bold text-slate-900' }, props.value || '-'),
    ])
  },
})

const HistoryPanel = defineComponent({
  props: {
    title: { type: String, required: true },
    items: { type: Array, default: () => [] },
    empty: { type: String, default: 'Aucun élément.' },
  },
  setup(props, { slots }) {
    return () => h('section', { class: 'rounded-xl border border-xelltekk-100 bg-white p-4 shadow-sm' }, [
      h('h3', { class: 'text-lg font-black text-slate-900' }, props.title),
      props.items.length
        ? h('div', { class: 'mt-3 divide-y divide-xelltekk-100' }, props.items.map(item =>
            h('div', { class: 'py-3' }, slots.default?.({ item }))
          ))
        : h('p', { class: 'mt-4 text-sm text-slate-500' }, props.empty),
    ])
  },
})

watch(() => route.query.tab, (tab) => {
  if (tab) activeTab.value = String(tab)
})

watch(() => route.query.new_action, (value) => {
  if (value && prospect.value) {
    activeTab.value = 'actions'
    openActionForm()
  }
})

watch(() => route.query.action_id, (value) => {
  if (value && actions.value.length) {
    const action = actions.value.find(item => Number(item.id) === Number(value))
    if (action) {
      activeTab.value = 'actions'
      openActionForm(action)
    }
  }
})

onMounted(async () => {
  if (isCreate.value) {
    activeTab.value = 'saisie'
    return
  }
  await loadProspect()
})

async function loadProspect() {
  loading.value = true
  try {
    const { data } = await api.get(`/clients/${prospectId.value}`)
    prospect.value = data
    await loadActions()

    if (route.query.new_action) {
      activeTab.value = 'actions'
      openActionForm()
    }
    if (route.query.action_id) {
      const action = actions.value.find(item => Number(item.id) === Number(route.query.action_id))
      if (action) {
        activeTab.value = 'actions'
        openActionForm(action)
      }
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Impossible de charger le prospect')
    router.push({ name: 'prospection' })
  } finally {
    loading.value = false
  }
}

async function loadActions() {
  if (!prospectId.value) return
  actionsLoading.value = true
  try {
    const { data } = await api.get('/prospection/actions', {
      params: { client_id: prospectId.value, per_page: 100 },
    })
    actions.value = data.data || []
  } catch (e) {
    toast.error(e.response?.data?.message || 'Impossible de charger les actions')
  } finally {
    actionsLoading.value = false
  }
}

function setTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

function goBack() {
  router.push({ name: 'prospection' })
}

function onProspectSaved(saved) {
  const id = saved.id || prospect.value?.id
  toast.success(isCreate.value ? 'Prospect créé.' : 'Prospect mis à jour.')
  if (isCreate.value && id) {
    router.push({ name: 'prospect-detail', params: { id }, query: { tab: 'fiche' } })
    return
  }
  loadProspect()
  activeTab.value = 'fiche'
}

function openActionForm(action = null) {
  editingActionId.value = action?.id || null
  Object.assign(actionForm, {
    client_id: prospect.value?.id || null,
    commercial_id: action?.commercial_id || prospect.value?.commercial_id || null,
    type_action: action?.type_action || 'appel',
    statut: action?.statut || 'planifiee',
    date_action: inputDateTime(action?.date_action) || new Date().toISOString().slice(0, 16),
    date_relance: inputDateTime(action?.date_relance),
    objet: action?.objet || `Relance ${prospect.value?.nom || ''}`.trim(),
    compte_rendu: action?.compte_rendu || '',
    resultat: action?.resultat || 'aucun',
    montant_potentiel: Number(action?.montant_potentiel || 0),
    prochaine_etape: action?.prochaine_etape || '',
  })
  actionFormOpen.value = true
  activeTab.value = 'actions'
}

function closeActionForm() {
  actionFormOpen.value = false
  editingActionId.value = null
}

async function saveAction() {
  saving.value = true
  try {
    const payload = {
      ...actionForm,
      client_id: prospect.value.id,
      commercial_id: actionForm.commercial_id || undefined,
      date_relance: actionForm.date_relance || null,
      compte_rendu: actionForm.compte_rendu || null,
      prochaine_etape: actionForm.prochaine_etape || null,
    }

    if (editingActionId.value) {
      await api.put(`/prospection/actions/${editingActionId.value}`, payload)
      toast.success('Action mise à jour')
    } else {
      await api.post('/prospection/actions', payload)
      toast.success('Action enregistrée')
    }

    closeActionForm()
    await loadActions()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Erreur enregistrement')
  } finally {
    saving.value = false
  }
}

async function markActionDone(action) {
  try {
    await api.put(`/prospection/actions/${action.id}`, {
      client_id: action.client_id || prospect.value.id,
      commercial_id: action.commercial_id || undefined,
      type_action: action.type_action,
      statut: 'effectuee',
      date_action: action.date_action,
      date_relance: action.date_relance || null,
      objet: action.objet,
      compte_rendu: action.compte_rendu || action.prochaine_etape || null,
      resultat: action.resultat || 'aucun',
      montant_potentiel: action.montant_potentiel || 0,
      prochaine_etape: action.prochaine_etape || null,
    })
    toast.success('Action terminée')
    await loadActions()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Impossible de terminer l’action')
  }
}

async function deleteAction(action) {
  const confirmed = await askConfirm({
    title: 'Supprimer l’action',
    message: `Supprimer l’action « ${action.objet || 'prospection'} » ?`,
    confirmLabel: 'Supprimer',
    tone: 'danger',
  })
  if (!confirmed) return

  try {
    await api.delete(`/prospection/actions/${action.id}`)
    toast.success('Action supprimée')
    await loadActions()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Suppression impossible')
  }
}

async function convertirProspect() {
  if (!prospect.value?.id) return
  const confirmed = await askConfirm({
    title: 'Convertir en client',
    message: `Convertir « ${prospect.value.nom} » en client ?`,
    hint: 'Le prospect quittera le pipeline, mais son historique sera conservé.',
    confirmLabel: 'Convertir',
    tone: 'primary',
  })
  if (!confirmed) return

  try {
    await api.post(`/prospection/prospects/${prospect.value.id}/convertir-client`)
    toast.success('Prospect converti en client.')
    await loadProspect()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Conversion impossible')
  }
}

function creerDevis() {
  if (!prospect.value?.id) return
  router.push({ name: 'devis-create', query: { client_id: prospect.value.id } })
}

function relanceEmailDraft(item) {
  return buildEmailDraft({
    to: item.email,
    subject: `Relance commerciale - ${item.nom}`,
    body:
      `Bonjour,\n\nJe me permets de revenir vers vous concernant votre besoin.\n\n` +
      `Nous restons disponibles pour échanger et vous proposer la solution la plus adaptée.\n\n` +
      `Cordialement,\nXELLTEKK`,
    context_type: 'prospection',
    context_id: item.id,
  })
}

function priorityFromAction(action) {
  if (!action) return 'nouveau'
  if (action.resultat === 'converti') return 'gagne'
  if (action.resultat === 'perdu' || action.statut === 'annulee') return 'perdu'
  if (isLate(action.date_relance, action.statut)) return 'retard'
  if (action.resultat === 'devis_a_faire' || action.type_action === 'devis') return 'devis'
  if (action.resultat === 'interesse' || Number(action.montant_potentiel || 0) > 0) return 'chaud'
  return 'suivi'
}

function priorityLabel(priority) {
  return {
    nouveau: 'Nouveau',
    retard: 'En retard',
    devis: 'Devis',
    chaud: 'Chaud',
    suivi: 'Suivi',
    gagne: 'Gagné',
    perdu: 'Perdu',
  }[priority] || 'Suivi'
}

function priorityClass(priority) {
  return {
    nouveau: 'bg-slate-100 text-slate-700',
    retard: 'bg-red-100 text-red-700',
    devis: 'bg-purple-100 text-purple-700',
    chaud: 'bg-amber-100 text-amber-700',
    suivi: 'bg-blue-100 text-blue-700',
    gagne: 'bg-green-100 text-green-700',
    perdu: 'bg-gray-200 text-gray-700',
  }[priority] || 'bg-gray-100 text-gray-700'
}

function resultatLabel(resultat) {
  return {
    interesse: 'Intéressé',
    a_relancer: 'À relancer',
    devis_a_faire: 'Devis',
    converti: 'Converti',
    perdu: 'Perdu',
    aucun: 'Aucun',
  }[resultat] || 'Aucun'
}

function resultatClass(resultat) {
  return {
    interesse: 'bg-amber-100 text-amber-800',
    a_relancer: 'bg-blue-100 text-blue-800',
    devis_a_faire: 'bg-purple-100 text-purple-800',
    converti: 'bg-green-100 text-green-800',
    perdu: 'bg-gray-200 text-gray-700',
    aucun: 'bg-slate-100 text-slate-600',
  }[resultat] || 'bg-slate-100 text-slate-600'
}

function typeActionLabel(t) {
  return { appel: 'Appel', email: 'Email', visite: 'Visite', whatsapp: 'WhatsApp', relance: 'Relance', devis: 'Devis', autre: 'Autre' }[t] || t
}
function statutActionLabel(s) {
  return { planifiee: 'Planifiée', effectuee: 'Effectuée', annulee: 'Annulée' }[s] || s
}
function statutActionClass(s) {
  return { planifiee: 'bg-yellow-100 text-yellow-800', effectuee: 'bg-green-100 text-green-800', annulee: 'bg-gray-200 text-gray-700' }[s] || 'bg-gray-100'
}
function inputDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '-' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '-' }
function isLate(date, statut) { return date && statut !== 'effectuee' && new Date(date) < new Date() }
</script>
