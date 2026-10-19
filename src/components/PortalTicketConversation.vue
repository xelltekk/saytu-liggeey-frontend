<template>
  <section class="space-y-3 rounded-xl border border-sky-200 p-4">
    <h3 class="font-bold">Conversation visible par le client</h3>
    <p>Les notes de l’onglet « Échanges internes » ne sont jamais affichées ici.</p>
    <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
    <article v-for="m in messages" :key="m.id" class="rounded-lg bg-sky-50 p-3"><strong>{{ m.author_name }}</strong> · {{ m.created_at }}<p class="whitespace-pre-wrap break-words">{{ m.body }}</p></article>
    <form v-if="editable" @submit.prevent="send"><label>Réponse au client<textarea v-model.trim="body" class="w-full rounded-lg border p-3" rows="4" required maxlength="4000" /></label><button :disabled="busy" class="btn-primary">Publier la réponse au client</button></form>
  </section>
</template>
<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
const props = defineProps({ id: Number, editable: Boolean })
const messages = ref([]), error = ref(''), body = ref(''), busy = ref(false), requestId = ref(crypto.randomUUID())
watch(() => props.id, async () => { try { messages.value = (await api.get(`/portal-admin/tickets/${props.id}/messages`)).data.messages } catch (e) { error.value = e.response?.data?.message || 'Chargement impossible.' } }, { immediate: true })
async function send() { if (busy.value) return; busy.value = true; error.value = ''; try { messages.value = (await api.post(`/portal-admin/tickets/${props.id}/messages`, { body: body.value, request_id: requestId.value })).data.messages; body.value = ''; requestId.value = crypto.randomUUID() } catch (e) { error.value = e.response?.data?.message || 'Envoi impossible.' } finally { busy.value = false } }
</script>
