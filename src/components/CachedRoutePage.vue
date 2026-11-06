<template>
  <component :is="component" />
</template>

<script setup>
import { provide, shallowReactive, shallowReadonly, watch } from 'vue'
import { routeLocationKey } from 'vue-router'

const props = defineProps({
  component: { type: Object, required: true },
  route: { type: Object, required: true },
})

// KeepAlive pauses rendering, not watchers. Give each cached page its own
// route snapshot: inactive pages must not consume another page's query/ID.
// The RouterView only updates these props for the page being displayed.
const pageRoute = shallowReactive({ ...props.route })
provide(routeLocationKey, shallowReadonly(pageRoute))
watch(() => props.route, route => Object.assign(pageRoute, route), { flush: 'sync' })
</script>
