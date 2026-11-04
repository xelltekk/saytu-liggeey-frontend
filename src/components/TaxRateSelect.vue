<template>
  <select :value="modelValue" aria-label="TVA (%)" required @change="emit('update:modelValue', Number($event.target.value))">
    <option :value="0">0 %</option>
    <option :value="18">18 %</option>
    <option v-if="legacyRate" :value="Number(modelValue)" disabled>{{ modelValue }} % (taux existant)</option>
  </select>
</template>

<script setup>
import { computed, watch } from 'vue'
const props = defineProps({ modelValue: { type: [Number, String], default: null } })
const emit = defineEmits(['update:modelValue'])
const isEmpty = value => value == null || String(value).trim() === ''
const legacyRate = computed(() => !isEmpty(props.modelValue) && ![0, 18].includes(Number(props.modelValue)))
watch(() => props.modelValue, value => {
  if (isEmpty(value)) emit('update:modelValue', 18)
}, { immediate: true })
</script>
