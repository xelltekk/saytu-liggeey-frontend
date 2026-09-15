<template>
  <div
    class="email-action-buttons"
    :class="{
      'email-action-buttons-compact': compact,
      'email-action-buttons-dialog': dialog,
    }"
  >
    <template v-if="dialog">
      <button
        type="button"
        class="email-action-trigger"
        :disabled="disabled || sending || !hasRecipient"
        :title="hasRecipient ? 'Choisir le mode de relance email' : 'Aucun email destinataire renseigné'"
        @click="openDialog"
      >
        {{ sending ? 'Envoi...' : triggerLabel }}
      </button>

      <Teleport v-if="dialogOpen" to="body">
        <div class="email-choice-backdrop" @click.self="closeDialog">
          <section class="email-choice-modal" role="dialog" aria-modal="true" aria-label="Choisir le mode d’envoi">
            <button type="button" class="email-choice-close" aria-label="Fermer" @click="closeDialog">×</button>
            <p class="email-choice-kicker">Relance email</p>
            <h3>Choisir le mode d’envoi</h3>
            <p class="email-choice-help">
              Destinataire : <strong>{{ email.to }}</strong>
            </p>
            <p v-if="email.subject" class="email-choice-subject">
              {{ email.subject }}
            </p>

            <div class="email-choice-actions">
              <button
                type="button"
                class="email-action-btn email-action-btn-primary"
                :disabled="sending"
                @click="sendFromSaytu"
              >
                {{ sending ? 'Envoi...' : sendButtonLabel }}
              </button>
              <button
                type="button"
                class="email-action-btn email-action-btn-secondary"
                :disabled="sending"
                @click="openInOutlook"
              >
                {{ outlookButtonLabel }}
              </button>
            </div>
          </section>
        </div>
      </Teleport>
    </template>

    <template v-else>
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
    </template>
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
  dialog: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  sendLabel: { type: String, default: '' },
  outlookLabel: { type: String, default: '' },
  triggerLabel: { type: String, default: 'Relancer' },
})

const emit = defineEmits(['sent', 'error', 'outlook'])
const toast = useToast()
const sending = ref(false)
const dialogOpen = ref(false)

const email = computed(() => buildEmailDraft(props.draft))
const hasRecipient = computed(() => Boolean(email.value.to))
const sendButtonLabel = computed(() => props.sendLabel || 'Envoyer depuis Saytu')
const outlookButtonLabel = computed(() => props.outlookLabel || 'Ouvrir dans Outlook')

function openDialog() {
  if (!hasRecipient.value) {
    toast.error('Aucun email destinataire renseigné.')
    return
  }
  dialogOpen.value = true
}

function closeDialog() {
  if (!sending.value) dialogOpen.value = false
}

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
    dialogOpen.value = false
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
    dialogOpen.value = false
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

.email-action-buttons-dialog {
  display: inline-flex;
}

.email-action-trigger {
  align-items: center;
  background: var(--saytu-soft, #eef6ff);
  border: 1px solid var(--saytu-border, #bfdbfe);
  border-radius: 999px;
  color: var(--saytu-primary, #2563eb);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 850;
  justify-content: center;
  min-height: 1.9rem;
  padding: 0.42rem 0.8rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
}

.email-action-trigger:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgb(14 165 233 / 14%);
  transform: translateY(-1px);
}

.email-action-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.email-choice-backdrop {
  align-items: center;
  background: rgb(15 23 42 / 28%);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 10000;
}

.email-choice-modal {
  background:
    linear-gradient(135deg, rgb(240 249 255 / 96%), rgb(236 254 255 / 96%)),
    var(--saytu-surface, #fff);
  border: 1px solid var(--saytu-border, #bfdbfe);
  border-radius: 1.35rem;
  box-shadow: 0 28px 80px rgb(15 23 42 / 24%);
  max-width: 430px;
  padding: 1.15rem;
  position: relative;
  width: min(430px, 100%);
}

.email-choice-close {
  align-items: center;
  border-radius: 999px;
  color: var(--saytu-muted, #64748b);
  display: inline-flex;
  font-size: 1.3rem;
  height: 2rem;
  justify-content: center;
  position: absolute;
  right: 0.75rem;
  top: 0.65rem;
  width: 2rem;
}

.email-choice-close:hover {
  background: rgb(14 165 233 / 10%);
  color: var(--saytu-primary, #2563eb);
}

.email-choice-kicker {
  color: var(--saytu-primary, #2563eb);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.email-choice-modal h3 {
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1.05rem;
  font-weight: 950;
  margin: 0.25rem 2rem 0.4rem 0;
}

.email-choice-help,
.email-choice-subject {
  color: var(--saytu-muted, #64748b);
  font-size: 0.82rem;
  margin: 0;
}

.email-choice-subject {
  background: rgb(255 255 255 / 70%);
  border: 1px solid rgb(186 230 253 / 70%);
  border-radius: 0.9rem;
  color: var(--saytu-shell-text, #0f172a);
  font-weight: 750;
  margin-top: 0.75rem;
  padding: 0.65rem 0.75rem;
}

.email-choice-actions {
  display: grid;
  gap: 0.6rem;
  margin-top: 1rem;
}

.email-choice-actions .email-action-btn {
  min-height: 2.35rem;
  width: 100%;
}
</style>
