<template>
  <div
    v-if="items.length"
    class="sticky top-0 z-20 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm"
    role="alert"
    aria-live="assertive"
  >
    <div class="flex items-start gap-3">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg">!</div>
      <div class="min-w-0 flex-1">
        <p class="font-semibold">{{ title }}</p>
        <p v-if="subtitle" class="mt-0.5 text-sm text-red-700">{{ subtitle }}</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="item in items" :key="`${item.field}-${item.message}`" class="rounded-md bg-white/70 px-3 py-2">
            <span class="font-semibold">{{ item.label }} :</span>
            <span class="ml-1">{{ item.message }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { flattenValidationErrors } from '@/utils/formErrors'

const props = defineProps({
  errors: { type: Object, default: () => ({}) },
  messages: { type: Array, default: () => [] },
  labels: { type: Object, default: () => ({}) },
  title: { type: String, default: 'Formulaire incomplet' },
  subtitle: { type: String, default: 'Corrigez les champs ci-dessous, puis réessayez.' },
})

const items = computed(() => [
  ...props.messages.filter(Boolean).map((message, index) => ({
    field: `message-${index}`,
    label: 'Erreur',
    message,
  })),
  ...flattenValidationErrors(props.errors, props.labels),
])
</script>
