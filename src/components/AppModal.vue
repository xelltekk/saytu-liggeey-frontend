<template>
  <Teleport to="body">
    <transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-0 sm:items-center sm:p-4"
        @click.self="closeModal"
      >
        <div
          class="bg-white rounded-t-2xl shadow-2xl w-full max-h-[92vh] overflow-hidden flex flex-col sm:rounded-xl sm:max-h-[90vh]"
          :class="sizeClass"
        >
          <!-- Header -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 sm:px-6 sm:py-4">
            <h3 class="min-w-0 truncate text-base font-semibold text-gray-900 sm:text-lg">{{ title }}</h3>
            <button
              @click="closeModal"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm, md, lg, xl
})

const emit = defineEmits(['update:modelValue'])

const sizeClass = computed(() => ({
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}[props.size]))

function closeModal() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
