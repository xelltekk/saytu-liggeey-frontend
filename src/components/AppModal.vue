<template>
  <Teleport to="body">
    <transition name="modal">
      <div
        v-if="modelValue"
        v-show="!isMinimized"
        :class="overlayClass"
        @click.self="requestClose('backdrop')"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="auth-card flex w-full max-h-[92vh] flex-col overflow-hidden bg-white sm:max-h-[90vh]"
          :class="[sizeClass, panelClass]"
        >
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
            <h3 :id="titleId" class="min-w-0 truncate text-base font-semibold text-slate-900 sm:text-lg dark:text-white">{{ title }}</h3>
            <div class="flex shrink-0 items-center gap-1">
              <button
                v-if="canMinimize"
                type="button"
                @click="minimize"
                class="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                title="Réduire la fenêtre"
                aria-label="Réduire la fenêtre"
              >
                <Minus class="h-4 w-4" />
              </button>
              <button
                ref="closeButton"
                type="button"
                @click="requestClose('button')"
                class="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 text-xl dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Fermer la fenêtre"
              >
                ×
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 dark:bg-slate-950">
            <slot />
          </div>

          <div v-if="$slots.footer" class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4 dark:border-slate-700 dark:bg-slate-900">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Minus } from 'lucide-vue-next'
import { useWindowDock } from '@/composables/useWindowDock'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm, md, lg, xl
  centered: { type: Boolean, default: false },
  beforeClose: { type: Function, default: null },
  stack: { type: String, default: 'default' }, // default, confirm
  minimizable: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'minimize', 'restore', 'minimized-change'])
const closeButton = ref(null)
const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`
const modalId = `modal-${Math.random().toString(36).slice(2, 10)}`
const isMinimized = ref(false)
const route = useRoute()
const dock = useWindowDock()
let previousActiveElement = null

const canMinimize = computed(() => props.minimizable && props.stack !== 'confirm' && props.size !== 'sm')

const sizeClass = computed(() => ({
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}[props.size]))

const overlayClass = computed(() => {
  const zIndexClass = props.stack === 'confirm' ? 'z-[120]' : 'z-[80]'
  return props.centered
    ? `fixed inset-0 ${zIndexClass} flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md`
    : `fixed inset-0 ${zIndexClass} flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-md sm:items-center sm:p-4`
})

const panelClass = computed(() => (
  props.centered
    ? 'rounded-[1.75rem]'
    : 'rounded-t-[1.75rem] sm:rounded-[1.75rem]'
))

async function requestClose(reason = 'programmatic') {
  if (props.beforeClose) {
    const canClose = await props.beforeClose(reason)
    if (canClose === false) return
  }
  unregisterMinimized()
  emit('update:modelValue', false)
}

function minimize() {
  if (!canMinimize.value || !props.modelValue) return

  isMinimized.value = true
  dock.register({
    id: modalId,
    title: props.title || 'Fenêtre en cours',
    route: route.fullPath,
  })
  emit('minimize')
  emit('minimized-change', true)
}

function restore() {
  if (!isMinimized.value) return

  isMinimized.value = false
  unregisterMinimized()
  emit('restore')
  emit('minimized-change', false)

  nextTick(() => {
    closeButton.value?.focus?.()
  })
}

function unregisterMinimized() {
  dock.unregister(modalId)
  isMinimized.value = false
  emit('minimized-change', false)
}

function handleDockRestore(event) {
  if (event.detail?.id === modalId) restore()
}

function handleDockClose(event) {
  if (event.detail?.id === modalId) requestClose('dock')
}

function onKeydown(event) {
  if (props.modelValue && !isMinimized.value && event.key === 'Escape') requestClose('escape')
}

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    previousActiveElement = document.activeElement
    await nextTick()
    if (!isMinimized.value) closeButton.value?.focus?.()
  } else {
    unregisterMinimized()
    previousActiveElement?.focus?.()
  }
})

watch(() => props.title, (title) => {
  dock.update(modalId, { title: title || 'Fenêtre en cours' })
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('app-modal:restore', handleDockRestore)
  window.addEventListener('app-modal:close', handleDockClose)
})

onUnmounted(() => {
  unregisterMinimized()
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('app-modal:restore', handleDockRestore)
  window.removeEventListener('app-modal:close', handleDockClose)
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
