<template>
  <main class="customer-portal">
    <header class="hero"><div><p class="eyebrow">VOTRE ESPACE CLIENT</p><h1>{{ account?.entreprise || 'Bienvenue dans votre espace client' }}</h1><p v-if="account">Bonjour {{ account.name }} · {{ account.client }}</p><p v-else>Un espace dédié pour vos demandes, vos commandes et vos contrats.</p></div><div class="hero-note">Un interlocuteur, un suivi clair.<br><small>Vos échanges et documents réunis au même endroit.</small></div></header>
    <p v-if="error" class="error" role="alert">{{ error }}</p><p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="loading">Chargement…</p>
    <form v-if="invitation" @submit.prevent="activate">
      <h2>Définir votre mot de passe</h2><p>Votre lien est personnel et valable 48 heures.</p>
      <label>Nouveau mot de passe (12 caractères minimum)<input v-model="password" type="password" autocomplete="new-password" required minlength="12" maxlength="128" /></label>
      <label>Confirmer le mot de passe<input v-model="confirmation" type="password" autocomplete="new-password" required minlength="12" maxlength="128" /></label>
      <button :disabled="busy">Activer mon accès</button>
    </form>
    <form v-else-if="!account && !loading" @submit.prevent="login">
      <label>Email<input v-model.trim="email" type="email" autocomplete="username" required maxlength="191" /></label>
      <label>Mot de passe<input v-model="password" type="password" autocomplete="current-password" required maxlength="128" /></label>
      <button :disabled="busy">Se connecter</button><p>Pas encore d’accès ou mot de passe oublié ? Demandez une invitation à votre fournisseur.</p>
    </form>
    <template v-else-if="account">
      <div class="conversation-heading"><span>Votre espace sécurisé</span><button class="secondary" :aria-expanded="showNotifications" @click="showNotifications = !showNotifications; loadNotifications()">🔔 Notifications ({{ notifications.unread }})</button></div>
      <section v-if="showNotifications" aria-label="Notifications"><p v-if="notificationError" role="alert">{{ notificationError }}</p><p v-if="!notifications.items.length">Aucune notification.</p><article v-for="n in notifications.items" :key="n.id"><button class="secondary" :disabled="busy" @click="openNotification(n)">{{ n.read_at ? '' : '● ' }}{{ n.title }}</button><small> {{ date(n.created_at) }}</small></article><small>Les 50 dernières notifications sont affichées.</small></section>
      <nav aria-label="Rubriques du portail"><button v-for="[key, label] in sections" :key="key" class="secondary" :aria-pressed="kind === key" :disabled="busy" @click="changeSection(key)">{{ label }}</button><button class="secondary" :disabled="busy" @click="logout">Déconnexion</button></nav>
      <div class="section-heading"><div><p class="eyebrow">{{ account.client }}</p><h2>{{ sectionTitle }}</h2><p>{{ sectionDescription }}</p></div><span class="privacy-badge">Espace réservé à votre entreprise</span></div>
      <section v-if="creating && !loading">
        <button class="secondary" :disabled="busy" @click="cancelCreation">← Retour liste</button>
        <h2>{{ kind === 'tickets' ? 'Créer un ticket' : kind === 'prix' ? 'Demander un prix / devis' : 'Soumettre un bon de commande' }}</h2>
        <p v-if="kind === 'prix'">Décrivez les articles souhaités. Votre fournisseur préparera un devis : aucun achat n’est engagé par cette demande.</p>
        <p v-if="kind === 'commandes'">Indiquez les articles et quantités souhaités. Votre fournisseur préparera un devis à vous soumettre. Cette demande ne vaut pas confirmation d’achat.</p>
        <form @submit.prevent="submit">
          <label>Objet<input v-model.trim="form.titre" required maxlength="191" /></label>
          <label>{{ kind === 'tickets' ? 'Décrivez votre problème' : 'Instructions / référence de votre bon de commande' }}<textarea v-model.trim="form.description" required maxlength="4000" rows="5" /></label>
          <label v-if="kind === 'tickets'">Priorité<select v-model="form.priorite"><option v-for="p in ['basse', 'normale', 'haute', 'urgente']" :key="p">{{ p }}</option></select></label>
          <fieldset v-else><legend>Articles demandés</legend><div v-for="(line, i) in lines" :key="i" class="order-line"><label>Article<input v-model.trim="line.designation" required maxlength="191" /></label><label>Quantité<input v-model="line.quantite" type="number" required min="0.001" max="999999" step="0.001" /></label><button v-if="lines.length > 1" type="button" class="secondary" @click="lines.splice(i, 1)">Retirer</button></div><button type="button" class="secondary" :disabled="lines.length >= 50" @click="lines.push({ designation: '', quantite: 1 })">+ Article</button></fieldset>
          <button :disabled="busy">{{ busy ? 'Enregistrement…' : 'Envoyer la demande' }}</button>
        </form>
      </section>
      <section v-else-if="selected && !loading">
        <button class="secondary" :disabled="busy" @click="back">← Retour liste</button><div class="detail-heading"><div><p class="eyebrow">{{ selected.reference }}</p><h2>{{ selected.titre }}</h2></div><span class="status-badge" :data-status="selected.statut">{{ status(selected.statut) }}</span></div>
        <template v-if="kind === 'tickets'">
          <div class="ticket-meta"><span>Priorité : {{ selected.priorite }}</span><span>Créé le {{ date(selected.created_at) }}</span></div>
          <article class="original-request"><h3>Votre demande initiale</h3><p class="text">{{ selected.description }}</p></article>
          <article v-if="selected.resolution?.trim()" class="ticket-resolution" aria-label="Solution apportée"><h3>Solution apportée par votre fournisseur</h3><p class="text">{{ selected.resolution }}</p></article>
          <div class="conversation-heading"><h3>Conversation avec votre fournisseur</h3><button class="secondary" :disabled="refreshing || busy" @click="refreshTicket">{{ refreshing ? 'Actualisation…' : 'Actualiser' }}</button></div>
          <p class="sync-state" role="status">{{ syncError || (lastSync ? `Actualisé à ${lastSync} · mise à jour automatique toutes les 15 secondes` : 'Les réponses apparaissent ici automatiquement.') }}</p>
          <div class="conversation"><p v-if="!selected.messages?.length" class="empty">Votre ticket est enregistré. La première réponse de votre fournisseur apparaîtra ici.</p><article v-for="m in selected.messages" :key="m.id" class="message" :class="{ support: m.author_type === 'support' }"><div class="message-heading"><strong>{{ m.author_name }} <small>· {{ m.author_type === 'support' ? 'Équipe support' : 'Votre entreprise' }}</small></strong><time>{{ date(m.created_at) }}</time></div><p class="text">{{ m.body }}</p></article></div>
          <form v-if="selected.statut !== 'ferme'" class="reply-box" @submit.prevent="reply"><label>Votre réponse<textarea v-model.trim="replyText" required maxlength="4000" rows="4" placeholder="Ajoutez une précision ou répondez à votre interlocuteur…" /></label><small>{{ replyText.length }} / 4 000 caractères · visible par votre fournisseur et les contacts de votre entreprise</small><button :disabled="busy || !replyText">{{ busy ? 'Envoi…' : 'Envoyer ma réponse' }}</button></form><p v-else class="notice">Ticket fermé — consultation uniquement. Vous ne pouvez plus répondre ni rouvrir ce ticket. Seule l’équipe interne autorisée peut le rouvrir. Pour un autre besoin, créez une nouvelle demande.</p>
        </template>
        <template v-if="kind === 'commandes'"><p v-if="selected.statut === 'brouillon' && !selected.quote_request_id" class="notice">Demande reçue. Votre fournisseur préparera un devis ; les prix seront précisés dans ce devis.</p><p class="notice">Demande → Devis → Acceptation du devis → Livraison / BL → Facture</p><article v-for="(l, i) in selected.lines" :key="i"><strong>{{ l.designation }}</strong> · Quantité {{ l.quantite }}<p>Livrée : {{ l.livree }} · Reste à livrer : {{ l.reste }}</p><p v-if="selected.statut !== 'brouillon'">Total TTC : {{ l.total_ttc }} {{ selected.devise }}</p></article><p v-if="selected.statut !== 'brouillon'">Total : {{ selected.total_ttc }} {{ selected.devise }}</p><h3>Bons de livraison</h3><p v-if="!selected.deliveries?.length">Aucune livraison enregistrée.</p><article v-for="d in selected.deliveries" :key="d.id">{{ d.reference }} · {{ d.date_livraison }} <button class="secondary" :disabled="busy" @click="downloadBL(d)">Télécharger le BL PDF</button></article><p v-if="selected.invoice">Facture : {{ selected.invoice.numero }} · {{ selected.invoice.total_ttc }} {{ selected.devise }}</p></template>
        <template v-if="kind === 'prix'"><p class="text">{{ selected.description }}</p><article v-for="(l, i) in selected.lines" :key="i">{{ l.designation }} · Quantité {{ l.quantite }}</article><p v-if="!selected.devis" class="notice">Votre demande est en cours de traitement. Le devis sera visible après son envoi par votre fournisseur.</p><article v-else><h3>Devis {{ selected.devis.numero }}</h3><p>Valable jusqu’au {{ selected.devis.date_validite }}</p><p>Total TTC : {{ selected.devis.total_ttc }} {{ selected.devis.devise }}</p></article></template>
        <template v-if="kind === 'contrats'"><p>Du {{ selected.date_debut }} au {{ selected.date_fin }}</p><p>Montant HT : {{ selected.montant }} {{ selected.devise }} · {{ selected.periodicite }}</p><p>Pour toute précision sur votre contrat, créez un ticket.</p></template>
        <button v-if="kind === 'prix' && selected.devis" class="secondary" :disabled="busy" @click="downloadQuote">Télécharger le devis PDF</button>
        <section v-if="kind === 'commandes' && selected.quote_request_id" class="notice"><p>Votre demande a été transformée en devis. Consultez-le dans « Demandes de prix » dès son envoi par votre fournisseur.</p><button :disabled="busy" @click="openOrderQuote">Consulter le suivi du devis</button></section>
        <section v-if="kind === 'prix' && selected.devis" class="notice">
          <p>Statut du devis : {{ status(selected.devis.statut) }}</p>
          <template v-if="selected.devis.can_decide">
            <p>Consultez le PDF avant de répondre. Votre décision concerne l’ensemble du devis, ses prix et ses conditions.</p>
            <label>Commentaire (facultatif)<textarea v-model="selected.draftComment" maxlength="1000" :disabled="busy" /></label>
            <button :disabled="busy" @click="decideQuote('accepte')">Accepter le devis</button>
            <button class="secondary" :disabled="busy" @click="decideQuote('refuse')">Refuser le devis</button>
          </template>
          <p v-else-if="!selected.decision && selected.devis.statut === 'envoye'">Ce devis a expiré. Contactez votre fournisseur pour le renouveler.</p>
          <template v-if="selected.decision"><p>Décision enregistrée le {{ date(selected.decision.created_at) }} : {{ status(selected.decision.decision) }}</p><p class="text">{{ selected.decision.comment }}</p></template>
          <button v-if="selected.order_id" class="secondary" :disabled="busy" @click="openQuoteOrder">Suivre la commande et les livraisons</button>
        </section>
      </section>
      <section v-else-if="!loading">
        <form class="filters" @submit.prevent="load()"><label>Rechercher<input v-model.trim="search" maxlength="191" placeholder="Objet ou référence…" type="search" /></label><label v-if="kind !== 'connaissances'">Statut<select v-model="filterStatus"><option value="">Tous les statuts</option><option v-for="s in statusOptions" :key="s" :value="s">{{ status(s) }}</option></select></label><button :disabled="busy">Rechercher</button><button type="button" class="secondary" @click="resetFilters">Réinitialiser</button></form>
        <div class="list-summary"><span>{{ total }} résultat(s)</span><small>20 éléments par page</small></div>
        <button v-if="['tickets', 'commandes', 'prix'].includes(kind)" @click="start">{{ kind === 'tickets' ? '+ Nouveau ticket' : kind === 'prix' ? '+ Demande de prix' : '+ Bon de commande' }}</button>
        <p v-if="!records.length" class="empty">Aucun élément disponible dans cette rubrique.</p>
        <template v-if="kind === 'connaissances'"><details v-for="r in records" :key="r.id"><summary>{{ r.titre }} — {{ r.categorie }}</summary><p class="text">{{ r.contenu }}</p></details></template>
        <div v-else class="record-grid"><article v-for="r in records" :key="r.id" class="record-card"><div class="card-top"><span class="eyebrow">{{ r.reference }}</span><span class="status-badge" :data-status="r.statut">{{ r.portal_review_state === 'quoted' ? 'Transformée en devis' : status(r.statut) }}</span></div><h2>{{ r.titre }}</h2><p class="muted">Créé le {{ date(r.created_at) }}</p><button class="secondary" :disabled="busy" @click="open(r)">{{ kind === 'tickets' ? 'Voir la conversation →' : 'Consulter →' }}</button></article></div>
        <nav v-if="pages > 1"><button :disabled="page <= 1" @click="load(page - 1)">Précédent</button><span>{{ page }} / {{ pages }}</span><button :disabled="page >= pages" @click="load(page + 1)">Suivant</button></nav>
      </section>
    </template>
  </main>
</template>
<script setup>
import { requestConfirmation as appConfirm } from '@/composables/useConfirm'
import { computed, onBeforeUnmount, ref } from 'vue'
import axios from 'axios'
const sections = [['tickets', 'Mes tickets'], ['prix', 'Demandes de prix'], ['commandes', 'Mes commandes'], ['contrats', 'Mes contrats'], ['connaissances', 'Base de connaissances']]
const key = 'saytu_customer_portal_session'
const api = axios.create({ baseURL: '/api/client-portal', headers: { Accept: 'application/json' } })
api.interceptors.request.use(c => { const token = sessionStorage.getItem(key); if (token) c.headers.Authorization = `Bearer ${token}`; return c })
const account = ref(null), email = ref(''), password = ref(''), confirmation = ref(''), invitation = ref(new URLSearchParams(location.hash.slice(1)).get('invitation') || '')
if (invitation.value) history.replaceState(null, '', location.pathname)
const loading = ref(false), busy = ref(false), error = ref(''), notice = ref(''), kind = ref('tickets'), records = ref([]), selected = ref(null), creating = ref(false), page = ref(1), pages = ref(1)
const form = ref({}), lines = ref([]), requestId = ref(''), replyText = ref(''), replyId = ref(crypto.randomUUID())
const search = ref(''), filterStatus = ref(''), total = ref(0), refreshing = ref(false), lastSync = ref(''), syncError = ref('')
const notifications = ref({ unread: 0, items: [] }), showNotifications = ref(false), notificationError = ref('')
const sectionTitle = computed(() => sections.find(([value]) => value === kind.value)?.[1])
const sectionDescription = computed(() => ({ prix: 'Décrivez vos besoins et recevez un devis de votre fournisseur.', tickets: 'Décrivez votre besoin et suivez les réponses de notre équipe.', commandes: 'Préparez vos demandes ; votre fournisseur les chiffre avant confirmation.', contrats: 'Retrouvez les contrats partagés avec votre entreprise.', connaissances: 'Consultez les guides et les réponses aux questions fréquentes.' }[kind.value]))
const statusOptions = computed(() => ({ prix: ['recue', 'en_chiffrage'], tickets: ['ouvert', 'en_cours', 'en_attente', 'resolu', 'ferme'], commandes: ['brouillon', 'confirmee', 'cloturee', 'annulee'], contrats: ['actif', 'termine', 'resilie'] }[kind.value] || []))
const date = value => { if (!value) return '—'; const d = new Date(String(value).replace(' ', 'T')); return Number.isNaN(d.getTime()) ? value : d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) }
let sequence = 0
const status = s => ({ envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé', facture: 'Facturé', expire: 'Expiré', recue: 'Demande reçue', en_chiffrage: 'Devis en préparation / suivi', brouillon: 'En attente de validation', confirmee: 'Confirmée', cloturee: 'Livrée', annulee: 'Annulée', ouvert: 'Ouvert', en_cours: 'En cours', en_attente: 'En attente', resolu: 'Résolu', ferme: 'Fermé', actif: 'Actif', termine: 'Terminé', resilie: 'Résilié' }[s] || s)
function failed(e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' · ') || e.response?.data?.message || 'Opération impossible. Réessayez.'; if ([401, 402, 403].includes(e.response?.status)) { sequence++; account.value = null; selected.value = null; records.value = []; sessionStorage.removeItem(key) } }
async function run(fn) { if (busy.value) return; busy.value = true; error.value = ''; try { await fn() } catch (e) { failed(e) } finally { busy.value = false } }
const activate = () => run(async () => { const { data } = await api.post('/activate', { token: invitation.value, password: password.value, password_confirmation: confirmation.value }); invitation.value = ''; password.value = ''; confirmation.value = ''; notice.value = data.message })
const login = () => run(async () => { const { data } = await api.post('/login', { email: email.value, password: password.value }); sessionStorage.setItem(key, data.token); password.value = ''; notifications.value = { unread: 0, items: [] }; account.value = (await api.get('/me')).data; notice.value = ''; await load(); await loadNotifications() })
const logout = async () => { if (!await canLeave()) return; return run(async () => { try { await api.post('/logout') } finally { sequence++; account.value = null; selected.value = null; records.value = []; creating.value = false; replyText.value = ''; sessionStorage.removeItem(key) } }) }
async function load(p = 1) { const version = ++sequence; loading.value = true; error.value = ''; try { const { data } = await api.get(`/${kind.value}`, { params: { page: p, q: search.value || undefined, statut: filterStatus.value || undefined } }); if (version === sequence) { records.value = data.data; page.value = data.current_page; pages.value = data.last_page; total.value = data.total } } catch (e) { if (version === sequence) failed(e) } finally { if (version === sequence) loading.value = false } }
const canLeave = async () => !busy.value && (!(creating.value || replyText.value || selected.value?.draftComment || selected.value?.orderDraft) || await appConfirm('Quitter cette saisie sans envoyer ?'))
async function cancelCreation() { if (await canLeave()) creating.value = false }
async function back() { if (!await canLeave()) return; sequence++; selected.value = null; replyText.value = ''; load(page.value) }
function resetFilters() { search.value = ''; filterStatus.value = ''; load() }
async function changeSection(value) { if (!await canLeave()) return; kind.value = value; creating.value = false; selected.value = null; replyText.value = ''; notice.value = ''; resetFilters() }
function start() { form.value = { titre: '', description: '', priorite: 'normale' }; lines.value = [{ designation: '', quantite: 1 }]; requestId.value = crypto.randomUUID(); creating.value = true; notice.value = '' }
const open = r => run(async () => { sequence++; selected.value = (await api.get(`/${kind.value}/${r.id}`)).data; replyText.value = ''; replyId.value = crypto.randomUUID(); lastSync.value = ''; syncError.value = '' })
const submit = () => run(async () => { const payload = { ...form.value, request_id: requestId.value }; if (['commandes', 'prix'].includes(kind.value)) payload.lines = lines.value; const { data } = await api.post(`/${kind.value}`, payload); notice.value = data.message; creating.value = false; await load(); selected.value = (await api.get(`/${kind.value}/${data.id}`)).data })
let notificationsLoading = false
async function loadNotifications() { if (!account.value || notificationsLoading || document.hidden) return; const identity = account.value; notificationsLoading = true; try { const { data } = await api.get('/notifications'); if (account.value === identity) { notifications.value = data; notificationError.value = '' } } catch { if (account.value === identity) notificationError.value = 'Notifications indisponibles. Réessayez.' } finally { notificationsLoading = false } }
async function openNotification(n) { if (busy.value || !await canLeave()) return; await run(async () => { sequence++; kind.value = n.kind; selected.value = null; creating.value = false; replyText.value = ''; search.value = ''; filterStatus.value = ''; await load(); selected.value = (await api.get(`/${n.kind}/${n.record_id}`)).data; replyId.value = crypto.randomUUID(); await api.post(`/notifications/${n.id}/read`); showNotifications.value = false; await loadNotifications() }) }
const downloadBL = d => run(async () => { const { data } = await api.get(`/commandes/${selected.value.id}/livraisons/${d.id}/pdf`, { responseType: 'blob' }); const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = `BL-${d.id}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) })
const downloadQuote = () => run(async () => { const { data } = await api.get(`/prix/${selected.value.id}/devis/pdf`, { responseType: 'blob' }); const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = `devis-${selected.value.id}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) })
const decideQuote = async decision => {
  if (busy.value || !selected.value?.devis?.can_decide) return
  if (!await appConfirm(`${decision === 'accepte' ? 'Accepter' : 'Refuser'} le devis ${selected.value.devis.numero} (${selected.value.devis.total_ttc} ${selected.value.devis.devise}) ? Cette décision sera transmise à votre fournisseur.`)) return
  return run(async () => {
    const row = selected.value
    const content = { decision, comment: row.draftComment || null, fingerprint: row.devis.fingerprint }
    const hash = JSON.stringify(content)
    if (row.decisionRequest?.hash !== hash) row.decisionRequest = { hash, id: crypto.randomUUID() }
    const { data } = await api.post(`/prix/${row.id}/devis/decision`, { ...content, request_id: row.decisionRequest.id })
    // Clear only after successful submission; keep the UUID if a response is lost.
    row.draftComment = ''; notice.value = data.message
    selected.value = (await api.get(`/prix/${row.id}`)).data
  })
}
const openQuoteOrder = async () => { if (!await canLeave()) return; return run(async () => { const id = selected.value.order_id; const { data } = await api.get(`/commandes/${id}`); sequence++; kind.value = 'commandes'; selected.value = data; search.value = ''; filterStatus.value = '' }) }
const refreshOrder = () => run(async () => { const id = selected.value.id; selected.value = (await api.get(`/commandes/${id}`)).data; notice.value = 'Commande actualisée.' })
const openOrderQuote = () => run(async () => { const id = selected.value.quote_request_id; if (!id) return; const { data } = await api.get(`/prix/${id}`); sequence++; kind.value = 'prix'; selected.value = data; search.value = ''; filterStatus.value = '' })
const reply = () => run(async () => { sequence++; selected.value = (await api.post(`/tickets/${selected.value.id}/messages`, { body: replyText.value, request_id: replyId.value })).data; replyText.value = ''; replyId.value = crypto.randomUUID(); syncError.value = ''; notice.value = 'Votre réponse a été envoyée.' })
async function refreshTicket() {
  if (!account.value || kind.value !== 'tickets' || !selected.value || busy.value || refreshing.value || document.hidden) return
  const id = selected.value.id, version = sequence
  refreshing.value = true
  try { const { data } = await api.get(`/tickets/${id}`); if (version === sequence && selected.value?.id === id) { selected.value = data; syncError.value = ''; lastSync.value = new Date().toLocaleTimeString('fr-FR') } }
  catch (e) { if (version === sequence) { syncError.value = 'Actualisation interrompue. Cliquez sur Actualiser pour réessayer.'; if ([401, 403, 402].includes(e.response?.status)) failed(e) } }
  finally { refreshing.value = false }
}
const timer = setInterval(refreshTicket, 15000)
const notificationTimer = setInterval(loadNotifications, 30000)
onBeforeUnmount(() => clearInterval(notificationTimer))
document.addEventListener('visibilitychange', refreshTicket)
const beforeUnload = e => { if (replyText.value || creating.value || selected.value?.draftComment || selected.value?.orderDraft) { e.preventDefault(); e.returnValue = '' } }
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(() => { sequence++; clearInterval(timer); document.removeEventListener('visibilitychange', refreshTicket); window.removeEventListener('beforeunload', beforeUnload) })
async function boot() { if (!sessionStorage.getItem(key) || invitation.value) return; loading.value = true; try { account.value = (await api.get('/me')).data; await load(); await loadNotifications() } catch (e) { failed(e) } finally { loading.value = false } }
boot()
</script>
<style scoped>
.ticket-resolution { background: #eaf8f0; border: 1px solid #9dceb1; border-left: 4px solid #238154; color: #174b32; }
.hero { display: flex; justify-content: space-between; gap: 24px; padding: 30px; background: linear-gradient(120deg, #123d5b, #076982); color: #fff; border-radius: 18px; }
.hero .eyebrow { color: #a4e8f1; } .hero p { margin-top: 8px; } .hero-note { align-self: center; max-width: 270px; line-height: 1.7; border-left: 2px solid #57cddd; padding-left: 22px; } .hero-note small { color: #d3edf5; }
.section-heading, .detail-heading, .conversation-heading, .card-top, .message-heading, .list-summary { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.section-heading { margin: 28px 0; } .section-heading h2 { font-size: 1.65rem; margin: 5px 0; } .section-heading p, .muted, .sync-state, .ticket-meta { color: #526778; } .privacy-badge { border: 1px solid #d1e3eb; border-radius: 30px; padding: 8px 12px; font-size: .8rem; }
.customer-portal .filters { display: flex; flex-wrap: wrap; align-items: end; background: #f3f7fa; padding: 18px; border-radius: 14px; } .filters label:first-child { flex: 1; min-width: 180px; }
.list-summary { margin: 18px 0; color: #526778; } .record-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; } .record-grid article { margin: 0; box-shadow: 0 4px 15px #143e5910; } .record-card button { margin-top: 18px; }
.status-badge { display: inline-block; padding: 6px 10px; border-radius: 30px; background: #edf2f7; color: #334d62; font-size: .8rem; font-weight: 700; }
.status-badge[data-status=ouvert], .status-badge[data-status=en_cours] { color: #115b92; background: #e2f1ff; } .status-badge[data-status=en_attente], .status-badge[data-status=brouillon] { color: #815000; background: #fff3d6; } .status-badge[data-status=resolu], .status-badge[data-status=actif], .status-badge[data-status=confirmee] { color: #126442; background: #e0f6eb; }
.detail-heading { margin-top: 24px; } .ticket-meta { display: flex; flex-wrap: wrap; gap: 22px; font-size: .85rem; margin-top: 14px; } h3 { font-weight: 700; } .original-request { background: #f5f8fa; } .sync-state { font-size: .8rem; margin: 12px 0; }
.conversation { max-height: 600px; overflow: auto; padding: 4px; } .message { margin-left: 30px; background: #f8fafc; } .message.support { margin-left: 0; margin-right: 30px; background: #eff9fc; border-left: 4px solid #007b99; } .message-heading small, time { font-size: .78rem; color: #526778; } .reply-box { background: #f3f7fa; padding: 22px; border-radius: 14px; } .reply-box small { color: #526778; }
@media(max-width: 720px) { .hero { flex-direction: column; padding: 22px; } .hero-note { display: none; } .record-grid { grid-template-columns: 1fr; } .privacy-badge { display: none; } .message, .message.support { margin-left: 0; margin-right: 0; } }
.customer-portal { max-width: 1080px; margin: 32px auto; padding: clamp(20px, 4vw, 48px); background: #fff; color: #163448; border-radius: 20px; min-height: 75vh; }
h1 { font-size: 1.8rem; font-weight: 800; } h2 { font-size: 1.15rem; font-weight: 700; margin: 12px 0; } header { margin-bottom: 24px; } .eyebrow { font-size: .75rem; letter-spacing: .12em; font-weight: 700; color: #006787; }
form { display: grid; gap: 16px; margin: 20px 0; } label { display: grid; gap: 6px; font-weight: 600; } input, textarea, select { width: 100%; border: 1px solid #91b6ca; padding: 12px; border-radius: 9px; background: white; color: #163448; }
button { background: #00678d; color: white; font-weight: 700; padding: 11px 16px; border-radius: 10px; justify-self: start; } button.secondary { color: #005070; background: #edf7fc; border: 1px solid #9bc4d8; } button[aria-pressed=true] { background: #005070; color: white; } button:disabled { opacity: .5; cursor: not-allowed; }
nav { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 24px 0; } article, details { border: 1px solid #c6dce5; padding: 18px; border-radius: 12px; margin: 14px 0; overflow-wrap: anywhere; } summary { cursor: pointer; font-weight: 700; } .text { white-space: pre-wrap; overflow-wrap: anywhere; margin-top: 12px; }
.error, .notice { padding: 14px; border-radius: 10px; margin: 12px 0; } .error { background: #fff0f0; color: #a31525; } .notice { background: #edf7fc; color: #174c62; } .empty { padding: 24px 0; } .order-line { display: grid; grid-template-columns: minmax(0, 2fr) minmax(100px, 1fr) auto; align-items: end; gap: 12px; margin: 12px 0; }
:focus-visible { outline: 3px solid #18aecf; outline-offset: 3px; } @media(max-width: 600px) { .order-line { grid-template-columns: 1fr; } .customer-portal { margin: 0; border-radius: 0; } }
</style>
