<template>
  <AppModal v-model="visible" :title="title" size="sm" centered stack="confirm">
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
        class="confirm-action-button inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
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
  danger: 'confirm-action-danger',
  primary: 'confirm-action-primary',
  neutral: 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500',
}[props.tone] || 'confirm-action-danger'))

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.confirm-action-primary {
  background: linear-gradient(135deg, var(--saytu-brand-from, #2563eb), var(--saytu-brand-to, #06b6d4));
  box-shadow: 0 10px 24px color-mix(in srgb, var(--saytu-primary, #2563eb) 24%, transparent);
}

.confirm-action-primary:hover {
  filter: brightness(0.96);
}

.confirm-action-primary:focus {
  --tw-ring-color: var(--saytu-focus, #38bdf8);
}

.confirm-action-danger {
  background: linear-gradient(135deg, #e11d48, #be123c);
}

.confirm-action-danger:hover {
  filter: brightness(0.96);
}

.confirm-action-danger:focus {
  --tw-ring-color: #f43f5e;
}
</style>
