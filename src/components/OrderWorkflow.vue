<script setup>
import { requestConfirmation as appConfirm } from '@/composables/useConfirm'
import { computed, ref } from 'vue'
const props = defineProps({ record: Object, api: [Object, Function], external: Boolean, disabled: Boolean, historyOnly: Boolean, editable: { type: Boolean, default: true } })
const emit = defineEmits(['changed', 'busy', 'draft'])
const body = ref(''), expected = ref(''), saving = ref(false), error = ref(''), retry = ref(null)
const flow = computed(() => props.record.workflow)
const blocked = computed(() => saving.value || props.disabled || !props.editable)
const labels = { awaiting_client: 'En attente de votre accord', accepted: 'Proposition acceptée', rejected: 'Proposition refusée : révision nécessaire', clarification: 'Précision demandée', revised: 'Proposition en cours de révision', refused: 'Commande refusée', approve: 'Commande confirmée', propose: 'Proposition envoyée', clarify: 'Précision demandée', refuse: 'Commande refusée', schedule: 'Date de livraison modifiée', note: 'Note interne', reserve: 'Réservation complétée', accept_offer: 'Accord du client', reject_offer: 'Refus du client', message: 'Message du client', livraison_validee: 'Livraison enregistrée', facture_creee: 'Facture préparée', creation: 'Commande créée', soumission_portail: 'Demande reçue', modification: 'Commande modifiée' }
const draft = () => emit('draft', !!body.value || !!expected.value)
labels.reply = 'Réponse de l’équipe'
async function action(name) {
  if (blocked.value) return
  if (['approve', 'refuse', 'accept_offer', 'reject_offer'].includes(name) && !await appConfirm(`${labels[name]} : confirmer cette action ?`)) return
  if (blocked.value) return
  const data = { action: name, version: flow.value.version, body: body.value || null }
  if (name === 'schedule') data.expected_at = expected.value
  if (props.external && ['accept_offer', 'reject_offer'].includes(name)) data.offer_hash = flow.value.offer_hash
  const hash = JSON.stringify(data)
  if (retry.value?.hash !== hash) retry.value = { hash, id: crypto.randomUUID() }
  saving.value = true; error.value = ''; emit('busy', true)
  let success = false
  try {
    await props.api.post(`${props.external ? '/commandes' : '/metier/commandes_clients'}/${props.record.id}/actions`, { ...data, request_id: retry.value.id })
    body.value = ''; expected.value = ''; draft(); success = true
  } catch (e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' · ') || e.response?.data?.message || 'Action impossible. Réessayez.' }
  finally { saving.value = false; emit('busy', false) }
  if (success) emit('changed')
}
</script>

<template>
  <section v-if="flow" class="order-workflow">
    <h3>Validation et suivi de la commande</h3>
    <template v-if="!historyOnly">
    <p>Demande reçue → Proposition et accord → Confirmation → Livraison(s) et BL → Facturation</p>
    <p><strong>{{ record.statut === 'confirmee' ? (record.deliveries?.length ? 'Livraison partielle — reliquat à livrer' : 'Commande confirmée') : record.statut === 'cloturee' ? 'Livrée' : record.statut === 'annulee' ? 'Commande refusée / annulée' : (labels[flow.state] || 'À vérifier') }}</strong></p>
    <p>Livraison prévue : <strong>{{ flow.expected_at || 'Date à convenir' }}</strong></p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <template v-if="!external && flow.check">
      <h4>Contrôles avant acceptation</h4>
      <p v-for="e in flow.check.errors" :key="e" class="error">{{ e }}</p>
      <p v-for="w in flow.check.warnings" :key="w" class="warning">{{ w }}</p>
      <p v-if="!flow.check.errors.length">Produits et quantités vérifiés. Contrôlez les prix avant confirmation.</p>
      <div v-if="flow.check.stock.length" class="table-wrap"><table><thead><tr><th>Article / composant</th><th>Reste à livrer</th><th>Réservé (devis inclus)</th><th>Disponible hors réservations</th><th>À réapprovisionner</th></tr></thead><tbody><tr v-for="s in flow.check.stock" :key="s.produit_id"><td>{{ s.label }}</td><td>{{ s.needed }}</td><td>{{ s.reserved }}</td><td>{{ s.available }}</td><td>{{ s.missing }}</td></tr></tbody></table></div>
      <p>Les réservations ne sont pas des sorties de stock. Les services ne sont pas réservés ; les packs réservent leurs composants.</p>
    </template>
    <section v-if="external && flow.offer && ['awaiting_client', 'accepted', 'rejected'].includes(flow.state)">
      <h4>Proposition soumise à votre accord</h4>
      <div class="table-wrap"><table><thead><tr><th>Article</th><th>Quantité</th><th>Prix unitaire HT</th><th>TVA %</th><th>Total TTC</th></tr></thead><tbody><tr v-for="(l, i) in flow.offer.lines" :key="i"><td>{{ l.designation }}</td><td>{{ l.quantite }}</td><td>{{ l.prix }}</td><td>{{ l.tva }}</td><td>{{ l.total_ttc }}</td></tr></tbody></table></div>
      <p><strong>Total TTC : {{ flow.offer.total_ttc }} {{ flow.offer.devise }}</strong></p>
      <p>Votre accord porte sur ces articles, quantités et prix. L’équipe confirmera ensuite la commande et la livraison.</p>
    </section>
    <template v-if="editable && !record.archived_at">
      <label>{{ external ? 'Message / motif du refus' : 'Message au client / motif (ou note interne avec le bouton dédié)' }}<textarea v-model="body" maxlength="4000" rows="3" :disabled="blocked" @input="draft" /></label>
      <div class="actions" v-if="external">
        <template v-if="record.statut === 'brouillon' && flow.state === 'awaiting_client'"><button :disabled="blocked" @click="action('accept_offer')">Accepter la proposition</button><button :disabled="blocked || !body.trim()" @click="action('reject_offer')">Refuser la proposition</button></template>
        <button v-if="['brouillon', 'confirmee'].includes(record.statut)" :disabled="blocked || !body.trim()" @click="action('message')">Envoyer mon message</button>
      </div>
      <template v-else>
        <button v-if="record.portal_user_id" type="button" :disabled="blocked || !body.trim()" @click="action('reply')">Envoyer la réponse au client</button>
        <p v-if="disabled">Enregistrez d’abord vos modifications dans la fiche.</p>
        <div class="actions" v-if="record.statut === 'brouillon'">
          <button v-if="record.portal_user_id" :disabled="blocked || !!flow.check?.errors.length" @click="action('propose')">Soumettre les prix et quantités au client</button>
          <button :disabled="blocked || !!flow.check?.errors.length || (!!record.portal_user_id && flow.state !== 'accepted')" @click="action('approve')">Accepter la commande</button>
          <button v-if="record.portal_user_id" :disabled="blocked || !body.trim()" @click="action('clarify')">Demander une précision</button>
          <button :disabled="blocked || !body.trim()" @click="action('refuse')">Refuser la commande</button>
        </div>
        <div class="actions" v-if="['brouillon', 'confirmee'].includes(record.statut)"><label>Date de livraison prévue<input type="date" v-model="expected" :disabled="blocked" @input="draft"></label><button :disabled="blocked || !expected || !body.trim()" @click="action('schedule')">Annoncer la date / son changement</button></div>
        <div class="actions"><button v-if="record.statut === 'confirmee' && !record.legacy_delivery" :disabled="blocked" @click="action('reserve')">Compléter la réservation disponible</button><button :disabled="blocked || !body.trim()" @click="action('note')">Enregistrer une note interne (non envoyée)</button></div>
      </template>
    </template>
    </template>
    <h4>{{ external ? 'Historique partagé' : 'Historique et échanges (100 derniers événements)' }}</h4>
    <div class="history"><article v-for="e in flow.events" :key="e.id"><strong>{{ labels[e.action] || e.action }}</strong> · {{ e.created_at }} · {{ e.actor_name }}<span v-if="e.visibility === 'internal'"> · INTERNE</span><p>{{ e.body }}</p></article><p v-if="!flow.events.length">Aucun échange pour le moment.</p></div>
  </section>
</template>

<style scoped>
.order-workflow{padding:1rem;border:1px solid #7dd3fc;border-radius:1rem;background:#f8fafc;color:#16394d;display:grid;gap:.8rem}.order-workflow h3,.order-workflow h4{font-weight:700}.order-workflow label{display:grid;gap:.4rem}.order-workflow textarea,.order-workflow input{padding:.6rem;border:1px solid #94a3b8;border-radius:.5rem;background:white;color:#16394d}.actions{display:flex;flex-wrap:wrap;align-items:end;gap:.6rem}.actions button{padding:.65rem .9rem;border:1px solid #0284c7;border-radius:.6rem;background:white;color:#075985;font-weight:600}.actions button:disabled{opacity:.5;cursor:not-allowed}.error{color:#b91c1c}.warning{color:#854d0e}.table-wrap{max-width:100%;overflow:auto;max-height:22rem}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:.5rem;border-bottom:1px solid #cbd5e1;white-space:nowrap}.history{max-height:24rem;overflow:auto}.history article{border-bottom:1px solid #cbd5e1;padding:.7rem 0}.history p{white-space:pre-wrap;overflow-wrap:anywhere}
</style>
