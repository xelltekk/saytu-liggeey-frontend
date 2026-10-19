<template>
  <main class="subscriber-portal">
    <header>
      <p class="eyebrow">ESPACE ENTREPRISE ABONNÉE</p>
      <h1>{{ title }}</h1>
      <p>Votre assistance XELLTEKK et vos documents d’abonnement Saytu.</p>
    </header>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="loading" aria-live="polite">Chargement…</p>
    <template v-else-if="section === 'tickets'">
      <section v-if="creating">
        <button class="secondary" @click="creating = false">← Retour liste</button>
        <h2>Nouveau ticket</h2>
        <form @submit.prevent="createTicket">
          <label>Sujet <input v-model.trim="form.sujet" required maxlength="191" /></label>
          <label>Catégorie <select v-model="form.categorie"><option v-for="c in ['support', 'technique', 'licence', 'facturation', 'renouvellement']" :key="c">{{ c }}</option></select></label>
          <label>Priorité <select v-model="form.priorite"><option v-for="p in ['basse', 'normale', 'haute', 'urgente']" :key="p">{{ p }}</option></select></label>
          <label>Décrivez votre demande <textarea v-model.trim="form.description" required maxlength="4000" rows="7" /></label>
          <p>Une notification sera envoyée à contact@xelltekk.com. Ne saisissez pas de mot de passe dans votre demande.</p>
          <button :disabled="busy">{{ busy ? 'Enregistrement…' : 'Créer le ticket' }}</button>
        </form>
      </section>
      <section v-else-if="selected">
        <button class="secondary" @click="selected = null">← Retour liste</button>
        <h2>{{ selected.numero }} — {{ selected.sujet }}</h2>
        <p>{{ selected.statut_label }} · Priorité {{ selected.priorite_label }}</p>
        <p v-if="selected.notification_pending" class="notice">Ticket enregistré ; notification email en attente d’envoi.</p>
        <article v-for="m in selected.messages" :key="m.id">
          <strong>{{ m.author_name || m.author_label }}</strong><small> · {{ m.created_at }}</small>
          <p class="text-content">{{ m.message }}</p>
        </article>
        <form v-if="selected.can_reply" @submit.prevent="reply">
          <label>Votre réponse <textarea v-model.trim="replyText" required minlength="2" maxlength="4000" rows="4" /></label>
          <button :disabled="busy">Envoyer la réponse</button>
        </form>
        <button v-if="selected.can_close" class="secondary" :disabled="busy" @click="closeTicket">Marquer le ticket comme terminé</button>
      </section>
      <section v-else>
        <button @click="creating = true; notice = ''">+ Nouveau ticket</button>
        <p v-if="!tickets.length">Vous n’avez pas encore de ticket support.</p>
        <article v-for="ticket in tickets" :key="ticket.id">
          <h2>{{ ticket.numero }} — {{ ticket.sujet }}</h2>
          <p>{{ ticket.statut_label }} · {{ ticket.created_at }}</p>
          <button class="secondary" @click="selected = ticket; replyText = ''">Ouvrir la conversation</button>
        </article>
        <p v-if="tickets.length === 50">Les 50 tickets les plus récents sont affichés.</p>
      </section>
    </template>
    <section v-else-if="section === 'contrats' && !loading">
      <p>Contrats d’abonnement de votre entreprise — consultation uniquement.</p>
      <p v-if="!records.length">Aucun contrat rattaché à votre abonnement.</p>
      <article v-for="contract in records" :key="contract.id">
        <h2>{{ contract.numero }} · {{ contract.plan }}</h2>
        <p>Statut : {{ contract.statut }} · Du {{ date(contract.date_debut) }} au {{ date(contract.date_fin) }}</p>
        <button :disabled="busy" @click="downloadContract(contract)">Télécharger le contrat PDF</button>
      </article>
    </section>
    <section v-else-if="section === 'connaissances' && !loading">
      <form class="search" @submit.prevent="load(1)"><label>Rechercher une procédure <input v-model.trim="query" maxlength="100" placeholder="Ex. créer une facture" /></label><button>Rechercher</button></form>
      <p v-if="!records.length">Aucune procédure publiée ne correspond à votre recherche.</p>
      <details v-for="article in records" :key="article.id">
        <summary>{{ article.titre }} <small>— {{ article.categorie }}</small></summary>
        <p class="text-content">{{ article.contenu }}</p>
      </details>
    </section>
    <nav v-if="section !== 'tickets' && pages > 1 && !loading" aria-label="Pagination">
      <button :disabled="page <= 1" @click="load(page - 1)">Précédent</button>
      <span>Page {{ page }} / {{ pages }}</span>
      <button :disabled="page >= pages" @click="load(page + 1)">Suivant</button>
    </nav>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { subscriberSections } from '@/utils/subscriberPortal'

const route = useRoute()
const section = computed(() => route.params.section)
const title = computed(() => subscriberSections.find(([key]) => key === section.value)?.[1])
const loading = ref(false), busy = ref(false), error = ref(''), notice = ref('')
const tickets = ref([]), records = ref([]), selected = ref(null), creating = ref(false)
const page = ref(1), pages = ref(1), query = ref(''), replyText = ref('')
const form = ref({ sujet: '', description: '', categorie: 'support', priorite: 'normale' })
let requestVersion = 0
const message = e => e.response?.data?.message || 'Impossible de terminer cette opération. Réessayez.'
const date = value => value ? String(value).slice(0, 10) : '—'
async function load(nextPage = 1) {
  const version = ++requestVersion
  loading.value = true; error.value = ''
  try {
    const { data } = await api.get(section.value === 'tickets' ? '/support/tickets' : `/espace-client/${section.value}`, { params: { page: nextPage, q: query.value } })
    if (version !== requestVersion) return
    if (section.value === 'tickets') tickets.value = data.tickets
    else { records.value = data.data; page.value = data.current_page; pages.value = data.last_page }
  } catch (e) { if (version === requestVersion) error.value = message(e) }
  finally { if (version === requestVersion) loading.value = false }
}
async function createTicket() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    const { data } = await api.post('/support/tickets', form.value)
    creating.value = false; selected.value = data.ticket; notice.value = data.message
    form.value = { sujet: '', description: '', categorie: 'support', priorite: 'normale' }
    await load()
  } catch (e) { error.value = message(e) }
  finally { busy.value = false }
}
async function mutateTicket(action, body) {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    const { data } = await api.post(`/support/tickets/${selected.value.id}/${action}`, body)
    selected.value = data.ticket; notice.value = data.message; replyText.value = ''
    await load()
  } catch (e) { error.value = message(e) }
  finally { busy.value = false }
}
const reply = () => mutateTicket('messages', { message: replyText.value })
const closeTicket = () => mutateTicket('close', { message: 'Demande terminée par le client.' })
async function downloadContract(contract) {
  busy.value = true; error.value = ''
  try {
    const { data } = await api.get(`/espace-client/contrats/${contract.id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(data), anchor = document.createElement('a')
    anchor.href = url; anchor.download = `contrat-saytu-${contract.id}.pdf`; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  } catch { error.value = 'Impossible de télécharger le contrat PDF.' }
  finally { busy.value = false }
}
watch(section, () => { creating.value = false; selected.value = null; query.value = ''; notice.value = ''; records.value = []; tickets.value = []; load() }, { immediate: true })
</script>

<style scoped>
.subscriber-portal { max-width: 1100px; margin: auto; padding: clamp(16px, 3vw, 32px); color: #163448; background: #fff; border-radius: 20px; }
header, section { margin-bottom: 24px; } h1 { font-size: 1.65rem; font-weight: 800; } h2 { font-size: 1.1rem; font-weight: 700; margin: 12px 0; }
.eyebrow { color: #03698b; font-weight: 700; letter-spacing: .08em; font-size: .75rem; }
form { display: grid; gap: 16px; margin: 20px 0; } label { display: grid; gap: 6px; font-weight: 600; }
input, select, textarea { width: 100%; padding: 12px; border: 1px solid #99bed0; border-radius: 10px; background: #fff; color: #163448; }
button { padding: 10px 16px; border-radius: 10px; background: #006c99; color: white; font-weight: 600; justify-self: start; }
button.secondary { background: #edf7fc; color: #00547a; border: 1px solid #99bed0; } button:disabled { opacity: .5; cursor: not-allowed; }
article, details { border: 1px solid #cadce6; border-radius: 12px; padding: 16px; margin: 16px 0; overflow-wrap: anywhere; }
summary { cursor: pointer; font-weight: 700; } .text-content { white-space: pre-wrap; overflow-wrap: anywhere; margin-top: 12px; }
.error, .notice { padding: 14px; border-radius: 10px; margin: 12px 0; } .error { background: #fff0f0; color: #a01e2a; } .notice { background: #edf7fc; color: #164e63; }
nav { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; } :focus-visible { outline: 3px solid #1ab5dc; outline-offset: 3px; }
</style>
