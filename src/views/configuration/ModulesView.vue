<template>
  <div class="mx-auto max-w-7xl space-y-7">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div><p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Configuration</p><h1 class="mt-1 text-2xl font-semibold text-slate-900">Modules</h1><p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Choisissez les fonctionnalités de votre société. Les données sont conservées lors d’une désactivation.</p></div>
      <button type="button" :disabled="loading" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" @click="load"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />Actualiser</button>
    </header>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="loading && !catalogue.length" role="status" class="py-12 text-center text-sm text-slate-500">Chargement des modules…</p>
    <template v-else>
      <div v-if="catalogue.length" class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4"><span class="text-sm text-slate-500">{{ catalogue.length }} modules · {{ enabledCount }} activés</span><label class="relative"><Search class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input v-model="query" type="search" placeholder="Rechercher un module…" aria-label="Rechercher un module" class="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm sm:w-72" /></label></div>
      <section v-for="family in families" :key="family.name" class="space-y-4"><h2 class="text-base font-semibold text-slate-800">{{ family.name }}</h2><div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><ModuleCard v-for="module in family.modules" :key="module.key" :module="module" :busy="busyKey === module.key" @toggle="previewChange" @details="showDetails" @configure="configure" /></div></section>
      <p v-if="catalogue.length && !families.length" class="py-8 text-center text-sm text-slate-500">Aucun module ne correspond à votre recherche.</p>
      <section class="rounded-2xl border border-slate-200 bg-white">
        <div class="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><History class="h-4 w-4 text-slate-500" /><h2 class="font-semibold text-slate-800">Historique des changements</h2></div>
        <p v-if="!modules.events.length" class="p-5 text-sm text-slate-500">Aucun changement enregistré.</p>
        <div v-else class="hidden overflow-x-auto sm:block"><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-xs text-slate-500"><tr><th class="px-5 py-3">Date</th><th class="px-5 py-3">Module</th><th class="px-5 py-3">Action</th><th class="px-5 py-3">Administrateur</th></tr></thead><tbody class="divide-y divide-slate-100"><tr v-for="event in modules.events" :key="event.id"><td class="whitespace-nowrap px-5 py-3 text-slate-600">{{ formatDate(event.occurred_at) }}</td><td class="px-5 py-3">{{ moduleName(event.module_key) }}</td><td class="px-5 py-3">{{ actionLabel(event.action) }}</td><td class="px-5 py-3 text-slate-600">{{ event.actor_name || (event.actor_id ? `Administrateur #${event.actor_id}` : 'Système') }}</td></tr></tbody></table></div>
        <div v-if="modules.events.length" class="divide-y divide-slate-100 sm:hidden"><article v-for="event in modules.events" :key="event.id" class="space-y-2 p-5 text-sm"><p class="font-semibold text-slate-800 [overflow-wrap:anywhere]">{{ moduleName(event.module_key) }}</p><p class="text-slate-600">{{ actionLabel(event.action) }} · {{ formatDate(event.occurred_at) }}</p><p class="text-slate-500">{{ event.actor_name || (event.actor_id ? `Administrateur #${event.actor_id}` : 'Système') }}</p></article></div>
      </section>
    </template>
    <ModuleDetailsDialog v-if="detailsModule" :module="detailsModule" :catalogue="catalogue" :settings-message="settingsMessage" @close="detailsModule = null" />
    <ModuleChangeDialog v-if="change" :module="change.module" :preview="change.preview" :catalogue="catalogue" :busy="applying" :error="changeError" @close="closeChange" @confirm="applyChange" />
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshCw, Search, History } from 'lucide-vue-next'
import { useModulesStore } from '@/stores/modules'
import { useAuthStore } from '@/stores/auth'
import { isXelltekkAdmin } from '@/utils/platformAccess'
import { useToast } from '@/composables/useToast'
import { configurationTarget } from '@/module-system/modulePolicy.mjs'
import api from '@/services/api'
import ModuleCard from '@/components/modules/ModuleCard.vue'
import ModuleDetailsDialog from '@/components/modules/ModuleDetailsDialog.vue'
import ModuleChangeDialog from '@/components/modules/ModuleChangeDialog.vue'

const modules = useModulesStore()
const auth = useAuthStore()
const catalogue = computed(() => modules.catalogue.filter(module => (module.scope !== 'platform' && module.key !== 'xelltekk_admin') || isXelltekkAdmin(auth.user)))
const router = useRouter()
const toast = useToast()
const query = ref('')
const loading = ref(false)
const error = ref('')
const busyKey = ref('')
const applying = ref(false)
const detailsModule = ref(null)
const settingsMessage = ref('')
const change = ref(null)
const changeError = ref('')
const enabledCount = computed(() => catalogue.value.filter(module => module.enabled).length)
const families = computed(() => {
  const groups = new Map()
  const term = query.value.trim().toLocaleLowerCase('fr')
  for (const module of catalogue.value) {
    if (term && !`${module.name} ${module.description} ${module.key}`.toLocaleLowerCase('fr').includes(term)) continue
    const family = typeof module.family === 'object' ? module.family?.name || module.family?.label : module.family
    const name = family || 'Autres modules'
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(module)
  }
  return [...groups].map(([name, items]) => ({ name, modules: items }))
})

// Affiche le message contrôlé de l'API sans présenter de détails techniques bruts.
function errorMessage(cause, fallback) { return typeof cause.response?.data?.message === 'string' ? cause.response.data.message : fallback }
// Recharge le catalogue administrateur ; un échec ne transforme jamais un module en OFF.
async function load() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try { await modules.fetchAdministration() } catch (cause) { error.value = errorMessage(cause, 'Impossible de charger les modules. Réessayez dans un instant.') } finally { loading.value = false }
}
// Ouvre les détails dans une fenêtre dont le contenu reste purement déclaratif.
function showDetails(module) { settingsMessage.value = ''; detailsModule.value = module }
// Utilise exclusivement les vraies pages locales ; sinon explique l'absence de réglages.
async function configure(module) {
  const target = configurationTarget(module)
  if (target) { await router.push(target); return }
  busyKey.value = module.key
  try {
    await api.get(`/configuration/modules/${encodeURIComponent(module.key)}/settings`)
    settingsMessage.value = 'Ce module ne dispose pas de paramètres dédiés pour le moment.'
    detailsModule.value = module
  } catch (cause) { toast.error(errorMessage(cause, 'Impossible de consulter les paramètres du module.')) } finally { busyKey.value = '' }
}
// Prépare un identifiant stable, réutilisé si la confirmation doit être renvoyée.
function requestId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, value => (Number(value) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(value) / 4).toString(16))
}
// Demande au serveur les dépendances et blocages avant toute mutation.
async function previewChange(module) {
  if (busyKey.value || applying.value || module.core || !module.activation_ready || !module.manageable || (!module.licensed && !module.enabled)) return
  busyKey.value = module.key
  changeError.value = ''
  try {
    const preview = await modules.previewChange(module.key, !module.enabled)
    change.value = { module, preview, requestId: requestId() }
  } catch (cause) { toast.error(errorMessage(cause, 'Impossible de préparer ce changement.')); if (cause.response?.status === 409) await load() } finally { busyKey.value = '' }
}
// Ferme une demande lorsqu'aucune application n'est en cours.
function closeChange() { if (!applying.value) change.value = null }
// Confirme exactement la révision et les dépendances présentées par le serveur.
async function applyChange() {
  if (applying.value || !change.value?.preview.can_apply) return
  const current = change.value
  applying.value = true
  changeError.value = ''
  try {
    const result = await modules.applyChange({
      key: current.module.key,
      enabled: current.preview.enabled,
      expected_revision: current.preview.revision,
      request_id: current.requestId,
      confirmed_dependencies: current.preview.dependencies_to_enable || [],
    })
    if (result) { change.value = null; toast.success('La configuration des modules a été mise à jour.'); await load() }
  } catch (cause) {
    changeError.value = errorMessage(cause, 'Le résultat du changement n’a pas pu être confirmé. Réessayez avec cette même demande.')
    if (cause.response?.status === 409) { change.value = null; toast.info('La configuration a changé. Vérifiez le catalogue puis recommencez.'); await load() }
  } finally { applying.value = false }
}
// Rend les entrées d'audit lisibles sans exposer leurs états internes.
function moduleName(key) { return catalogue.value.find(module => module.key === key)?.name || key }
// Traduit les actions connues et conserve un libellé neutre pour les événements futurs.
function actionLabel(action) { return ({ enable: 'Activé', disable: 'Désactivé', initialize: 'Initialisation', unchanged: 'Sans modification', enabled: 'Activé', disabled: 'Désactivé', activated: 'Activé', deactivated: 'Désactivé', settings_updated: 'Paramètres modifiés' })[action] || 'Configuration modifiée' }
// Formate les dates serveur dans le fuseau de l'utilisateur.
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date) }
onMounted(load)
</script>
