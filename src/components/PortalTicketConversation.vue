<template>
  <section class="space-y-3 rounded-xl border border-sky-200 p-4">
    <h3 class="font-bold">Conversation visible par le client</h3>
    <p>Publiez ici votre réponse : elle sera visible dans le portail du client. Les « Échanges internes » restent confidentiels.</p>
    <button type="button" :disabled="loading || busy" @click="load">{{ loading ? 'Actualisation…' : 'Actualiser la conversation' }}</button>
    <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="rounded-lg bg-green-50 p-3 text-green-800">{{ success }}</p>
    <p v-if="!messages.length && !loading">Aucune réponse publiée. Rédigez votre premier message ci-dessous.</p>
    <article v-for="m in messages" :key="m.id" class="rounded-lg bg-sky-50 p-3"><strong>{{ m.author_name }}</strong> · {{ m.created_at }}<p class="whitespace-pre-wrap break-words">{{ m.body }}</p></article>
    <form v-if="editable" @submit.prevent="send"><label>Réponse publique au client<textarea v-model.trim="body" class="w-full rounded-lg border p-3" rows="4" required maxlength="4000" /></label><button :disabled="busy || !body" class="btn-primary">{{ busy ? 'Publication…' : 'Publier la réponse au client' }}</button></form>
  </section>
</template>
<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import api from '@/services/api'
const props = defineProps({ id: Number, editable: Boolean })
const emit = defineEmits(['draft'])
const messages = ref([]), error = ref(''), success = ref(''), body = ref(''), busy = ref(false), loading = ref(false), requestId = ref(crypto.randomUUID())
let version = 0
watch(body, value => emit('draft', value))
async function load() {
  if (busy.value || loading.value || document.hidden) return
  const current = version, id = props.id
  loading.value = true
  try { const { data } = await api.get(`/portal-admin/tickets/${id}/messages`); if (current === version) { messages.value = data.messages; error.value = '' } }
  catch (e) { if (current === version) error.value = e.response?.data?.message || 'Actualisation impossible. Réessayez.' }
  finally { loading.value = false }
}
watch(() => props.id, () => { version++; messages.value = []; body.value = ''; success.value = ''; load() }, { immediate: true })
async function send() { if (busy.value || !body.value) return; version++; busy.value = true; error.value = ''; success.value = ''; try { messages.value = (await api.post(`/portal-admin/tickets/${props.id}/messages`, { body: body.value, request_id: requestId.value })).data.messages; body.value = ''; requestId.value = crypto.randomUUID(); success.value = 'Réponse publiée dans le portail client.' } catch (e) { error.value = e.response?.data?.message || 'Envoi impossible.' } finally { busy.value = false } }
const timer = setInterval(load, 15000)
document.addEventListener('visibilitychange', load)
onBeforeUnmount(() => { version++; clearInterval(timer); document.removeEventListener('visibilitychange', load); emit('draft', '') })
</script>
