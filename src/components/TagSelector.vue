<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">Tags</label>

    <!-- Tags sélectionnés -->
    <div class="flex flex-wrap gap-2 min-h-[36px] p-2 border border-gray-200 rounded-lg bg-gray-50">
      <span
        v-for="tagId in modelValue"
        :key="tagId"
        v-bind="badgeProps(tagId)"
      >
        <span class="mr-1">{{ getTag(tagId)?.emoji }}</span>
        {{ getTag(tagId)?.libelle }}
        <button @click="retirer(tagId)" type="button" class="ml-1.5 hover:bg-black/10 rounded-full px-1 leading-none">×</button>
      </span>
      <span v-if="!modelValue?.length" class="text-xs text-gray-400 italic self-center">Aucun tag</span>
    </div>

    <!-- Sélecteur de tags disponibles -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tag in tagsDisponibles"
        :key="tag.id"
        @click="ajouter(tag.id)"
        type="button"
        class="text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
      >
        <span class="mr-1">{{ tag.emoji }}</span>
        {{ tag.libelle }}
      </button>
      <span v-if="!tagsDisponibles.length && tags.length" class="text-xs text-gray-400 italic">
        Tous les tags sont sélectionnés
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const tags = ref([])

const tagsDisponibles = computed(() => {
  return tags.value.filter(t => !(props.modelValue || []).includes(t.id))
})

function getTag(id) {
  return tags.value.find(t => t.id === id)
}

function badgeProps(tagId) {
  const tag = getTag(tagId)
  const couleur = tag?.couleur || '#6b7280'
  return {
    class: 'inline-flex items-center text-xs font-medium px-2 py-1 rounded-full text-white',
    style: `background-color: ${couleur}`,
  }
}

function ajouter(tagId) {
  const list = [...(props.modelValue || []), tagId]
  emit('update:modelValue', list)
}

function retirer(tagId) {
  const list = (props.modelValue || []).filter(id => id !== tagId)
  emit('update:modelValue', list)
}

async function loadTags() {
  try {
    const { data } = await api.get('/tags')
    tags.value = data
  } catch (e) {
    console.error('Erreur chargement tags', e)
  }
}

onMounted(() => loadTags())
</script>