<template>
  <div class="email-action-buttons" :class="{ 'email-action-buttons-compact': compact }">
    <button
      type="button"
      class="email-action-btn email-action-btn-primary"
      :disabled="disabled || sending || !hasRecipient"
      :title="hasRecipient ? 'Envoyer immédiatement avec le SMTP configuré dans Saytu' : 'Aucun email destinataire renseigné'"
      @click="sendFromSaytu"
    >
      {{ sending ? 'Envoi...' : sendButtonLabel }}
    </button>

    <button
      type="button"
      class="email-action-btn email-action-btn-secondary"
      :disabled="disabled || !hasRecipient"
      :title="hasRecipient ? 'Télécharger un fichier .eml à ouvrir avec Outlook classique' : 'Aucun email destinataire renseigné'"
      @click="openInOutlook"
    >
      {{ outlookButtonLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { buildEmailDraft, downloadOutlookEml } from '@/utils/emailComposer'

const props = defineProps({
  draft: { type: Object, default: () => ({}) },
  filename: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  sendLabel: { type: String, default: '' },
  outlookLabel: { type: String, default: '' },
})

const emit = defineEmits(['sent', 'error', 'outlook'])
const toast = useToast()
const sending = ref(false)

const email = computed(() => buildEmailDraft(props.draft))
const hasRecipient = computed(() => Boolean(email.value.to))
const sendButtonLabel = computed(() => props.sendLabel || 'Envoyer depuis Saytu')
const outlookButtonLabel = computed(() => props.outlookLabel || 'Ouvrir dans Outlook')

async function sendFromSaytu() {
  if (!hasRecipient.value) {
    toast.error('Aucun email destinataire renseigné.')
    return
  }

  sending.value = true
  try {
    const { data } = await api.post('/emails/send', email.value)
    toast.success(data.message || 'Email envoyé depuis Saytu.')
    emit('sent', data)
  } catch (error) {
    const message = error.response?.data?.message || 'Email non envoyé depuis Saytu.'
    toast.error(message)
    emit('error', error)
  } finally {
    sending.value = false
  }
}

function openInOutlook() {
  if (!hasRecipient.value) {
    toast.error('Aucun email destinataire renseigné.')
    return
  }

  if (downloadOutlookEml(email.value, props.filename)) {
    toast.success('Fichier .eml téléchargé. Ouvrez-le avec Outlook classique.')
    emit('outlook', email.value)
  } else {
    toast.error('Impossible de générer le fichier Outlook.')
  }
}
</script>

<style scoped>
.email-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.email-action-btn {
  align-items: center;
  border-radius: 999px;
  border: 1px solid;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 800;
  justify-content: center;
  line-height: 1.1;
  min-height: 2rem;
  padding: 0.5rem 0.75rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
}

.email-action-btn:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgb(14 165 233 / 14%);
  transform: translateY(-1px);
}

.email-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.email-action-btn-primary {
  background: linear-gradient(135deg, var(--saytu-primary, #2563eb), var(--saytu-accent, #22d3ee));
  border-color: transparent;
  color: white;
}

.email-action-btn-secondary {
  background: var(--saytu-soft, #eef6ff);
  border-color: var(--saytu-border, #bfdbfe);
  color: var(--saytu-primary, #2563eb);
}

.email-action-buttons-compact .email-action-btn {
  min-height: 1.75rem;
  padding: 0.38rem 0.58rem;
}
</style>
