<template><div class="formatted-designation" v-html="safeHtml"></div></template>
<script setup>
import { computed } from 'vue'
import { cleanDesignationHtml, designationText, plainDesignationHtml } from '@/services/designationFormatting.mjs'
const props = defineProps({ text: { type: String, default: '' }, html: { type: String, default: '' } })
const safeHtml = computed(() => {
  const html = cleanDesignationHtml(props.html)
  return html && designationText(html) === props.text.trim() ? html : plainDesignationHtml(props.text)
})
</script>
<style scoped>
.formatted-designation { white-space:pre-wrap; overflow-wrap:anywhere; font-weight:400; }
.formatted-designation :deep(ul) { list-style:disc; padding-left:22px; }
.formatted-designation :deep(ol) { list-style:decimal; padding-left:22px; }
</style>
