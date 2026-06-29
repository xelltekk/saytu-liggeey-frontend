<template>
  <th :class="['px-4 py-3 text-xs font-semibold uppercase text-gray-600', alignClass]">
    <button
      type="button"
      class="inline-flex items-center gap-1 transition hover:text-xelltekk-700"
      :class="buttonClass"
      @click="$emit('sort', column)"
    >
      <span><slot /></span>
      <span class="text-[10px] leading-none" :class="active ? 'text-xelltekk-700' : 'text-gray-400'">
        {{ icon }}
      </span>
    </button>
  </th>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  column: { type: String, required: true },
  active: { type: Boolean, default: false },
  icon: { type: String, default: '↕' },
  align: { type: String, default: 'left' },
})

defineEmits(['sort'])

const alignClass = computed(() => {
  if (props.align === 'right') return 'text-right'
  if (props.align === 'center') return 'text-center'
  return 'text-left'
})

const buttonClass = computed(() => {
  if (props.align === 'right') return 'w-full justify-end'
  if (props.align === 'center') return 'w-full justify-center'
  return ''
})
</script>
