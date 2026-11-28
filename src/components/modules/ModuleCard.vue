<template>
  <article class="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <span class="hidden shrink-0 rounded-xl bg-slate-100 p-2.5 text-slate-600 sm:inline-flex"><component :is="icon" class="h-5 w-5" aria-hidden="true" /></span>
        <h3 class="min-w-0 text-base font-semibold text-slate-900 [overflow-wrap:anywhere]">{{ module.name || module.key }}</h3>
      </div>
      <button type="button" role="switch" :aria-checked="module.enabled" :aria-label="`${module.enabled ? 'Désactiver' : 'Activer'} ${module.name || module.key}`"
        :disabled="locked || busy" :title="lockReason"
        class="relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        :class="module.enabled ? 'bg-slate-700' : 'bg-slate-200'" @click="$emit('toggle', module)">
        <span class="h-4 w-4 rounded-full bg-white shadow-sm transition-transform" :class="module.enabled ? 'translate-x-6' : 'translate-x-1'"></span>
      </button>
    </div>
    <p class="mt-4 flex-1 text-sm leading-6 text-slate-600">{{ module.description }}</p>
    <p v-if="lockReason" class="mt-3 text-xs leading-5 text-slate-500">{{ lockReason }}</p>
    <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
      <span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{{ module.core ? 'Noyau permanent' : !module.licensed ? 'Hors abonnement' : module.enabled ? 'Activé' : 'Désactivé' }}</span>
      <div class="flex gap-1">
        <button type="button" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline" :aria-label="`Paramètres de ${module.name || module.key}`" title="Paramètres du module" @click="$emit('configure', module)"><Settings class="h-4 w-4" /></button>
        <button type="button" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline" :aria-label="`Détails de ${module.name || module.key}`" title="Détails du module" @click="$emit('details', module)"><Info class="h-4 w-4" /></button>
      </div>
    </div>
  </article>
</template>
<script setup>
import { computed } from 'vue'
import { Blocks, BookOpen, Users, FileText, Wallet, Package, CalendarDays, Settings, Info, ShieldCheck, Printer, ShoppingCart, Headphones, Target, Scale, Building2 } from 'lucide-vue-next'
const props = defineProps({ module: { type: Object, required: true }, busy: Boolean })
defineEmits(['toggle', 'configure', 'details'])
const icons = { blocks: Blocks, book: BookOpen, 'book-open': BookOpen, users: Users, 'file-text': FileText, wallet: Wallet, package: Package, calendar: CalendarDays, 'calendar-days': CalendarDays, settings: Settings, shield: ShieldCheck, printer: Printer, 'shopping-cart': ShoppingCart, headphones: Headphones, target: Target, scale: Scale, building: Building2 }
const icon = computed(() => icons[String(props.module.icon || '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()] || Blocks)
const locked = computed(() => props.module.core || !props.module.activation_ready || !props.module.manageable || (!props.module.licensed && !props.module.enabled))
const lockReason = computed(() => {
  if (props.module.core) return 'Les fonctions essentielles restent toujours disponibles.'
  if (!props.module.licensed) return props.module.enabled ? 'Ce module n’est plus inclus dans l’abonnement. Vous pouvez le désactiver.' : 'Ce module n’est pas inclus dans l’abonnement actuel.'
  if (!props.module.activation_ready) return 'La gestion de ce module sera disponible après sa validation. Son fonctionnement actuel est conservé.'
  if (!props.module.manageable) return 'Vous ne pouvez pas modifier ce module.'
  return ''
})
</script>
