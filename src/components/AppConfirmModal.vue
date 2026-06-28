<template>
  <AppModal v-model="visible" :title="title" size="sm" centered>
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <div class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
          !
        </div>
        <div class="space-y-1">
          <p class="text-sm font-medium text-slate-900 dark:text-white">{{ message }}</p>
          <p v-if="hint" class="text-xs text-slate-500 dark:text-slate-400">{{ hint }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn-secondary" @click="cancel">
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
        :class="confirmButtonClass"
        @click="confirm"
      >
        {{ confirmLabel }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import AppModal from '@/components/AppModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmation' },
  message: { type: String, required: true },
  hint: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Continuer' },
  cancelLabel: { type: String, default: 'Annuler' },
  tone: { type: String, default: 'danger' }, // danger, primary, neutral
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const confirmButtonClass = computed(() => ({
  danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
  primary: 'bg-xelltekk-600 hover:bg-xelltekk-700 focus:ring-xelltekk-500',
  neutral: 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500',
}[props.tone] || 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'))

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('update:modelValue', false)
}
</script>
