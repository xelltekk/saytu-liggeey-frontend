<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <transition-group name="toast" tag="div" class="space-y-2">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 p-4 rounded-lg shadow-lg border min-w-[300px]"
          :class="toastClass(toast.type)"
        >
          <span class="text-lg flex-shrink-0">{{ toastIcon(toast.type) }}</span>
          <p class="text-sm flex-1">{{ toast.message }}</p>
          <button @click="removeToast(toast.id)" class="text-gray-400 hover:text-gray-700">
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