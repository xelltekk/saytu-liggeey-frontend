<template>
  <div class="space-y-4">
    <div class="stat-grid grid grid-cols-1 sm:grid-cols-3">
      <div class="rounded bg-gray-50 p-3 text-center">
        <div class="text-2xl font-bold text-xelltekk-700">{{ entrepot.zones?.length || 0 }}</div>
        <div class="text-xs uppercase text-gray-500">Zones</div>
      </div>
      <div class="rounded bg-gray-50 p-3 text-center">
        <div class="text-2xl font-bold text-xelltekk-700">{{ totalEmplacements }}</div>
        <div class="text-xs uppercase text-gray-500">Emplacements</div>
      </div>
      <div class="rounded bg-gray-50 p-3 text-center">
        <div class="text-base font-bold text-green-700">{{ entrepot.code }}</div>
        <div class="text-xs uppercase text-gray-500">Code</div>
      </div>
    </div>

    <div>
      <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 class="font-semibold text-gray-800">Zones</h4>
        <button v-if="canManage" @click="showZoneForm = !showZoneForm" class="btn-secondary text-xs">
          {{ showZoneForm ? 'Annuler' : '+ Ajouter une zone' }}
        </button>
      </div>

      <div v-if="showZoneForm && canManage" class="mb-3 rounded border border-gray-200 bg-gray-50 p-3">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input v-model="newZone.code" type="text" class="input text-sm" placeholder="Code (ex: A1)" />
          <input v-model="newZone.libelle" type="text" class="input text-sm" placeholder="Libelle" />
          <select v-model="newZone.type" class="input text-sm">
            <option value="stockage">Stockage</option>
            <option value="reception">Reception</option>
            <option value="expedition">Expedition</option>
            <option value="quarantaine">Quarantaine</option>
            <option value="sav">SAV</option>
          </select>
        </div>
        <button @click="createZone" :disabled="savingZone" class="btn-primary mt-2 w-full text-sm">
          {{ savingZone ? 'Creation...' : 'Creer la zone' }}
        </button>
      </div>

      <div v-if="(entrepot.zones?.length || 0) === 0" class="py-4 text-center text-sm text-gray-400">
        Aucune zone. Ajoutez-en une.
      </div>

      <div v-for="zone in entrepot.zones" :key="zone.id" class="mb-2 rounded-lg border border-gray-200 p-3">
        <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span class="font-semibold">{{ zone.libelle }}</span>
            <span class="ml-2 text-xs text-gray-500">[{{ zone.code }}]</span>
            <span class="badge ml-2 text-xs" :class="typeBadge(zone.type)">{{ typeLabel(zone.type) }}</span>
          </div>
          <div v-if="canManage" class="flex gap-1">
            <button @click="addEmplacementTo(zone.id)" class="btn-secondary text-xs">+ Empl.</button>
            <button @click="deleteZone(zone)" class="text-sm text-red-600 hover:text-red-800">Supprimer</button>
          </div>
        </div>

        <div v-if="newEmplacementZoneId === zone.id && canManage" class="mb-2 rounded bg-blue-50 p-2">
          <div class="grid grid-cols-1 gap-1 sm:grid-cols-4">
            <input v-model="newEmplacement.code" type="text" class="input text-xs" placeholder="Code" />
            <input v-model="newEmplacement.allee" type="text" class="input text-xs" placeholder="Allee" />
            <input v-model="newEmplacement.rangee" type="text" class="input text-xs" placeholder="Rangee" />
            <input v-model="newEmplacement.niveau" type="text" class="input text-xs" placeholder="Niveau" />
          </div>
          <button @click="createEmplacement(zone.id)" :disabled="savingEmplacement" class="btn-primary mt-1 w-full text-xs">
            {{ savingEmplacement ? 'Creation...' : 'Creer' }}
          </button>
        </div>

        <div v-if="zone.emplacements?.length > 0" class="flex flex-wrap gap-1">
          <div
            v-for="emp in zone.emplacements"
            :key="emp.id"
            class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs"
          >
            <span class="font-mono">{{ emp.code }}</span>
            <span v-if="emp.allee || emp.rangee || emp.niveau" class="text-gray-500">
              ({{ [emp.allee, emp.rangee, emp.niveau].filter(Boolean).join('-') }})
            </span>
            <button v-if="canManage" @click="deleteEmplacement(emp)" class="ml-1 text-red-500 hover:text-red-700">x</button>
          </div>
        </div>
        <div v-else class="text-xs text-gray-400">Aucun emplacement</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps({
  entrepot: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
})
const emit = defineEmits(['refresh'])
const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const showZoneForm = ref(false)
const newZone = reactive({ code: '', libelle: '', type: 'stockage' })
const newEmplacementZoneId = ref(null)
const newEmplacement = reactive({ code: '', allee: '', rangee: '', niveau: '' })
const savingZone = ref(false)
const savingEmplacement = ref(false)

const totalEmplacements = computed(() => {
  return props.entrepot.zones?.reduce((s, z) => s + (z.emplacements?.length || 0), 0) || 0
})

async function createZone() {
  if (!newZone.code || !newZone.libelle) {
    toast.error('Code et libelle requis')
    return
  }

  savingZone.value = true
  try {
    await api.post(`/entrepots/${props.entrepot.id}/zones`, newZone)
    toast.success('Zone creee')
    showZoneForm.value = false
    Object.assign(newZone, { code: '', libelle: '', type: 'stockage' })
    emit('refresh')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
  } finally {
    savingZone.value = false
  }
}

async function deleteZone(zone) {
  if (!await askConfirm({ message: `Supprimer la zone "${zone.libelle}" ?`, tone: 'danger', confirmLabel: 'Supprimer' })) return
  try {
    await api.delete(`/zones/${zone.id}`)
    toast.success('Zone supprimee')
    emit('refresh')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur de suppression')
  }
}

function addEmplacementTo(zoneId) {
  newEmplacementZoneId.value = newEmplacementZoneId.value === zoneId ? null : zoneId
  Object.assign(newEmplacement, { code: '', allee: '', rangee: '', niveau: '' })
}

async function createEmplacement(zoneId) {
  if (!newEmplacement.code) {
    toast.error('Code requis')
    return
  }

  savingEmplacement.value = true
  try {
    await api.post(`/zones/${zoneId}/emplacements`, newEmplacement)
    toast.success('Emplacement cree')
    newEmplacementZoneId.value = null
    emit('refresh')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
  } finally {
    savingEmplacement.value = false
  }
}

async function deleteEmplacement(emp) {
  if (!await askConfirm({ message: `Supprimer l'emplacement "${emp.code}" ?`, tone: 'danger', confirmLabel: 'Supprimer' })) return
  try {
    await api.delete(`/emplacements/${emp.id}`)
    toast.success('Emplacement supprime')
    emit('refresh')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
  }
}

function typeLabel(type) {
  return {
    stockage: 'Stockage',
    reception: 'Reception',
    expedition: 'Expedition',
    quarantaine: 'Quarantaine',
    sav: 'SAV',
  }[type] || type
}

function typeBadge(type) {
  return {
    stockage: 'bg-blue-100 text-blue-700',
    reception: 'bg-green-100 text-green-700',
    expedition: 'bg-purple-100 text-purple-700',
    quarantaine: 'bg-yellow-100 text-yellow-700',
    sav: 'bg-orange-100 text-orange-700',
  }[type] || 'bg-gray-100'
}
</script>
