<template>
  <section class="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 print-actions">
    <h3 class="text-lg font-bold">{{ correction ? 'Correction du relevé et du brouillon ' + correction.facture.numero : 'Créer la facture de consommation' }}</h3>
    <p class="mt-2 text-sm">Facture brouillon, sans envoi au client ni mouvement de stock. Le forfait de location s’ajoute une seule fois à cette facture, sans pages incluses ni prorata automatique. Grands formats non inclus.</p>
    <p v-if="!allowed" class="mt-3">Vous devez disposer des droits de création et de consultation des factures.</p>
    <form v-else @submit.prevent="createInvoice" class="mt-4">
      <fieldset :disabled="saving || !!invoice">
        <label class="block font-semibold">Client à facturer</label>
        <ClientSearchSelect v-if="!correction" v-model="clientId" :clients="clientOptions" required />
        <p v-else class="mt-1 font-semibold">{{ correction.client?.nom }}</p>
        <label class="mt-3 block font-semibold">Forfait de location HT (FCFA)
          <input v-model="rentalFee" class="input mt-1" type="number" min="0" max="999999999.99" step="0.01" required placeholder="Ex. : 25000" />
        </label>
        <p class="mt-1 text-sm">Laissez 0 pour facturer uniquement les impressions. Le taux de TVA ci-dessous s’applique aussi au forfait.</p>
        <label class="mt-3 block font-semibold">TVA (%) — à vérifier avant création
          <input v-model="tva" class="input mt-1" type="number" min="0" max="100" step="0.01" required />
        </label>
        <p class="mt-3">Impressions HT : {{ format(result.total) }} CFA · Forfait HT : {{ format(rentalFee) }} CFA</p>
        <p class="font-bold">Total HT : {{ format(totalHt) }} CFA</p>
        <p class="mt-3 font-bold">Total TTC estimé : {{ format(totalTtc) }} CFA</p>
        <label class="mt-3 flex gap-2"><input v-model="confirmed" type="checkbox" required />Je confirme le client, les consommations, le forfait et la TVA.</label>
        <label v-if="correction" class="mt-3 block font-semibold">Motif de correction<textarea v-model="reason" class="input mt-1" rows="3" minlength="3" maxlength="1000" required /></label>
        <button class="btn-primary mt-4" :disabled="!confirmed || !clientId || saving || !!invoice || (result.black + result.color === 0 && Number(rentalFee) <= 0)">
          {{ saving ? 'Enregistrement…' : correction ? 'Enregistrer la correction' : 'Créer la facture brouillon' }}
        </button>
      </fieldset>
    </form>
    <p v-if="error" class="mt-3 text-red-800" role="alert">{{ error }}</p>
    <div v-if="invoice" class="mt-4 rounded-lg border border-green-300 bg-white p-3" role="status">
      <p>{{ existing ? 'Cette période est déjà facturée :' : correction ? 'Correction enregistrée :' : 'Facture créée :' }} {{ invoice.numero }}</p>
      <RouterLink :to="{ name: 'facture-detail', params: { id: invoice.id } }" class="btn-primary mt-3 inline-block">Ouvrir la facture</RouterLink>
      <RouterLink v-if="followUp" :to="{ name: 'leasing', query: { tab: 'releves', suivi: followUp.id } }" class="btn-secondary ml-2 mt-3 inline-block">Voir le relevé et son suivi</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/services/api'
import ClientSearchSelect from '@/components/ClientSearchSelect.vue'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/access'
const props = defineProps({ result: { type: Object, required: true }, reports: { type: Array, required: true }, options: { type: Object, required: true }, client: { type: Object, default: null }, correction: { type: Object, default: null } })
const emit = defineEmits(['busy', 'archived'])
const auth = useAuthStore()
const allowed = computed(() => hasPermission(auth.user, props.correction ? 'factures.update' : 'factures.create') && hasPermission(auth.user, 'factures.view') && (!props.correction || hasPermission(auth.user, 'leasing.update')))
const clientId = ref(props.correction?.client?.id || (props.client?.id ? Number(props.client.id) : null)), tva = ref(props.correction?.payload?.tva ?? 18), confirmed = ref(false)
const saving = ref(false), invoice = ref(null), error = ref(''), existing = ref(false)
const rentalFee = ref(props.correction?.payload?.rentalFee ?? 0), reason = ref(''), followUp = ref(null)
const clientOptions = computed(() => props.client ? [props.client] : [])
const format = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
const totalHt = computed(() => Math.round((props.result.total + Number(rentalFee.value)) * 100) / 100)
const totalTtc = computed(() => Math.round((totalHt.value + Math.round(props.result.blackAmount * Number(tva.value)) / 100 + Math.round(props.result.colorAmount * Number(tva.value)) / 100 + Math.round(Number(rentalFee.value) * Number(tva.value)) / 100) * 100) / 100)
watch([clientId, tva, rentalFee], () => { confirmed.value = false })
watch(() => props.result, () => { invoice.value = null; error.value = ''; existing.value = false; confirmed.value = false })
async function createInvoice() {
  if (saving.value || invoice.value || !allowed.value || !clientId.value || !confirmed.value) return
  if (tva.value === '' || !Number.isFinite(Number(tva.value)) || Number(tva.value) < 0 || Number(tva.value) > 100) { error.value = 'Vérifiez le taux de TVA.'; return }
  if (rentalFee.value === '' || !Number.isFinite(Number(rentalFee.value)) || Number(rentalFee.value) < 0 || Number(rentalFee.value) > 999999999.99 || !/^\d+(\.\d{1,2})?$/.test(String(rentalFee.value))) { error.value = 'Vérifiez le forfait : montant positif ou nul, avec deux décimales maximum.'; return }
  if (props.correction && reason.value.trim().length < 3) { error.value = 'Précisez le motif de correction.'; return }
  saving.value = true; emit('busy', true); error.value = ''
  try {
    const payload = {
      client_id: clientId.value, tva: Number(tva.value), rentalFee: Number(rentalFee.value), reports: JSON.parse(JSON.stringify(props.reports)),
      blackPrice: Number(props.options.blackPrice), colorPrice: Number(props.options.colorPrice),
      largeColor: Number(props.options.largeColor), a4: props.options.a4, verified: props.options.verified,
    }
    const { data } = props.correction
      ? await api.put('/leasing/comparaisons/' + props.correction.id, { ...payload, expected_revision: props.correction.revision, invoice_token: props.correction.invoice_token, motif: reason.value.trim() })
      : await api.post('/leasing/comparaison/facture', payload)
    if (!data?.facture?.id || !data?.suivi?.id) throw Error('Réponse incomplète. Consultez le suivi avant de réessayer.')
    invoice.value = data.facture; existing.value = !!data.already_exists
    followUp.value = data.suivi
    if (!data.already_exists) emit('archived', data.suivi)
  } catch (e) {
    error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message || 'Création impossible. Réessayez sans changer de client ni de période.'
  } finally { saving.value = false; emit('busy', false) }
}
</script>
