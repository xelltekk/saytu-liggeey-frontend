<template>
  <Teleport v-if="modelValue && hasTarget" :to="teleportTo">
    <section class="inline-panel-modal" :class="panelSizeClass">
      <header class="inline-panel-modal__header">
        <div>
          <button type="button" class="inline-panel-modal__back" @click="close">
            ← Retour liste
          </button>
          <h3 class="inline-panel-modal__title">{{ title }}</h3>
          <p class="inline-panel-modal__subtitle">{{ subtitle }}</p>
        </div>
      </header>
      <div class="inline-panel-modal__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="inline-panel-modal__footer">
        <slot name="footer" />
      </footer>
    </section>
  </Teleport>

  <section v-else-if="modelValue" class="inline-panel-modal" :class="panelSizeClass">
    <header class="inline-panel-modal__header">
      <div>
        <button type="button" class="inline-panel-modal__back" @click="close">
          ← Retour liste
        </button>
        <h3 class="inline-panel-modal__title">{{ title }}</h3>
        <p class="inline-panel-modal__subtitle">{{ subtitle }}</p>
      </div>
    </header>
    <div class="inline-panel-modal__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="inline-panel-modal__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'lg' },
  centered: { type: Boolean, default: false },
  stack: { type: String, default: '' },
  teleportTo: { type: String, default: '[data-inline-modal-workspace]' },
})

const emit = defineEmits(['update:modelValue', 'minimized-change'])
const hasTarget = ref(false)

const panelSizeClass = computed(() => ({
  'inline-panel-modal--sm': props.size === 'sm',
  'inline-panel-modal--md': props.size === 'md',
  'inline-panel-modal--lg': props.size === 'lg',
  'inline-panel-modal--xl': props.size === 'xl',
}))

const subtitle = computed(() => (
  props.stack === 'confirm'
    ? 'Vérification avant validation.'
    : 'Saisie en page complète, sans fenêtre flottante.'
))

onMounted(checkTarget)
onBeforeUnmount(() => setWorkspaceOpen(false))

watch(() => props.modelValue, async (isOpen) => {
  if (!isOpen) {
    setWorkspaceOpen(false)
    return
  }
  await nextTick()
  checkTarget()
  setWorkspaceOpen(true)
  await nextTick()
  document.querySelector(props.teleportTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

function checkTarget() {
  hasTarget.value = Boolean(document.querySelector(props.teleportTo))
}

function setWorkspaceOpen(isOpen) {
  const target = document.querySelector(props.teleportTo)
  if (!target) return
  target.classList.toggle('inline-panel-workspace--open', isOpen)
}

function close() {
  emit('minimized-change', false)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.inline-panel-modal {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 18%, var(--saytu-border, #bae6fd));
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-brand-to, #22d3ee) 16%, transparent), transparent 34%),
    color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #0ea5e9) 10%);
  box-shadow: 0 16px 40px color-mix(in srgb, var(--saytu-primary, #0ea5e9) 12%, transparent);
  margin: 0 0 1rem;
  overflow: hidden;
}

:global([data-inline-modal-workspace].inline-panel-workspace--open ~ *) {
  display: none !important;
}

.inline-panel-modal--sm,
.inline-panel-modal--md,
.inline-panel-modal--lg,
.inline-panel-modal--xl {
  width: 100%;
}

.inline-panel-modal__header {
  border-bottom: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 18%, var(--saytu-border, #bae6fd));
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-brand-to, #22d3ee) 18%, transparent), transparent 36%),
    color-mix(in srgb, var(--saytu-surface, #ffffff) 74%, var(--saytu-primary, #0ea5e9) 26%);
  padding: 1.25rem;
}

.inline-panel-modal__back {
  border: 0;
  background: transparent;
  color: var(--saytu-primary, #0ea5e9);
  font-size: 0.9rem;
  font-weight: 950;
  padding: 0 0 1rem;
}

.inline-panel-modal__title {
  color: var(--saytu-shell-text, #0f172a);
  font-size: clamp(1.65rem, 2.2vw, 2rem);
  font-weight: 950;
  line-height: 1.2;
}

.inline-panel-modal__subtitle {
  color: color-mix(in srgb, var(--saytu-primary, #0ea5e9) 72%, var(--saytu-shell-text, #0f172a));
  font-size: 1rem;
  margin-top: 0.45rem;
}

.inline-panel-modal__body {
  padding: 1rem;
}

.inline-panel-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 18%, var(--saytu-border, #bae6fd));
  background: rgb(255 255 255 / 58%);
  padding: 1rem;
}

@media (max-width: 640px) {
  .inline-panel-modal__footer {
    flex-direction: column;
  }
}
</style>
