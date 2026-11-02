<template>
  <details class="mt-3 border-t border-cyan-100 pt-3">
    <summary class="cursor-pointer font-semibold text-cyan-800">Tarifs mémorisés dans le contrat</summary>
    <p class="my-2 text-sm">Ces valeurs préremplissent les prochaines comparaisons. Les relevés enregistrés et les factures existantes ne sont pas recalculés.</p>
    <form @submit.prevent="save">
      <fieldset :disabled="disabled || saving || !allowed" class="grid gap-3 sm:grid-cols-2">
        <label>Forfait mensuel de location HT<input v-model="rates.loyer_mensuel_ht" class="input mt-1 w-full" type="number" min="0" max="999999999.99" step="0.01" required /></label>
        <label>TVA du contrat (%)<input v-model="rates.taux_tva" class="input mt-1 w-full" type="number" min="0" max="100" step="0.01" required /></label>
        <label>Prix noir HT / face<input v-model="rates.prix_page_noir_ht" class="input mt-1 w-full" type="number" min="0" max="1000000" step="0.01" required /></label>
        <label>Prix couleur HT / face<input v-model="rates.prix_page_couleur_ht" class="input mt-1 w-full" type="number" min="0" max="1000000" step="0.01" required /></label>
        <button v-if="allowed" class="btn-secondary">{{ saving ? 'Enregistrement…' : 'Mémoriser les tarifs du contrat' }}</button>
      </fieldset>
    </form>
    <p v-if="message" class="mt-2 text-sm" role="status">{{ message }}</p>
  </details>
</template>
<script setup>
import { computed, reactive, ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/access'
const props = defineProps({ contract: { type: Object, required: true }, disabled: Boolean })
const auth = useAuthStore(), allowed = computed(() => hasPermission(auth.user, 'leasing.update'))
const rates = reactive(Object.fromEntries(['loyer_mensuel_ht', 'taux_tva', 'prix_page_noir_ht', 'prix_page_couleur_ht'].map(key => [key, Number(props.contract[key] || 0)])))
const saving = ref(false), message = ref('')
async function save() {
  if (!allowed.value || props.disabled || saving.value) return
  saving.value = true; message.value = ''
  try { await api.put(`/leasing/preparations/contexte/${props.contract.id}/tarifs`, rates); message.value = 'Tarifs mémorisés pour les prochaines comparaisons. La saisie actuelle reste inchangée.' }
  catch (e) { message.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Enregistrement impossible.' }
  finally { saving.value = false }
}
</script>
