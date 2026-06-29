<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-3 top-3 z-[120] space-y-2 sm:left-auto sm:right-4 sm:max-w-md"
      aria-live="polite"
      aria-atomic="false"
    >
      <transition-group name="toast" tag="div" class="space-y-2">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex max-h-[55vh] min-w-0 items-start gap-3 overflow-y-auto rounded-lg border p-4 shadow-xl sm:min-w-[360px]"
          :class="toastClass(toast.type)"
          :role="toast.type === 'error' ? 'alert' : 'status'"
        >
          <span class="text-lg flex-shrink-0">{{ toastIcon(toast.type) }}</span>
          <div class="min-w-0 flex-1 text-sm">
            <p v-if="toastMessages(toast).length === 1">{{ toastMessages(toast)[0] }}</p>
            <ul v-else class="list-disc space-y-1 pl-4">
              <li v-for="message in toastMessages(toast)" :key="message">{{ message }}</li>
            </ul>
          </div>
          <button
            type="button"
            @click="removeToast(toast.id)"
            class="text-gray-400 hover:text-gray-700"
            aria-label="Fermer la notification"
          >
            ✕
          </button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

function toastMessages(toast) {
  return toast.messages || [toast.message].filter(Boolean)
}

function toastClass(type) {
  return {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  }[type]
}

function toastIcon(type) {
  return { success: '✅', error: '❌', info: 'ℹ️' }[type]
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
