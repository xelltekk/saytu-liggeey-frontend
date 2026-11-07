<template>
  <component v-if="visible" :is="component" />
</template>

<script setup>
import { onActivated, onDeactivated, provide, ref, shallowReactive, shallowReadonly, watch } from 'vue'
import { completedCreationKey } from '@/composables/useCreationReturn'
import { routeLocationKey } from 'vue-router'

const props = defineProps({
  component: { type: Object, required: true },
  route: { type: Object, required: true },
})

// KeepAlive pauses rendering, not watchers. Give each cached page its own
// route snapshot: inactive pages must not consume another page's query/ID.
// The RouterView only updates these props for the page being displayed.
const visible = ref(true)
let completed = false
provide(completedCreationKey, value => { completed = value })
onDeactivated(() => { if (completed) visible.value = false })
onActivated(() => { visible.value = true; completed = false })

const pageRoute = shallowReactive({ ...props.route })
provide(routeLocationKey, shallowReadonly(pageRoute))
watch(() => props.route, route => Object.assign(pageRoute, route), { flush: 'sync' })
</script>
