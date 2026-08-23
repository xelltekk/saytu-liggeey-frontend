<template>
  <AppConfirmModal
    :model-value="state.visible"
    :title="state.title"
    :message="state.message"
    :hint="state.hint"
    :confirm-label="state.confirmLabel"
    :cancel-label="state.cancelLabel"
    :tone="state.tone"
    @update:model-value="handleVisibility"
    @confirm="confirm"
  />
</template>

<script setup>
import AppConfirmModal from '@/components/AppConfirmModal.vue'
import { useConfirmHost } from '@/composables/useConfirm'

const { state, confirm, cancel } = useConfirmHost()

function handleVisibility(value) {
  if (!value) cancel()
}
</script>
