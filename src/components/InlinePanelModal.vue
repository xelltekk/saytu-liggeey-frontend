<template>
  <Teleport v-if="modelValue && hasTarget" :to="teleportTo">
    <section class="inline-panel-modal" :class="panelSizeClass">
      <nav class="inline-panel-modal__tabs" aria-label="Onglets de travail">
        <button type="button" class="inline-panel-modal__tab inline-panel-modal__tab--idle" @click="close">
          Liste
        </button>
        <span class="inline-panel-modal__tab inline-panel-modal__tab--active">
          {{ title || 'Saisie' }}
        </span>
      </nav>
      <header class="inline-panel-modal__header">
        <div>
          <p class="inline-panel-modal__eyebrow">Espace de travail</p>
          <h3 class="inline-panel-modal__title">{{ title }}</h3>
        </div>
        <button type="button" class="inline-panel-modal__close" @click="close">Retour liste</button>
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
    <nav class="inline-panel-modal__tabs" aria-label="Onglets de travail">
      <button type="button" class="inline-panel-modal__tab inline-panel-modal__tab--idle" @click="close">
        Liste
      </button>
      <span class="inline-panel-modal__tab inline-panel-modal__tab--active">
        {{ title || 'Saisie' }}
      </span>
    </nav>
    <header class="inline-panel-modal__header">
      <div>
        <p class="inline-panel-modal__eyebrow">Espace de travail</p>
        <h3 class="inline-panel-modal__title">{{ title }}</h3>
      </div>
      <button type="button" class="inline-panel-modal__close" @click="close">Retour liste</button>
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

.inline-panel-modal__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 18%, var(--saytu-border, #bae6fd));
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 72%, var(--saytu-primary, #0ea5e9) 28%);
  padding: 0.75rem 1rem 0;
}

.inline-panel-modal__tab {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 24%, var(--saytu-border, #bae6fd));
  border-bottom: 0;
  border-radius: 0.9rem 0.9rem 0 0;
  font-size: 0.82rem;
  font-weight: 900;
  padding: 0.65rem 1rem;
}

.inline-panel-modal__tab--idle {
  background: rgb(255 255 255 / 54%);
  color: color-mix(in srgb, var(--saytu-shell-text, #0f172a) 72%, var(--saytu-primary, #0ea5e9));
}

.inline-panel-modal__tab--active {
  background: var(--saytu-surface, #ffffff);
  color: var(--saytu-primary, #0ea5e9);
  box-shadow: 0 -8px 24px color-mix(in srgb, var(--saytu-primary, #0ea5e9) 10%, transparent);
}

.inline-panel-modal--sm,
.inline-panel-modal--md,
.inline-panel-modal--lg,
.inline-panel-modal--xl {
  width: 100%;
}

.inline-panel-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 18%, var(--saytu-border, #bae6fd));
  background: rgb(255 255 255 / 64%);
  padding: 1rem;
}

.inline-panel-modal__eyebrow {
  color: var(--saytu-primary, #0ea5e9);
  font-size: 0.7rem;
  font-weight: 950;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.inline-panel-modal__title {
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1.25rem;
  font-weight: 950;
  line-height: 1.2;
}

.inline-panel-modal__close {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 28%, var(--saytu-border, #bae6fd));
  border-radius: 999px;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 88%, var(--saytu-primary, #0ea5e9) 12%);
  color: var(--saytu-primary, #0ea5e9);
  font-size: 0.8rem;
  font-weight: 850;
  padding: 0.45rem 0.85rem;
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
