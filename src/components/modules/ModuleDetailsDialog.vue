<template>
  <dialog ref="dialog" class="modules-dialog w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl" aria-labelledby="module-details-title" @cancel.prevent="$emit('close')" @click="closeOnBackdrop">
    <div class="flex items-center justify-between border-b border-slate-100 p-5">
      <h2 id="module-details-title" class="text-lg font-semibold">{{ module.name || module.key }}</h2>
      <button type="button" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer les détails" @click="$emit('close')"><X class="h-5 w-5" /></button>
    </div>
    <div class="max-h-[65vh] space-y-5 overflow-y-auto p-5 text-sm">
      <p class="leading-6 text-slate-600">{{ module.description }}</p>
      <p v-if="settingsMessage" class="rounded-xl bg-slate-50 p-4 leading-6">{{ settingsMessage }}</p>
      <dl class="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3">
        <dt class="text-slate-500">Version</dt><dd>{{ module.version || '—' }}</dd>
        <dt class="text-slate-500">Auteur</dt><dd>{{ module.author || 'Saytu' }}</dd>
        <dt class="text-slate-500">Identifiant</dt><dd class="break-all font-mono text-xs">{{ module.key }}</dd>
        <dt class="text-slate-500">Dépendances</dt><dd>{{ labels(module.dependencies) }}</dd>
        <dt class="text-slate-500">Intégrations facultatives</dt><dd>{{ labels(module.integrations) }}</dd>
      </dl>
      <div><h3 class="font-semibold">Permissions déclarées</h3><ul v-if="permissions.length" class="mt-2 space-y-1 text-slate-600"><li v-for="permission in permissions" :key="permission" class="break-all font-mono text-xs">{{ permission }}</li></ul><p v-else class="mt-2 text-slate-500">Aucune permission spécifique.</p></div>
      <p class="text-xs leading-5 text-slate-500">La désactivation d’un module conserve ses données. Les droits des utilisateurs continuent de s’appliquer lorsqu’il est activé.</p>
    </div>
    <div class="border-t border-slate-100 p-4 text-right"><button type="button" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" @click="$emit('close')">Fermer</button></div>
  </dialog>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { X } from 'lucide-vue-next'
const props = defineProps({ module: { type: Object, required: true }, catalogue: { type: Array, default: () => [] }, settingsMessage: { type: String, default: '' } })
const emit = defineEmits(['close'])
const dialog = ref(null)
const permissions = computed(() => {
  const values = Array.isArray(props.module.permissions) ? props.module.permissions : Object.keys(props.module.permissions || {})
  return values.map(value => typeof value === 'string' ? value : value.key || value.name || value.permission).filter(Boolean)
})
// Présente les noms du catalogue plutôt que les clés techniques des dépendances.
function labels(keys) { return (keys || []).map(key => props.catalogue.find(module => module.key === key)?.name || key).join(', ') || 'Aucune' }
// Ferme uniquement lorsqu'un clic vise le fond de la fenêtre native.
function closeOnBackdrop(event) { if (event.target === dialog.value) emit('close') }
onMounted(() => dialog.value.showModal())
onBeforeUnmount(() => dialog.value?.close())
</script>
<style scoped>.modules-dialog::backdrop { background: rgb(15 23 42 / .45); }</style>
