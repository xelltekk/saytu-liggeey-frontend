<template>
  <dialog ref="dialog" class="modules-dialog w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl" aria-labelledby="module-change-title" @cancel.prevent="cancel">
    <h2 id="module-change-title" class="text-lg font-semibold">{{ preview.enabled ? 'Activer' : 'Désactiver' }} {{ module.name || module.key }}</h2>
    <p class="mt-4 text-sm leading-6 text-slate-600">{{ preview.message || 'Vérifiez les changements avant de confirmer.' }}</p>
    <div v-if="preview.dependencies_to_enable?.length" class="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><h3 class="font-semibold">Dépendances à activer également</h3><ul class="mt-2 list-inside list-disc space-y-1 text-slate-600"><li v-for="key in preview.dependencies_to_enable" :key="key">{{ moduleName(key) }}</li></ul></div>
    <div v-if="preview.blocking_dependents?.length" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><h3 class="font-semibold">Des modules actifs en dépendent</h3><ul class="mt-2 list-inside list-disc space-y-1"><li v-for="key in preview.blocking_dependents" :key="key">{{ moduleName(key) }}</li></ul></div>
    <p class="mt-4 text-sm text-slate-500">Les données existantes sont conservées.</p>
    <p v-if="error" role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <div class="mt-6 flex justify-end gap-3"><button type="button" :disabled="busy" class="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-50" @click="cancel">Annuler</button><button v-if="preview.can_apply" type="button" :disabled="busy" class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="$emit('confirm')">{{ busy ? 'Application…' : 'Confirmer' }}</button></div>
  </dialog>
</template>
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
const props = defineProps({ module: { type: Object, required: true }, preview: { type: Object, required: true }, catalogue: { type: Array, default: () => [] }, busy: Boolean, error: { type: String, default: '' } })
const emit = defineEmits(['close', 'confirm'])
const dialog = ref(null)
// Rend les dépendances lisibles dans le récapitulatif fourni par le serveur.
function moduleName(key) { return props.catalogue.find(module => module.key === key)?.name || key }
// Empêche la fermeture pendant une mutation dont le résultat doit rester visible.
function cancel() { if (!props.busy) emit('close') }
onMounted(() => dialog.value.showModal())
onBeforeUnmount(() => dialog.value?.close())
</script>
<style scoped>.modules-dialog::backdrop { background: rgb(15 23 42 / .45); }</style>
