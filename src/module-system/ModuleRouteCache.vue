<template>
  <KeepAlive :max="18" :include="includedNames">
    <component v-if="allowed" :is="wrapper" :component="component" :route="route" :key="cacheKey" />
  </KeepAlive>
</template>

<script setup>
import { computed, defineComponent, h } from 'vue'
import CachedRoutePage from '@/components/CachedRoutePage.vue'
import { useModulesStore } from '@/stores/modules'
import { moduleKeysForPath } from './modulePolicy.mjs'

const props = defineProps({ component: { type: Object, required: true }, route: { type: Object, required: true } })
const modules = useModulesStore()
const wrappers = new Map()
const owner = computed(() => moduleKeysForPath(props.route.path).join('__'))
const allowed = computed(() => modules.allowsPath(props.route.path))

// Donne un nom par propriétaire pour évincer ses vues sans détruire les autres saisies.
function wrapperFor(key) {
  if (!wrappers.has(key)) wrappers.set(key, defineComponent({
    name: `ModuleRoute_${key}`,
    props: ['component', 'route'],
    setup: wrapperProps => () => h(CachedRoutePage, { component: wrapperProps.component, route: wrapperProps.route }),
  }))
  return wrappers.get(key)
}
const wrapper = computed(() => wrapperFor(owner.value))
const includedNames = computed(() => {
  wrapperFor(owner.value)
  return [...wrappers.keys()].filter(key => key.split('__').every(module => modules.allows(module))).map(key => `ModuleRoute_${key}`)
})
const cacheKey = computed(() => `${modules.tenantId ?? 'legacy'}:${props.route.path}`)
</script>
