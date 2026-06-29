<template>
  <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
    <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="font-bold text-slate-900 dark:text-white">Types de conges</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Parametrez les quotas, justificatifs et couleurs.</p>
        </div>
        <button v-if="typeForm.id" type="button" class="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300" @click="resetType">Annuler</button>
      </div>

      <form class="mt-3 grid gap-2 sm:grid-cols-2" @submit.prevent="saveType">
        <input v-model="typeForm.code" class="input" placeholder="Code court" required />
        <input v-model="typeForm.libelle" class="input" placeholder="Libelle" required />
        <label class="label">Couleur<input v-model="typeForm.couleur" type="color" class="input h-11" /></label>
        <label class="label">Jours annuels<input v-model.number="typeForm.jours_annuels" type="number" min="0" max="365" step="0.5" class="input" required /></label>
        <label class="check"><input v-model="typeForm.justificatif_requis" type="checkbox" /> Justificatif requis</label>
        <label class="check"><input v-model="typeForm.is_active" type="checkbox" /> Type actif</label>
        <button class="btn-primary sm:col-span-2" :disabled="saving">{{ typeForm.id ? 'Mettre a jour' : 'Ajouter le type de conge' }}</button>
      </form>

      <div class="mt-4 grid gap-2 sm:grid-cols-[1fr_150px_auto]">
        <input v-model="filters.type_search" class="input" placeholder="Rechercher code ou libelle..." @keyup.enter="load" />
        <select v-model="filters.type_active" class="input" @change="load">
          <option value="">Tous</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>
        <button type="button" class="btn-secondary" @click="load">Actualiser</button>
      </div>

      <div class="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        <div v-for="t in data.types_conges" :key="t.id" class="flex flex-wrap items-center gap-3 py-3 text-sm">
          <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: t.couleur }"></span>
          <div class="min-w-0 flex-1">
            <strong class="text-slate-900 dark:text-white">{{ t.libelle }}</strong>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t.code }} - {{ formatJours(t.jours_annuels) }} jours - {{ t.justificatif_requis ? 'justificatif requis' : 'sans justificatif obligatoire' }}</p>
          </div>
          <span class="badge" :class="t.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'">{{ t.is_active ? 'Actif' : 'Inactif' }}</span>
          <button type="button" class="text-blue-700 hover:underline dark:text-blue-300" @click="editType(t)">Modifier</button>
          <button v-if="t.is_active" type="button" class="text-red-700 hover:underline dark:text-red-300" @click="disableType(t)">Desactiver</button>
        </div>
        <p v-if="!data.types_conges.length" class="empty">Aucun type de conge.</p>
      </div>
    </section>

    <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="font-bold text-slate-900 dark:text-white">Annonces internes</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Publiez les messages visibles sur le tableau de bord de tous les utilisateurs.</p>
        </div>
        <button v-if="annonceForm.id" type="button" class="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300" @click="resetAnnonce">Nouvelle annonce</button>
      </div>

      <form class="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950" @submit.prevent="saveAnnonce">
        <div class="grid gap-3">
          <input v-model="annonceForm.titre" class="input" placeholder="Titre de l'annonce" required />
          <textarea v-model="annonceForm.contenu" rows="4" class="input" placeholder="Message destine aux utilisateurs" required></textarea>
          <div class="grid gap-2 sm:grid-cols-2">
            <label class="label">Date de publication<input v-model="annonceForm.publie_le" type="datetime-local" class="input" /></label>
            <label class="label">Date d'expiration<input v-model="annonceForm.expire_le" type="datetime-local" class="input" /></label>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label class="check"><input v-model="annonceForm.is_active" type="checkbox" /> Annonce active</label>
            <button type="button" class="btn-secondary px-3 py-2 text-sm" @click="publishNow">Publier maintenant</button>
          </div>
          <button class="btn-primary w-full" :disabled="saving">{{ annonceForm.id ? 'Mettre a jour l annonce' : 'Publier l annonce' }}</button>
        </div>
      </form>

      <div v-if="annoncePreview" class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-500/30 dark:bg-blue-950/30">
        <p class="text-xs font-semibold uppercase text-blue-700 dark:text-blue-200">Apercu dashboard</p>
        <h4 class="mt-1 font-semibold text-slate-900 dark:text-white">{{ annonceForm.titre }}</h4>
        <p class="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{{ annonceForm.contenu }}</p>
      </div>

      <div class="mt-4 grid gap-2 lg:grid-cols-[1fr_170px_auto]">
        <input v-model="filters.annonce_search" class="input" placeholder="Rechercher une annonce..." @keyup.enter="load" />
        <select v-model="filters.annonce_statut" class="input" @change="load">
          <option value="">Tous les statuts</option>
          <option value="visible">Visibles</option>
          <option value="programmee">Programmees</option>
          <option value="expiree">Expirees</option>
          <option value="masquee">Masquees</option>
        </select>
        <button type="button" class="btn-secondary" @click="load">Actualiser</button>
      </div>

      <div class="mt-4 space-y-3">
        <article v-for="a in data.annonces" :key="a.id" class="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <strong class="text-slate-900 dark:text-white">{{ a.titre }}</strong>
                <span class="badge" :class="statusMeta(a).class">{{ statusMeta(a).label }}</span>
              </div>
              <p class="mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">{{ a.contenu }}</p>
              <p class="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Publiee : {{ date(a.publie_le) }} - Auteur : {{ a.auteur?.name || 'RH' }}
                <span v-if="a.expire_le"> - Expire : {{ date(a.expire_le) }}</span>
              </p>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button type="button" class="text-blue-700 hover:underline dark:text-blue-300" @click="editAnnonce(a)">Modifier</button>
            <button v-if="a.is_active" type="button" class="text-red-700 hover:underline dark:text-red-300" @click="disableAnnonce(a)">Masquer</button>
            <button v-else type="button" class="text-green-700 hover:underline dark:text-green-300" @click="reactivateAnnonce(a)">Republier</button>
          </div>
        </article>
        <p v-if="!data.annonces.length" class="empty">Aucune annonce pour ces filtres.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const saving = ref(false)
const data = reactive({ types_conges: [], annonces: [] })
const filters = reactive({ type_search: '', type_active: '', annonce_search: '', annonce_active: '', annonce_statut: '' })
const emptyType = () => ({ id: null, code: '', libelle: '', couleur: '#2563eb', jours_annuels: 0, justificatif_requis: false, is_active: true })
const typeForm = reactive(emptyType())
const emptyAnnonce = () => ({ id: null, titre: '', contenu: '', publie_le: '', expire_le: '', is_active: true })
const annonceForm = reactive(emptyAnnonce())
const annoncePreview = computed(() => annonceForm.titre || annonceForm.contenu)

function toInputDate(value = new Date()) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function date(value) {
  return value ? new Date(value).toLocaleString('fr-FR') : 'Immediate'
}

function formatJours(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value || 0))
}

function statusMeta(annonce) {
  if (!annonce.is_active) return { label: 'Masquee', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
  const now = Date.now()
  const publishedAt = annonce.publie_le ? new Date(annonce.publie_le).getTime() : null
  const expiresAt = annonce.expire_le ? new Date(annonce.expire_le).getTime() : null
  if (publishedAt && publishedAt > now) return { label: 'Programmee', class: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200' }
  if (expiresAt && expiresAt < now) return { label: 'Expiree', class: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200' }
  return { label: 'Visible', class: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200' }
}

function payloadAnnonce(source = annonceForm) {
  return {
    titre: source.titre,
    contenu: source.contenu,
    publie_le: source.publie_le || null,
    expire_le: source.expire_le || null,
    is_active: Boolean(source.is_active),
  }
}

async function load() {
  try {
    const params = { ...filters }
    if (params.annonce_statut) params.annonce_active = ''
    Object.assign(data, (await api.get('/rh/configuration', { params })).data)
  } catch (e) {
    toast.error(e.response.data.message || 'Impossible de charger la configuration RH.')
  }
}

function resetType() { Object.assign(typeForm, emptyType()) }
function resetAnnonce() { Object.assign(annonceForm, emptyAnnonce()) }
function editType(typeConge) { Object.assign(typeForm, typeConge) }
function editAnnonce(annonce) {
  Object.assign(annonceForm, {
    ...annonce,
    publie_le: toInputDate(annonce.publie_le),
    expire_le: toInputDate(annonce.expire_le),
    is_active: Boolean(annonce.is_active),
  })
}
function publishNow() {
  annonceForm.publie_le = toInputDate()
  annonceForm.is_active = true
}

async function act(fn, message) {
  saving.value = true
  try {
    await fn()
    toast.success(message)
    await load()
  } catch (e) {
    toast.error(Object.values(e.response.data.errors || {})[0]?.[0] || e.response.data.message || 'Action impossible.')
  } finally {
    saving.value = false
  }
}

async function saveType() {
  const payload = { ...typeForm }
  delete payload.id
  await act(() => typeForm.id ? api.put(`/rh/configuration/types-conges/${typeForm.id}`, payload) : api.post('/rh/configuration/types-conges', payload), 'Type de conge enregistre.')
  resetType()
}

async function disableType(typeConge) {
  await act(() => api.delete(`/rh/configuration/types-conges/${typeConge.id}`), 'Type de conge desactive.')
}

async function saveAnnonce() {
  const payload = payloadAnnonce()
  await act(() => annonceForm.id ? api.put(`/rh/configuration/annonces/${annonceForm.id}`, payload) : api.post('/rh/configuration/annonces', payload), 'Annonce enregistree.')
  resetAnnonce()
}

async function disableAnnonce(annonce) {
  await act(() => api.delete(`/rh/configuration/annonces/${annonce.id}`), 'Annonce masquee.')
}

async function reactivateAnnonce(annonce) {
  const payload = payloadAnnonce({ ...annonce, publie_le: toInputDate(), expire_le: null, is_active: true })
  await act(() => api.put(`/rh/configuration/annonces/${annonce.id}`, payload), 'Annonce republiee.')
}

onMounted(load)
</script>

<style scoped>
.label { @apply space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200; }
.check { @apply flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200; }
.badge { @apply rounded px-2 py-1 text-xs font-semibold; }
.empty { @apply rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400 dark:border-slate-700; }
</style>
