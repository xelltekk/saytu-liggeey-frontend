<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button type="button" class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900" @click="goBack">
        ← Retour agenda
      </button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Agenda</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">Nouveau rendez-vous</h1>
      <p class="mt-1 text-sm text-cyan-800">Saisie en page complète, sans fenêtre flottante.</p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div class="mb-4 border-b border-cyan-100">
        <button type="button" class="-mb-px rounded-t-2xl border border-cyan-200 border-b-white bg-white px-5 py-3 text-sm font-black text-cyan-700">
          Rendez-vous
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="saveRdv">
        <label class="field-label">
          Titre du rendez-vous
          <input v-model.trim="rdvForm.titre" class="input" placeholder="Ex : Rendez-vous client, réunion interne..." required />
        </label>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label">
            Début
            <input v-model="rdvForm.date_debut" type="datetime-local" class="input" required />
          </label>
          <label class="field-label">
            Fin
            <input v-model="rdvForm.date_fin" type="datetime-local" class="input" />
          </label>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label">
            Client / contact
            <input v-model.trim="rdvForm.client_nom" class="input" placeholder="Optionnel" />
          </label>
          <label class="field-label">
            Lieu
            <input v-model.trim="rdvForm.lieu" class="input" placeholder="Bureau, téléphone, adresse..." />
          </label>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label">
            Visibilité
            <select v-model="rdvForm.visibilite" class="input">
              <option value="equipe">Visible par l’équipe</option>
              <option value="personnelle">Personnel</option>
            </select>
          </label>
          <label class="field-label">
            Priorité
            <select v-model="rdvForm.priorite" class="input">
              <option value="info">Information</option>
              <option value="todo">À faire</option>
              <option value="warning">Attention</option>
              <option value="critical">Critique</option>
            </select>
          </label>
        </div>

        <label class="field-label">
          Notes
          <textarea v-model.trim="rdvForm.description" rows="4" class="input" placeholder="Détails utiles pour le rendez-vous..."></textarea>
        </label>

        <div class="flex flex-col-reverse gap-2 border-t border-cyan-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
          <button class="btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement...' : 'Ajouter à l’agenda' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const saving = ref(false)
const rdvForm = reactive(defaultRdvForm(typeof route.query.date === 'string' ? route.query.date : null))

async function saveRdv() {
  saving.value = true
  try {
    await api.post('/agenda/rendez-vous', {
      titre: rdvForm.titre,
      description: rdvForm.description || null,
      date_debut: rdvForm.date_debut,
      date_fin: rdvForm.date_fin || null,
      lieu: rdvForm.lieu || null,
      client_nom: rdvForm.client_nom || null,
      visibilite: rdvForm.visibilite,
      priorite: rdvForm.priorite,
      statut: 'planifie',
    })
    toast.success('Rendez-vous ajouté à l’agenda.')
    goBack()
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    const firstError = Object.values(errors).flat().find(Boolean)
    toast.error(e.response?.data?.message || firstError || 'Enregistrement du rendez-vous impossible.')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'agenda' })
}

function defaultRdvForm(dateKeyValue = null) {
  const start = dateKeyValue ? dateFromKey(dateKeyValue) : nextDefaultDateTime()
  const end = new Date(start)
  end.setHours(end.getHours() + 1)

  return {
    titre: '',
    description: '',
    date_debut: toDateTimeLocal(start),
    date_fin: toDateTimeLocal(end),
    lieu: '',
    client_nom: '',
    visibilite: 'equipe',
    priorite: 'todo',
  }
}

function nextDefaultDateTime() {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return date
}

function dateFromKey(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day, 9, 0, 0)
}

function toDateTimeLocal(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-') + `T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

