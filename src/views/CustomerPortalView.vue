<template>
  <main class="customer-portal">
    <header><p class="eyebrow">PORTAIL CLIENTS</p><h1>{{ account?.entreprise || 'Bienvenue dans votre espace client' }}</h1><p v-if="account">{{ account.client }} · {{ account.name }}</p><p v-else>Connectez-vous avec l’accès reçu de votre fournisseur, distinct d’un compte employé Saytu.</p></header>
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
      <nav aria-label="Rubriques du portail"><button v-for="[key, label] in sections" :key="key" class="secondary" :aria-pressed="kind === key" :disabled="busy" @click="changeSection(key)">{{ label }}</button><button class="secondary" :disabled="busy" @click="logout">Déconnexion</button></nav>
      <section v-if="creating && !loading">
        <button class="secondary" :disabled="busy" @click="creating = false">← Retour liste</button>
        <h2>{{ kind === 'tickets' ? 'Créer un ticket' : 'Soumettre un bon de commande' }}</h2>
        <p v-if="kind === 'commandes'">Indiquez les articles et quantités souhaités. Votre fournisseur vérifiera les disponibilités, les prix et les taxes avant d’accepter la commande. Cette demande ne vaut pas confirmation.</p>
        <form @submit.prevent="submit">
          <label>Objet<input v-model.trim="form.titre" required maxlength="191" /></label>
          <label>{{ kind === 'tickets' ? 'Décrivez votre problème' : 'Instructions / référence de votre bon de commande' }}<textarea v-model.trim="form.description" required maxlength="4000" rows="5" /></label>
          <label v-if="kind === 'tickets'">Priorité<select v-model="form.priorite"><option v-for="p in ['basse', 'normale', 'haute', 'urgente']" :key="p">{{ p }}</option></select></label>
          <fieldset v-else><legend>Articles demandés</legend><div v-for="(line, i) in lines" :key="i" class="order-line"><label>Article<input v-model.trim="line.designation" required maxlength="191" /></label><label>Quantité<input v-model="line.quantite" type="number" required min="0.001" max="999999" step="0.001" /></label><button v-if="lines.length > 1" type="button" class="secondary" @click="lines.splice(i, 1)">Retirer</button></div><button type="button" class="secondary" :disabled="lines.length >= 50" @click="lines.push({ designation: '', quantite: 1 })">+ Article</button></fieldset>
          <button :disabled="busy">{{ busy ? 'Enregistrement…' : 'Envoyer la demande' }}</button>
        </form>
      </section>
      <section v-else-if="selected && !loading">
        <button class="secondary" @click="selected = null">← Retour liste</button><h2>{{ selected.reference }} — {{ selected.titre }}</h2><p>{{ status(selected.statut) }}</p>
        <template v-if="kind === 'tickets'"><p class="text">{{ selected.description }}</p><article v-for="m in selected.messages" :key="m.id"><strong>{{ m.author_name }}</strong> · {{ m.created_at }}<p class="text">{{ m.body }}</p></article><form v-if="selected.statut !== 'ferme'" @submit.prevent="reply"><label>Ajouter une réponse<textarea v-model.trim="replyText" required maxlength="4000" rows="4" /></label><button :disabled="busy">Envoyer</button></form></template>
        <template v-if="kind === 'commandes'"><p v-if="selected.statut === 'brouillon'" class="notice">Demande en attente de vérification et de chiffrage. Les montants ne sont pas définitifs.</p><article v-for="(l, i) in selected.lines" :key="i"><strong>{{ l.designation }}</strong> · Quantité {{ l.quantite }}<p v-if="selected.statut !== 'brouillon'">Total TTC : {{ l.total_ttc }} {{ selected.devise }}</p></article><p v-if="selected.statut !== 'brouillon'">Total : {{ selected.total_ttc }} {{ selected.devise }}</p></template>
        <template v-if="kind === 'contrats'"><p>Du {{ selected.date_debut }} au {{ selected.date_fin }}</p><p>Montant HT : {{ selected.montant }} {{ selected.devise }} · {{ selected.periodicite }}</p><p>Pour toute précision sur votre contrat, créez un ticket.</p></template>
      </section>
      <section v-else-if="!loading">
        <button v-if="['tickets', 'commandes'].includes(kind)" @click="start">{{ kind === 'tickets' ? '+ Nouveau ticket' : '+ Bon de commande' }}</button>
        <p v-if="!records.length" class="empty">Aucun élément disponible dans cette rubrique.</p>
        <template v-if="kind === 'connaissances'"><details v-for="r in records" :key="r.id"><summary>{{ r.titre }} — {{ r.categorie }}</summary><p class="text">{{ r.contenu }}</p></details></template>
        <template v-else><article v-for="r in records" :key="r.id"><h2>{{ r.reference }} — {{ r.titre }}</h2><p>{{ status(r.statut) }}</p><button class="secondary" @click="open(r)">Consulter</button></article></template>
        <nav v-if="pages > 1"><button :disabled="page <= 1" @click="load(page - 1)">Précédent</button><span>{{ page }} / {{ pages }}</span><button :disabled="page >= pages" @click="load(page + 1)">Suivant</button></nav>
      </section>
    </template>
  </main>
</template>
<script setup>
import { ref } from 'vue'
import axios from 'axios'
const sections = [['tickets', 'Mes tickets'], ['commandes', 'Mes commandes'], ['contrats', 'Mes contrats'], ['connaissances', 'Base de connaissances']]
const key = 'saytu_customer_portal_session'
const api = axios.create({ baseURL: '/api/client-portal', headers: { Accept: 'application/json' } })
api.interceptors.request.use(c => { const token = sessionStorage.getItem(key); if (token) c.headers.Authorization = `Bearer ${token}`; return c })
const account = ref(null), email = ref(''), password = ref(''), confirmation = ref(''), invitation = ref(new URLSearchParams(location.hash.slice(1)).get('invitation') || '')
if (invitation.value) history.replaceState(null, '', location.pathname)
const loading = ref(false), busy = ref(false), error = ref(''), notice = ref(''), kind = ref('tickets'), records = ref([]), selected = ref(null), creating = ref(false), page = ref(1), pages = ref(1)
const form = ref({}), lines = ref([]), requestId = ref(''), replyText = ref(''), replyId = ref(crypto.randomUUID())
let sequence = 0
const status = s => ({ brouillon: 'En attente de validation', confirmee: 'Confirmée', cloturee: 'Livrée', annulee: 'Annulée', ouvert: 'Ouvert', en_cours: 'En cours', en_attente: 'En attente', resolu: 'Résolu', ferme: 'Fermé', actif: 'Actif', termine: 'Terminé', resilie: 'Résilié' }[s] || s)
function failed(e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' · ') || e.response?.data?.message || 'Opération impossible. Réessayez.'; if (e.response?.status === 401) { account.value = null; sessionStorage.removeItem(key) } }
async function run(fn) { if (busy.value) return; busy.value = true; error.value = ''; try { await fn() } catch (e) { failed(e) } finally { busy.value = false } }
const activate = () => run(async () => { const { data } = await api.post('/activate', { token: invitation.value, password: password.value, password_confirmation: confirmation.value }); invitation.value = ''; password.value = ''; confirmation.value = ''; notice.value = data.message })
const login = () => run(async () => { const { data } = await api.post('/login', { email: email.value, password: password.value }); sessionStorage.setItem(key, data.token); password.value = ''; account.value = (await api.get('/me')).data; notice.value = ''; await load() })
const logout = () => run(async () => { try { await api.post('/logout') } finally { sequence++; account.value = null; selected.value = null; records.value = []; sessionStorage.removeItem(key) } })
async function load(p = 1) { const version = ++sequence; loading.value = true; error.value = ''; try { const { data } = await api.get(`/${kind.value}`, { params: { page: p } }); if (version === sequence) { records.value = data.data; page.value = data.current_page; pages.value = data.last_page } } catch (e) { if (version === sequence) failed(e) } finally { if (version === sequence) loading.value = false } }
function changeSection(value) { if (creating.value && !confirm('Quitter cette saisie sans envoyer ?')) return; kind.value = value; creating.value = false; selected.value = null; notice.value = ''; load() }
function start() { form.value = { titre: '', description: '', priorite: 'normale' }; lines.value = [{ designation: '', quantite: 1 }]; requestId.value = crypto.randomUUID(); creating.value = true; notice.value = '' }
const open = r => run(async () => { selected.value = (await api.get(`/${kind.value}/${r.id}`)).data; replyText.value = ''; replyId.value = crypto.randomUUID() })
const submit = () => run(async () => { const payload = { ...form.value, request_id: requestId.value }; if (kind.value === 'commandes') payload.lines = lines.value; const { data } = await api.post(`/${kind.value}`, payload); notice.value = data.message; creating.value = false; await load(); selected.value = (await api.get(`/${kind.value}/${data.id}`)).data })
const reply = () => run(async () => { selected.value = (await api.post(`/tickets/${selected.value.id}/messages`, { body: replyText.value, request_id: replyId.value })).data; replyText.value = ''; replyId.value = crypto.randomUUID() })
async function boot() { if (!sessionStorage.getItem(key) || invitation.value) return; loading.value = true; try { account.value = (await api.get('/me')).data; await load() } catch (e) { failed(e) } finally { loading.value = false } }
boot()
</script>
<style scoped>
.customer-portal { max-width: 1080px; margin: 32px auto; padding: clamp(20px, 4vw, 48px); background: #fff; color: #163448; border-radius: 20px; min-height: 75vh; }
h1 { font-size: 1.8rem; font-weight: 800; } h2 { font-size: 1.15rem; font-weight: 700; margin: 12px 0; } header { margin-bottom: 24px; } .eyebrow { font-size: .75rem; letter-spacing: .12em; font-weight: 700; color: #006787; }
form { display: grid; gap: 16px; margin: 20px 0; } label { display: grid; gap: 6px; font-weight: 600; } input, textarea, select { width: 100%; border: 1px solid #91b6ca; padding: 12px; border-radius: 9px; background: white; color: #163448; }
button { background: #00678d; color: white; font-weight: 700; padding: 11px 16px; border-radius: 10px; justify-self: start; } button.secondary { color: #005070; background: #edf7fc; border: 1px solid #9bc4d8; } button[aria-pressed=true] { background: #005070; color: white; } button:disabled { opacity: .5; cursor: not-allowed; }
nav { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 24px 0; } article, details { border: 1px solid #c6dce5; padding: 18px; border-radius: 12px; margin: 14px 0; overflow-wrap: anywhere; } summary { cursor: pointer; font-weight: 700; } .text { white-space: pre-wrap; overflow-wrap: anywhere; margin-top: 12px; }
.error, .notice { padding: 14px; border-radius: 10px; margin: 12px 0; } .error { background: #fff0f0; color: #a31525; } .notice { background: #edf7fc; color: #174c62; } .empty { padding: 24px 0; } .order-line { display: grid; grid-template-columns: minmax(0, 2fr) minmax(100px, 1fr) auto; align-items: end; gap: 12px; margin: 12px 0; }
:focus-visible { outline: 3px solid #18aecf; outline-offset: 3px; } @media(max-width: 600px) { .order-line { grid-template-columns: 1fr; } .customer-portal { margin: 0; border-radius: 0; } }
</style>
