<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PortalTicketConversation from '@/components/PortalTicketConversation.vue'
import OrderWorkflow from '@/components/OrderWorkflow.vue'
import { ouvrirPDF } from '@/services/pdf'
import { businessPayload, businessColumns, applyCatalogProduct } from '@/utils/businessModules'

const route = useRoute(), router = useRouter()
const definitions = ref([]), definition = ref(null), records = ref([]), record = ref(null), form = ref({})
const loading = ref(false), saving = ref(false), error = ref(''), success = ref(''), tab = ref('fiche')
const search = ref(''), status = ref(''), archives = ref(false), page = ref(1), lastPage = ref(1), total = ref(0)
const choices = ref({}), lookupText = ref({}), productText = ref(''), products = ref([])
const message = ref(''), requestId = ref(crypto.randomUUID()), messageId = ref(crypto.randomUUID())
const portalDraft = ref('')
const clean = ref(''), dirty = computed(() => clean.value && JSON.stringify(form.value) !== clean.value)
const followup = ref(''), renewalEnd = ref(''), renewalReminder = ref('')
const renewalDirty = computed(() => !!renewalEnd.value || !!renewalReminder.value)
const shipment = ref(null), shipmentClean = ref(''), shipmentId = ref(crypto.randomUUID())
const shipmentDirty = computed(() => shipmentClean.value && JSON.stringify(shipment.value) !== shipmentClean.value)
const key = computed(() => route.params.module), detail = computed(() => !!route.params.id)
const lockedOrder = computed(() => key.value === 'commandes_clients' && record.value && record.value.statut !== 'brouillon')
const editable = computed(() => !record.value?.archived_at && (record.value ? definition.value?.permissions.update : definition.value?.permissions.create))
let sequence = 0
const lookupSequence = {}
const statusText = value => ({ actif: 'Actif', inactif: 'Inactif', brouillon: 'Brouillon', confirmee: 'Confirmée', cloturee: 'Clôturée', annulee: 'Annulée', termine: 'Terminé', resilie: 'Résilié', planifie: 'Planifié', en_cours: 'En cours', annule: 'Annulé', ouvert: 'Ouvert', en_attente: 'En attente', resolu: 'Résolu', ferme: 'Fermé', publie: 'Publié', retire: 'Retiré', a_faire: 'À faire', terminee: 'Terminée' }[value] || value)
const explain = e => Object.values(e.response?.data?.errors || {}).flat().join(' · ') || e.response?.data?.message || 'Chargement impossible. Réessayez.'
const downloadingDelivery = ref(null)
async function downloadDelivery(delivery) {
  if (downloadingDelivery.value) return
  const current = sequence
  downloadingDelivery.value = delivery.id
  error.value = ''
  try {
    await ouvrirPDF(`/metier/commandes_clients/${record.value.id}/livraisons/${delivery.id}/pdf`, `${delivery.reference}.pdf`)
  } catch {
    if (current === sequence) error.value = 'Téléchargement du bon de livraison impossible. Vérifiez vos droits et réessayez.'
  } finally { downloadingDelivery.value = null }
}
const listTarget = () => ({ name: 'business-list', params: { module: key.value }, query: route.query })
const canLeave = () => !saving.value && ((!dirty.value && !message.value.trim() && !portalDraft.value && !renewalDirty.value && !shipmentDirty.value) || window.confirm('Quitter sans enregistrer les modifications ou le message en cours ?'))
onBeforeRouteLeave(canLeave)
onBeforeRouteUpdate(canLeave)
const unload = e => { if (dirty.value || message.value.trim() || portalDraft.value || renewalDirty.value || shipmentDirty.value) { e.preventDefault(); e.returnValue = '' } }
window.addEventListener('beforeunload', unload)
onBeforeUnmount(() => { sequence++; window.removeEventListener('beforeunload', unload) })

async function load() {
  const current = ++sequence
  loading.value = true; error.value = ''; success.value = ''; clean.value = ''; message.value = ''; record.value = null; definition.value = null; choices.value = {}; lookupText.value = {}; tab.value = 'fiche'; products.value = []
  renewalEnd.value = ''; renewalReminder.value = ''; portalDraft.value = ''
  shipment.value = null; shipmentClean.value = ''; shipmentId.value = crypto.randomUUID()
  try {
    const catalog = (await api.get('/metier')).data.modules
    if (current !== sequence) return
    definitions.value = catalog
    if (!key.value) return
    definition.value = catalog.find(d => d.key === key.value)
    if (!definition.value) throw new Error('Cette rubrique n’est pas autorisée pour votre compte.')
    if (!detail.value) {
      search.value = String(route.query.q || ''); status.value = String(route.query.statut || ''); archives.value = route.query.archives === '1'
      page.value = Math.max(1, Number(route.query.page) || 1)
      followup.value = String(route.query.suivi || '')
      const data = (await api.get(`/metier/${key.value}`, { params: { q: search.value, statut: status.value || undefined, archives: archives.value ? 1 : 0, page: page.value, client_id: route.query.client_id || undefined, suivi: followup.value || undefined } })).data
      if (current !== sequence) return
      records.value = data.data; lastPage.value = data.last_page; total.value = data.total
    } else {
      requestId.value = crypto.randomUUID(); messageId.value = crypto.randomUUID()
      let data = { titre: '', statut: definition.value.statuses[0], lines: [], tasks: [] }
      for (const [field, , type, options] of definition.value.fields) data[field] = type === 'select' ? options[0] : ''
      if ('devise' in data) data.devise = 'XOF'
      if ('date_debut' in data) {
        const today = new Date()
        data.date_debut = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      }
      if (key.value === 'sav') data.priorite = 'normale'
      if ('client_id' in data && /^[1-9]\d*$/.test(String(route.query.client_id || ''))) data.client_id = Number(route.query.client_id)
      if (route.params.id !== 'nouveau') {
        data = (await api.get(`/metier/${key.value}/${route.params.id}`)).data
        if (current !== sequence) return
        record.value = data
        if (key.value === 'sav' && data.portal_user_id) tab.value = 'portal'
        if (key.value === 'commandes_clients') {
          const today = new Date(), due = new Date()
          due.setDate(due.getDate() + 30)
          const date = value => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
          shipment.value = { date_livraison: date(today), date_echeance: date(due), notes: '', lines: data.lines.map(l => ({ line_id: l.id, quantite: '0' })) }
          shipmentClean.value = JSON.stringify(shipment.value)
        }
      }
      form.value = structuredClone(data)
      clean.value = JSON.stringify(form.value)
      for (const [field, , type, source] of definition.value.fields) {
        if (type === 'relation') await lookup(field, source, current)
      }
      if (key.value === 'commandes_clients') await lookupProducts(current)
    }
  } catch (e) { if (current === sequence) error.value = e.response ? explain(e) : e.message }
  finally { if (current === sequence) loading.value = false }
}
async function lookup(field, source, current = sequence) {
  const attempt = lookupSequence[field] = (lookupSequence[field] || 0) + 1
  try {
    const data = (await api.get(`/metier/${key.value}/options/${source}`, { params: { q: lookupText.value[field] || undefined, client_id: form.value.client_id || undefined } })).data.options
    if (current === sequence && attempt === lookupSequence[field]) choices.value[field] = data
  } catch (e) { if (current === sequence) error.value = explain(e) }
}
async function lookupProducts(current = sequence) {
  const attempt = lookupSequence.products = (lookupSequence.products || 0) + 1
  try {
    const data = (await api.get(`/metier/${key.value}/options/produits`, { params: { q: productText.value || undefined } })).data.options
    if (current === sequence && attempt === lookupSequence.products) products.value = data
  } catch (e) { if (current === sequence) error.value = explain(e) }
}
function clientChanged() {
  for (const [field, , type, source] of definition.value.fields) if (type === 'relation' && ['devis', 'contacts'].includes(source)) { form.value[field] = null; lookup(field, source) }
}
function filterList(nextPage = 1) {
  router.push({ name: 'business-list', params: { module: key.value }, query: { client_id: route.query.client_id || undefined, suivi: followup.value || undefined, q: search.value || undefined, statut: status.value || undefined, archives: archives.value ? '1' : undefined, page: nextPage > 1 ? nextPage : undefined } })
}
async function save() {
  if (saving.value || !editable.value) return
  if (portalDraft.value && !window.confirm('Enregistrer la fiche et abandonner la réponse client non publiée ?')) return
  if (renewalDirty.value && !window.confirm('Enregistrer la fiche sans appliquer le renouvellement saisi ?')) return
  if (shipmentDirty.value && !window.confirm('Enregistrer la fiche sans appliquer la livraison saisie ?')) return
  saving.value = true; error.value = ''; success.value = ''
  try {
    const payload = businessPayload(definition.value, form.value, record.value, requestId.value)
    const url = `/metier/${key.value}`
    const response = record.value ? await api.put(`${url}/${record.value.id}`, payload) : await api.post(url, payload)
    clean.value = JSON.stringify(form.value)
    saving.value = false
    if (!record.value) await router.replace({ name: 'business-detail', params: { module: key.value, id: response.data.id }, query: route.query })
    else await load()
    success.value = 'Fiche enregistrée.'
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
async function archive() {
  if (!window.confirm('Archiver cette fiche ? Elle restera consultable dans les archives.')) return
  saving.value = true; error.value = ''
  try {
    await api.delete(`/metier/${key.value}/${record.value.id}`, { data: { version: record.value.version } })
    clean.value = ''; saving.value = false; await router.push(listTarget())
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
async function sendMessage() {
  if (!message.value.trim() || saving.value) return
  saving.value = true; error.value = ''
  try {
    await api.post(`/metier/sav/${record.value.id}/messages`, { contenu: message.value, request_id: messageId.value })
    message.value = ''; await load(); tab.value = 'messages'; success.value = 'Échange interne enregistré.'
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
async function renewContract() {
  if (saving.value || dirty.value) return
  saving.value = true; error.value = ''
  try {
    await api.post(`/metier/contrats_services/${record.value.id}/renouveler`, { version: record.value.version, date_fin: renewalEnd.value, renouvellement: renewalReminder.value || null })
    await load(); success.value = 'Contrat renouvelé. Aucune facture ni aucun paiement créés.'
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
async function deliverOrder() {
  if (saving.value || dirty.value) return
  const lines = shipment.value.lines.filter(l => Number(l.quantite) !== 0)
  if (!lines.length) { error.value = 'Saisissez au moins une quantité à livrer.'; return }
  if (!window.confirm(record.value.legacy_delivery ? 'Commande historique : livrer et facturer ces quantités, sans encaissement ?' : 'Valider la livraison et déduire le stock ? Aucune facture ni paiement ne sera créé.')) return
  saving.value = true; error.value = ''
  try {
    const payload = { ...shipment.value, lines, version: record.value.version, request_id: shipmentId.value }
    if (!record.value.legacy_delivery) delete payload.date_echeance
    await api.post(`/metier/commandes_clients/${record.value.id}/livrer`, payload)
    await load(); tab.value = 'deliveries'; success.value = 'Livraison enregistrée. Le bon de livraison PDF est disponible dans l’historique.'
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
async function billOrder() {
  if (saving.value || dirty.value || !window.confirm('Créer la facture complète de cette commande en brouillon ? Aucun stock ni paiement ne sera modifié.')) return
  saving.value = true; error.value = ''
  try {
    await api.post(`/metier/commandes_clients/${record.value.id}/facturer`, { version: record.value.version, date_echeance: shipment.value.date_echeance })
    await load(); tab.value = 'deliveries'; success.value = 'Facture créée en brouillon. Ouvrez-la pour la vérifier et la valider.'
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
async function createArticle() {
  if (saving.value || dirty.value || !window.confirm('Copier uniquement la solution dans une procédure interne en brouillon ? Relisez-la avant publication.')) return
  saving.value = true; error.value = ''
  try {
    const { data } = await api.post(`/metier/sav/${record.value.id}/procedure`, { version: record.value.version })
    saving.value = false
    await router.push({ name: 'business-detail', params: { module: 'connaissances', id: data.id } })
  } catch (e) { error.value = explain(e) }
  finally { saving.value = false }
}
function eventDetails(event) {
  try {
    const d = JSON.parse(event.details || '{}')
    if (d.before && d.after) return `Total TTC : ${d.before.total_ttc} → ${d.after.total_ttc}. Avant : ${d.before.lines.map(l => `${l.designation} × ${l.quantite} à ${l.prix} HT`).join(' ; ')}. Après : ${d.after.lines.map(l => `${l.designation} × ${l.quantite} à ${l.prix} HT`).join(' ; ')}`
  } catch { /* Legacy events can have no structured details. */ }
  try { const d = JSON.parse(event.details || '{}'); return d.ancienne_fin ? `Fin : ${d.ancienne_fin} → ${d.nouvelle_fin}` : [d.livraison_id ? `Livraison #${d.livraison_id}` : '', d.facture_id ? `Facture #${d.facture_id}` : ''].filter(Boolean).join(' · ') } catch { return '' }
}
watch(() => route.fullPath, load, { immediate: true })
</script>

<template>
  <main class="business space-y-5">
    <header class="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
      <RouterLink v-if="detail" :to="listTarget()" class="font-semibold text-cyan-800">← Retour liste</RouterLink>
      <RouterLink v-else-if="key" to="/metier" class="font-semibold text-cyan-800">← Toutes les rubriques</RouterLink>
      <h1 class="mt-3 text-2xl font-bold">{{ definition?.label || 'Relation client et services' }}</h1>
      <p v-if="definition?.notice" class="mt-2 text-sm">{{ definition.notice }}</p>
    </header>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{{ error }}</p>
    <p v-if="success" role="status" class="rounded-xl bg-cyan-50 p-4">{{ success }}</p>
    <p v-if="loading" role="status">Chargement…</p>
    <section v-else-if="!key" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <RouterLink v-for="item in definitions" :key="item.key" :to="`/metier/${item.key}`" class="rounded-xl border border-cyan-200 bg-white p-6 font-semibold">{{ item.label }} →</RouterLink>
      <p v-if="!definitions.length">Aucune rubrique autorisée. Contactez votre administrateur.</p>
    </section>
    <section v-else-if="definition && !detail" class="rounded-2xl border border-cyan-200 bg-white p-5">
      <p v-if="route.query.client_id" class="mb-4 text-sm">Liste limitée au client sélectionné. <RouterLink :to="{ name: 'business-list', params: { module: key } }" class="underline">Afficher tous les clients</RouterLink></p>
      <form class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="filterList()">
        <label>Recherche<input v-model="search" type="search" maxlength="100" placeholder="Titre ou référence"></label>
        <label>Statut<select v-model="status"><option value="">Tous</option><option v-for="s in definition.statuses" :key="s" :value="s">{{ statusText(s) }}</option></select></label>
        <label>Suivi<select v-model="followup"><option value="">Tout</option><option value="a_traiter">Actifs / à traiter</option><option v-if="['contrats_services', 'projets'].includes(key)" value="echeance">Échus ou échéance sous 30 jours</option></select></label>
        <label class="flex items-center gap-2"><input v-model="archives" type="checkbox"> Archives</label>
        <button type="submit">Rechercher</button>
        <RouterLink v-if="definition.permissions.create" :to="{ name: 'business-detail', params: { module: key, id: 'nouveau' }, query: route.query }" class="action">+ Nouvelle fiche</RouterLink>
      </form>
      <div class="max-h-[520px] overflow-auto" tabindex="0" aria-label="Liste des fiches"><table class="w-full text-left text-sm">
        <thead class="sticky top-0 bg-cyan-50"><tr><th>Référence</th><th>Titre / nom</th><th v-for="[field, label] in businessColumns[key]" :key="field">{{ label }}</th><th>Statut</th><th>Action</th></tr></thead>
        <tbody><tr v-for="item in records" :key="item.id"><td>{{ item.reference }}</td><td>{{ item.titre }}</td><td v-for="[field] in businessColumns[key]" :key="field">{{ item[field] ?? '—' }}</td><td>{{ statusText(item.statut) }}</td><td><RouterLink :to="{ name: 'business-detail', params: { module: key, id: item.id }, query: route.query }" class="font-semibold text-cyan-800 underline">Ouvrir</RouterLink></td></tr></tbody>
      </table><p v-if="!records.length" class="p-6">Aucune fiche trouvée.</p></div>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3"><span>{{ total }} fiche(s) · Page {{ page }} / {{ lastPage }}</span><div class="flex gap-2"><button :disabled="page <= 1" @click="filterList(page - 1)">Précédent</button><button :disabled="page >= lastPage" @click="filterList(page + 1)">Suivant</button></div></div>
    </section>
    <section v-else-if="definition && detail && (record || route.params.id === 'nouveau')" class="rounded-2xl border border-cyan-200 bg-white p-5">
      <h2 class="text-xl font-bold">{{ record?.reference || 'Nouvelle fiche' }}</h2>
      <div v-if="record?.relation_links" class="my-3 flex flex-wrap gap-3" aria-label="Fiches liées">
        <RouterLink v-for="(url, field) in record.relation_links" :key="field" :to="url" class="action">Ouvrir {{ record.relation_labels[field] }} →</RouterLink>
      </div>
      <p v-if="record?.archived_at" class="my-3 font-semibold">Fiche archivée — lecture seule.</p>
      <p v-if="record?.portal_user_id" class="my-3 rounded-xl bg-amber-50 p-3">Demande reçue du portail clients. <span v-if="key === 'commandes_clients'">Les quantités sont demandées par le client ; renseignez vos produits, prix et taxes avant validation. Aucun stock n’a été déduit.</span><span v-else>Le titre et la description sont visibles par ce client. Utilisez « Échanges internes » pour vos notes confidentielles.</span></p>
      <p v-if="lockedOrder" class="my-3 text-sm">Commande figée : seul le statut peut être modifié. Les lignes et montants restent conservés.</p>
      <div v-if="key === 'sav' && record" class="my-3 flex flex-wrap gap-2">
        <RouterLink v-if="record.article_id" :to="`/metier/connaissances/${record.article_id}`" class="action">Voir la procédure issue de ce ticket</RouterLink>
        <button v-else-if="editable && record.can_create_article && ['resolu', 'ferme'].includes(record.statut)" :disabled="saving || dirty || !!message.trim()" type="button" @click="createArticle">Créer une procédure depuis la solution</button>
      </div>
      <nav class="my-4 flex flex-wrap gap-2" aria-label="Sections de la fiche">
        <button type="button" :aria-pressed="tab === 'fiche'" @click="tab = 'fiche'">Fiche</button>
        <button v-if="definition.children === 'lines'" type="button" :aria-pressed="tab === 'lines'" @click="tab = 'lines'">Lignes de commande</button>
        <button v-if="key === 'commandes_clients' && record" type="button" :aria-pressed="tab === 'deliveries'" @click="tab = 'deliveries'">Livraisons et factures</button>
        <button v-if="definition.children === 'tasks'" type="button" :aria-pressed="tab === 'tasks'" @click="tab = 'tasks'">Tâches et temps passé</button>
        <button v-if="definition.children === 'messages' && record" type="button" :aria-pressed="tab === 'messages'" @click="tab = 'messages'">Échanges internes</button>
        <button v-if="key === 'sav' && record?.portal_user_id" type="button" :aria-pressed="tab === 'portal'" @click="tab = 'portal'">Répondre au client</button>
        <button v-if="record" type="button" :aria-pressed="tab === 'history'" @click="tab = 'history'">Historique</button>
        <button v-if="key === 'contrats_services' && editable && record && ['actif', 'termine'].includes(record.statut)" type="button" :aria-pressed="tab === 'renewal'" @click="tab = 'renewal'">Renouveler</button>
        <button v-if="key === 'connaissances' && record" type="button" :aria-pressed="tab === 'lecture'" @click="tab = 'lecture'">Lire la procédure</button>
      </nav>
      <OrderWorkflow v-if="key === 'commandes_clients' && record?.workflow" v-show="['fiche', 'history'].includes(tab)" :history-only="tab === 'history'" :record="record" :api="api" :disabled="!!dirty || saving" :editable="editable" @changed="load" @busy="saving = $event" @draft="portalDraft = $event" />
      <form novalidate @submit.prevent="save">
        <fieldset :disabled="saving || !editable" class="space-y-4">
          <div v-show="tab === 'fiche'" class="grid gap-4 md:grid-cols-2">
            <p v-if="key === 'commandes_clients' && record?.workflow" class="md:col-span-2">Utilisez les boutons de validation ci-dessus pour accepter ou refuser. Enregistrez d’abord les lignes et les prix.</p>
            <label>Statut<select v-model="form.statut" :disabled="key === 'commandes_clients' && !!record?.workflow && record.statut === 'brouillon'"><option v-for="s in record ? (record.allowed_statuses || [record.statut]) : [definition.statuses[0]]" :key="s" :value="s">{{ statusText(s) }}</option></select></label>
            <label>{{ key === 'contacts' ? 'Nom complet' : 'Titre / objet' }} *<input v-model="form.titre" :disabled="lockedOrder" maxlength="191"></label>
            <label v-for="[field, label, type, source, required] in definition.fields" :key="field" :class="{ 'md:col-span-2': type === 'textarea' }">
              {{ label }} {{ required ? '*' : '' }}
              <small v-if="key === 'sav' && field === 'resolution' && record?.portal_user_id" class="font-semibold text-sky-800">Visible dans le portail du client dès l’enregistrement. Pour une note confidentielle, utilisez « Échanges internes ».</small>
              <textarea v-if="type === 'textarea'" v-model="form[field]" :disabled="lockedOrder" rows="6" maxlength="20000" />
              <select v-else-if="type === 'select'" v-model="form[field]" :disabled="lockedOrder"><option v-for="s in source" :key="s" :value="s">{{ statusText(s) }}</option></select>
              <template v-else-if="type === 'relation'">
                <div class="flex gap-2"><input v-model="lookupText[field]" :disabled="lockedOrder" :aria-label="`Rechercher : ${label}`" placeholder="Rechercher une fiche…" @keydown.enter.prevent="lookup(field, source)"><button type="button" :disabled="lockedOrder" @click="lookup(field, source)">Chercher</button></div>
                <select v-model="form[field]" :aria-label="label" :disabled="lockedOrder" @change="field === 'client_id' && clientChanged()"><option :value="null">— Aucun —</option><option v-if="form[field] && !(choices[field] || []).some(c => Number(c.id) === Number(form[field]))" :value="form[field]">{{ record?.relation_labels?.[field] || `Fiche #${form[field]}` }}</option><option v-for="choice in choices[field] || []" :key="choice.id" :value="choice.id">{{ choice.label }}</option></select>
                <small>30 résultats maximum ; précisez la recherche si nécessaire.</small>
              </template>
              <input v-else v-model="form[field]" :disabled="lockedOrder" :type="['date', 'email', 'tel'].includes(type) ? type : 'text'" :inputmode="type === 'money' ? 'decimal' : undefined" :maxlength="type === 'currency' ? 3 : type === 'tel' ? 40 : 191">
            </label>
          </div>
          <div v-show="tab === 'lines'" v-if="definition.children === 'lines'" class="space-y-3">
            <div v-if="!lockedOrder" class="flex gap-2"><input v-model="productText" placeholder="Rechercher un produit du catalogue" aria-label="Recherche produit" @keydown.enter.prevent="lookupProducts()"><button type="button" @click="lookupProducts()">Chercher</button></div>
            <fieldset v-for="(line, index) in form.lines" :key="index" :disabled="lockedOrder" class="grid gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 md:grid-cols-3">
              <legend>Ligne {{ index + 1 }}</legend>
              <label>Produit (facultatif)<select v-model="line.produit_id" @change="applyCatalogProduct(line, products.find(p => Number(p.id) === Number(line.produit_id)))"><option :value="null">Ligne libre</option><option v-if="line.produit_id && !products.some(p => p.id === line.produit_id)" :value="line.produit_id">Produit #{{ line.produit_id }}</option><option v-for="p in products" :key="p.id" :value="p.id">{{ p.label }}</option></select></label>
              <label>Désignation *<input v-model="line.designation" maxlength="191"></label><label>Quantité *<input v-model="line.quantite" inputmode="decimal"></label><label>Prix unitaire HT *<input v-model="line.prix" inputmode="decimal"></label><label>TVA (%) *<input v-model="line.tva" inputmode="decimal"></label><button type="button" @click="form.lines.splice(index, 1)">Retirer la ligne</button>
            </fieldset>
            <button v-if="!lockedOrder" type="button" :disabled="form.lines.length >= 100" @click="form.lines.push({ produit_id: null, designation: '', quantite: '1', prix: '0', tva: '0' })">+ Ajouter une ligne</button>
            <p v-if="record">Derniers totaux enregistrés : HT {{ record.total_ht }} · TVA {{ record.total_tva }} · TTC {{ record.total_ttc }} {{ record.devise }}</p>
            <p class="text-sm">Les totaux sont calculés et contrôlés à l’enregistrement. Utilisez un point pour les décimales.</p>
          </div>
          <div v-show="tab === 'tasks'" v-if="definition.children === 'tasks'" class="space-y-3">
            <fieldset v-for="(task, index) in form.tasks" :key="index" class="grid gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 md:grid-cols-3">
              <legend>Tâche {{ index + 1 }}</legend><label>Intitulé *<input v-model="task.titre" maxlength="191"></label><label>Statut<select v-model="task.statut"><option v-for="s in ['a_faire', 'en_cours', 'terminee', 'annulee']" :key="s" :value="s">{{ statusText(s) }}</option></select></label><label>Échéance<input v-model="task.echeance" type="date"></label><label>Responsable<select v-model="task.owner_id"><option :value="null">— Aucun —</option><option v-if="task.owner_id && !(choices.owner_id || []).some(c => c.id === task.owner_id)" :value="task.owner_id">Utilisateur #{{ task.owner_id }}</option><option v-for="p in choices.owner_id || []" :key="p.id" :value="p.id">{{ p.label }}</option></select></label><label>Temps passé (minutes)<input v-model="task.minutes" type="number" min="0" max="10000000"></label><button type="button" @click="form.tasks.splice(index, 1)">Retirer la tâche</button>
            </fieldset>
            <button type="button" :disabled="form.tasks.length >= 200" @click="form.tasks.push({ titre: '', statut: 'a_faire', owner_id: null, echeance: null, minutes: 0 })">+ Ajouter une tâche</button>
            <p>Temps total : {{ form.tasks.reduce((sum, t) => sum + Number(t.minutes || 0), 0) }} minutes. La recherche de responsables se trouve dans la section Fiche.</p>
          </div>
          <div v-if="!['messages', 'portal', 'history', 'renewal', 'lecture', 'deliveries'].includes(tab)" class="flex flex-wrap gap-3 border-t border-cyan-100 pt-4"><button v-if="editable" class="primary" type="submit">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button><span v-if="dirty" class="self-center text-sm">Modifications non enregistrées</span></div>
        </fieldset>
      </form>
      <section v-if="tab === 'deliveries' && record && shipment" class="space-y-5">
        <p v-if="record.legacy_delivery">Commande historique déjà facturée par livraisons : son ancien fonctionnement est conservé pour éviter les doubles sorties de stock.</p>
        <p v-else>Livrer crée un BL et déduit le stock, sans facturer. Vous pouvez créer la facture complète de la commande avant ou après les livraisons. Le paiement reste indépendant.</p>
        <RouterLink v-if="record.facture_id" :to="`/factures/${record.facture_id}`" class="action">Ouvrir la facture de la commande</RouterLink>
        <form v-if="record.can_bill" class="rounded-xl border border-cyan-200 p-4 space-y-3" @submit.prevent="billOrder"><label>Échéance de la facture<input v-model="shipment.date_echeance" type="date" required :disabled="saving || dirty"></label><button :disabled="saving || dirty">Créer la facture complète (brouillon)</button></form>
        <div class="overflow-auto"><table class="w-full text-sm"><thead><tr><th>Produit / prestation</th><th>Commandé</th><th>Livré</th><th>Reste</th><th>À livrer maintenant</th></tr></thead><tbody>
          <tr v-for="(line, index) in record.lines" :key="line.id"><td>{{ line.designation }}</td><td>{{ line.quantite }}</td><td>{{ line.livree }}</td><td>{{ line.reste }}</td><td><input v-model="shipment.lines[index].quantite" :aria-label="`Quantité à livrer : ${line.designation}`" type="number" min="0" step="0.001" :max="line.reste" :disabled="saving || dirty || !record.can_deliver || !!record.archived_at || record.statut !== 'confirmee' || Number(line.reste) <= 0"></td></tr>
        </tbody></table></div>
        <form v-if="record.can_deliver && !record.archived_at && record.statut === 'confirmee'" class="space-y-3" @submit.prevent="deliverOrder">
          <button type="button" :disabled="saving || dirty" @click="shipment.lines = record.lines.map(l => ({ line_id: l.id, quantite: l.reste }))">Livrer le reliquat : remplir les quantités restantes</button>
          <label>Date de livraison<input v-model="shipment.date_livraison" type="date" required :disabled="saving || dirty"></label>
          <label v-if="record.legacy_delivery">Échéance de paiement de la facture<input v-model="shipment.date_echeance" type="date" required :disabled="saving || dirty"></label>
          <label>Notes de livraison<textarea v-model="shipment.notes" maxlength="2000" :disabled="saving || dirty" /></label>
          <p v-if="dirty">Enregistrez les modifications de la fiche avant de livrer.</p>
          <button type="submit" class="primary" :disabled="saving || dirty">{{ saving ? 'Enregistrement…' : record.legacy_delivery ? 'Livrer et facturer ces quantités' : 'Valider la livraison / Générer le BL' }}</button>
        </form>
        <p v-else-if="record.statut === 'brouillon'">Confirmez la commande dans l’onglet Fiche pour commencer les livraisons.</p>
        <p v-else-if="record.statut === 'cloturee'">Commande clôturée. Consultez ci-dessous les livraisons enregistrées.</p>
        <p v-else-if="!record.can_deliver">La création et la validation des factures nécessitent les droits correspondants.</p>
        <h3 class="font-bold">Historique des livraisons</h3>
        <article v-for="delivery in record.deliveries" :key="delivery.id" class="rounded-xl border border-cyan-200 p-4"><p>{{ delivery.reference }} · {{ delivery.date_livraison }}</p><p class="whitespace-pre-wrap">{{ delivery.notes }}</p><div class="mt-3 flex flex-wrap items-center gap-4"><button type="button" :disabled="!!downloadingDelivery" @click="downloadDelivery(delivery)">{{ downloadingDelivery === delivery.id ? 'Préparation du PDF…' : 'Bon de livraison PDF' }}</button><RouterLink v-if="delivery.facture_id" :to="`/factures/${delivery.facture_id}`" class="font-bold underline">Ouvrir la facture</RouterLink></div></article>
        <p v-if="!record.deliveries.length">Aucune livraison enregistrée.</p>
      </section>
      <section v-if="tab === 'messages' && record" class="space-y-3">
        <p v-if="record.portal_user_id" class="rounded-xl bg-amber-50 p-4 font-semibold">Notes confidentielles : le client ne voit pas ces échanges. <button type="button" @click="tab = 'portal'">Répondre au client →</button></p>
        <p class="text-sm">{{ record.messages_total }} échange(s) · les 200 derniers échanges au maximum sont affichés.</p>
        <div class="max-h-96 space-y-3 overflow-auto"><article v-for="m in record.messages" :key="m.id" class="rounded-xl bg-cyan-50 p-4"><small>{{ m.created_at }} · Utilisateur #{{ m.user_id }}</small><p class="mt-2 whitespace-pre-wrap break-words">{{ m.contenu }}</p></article></div>
        <form v-if="editable && record.statut !== 'ferme'" @submit.prevent="sendMessage"><label>Nouvel échange interne<textarea v-model="message" maxlength="10000" rows="4" :disabled="saving || dirty" /></label><p v-if="dirty">Enregistrez la fiche avant d’ajouter un échange.</p><button class="mt-3" :disabled="saving || dirty || !message.trim()">Enregistrer l’échange</button></form>
      </section>
      <PortalTicketConversation v-if="key === 'sav' && record?.portal_user_id" v-show="tab === 'portal'" :key="record.id" :id="record.id" :editable="editable && record.statut !== 'ferme' && !dirty" @draft="portalDraft = $event" />
      <section v-if="tab === 'history' && record" class="max-h-96 overflow-auto"><p class="mb-3 text-sm">100 derniers événements. Les anciennes et nouvelles dates de renouvellement sont conservées.</p><p v-for="(event, index) in record.events" :key="index" class="border-b border-cyan-100 py-3">{{ event.created_at }} · {{ event.action }} · {{ statusText(event.statut) }} · Utilisateur #{{ event.user_id }} <span class="block">{{ eventDetails(event) }}</span></p></section>
      <form v-if="tab === 'renewal' && record" class="space-y-4" @submit.prevent="renewContract">
        <p>Fin actuelle : {{ record.date_fin }}. Ce renouvellement prolonge le contrat et conserve son historique. Il ne génère pas de facture.</p>
        <p v-if="dirty" role="alert">Enregistrez d’abord les modifications de la fiche.</p>
        <label>Nouvelle date de fin *<input v-model="renewalEnd" type="date" required :disabled="saving || dirty"></label>
        <label>Prochaine échéance de renouvellement<input v-model="renewalReminder" type="date" :disabled="saving || dirty"></label>
        <button type="submit" :disabled="saving || dirty || !renewalEnd">Confirmer le renouvellement</button>
      </form>
      <article v-if="tab === 'lecture' && record" class="rounded-xl bg-cyan-50 p-5">
        <p class="text-sm">{{ record.categorie }} · {{ statusText(record.statut) }} · Document interne</p>
        <h3 class="my-4 text-xl font-bold">{{ record.titre }}</h3>
        <p class="whitespace-pre-wrap break-words">{{ record.contenu }}</p>
      </article>
      <button v-if="record && !record.archived_at && definition.permissions.delete" class="mt-6" :disabled="saving || dirty || renewalDirty || shipmentDirty" @click="archive">Archiver la fiche</button>
    </section>
  </main>
</template>

<style scoped>
.business { color: #163b4b; }
.business label { display: block; font-size: .875rem; font-weight: 600; }
.business input:not([type=checkbox]), .business select, .business textarea { display: block; width: 100%; min-width: 0; margin-top: .35rem; border: 1px solid #94d9ef; border-radius: .7rem; padding: .65rem; background: #f2fcff; color: #163b4b; font-weight: 400; }
.business button, .business .action { border: 1px solid #80d4eb; border-radius: .7rem; padding: .6rem 1rem; background: #edfbff; color: #075d7a; font-weight: 600; }
.business .primary, .business button[aria-pressed=true] { background: #087e9e; color: white; }
.business button:disabled { opacity: .5; cursor: not-allowed; }
.business :focus-visible { outline: 3px solid #0ea5e9; outline-offset: 2px; }
.business th, .business td { padding: .85rem; border-bottom: 1px solid #d5f2fa; }
.business small { font-weight: 400; }
</style>
