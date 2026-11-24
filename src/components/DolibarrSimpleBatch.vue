<template>
  <section class="rounded-xl border bg-white p-5">
    <h3 class="text-lg font-bold">{{ title }}</h3>
    <p class="mt-1 text-sm text-slate-600">Les nouvelles fiches sans anomalie seront créées. Les correspondances existantes et les doublons sont présentés pour vérification.</p>
    <p v-if="error" role="alert" class="my-3 rounded-lg bg-red-50 p-3 text-red-800">{{ error }}</p>
    <p v-if="busy" role="status" class="my-3">{{ progress }}</p>
    <button v-if="!preview" type="button" class="btn-primary mt-4" :disabled="busy" @click="check">Vérifier {{ title.toLocaleLowerCase('fr') }}</button>
    <template v-else>
      <dl class="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="rounded-lg bg-blue-50 p-3"><dt class="text-sm">Nouvelles fiches prêtes</dt><dd class="text-xl font-bold">{{ Math.max(0, ready.length - cursor) }}</dd></div>
        <div class="rounded-lg bg-amber-50 p-3"><dt class="text-sm">À vérifier</dt><dd class="text-xl font-bold">{{ reviewCount }}</dd></div>
        <div class="rounded-lg bg-green-50 p-3"><dt class="text-sm">Créées dans cette session</dt><dd class="text-xl font-bold">{{ created }}</dd></div>
      </dl>
      <template v-if="module === 'contacts'">
        <p class="my-3 text-sm text-slate-600">{{ preview.notice }}</p>
        <p class="my-2 text-sm">{{ preview.rows.filter(row => row.status === 'already_processed').length }} contact(s) déjà repris.</p>
        <details class="my-3 rounded-lg border p-3"><summary class="cursor-pointer font-semibold">Vérifier les contacts et leurs rattachements</summary>
          <article v-for="row in preview.rows.slice((contactPage - 1) * 20, contactPage * 20)" :key="row.line" class="mt-3 border-t pt-3 text-sm">
            <strong>{{ row.name }}</strong> · {{ row.client }}<p>{{ row.fonction || 'Fonction non renseignée' }}</p><p v-if="row.email">{{ row.email }}</p><p v-if="row.telephone">Téléphone : {{ row.telephone }}</p><p v-if="row.mobile">Mobile : {{ row.mobile }}</p>
            <p :class="row.status === 'review' ? 'text-red-700' : 'text-green-700'">{{ { new: 'Prêt', review: 'À résoudre', already_processed: 'Déjà repris' }[row.status] }}</p><p v-for="issue in row.issues" :key="issue" class="text-red-700">{{ issue }}</p>
          </article>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-2"><button type="button" class="btn-secondary" :disabled="contactPage <= 1" @click="contactPage--">Précédent</button><span>{{ contactPage }} / {{ Math.max(1, Math.ceil(preview.rows.length / 20)) }}</span><button type="button" class="btn-secondary" :disabled="contactPage * 20 >= preview.rows.length" @click="contactPage++">Suivant</button></div>
        </details>
      </template>
      <p v-for="blocker in preview.blockers" :key="blocker" class="my-2 text-red-800">{{ blocker }}</p>
      <template v-if="ready.length && !done">
        <label class="my-3 flex items-start gap-2"><input v-model="confirmed" type="checkbox" :disabled="busy" class="mt-1" />Je confirme l’import des {{ ready.length }} nouvelles fiches dans cette société, avec les paramètres choisis.</label>
        <button type="button" class="btn-primary" :disabled="busy || !confirmed || !preview.execution_available || preview.blockers?.length" @click="run">{{ pending ? 'Reprendre le transfert' : 'Importer les nouvelles fiches' }}</button>
      </template>
      <p v-if="done" class="rounded-lg bg-green-50 p-3 text-green-900" role="status">{{ created }} fiche(s) créée(s), {{ alreadyProcessed }} déjà traitée(s). {{ reviewCount }} fiche(s) restent à vérifier.</p>
      <button v-if="!busy" type="button" class="btn-secondary mt-3" @click="check">Actualiser le contrôle</button>
    </template>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import api from '@/services/api'

const props = defineProps({
  report: { type: Object, required: true },
  sqlFile: { type: Object, required: true },
  settings: { type: Object, required: true },
  module: { type: String, required: true },
  title: { type: String, required: true },
})
const emit = defineEmits(['busy', 'imported'])
const preview = ref(null)
const busy = ref(false)
const confirmed = ref(false)
const error = ref('')
const progress = ref('')
const created = ref(0)
const alreadyProcessed = ref(0)
const done = ref(false)
const contactPage = ref(1)
const ready = computed(() => (preview.value?.rows || []).filter(row => row.status === 'new' && !row.issues.length))
const reviewCount = computed(() => (preview.value?.rows || []).filter(row => row.status !== 'new' && row.status !== 'already_processed').length)
let cursor = 0
let pending = null
let lastWrite = 0
let cancelled = false
onBeforeUnmount(() => { cancelled = true })

function endpoint(action) {
  const modulePath = props.module === 'tiers' ? '' : '/' + props.module
  return `/data-imports/${props.report.id}${modulePath}/${action}`
}

function form() {
  const data = new FormData()
  data.append('database', props.sqlFile)
  if (preview.value?.mapping) {
    for (const [key, value] of Object.entries(preview.value.mapping)) {
      if (value !== null) data.append(`mapping[${key}]`, value)
    }
  } else if (props.module === 'products') {
    data.append('mapping[product_unit]', props.settings.productUnit)
    data.append('mapping[service_unit]', props.settings.serviceUnit)
  }
  return data
}

function explain(exception) {
  return Object.values(exception.response?.data?.errors || {}).flat().join(' ')
    || exception.response?.data?.message
    || 'Le transfert a été interrompu. Reprenez avec le même fichier et les mêmes paramètres.'
}

async function check() {
  busy.value = true
  emit('busy', true)
  error.value = ''
  progress.value = 'Vérification des fiches et des doublons…'
  try {
    const body = form()
    if (props.module === 'contacts') body.append('source_key', props.settings.sourceKey)
    const { data } = await api.post(endpoint('preview'), body, { headers: { 'Content-Type': 'multipart/form-data' } })
    preview.value = data
    contactPage.value = 1
    cursor = 0
    pending = null
    confirmed.value = false
    done.value = false
  } catch (exception) {
    error.value = explain(exception)
  } finally {
    busy.value = false
    emit('busy', false)
  }
}

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function run() {
  if (!confirmed.value || busy.value || !preview.value?.execution_available || preview.value.blockers?.length) return
  busy.value = true
  emit('busy', true)
  error.value = ''
  try {
    while (!cancelled && cursor < ready.value.length) {
      const batch = ready.value.slice(cursor, cursor + 200)
      if (!pending) pending = { id: crypto.randomUUID(), batch }
      const wait = Math.max(0, 22000 - (Date.now() - lastWrite))
      progress.value = `Transfert de ${cursor + 1} à ${cursor + pending.batch.length} sur ${ready.value.length}…`
      if (wait) await pause(wait)
      if (cancelled) return
      const data = form()
      data.append('preview_token', preview.value.preview_token)
      data.append('request_id', pending.id)
      data.append('source_key', props.settings.sourceKey)
      if (props.module === 'tiers') data.append('country', props.settings.country)
      data.append('confirmed', '1')
      pending.batch.forEach((row, index) => {
        data.append(`decisions[${index}][line]`, row.line)
        data.append(`decisions[${index}][action]`, 'create')
      })
      let response
      try {
        lastWrite = Date.now()
        response = await api.post(endpoint('execute'), data, { headers: { 'Content-Type': 'multipart/form-data' } })
      } catch (exception) {
        if (exception.response?.status !== 429) throw exception
        progress.value = 'Le serveur régule les transferts. Reprise automatique…'
        const retry = Number(exception.response.headers?.['retry-after'])
        await pause((Number.isFinite(retry) && retry > 0 ? Math.min(retry, 120) : 60) * 1000)
        continue
      }
      created.value += Number(response.data.created || 0)
      alreadyProcessed.value += Number(response.data.already_processed || 0)
      cursor += pending.batch.length
      pending = null
      emit('imported')
    }
    if (!cancelled) {
      done.value = true
      for (const row of ready.value) row.status = 'already_processed'
    }
  } catch (exception) {
    error.value = explain(exception) + ' Les lots déjà enregistrés restent visibles dans le bilan.'
  } finally {
    busy.value = false
    emit('busy', false)
  }
}
</script>
